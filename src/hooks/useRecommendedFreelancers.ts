import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache,
  invalidateCachesByEvent,
  CACHE_KEYS, 
  CACHE_EVENT_TYPES,
  CACHE_EXPIRY 
} from '@/lib/optimizations/index';
import { useLastRefresh } from './useLastRefresh';

export interface RecommendedFreelancer {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
  bio: string | null;
  rating: number;
  is_certified: boolean;
  completed_projects: number;
  reviews_count: number;
}

interface UseRecommendedFreelancersOptions {
  limit?: number;
  useCache?: boolean;
}

/**
 * Hook pour récupérer les freelancers recommandés pour un client
 */
export function useRecommendedFreelancers(options: UseRecommendedFreelancersOptions = {}) {
  const { limit = 3, useCache = true } = options;
  const { user } = useAuth();
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  const [freelancers, setFreelancers] = useState<RecommendedFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Références pour éviter les effets de bord
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Clé de cache standardisée
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `${CACHE_KEYS.CLIENT_RECOMMENDED_FREELANCERS}${user.id}_limit_${limit}`;
  }, [user?.id, limit, useCache]);

  // Fonction pour récupérer les freelancers recommandés
  const fetchRecommendedFreelancers = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Protection contre les requêtes concurrentes
    if (isFetchingRef.current && !forceRefresh) {
      console.log("[RecommendedFreelancers] Requête ignorée: déjà en cours");
      return;
    }
    
    // Limiter la fréquence des requêtes
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTimeRef.current < 5000)) {
      console.log("[RecommendedFreelancers] Requête ignorée: throttling (5s)");
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Annuler les requêtes précédentes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Vérifier le cache si activé et pas de forceRefresh
      if (useCache && !forceRefresh) {
        const cachedData = getCachedData<RecommendedFreelancer[]>(cacheKey);
        if (cachedData) {
          console.log("[RecommendedFreelancers] Utilisation des données en cache");
          setFreelancers(cachedData);
          setLoading(false);
          setIsRefreshing(false);
          isFetchingRef.current = false;
          return;
        }
      }

      console.log("[RecommendedFreelancers] Récupération des données depuis Supabase...");

      // Récupérer les profils de freelancers
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, is_certified')
        .eq('role', 'freelance')
        .eq('is_active', true)
        .limit(limit * 2); // Récupérer plus de profils pour permettre de filtrer plus tard

      if (profilesError) {
        console.error("[RecommendedFreelancers] Erreur de profils:", profilesError);
        setError(profilesError.message);
        setFreelancers([]);
        return;
      }

      if (!profilesData || !Array.isArray(profilesData) || profilesData.length === 0) {
        console.log("[RecommendedFreelancers] Aucun profil trouvé");
        setFreelancers([]);
        return;
      }

      // Récupérer les IDs des freelancers pour les requêtes suivantes
      const freelancerIds = profilesData.map(profile => profile.id);

      // Récupérer les commandes terminées pour chaque freelance
      const { data: completedOrdersData, error: completedOrdersError } = await supabase
        .from('orders')
        .select('freelance_id')
        .in('freelance_id', freelancerIds)
        .eq('status', 'completed');

      if (completedOrdersError) {
        console.error("[RecommendedFreelancers] Erreur de commandes:", completedOrdersError);
      }

      // Compter manuellement le nombre de commandes par freelancer
      const completedOrdersMap = new Map<string, number>();
      if (completedOrdersData && completedOrdersData.length > 0) {
        completedOrdersData.forEach((item: { freelance_id: string }) => {
          const currentCount = completedOrdersMap.get(item.freelance_id) || 0;
          completedOrdersMap.set(item.freelance_id, currentCount + 1);
        });
      }

      // Récupérer les avis pour chaque freelance
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('freelance_id, rating')
        .in('freelance_id', freelancerIds);

      if (reviewsError) {
        console.error("[RecommendedFreelancers] Erreur d'avis:", reviewsError);
      }

      // Calculer les moyennes d'avis et le nombre d'avis par freelancer
      const ratingsMap = new Map<string, { total: number, count: number }>();
      if (reviewsData && reviewsData.length > 0) {
        reviewsData.forEach(review => {
          if (!ratingsMap.has(review.freelance_id)) {
            ratingsMap.set(review.freelance_id, { total: 0, count: 0 });
          }
          const current = ratingsMap.get(review.freelance_id)!;
          current.total += review.rating;
          current.count += 1;
          ratingsMap.set(review.freelance_id, current);
        });
      }

      // Construire les freelancers avec des données réelles
      const freelancerProfiles: RecommendedFreelancer[] = profilesData.map(profile => {
        const ratingData = ratingsMap.get(profile.id);
        const averageRating = ratingData ? ratingData.total / ratingData.count : 5; // Par défaut 5 si pas d'avis
        const reviewsCount = ratingData ? ratingData.count : 0;
        const completedProjects = completedOrdersMap.get(profile.id) || 0;

        return {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          specialty: null, // Cette donnée pourrait être ajoutée plus tard
          rating: averageRating,
          is_certified: profile.is_certified || false,
          completed_projects: completedProjects,
          reviews_count: reviewsCount
        };
      }).slice(0, limit);

      console.log("[RecommendedFreelancers] Données récupérées depuis la base de données");
      
      // Mettre à jour l'état et le cache
      setFreelancers(freelancerProfiles);
      if (useCache && freelancerProfiles.length > 0) {
        setCachedData(cacheKey, freelancerProfiles, { 
          expiry: CACHE_EXPIRY.DASHBOARD_DATA || 10 * 60 * 1000 
        });
      }
      
      // Mettre à jour l'interface
      updateLastRefresh();
      
    } catch (err) {
      console.error("[RecommendedFreelancers] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setFreelancers([]); // Important de réinitialiser l'état en cas d'erreur
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [user, cacheKey, limit, useCache, updateLastRefresh]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchRecommendedFreelancers();
  }, [fetchRecommendedFreelancers]);
  
  // Écouter les événements de mise à jour pour invalider le cache
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCacheInvalidated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { key } = customEvent.detail || {};
      
      if (key && (
        key.includes(CACHE_KEYS.CLIENT_RECOMMENDED_FREELANCERS) || 
        key.includes('profiles_') || 
        key.includes('freelancers_')
      )) {
        console.log("[RecommendedFreelancers] Événement d'invalidation détecté, rechargement des données");
        fetchRecommendedFreelancers(true);
      }
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidated);
    window.addEventListener('vynal:profile-updated', () => fetchRecommendedFreelancers(true));
    
    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidated);
      window.removeEventListener('vynal:profile-updated', () => fetchRecommendedFreelancers(true));
    };
  }, [fetchRecommendedFreelancers]);
  
  // Fournir des méthodes d'invalidation du cache
  const invalidateFreelancersCache = useCallback(() => {
    if (cacheKey) {
      invalidateCache(cacheKey);
      invalidateCachesByEvent(CACHE_EVENT_TYPES.CLIENT_PROFILE_UPDATED);
      
      // Émettre un événement pour informer les autres composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:profile-updated'));
      }
    }
  }, [cacheKey]);

  return {
    freelancers,
    loading,
    error,
    isRefreshing,
    lastRefreshText: getLastRefreshText(),
    refresh: () => fetchRecommendedFreelancers(true),
    invalidateCache: invalidateFreelancersCache
  };
} 