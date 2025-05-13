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

export interface ClientStats {
  activeOrders: number;
  completedOrders: number;
  pendingDeliveries: number;
  totalSpent: number;
  unreadMessages: number;
  favoriteFreelancers: number;
}

interface UseClientStatsOptions {
  useCache?: boolean;
}

/**
 * Hook pour récupérer les statistiques d'un client
 */
export function useClientStats(options: UseClientStatsOptions = {}) {
  const { useCache = true } = options;
  const { user } = useAuth();
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  const [stats, setStats] = useState<ClientStats>({
    activeOrders: 0,
    completedOrders: 0,
    pendingDeliveries: 0,
    totalSpent: 0,
    unreadMessages: 0,
    favoriteFreelancers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Références pour éviter les effets de bord
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Clé de cache unique standardisée
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `${CACHE_KEYS.CLIENT_STATS}${user.id}`;
  }, [user?.id, useCache]);

  // Fonction pour récupérer les statistiques du client
  const fetchClientStats = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Protection contre les requêtes concurrentes
    if (isFetchingRef.current && !forceRefresh) {
      console.log("[ClientStats] Requête ignorée: déjà en cours");
      return;
    }
    
    // Limiter la fréquence des requêtes
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTimeRef.current < 5000)) {
      console.log("[ClientStats] Requête ignorée: throttling (5s)");
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
        const cachedData = getCachedData<ClientStats>(cacheKey);
        if (cachedData) {
          console.log("[ClientStats] Utilisation des données en cache");
          setStats(cachedData);
          setLoading(false);
          setIsRefreshing(false);
          isFetchingRef.current = false;
          return;
        }
      }

      console.log("[ClientStats] Récupération des données depuis Supabase...");

      // Utiliser la fonction RPC consolidée
      const { data: consolidatedData, error: rpcError } = await supabase.rpc('get_client_stats', { 
        user_id: user.id 
      });
      
      if (rpcError) {
        console.error("[ClientStats] Erreur RPC:", rpcError);
        setError(rpcError.message);
        setLoading(false);
        setIsRefreshing(false);
      } else if (consolidatedData) {
        console.log("[ClientStats] Données RPC récupérées:", consolidatedData);
        
        // S'assurer que toutes les propriétés sont présentes et avec des valeurs par défaut
        const statsData = {
          activeOrders: consolidatedData.activeOrders || 0,
          completedOrders: consolidatedData.completedOrders || 0,
          pendingDeliveries: consolidatedData.pendingDeliveries || 0,
          totalSpent: consolidatedData.totalSpent || 0,
          unreadMessages: consolidatedData.unreadMessages || 0,
          favoriteFreelancers: consolidatedData.favoriteFreelancers || 0
        };
        
        setStats(statsData);
        
        // Mettre à jour le cache
        if (useCache) {
          setCachedData(cacheKey, statsData, { 
            expiry: CACHE_EXPIRY.DASHBOARD_STATS || 5 * 60 * 1000 
          });
        }
        
        setLoading(false);
        setIsRefreshing(false);
        updateLastRefresh();
      }
    } catch (err) {
      console.error("[ClientStats] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
      setIsRefreshing(false);
    } finally {
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [user, cacheKey, useCache, updateLastRefresh]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchRecentClientStats();
  }, [fetchClientStats]);
  
  // Alias pour l'ancienne fonction fetchRecentClientStats
  const fetchRecentClientStats = useCallback(() => {
    return fetchClientStats();
  }, [fetchClientStats]);
  
  // Écouter les événements de mise à jour pour invalider le cache
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCacheInvalidated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { key, type } = customEvent.detail || {};
      
      if (key && key.includes(CACHE_KEYS.CLIENT_STATS)) {
        console.log("[ClientStats] Cache invalidé par clé:", key);
        fetchClientStats(true);
      } else if (type === CACHE_EVENT_TYPES.USERS_UPDATED) {
        console.log("[ClientStats] Cache invalidé par changement d'authentification");
        fetchClientStats(true);
      } else if (type === CACHE_EVENT_TYPES.ORDERS_UPDATED) {
        console.log("[ClientStats] Cache invalidé par mise à jour de commande");
        fetchClientStats(true);
      }
    };
    
    // Écouter les événements d'invalidation du cache
    window.addEventListener('cache-invalidated', handleCacheInvalidated);
    
    return () => {
      window.removeEventListener('cache-invalidated', handleCacheInvalidated);
    };
  }, [fetchClientStats]);

  return {
    stats,
    loading,
    error,
    isRefreshing,
    refresh: () => fetchClientStats(true),
    lastRefreshText: getLastRefreshText(),
    invalidateCache: () => invalidateCache(cacheKey)
  };
} 