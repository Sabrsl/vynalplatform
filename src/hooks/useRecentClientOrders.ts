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

// Types adaptés
export interface OrderService {
  id: string;
  title: string;
  price: number;
  description?: string;
}

export interface OrderProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled';

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  service: OrderService;
  freelance: OrderProfile;
  client: OrderProfile;
  is_client_view: boolean;
  total_amount?: number;
  delivery_time: number;
}

interface RawOrderData {
  id: string;
  created_at: string;
  status: string;
  service_id: string;
  client_id: string;
  freelance_id: string;
  price: number;
  delivery_time: number;
}

interface UseRecentClientOrdersOptions {
  limit?: number;
  useCache?: boolean;
}

export function useRecentClientOrders(options: UseRecentClientOrdersOptions = {}) {
  const { limit = 3, useCache = true } = options;
  const { user } = useAuth();
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  const [orders, setOrders] = useState<Order[]>([]);
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
    return `${CACHE_KEYS.CLIENT_RECENT_ORDERS}${user.id}_limit_${limit}`;
  }, [user?.id, limit, useCache]);

  // Fonction pour récupérer les commandes récentes
  const fetchRecentOrders = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Protection contre les requêtes concurrentes
    if (isFetchingRef.current && !forceRefresh) {
      console.log("[RecentClientOrders] Requête ignorée: déjà en cours");
      return;
    }
    
    // Limiter la fréquence des requêtes
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTimeRef.current < 5000)) {
      console.log("[RecentClientOrders] Requête ignorée: throttling (5s)");
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
        const cachedData = getCachedData<Order[]>(cacheKey);
        if (cachedData) {
          console.log("[RecentClientOrders] Utilisation des données en cache");
          setOrders(cachedData);
          setLoading(false);
          setIsRefreshing(false);
          isFetchingRef.current = false;
          return;
        }
      }

      console.log("[RecentClientOrders] Récupération des données depuis Supabase...");

      // Récupérer les commandes récentes du client avec une seule requête
      interface OrderDataResponse {
        id: string;
        created_at: string;
        status: OrderStatus;
        price: number;
        delivery_time: number;
        service: {
          id: string;
          title: string;
          price: number;
          description?: string;
        };
        freelance: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string;
        };
        client: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string;
        };
      }

      const { data, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          status, 
          price, 
          delivery_time,
          service:services(id, title, price, description),
          freelance:profiles!freelance_id(id, username, full_name, avatar_url),
          client:profiles!client_id(id, username, full_name, avatar_url)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) {
        throw ordersError;
      } else if (data) {
        // Vérifier que les données sont valides
        if (!Array.isArray(data)) {
          console.error("[RecentClientOrders] Format de données inattendu:", data);
          setError("Format de données inattendu");
          setOrders([]);
        } else {
          // Transformer les données en format attendu
          const enrichedOrders: Order[] = data.map((item: any) => ({
            id: item.id,
            created_at: item.created_at,
            status: item.status as OrderStatus,
            service: {
              id: item.service?.id || '',
              title: item.service?.title || '',
              price: item.service?.price || 0,
              description: item.service?.description
            },
            freelance: {
              id: item.freelance?.id || '',
              username: item.freelance?.username || '',
              full_name: item.freelance?.full_name || '',
              avatar_url: item.freelance?.avatar_url
            },
            client: {
              id: item.client?.id || '',
              username: item.client?.username || '',
              full_name: item.client?.full_name || '',
              avatar_url: item.client?.avatar_url
            },
            is_client_view: true,
            total_amount: item.price,
            delivery_time: item.delivery_time
          }));

          // Mettre à jour l'état avec les commandes enrichies
          setOrders(enrichedOrders);
          if (useCache && enrichedOrders.length > 0) {
            setCachedData(cacheKey, enrichedOrders, { 
              expiry: 3 * 24 * 60 * 60 * 1000, // 3 jours de cache
              priority: 'high'
            });
          }
          
          // Mettre à jour l'interface
          updateLastRefresh();
        }
      }
    } catch (err) {
      console.error("[RecentClientOrders] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setOrders([]); // Réinitialiser en cas d'erreur
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [user, cacheKey, limit, useCache, updateLastRefresh]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);
  
  // Écouter les événements de mise à jour pour invalider le cache
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCacheInvalidated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { key } = customEvent.detail || {};
      
      if (key && (
        key.includes(CACHE_KEYS.CLIENT_RECENT_ORDERS) || 
        key.includes(CACHE_KEYS.CLIENT_ORDERS) || 
        key.includes('orders_')
      )) {
        console.log("[RecentClientOrders] Événement d'invalidation détecté, rechargement des données");
        fetchRecentOrders(true);
      }
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidated);
    window.addEventListener('vynal:orders-updated', () => fetchRecentOrders(true));
    
    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidated);
      window.removeEventListener('vynal:orders-updated', () => fetchRecentOrders(true));
    };
  }, [fetchRecentOrders]);
  
  // Fournir des méthodes d'invalidation du cache
  const invalidateOrdersCache = useCallback(() => {
    if (cacheKey) {
      invalidateCache(cacheKey);
      invalidateCachesByEvent(CACHE_EVENT_TYPES.CLIENT_ORDERS_UPDATED);
      
      // Émettre un événement pour informer les autres composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:orders-updated'));
      }
    }
  }, [cacheKey]);

  return {
    recentOrders: orders,
    loading,
    error,
    isRefreshing,
    lastRefreshText: getLastRefreshText(),
    refresh: () => fetchRecentOrders(true),
    invalidateCache: invalidateOrdersCache
  };
} 