import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCachedData, setCachedData } from '@/lib/optimizations/cache';

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
  const [freelancers, setFreelancers] = useState<RecommendedFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clé de cache unique
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `recommended_freelancers_${user.id}_limit_${limit}`;
  }, [user?.id, limit, useCache]);

  // Fonction pour récupérer les freelancers recommandés
  const fetchRecommendedFreelancers = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setIsRefreshing(true);

    try {
      // Vérifier le cache si activé et pas de forceRefresh
      if (useCache && !forceRefresh) {
        const cachedData = getCachedData<RecommendedFreelancer[]>(cacheKey);
        if (cachedData) {
          console.log("[RecommendedFreelancers] Utilisation des données en cache");
          setFreelancers(cachedData);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

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
        setCachedData(cacheKey, freelancerProfiles, { expiry: 10 * 60 * 1000 }); // Cache de 10 minutes
      }
    } catch (err) {
      console.error("[RecommendedFreelancers] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setFreelancers([]); // Important de réinitialiser l'état en cas d'erreur
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, cacheKey, limit, useCache]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchRecommendedFreelancers();
  }, [fetchRecommendedFreelancers]);

  return {
    freelancers,
    loading,
    error,
    isRefreshing,
    refresh: () => fetchRecommendedFreelancers(true)
  };
} 