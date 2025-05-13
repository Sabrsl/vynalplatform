import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { OrderDetails } from '@/components/messaging/messaging-types';
import requestCoordinator from '@/lib/optimizations/requestCoordinator';

// Types pour les compteurs de commandes
interface OrderCounts {
  total_count: number;
  active_count: number;
  pending_count: number;
  completed_count: number;
  cancelled_count: number;
  filtered_count: number;
}

// Type pour les résultats de la requête
interface ClientOrdersResult {
  counts: OrderCounts;
  orders: OrderDetails[];
}

// Options de requête
interface FetchOrdersOptions {
  page: number;
  itemsPerPage: number;
  status?: string[];
  sortBy?: 'recent' | 'oldest' | 'price_high' | 'price_low';
  searchQuery?: string;
}

// Type de retour du hook
interface UseClientOrdersReturn {
  orders: OrderDetails[];
  counts: OrderCounts;
  loading: boolean;
  error: string | null;
  fetchOrders: (options?: Partial<FetchOrdersOptions>) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

// Cache de commandes
const ORDERS_CACHE = {
  data: null as ClientOrdersResult | null,
  timestamp: 0,
  options: null as FetchOrdersOptions | null
};

// Durée de validité du cache en ms (2 minutes)
const CACHE_DURATION = 2 * 60 * 1000;

/**
 * Hook pour récupérer et gérer les commandes d'un client
 */
export function useClientOrders(
  initialOptions: Partial<FetchOrdersOptions> = {}
): UseClientOrdersReturn {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [counts, setCounts] = useState<OrderCounts>({
    total_count: 0,
    active_count: 0,
    pending_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    filtered_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOptions, setCurrentOptions] = useState<FetchOrdersOptions>({
    page: initialOptions.page || 1,
    itemsPerPage: initialOptions.itemsPerPage || 10,
    status: initialOptions.status || undefined,
    sortBy: initialOptions.sortBy || 'recent',
    searchQuery: initialOptions.searchQuery || undefined
  });

  // Fonction de secours pour charger les commandes lorsque la RPC n'est pas disponible
  const fetchOrdersLegacy = async (options: FetchOrdersOptions) => {
    const supabase = createClientComponentClient();
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }
    
    setLoading(true);
    try {
      console.log("[useClientOrders] Utilisation de la méthode legacy pour charger les commandes");
      
      // Calculer l'offset pour la pagination
      const from = (options.page - 1) * options.itemsPerPage;
      const to = from + options.itemsPerPage - 1;
      
      // Requête de base pour les compteurs
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('client_id', user.id);
      
      // Obtenir le nombre total de commandes
      const { count: total_count } = await query;
      
      // Obtenir le compteur de commandes par statut
      const countsByStatus = await Promise.all([
        // Active orders
        supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('client_id', user.id)
          .in('status', ['in_progress', 'completed', 'delivered'])
          .then(res => res.count || 0),
        
        // Pending orders
        supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('client_id', user.id)
          .eq('status', 'pending')
          .then(res => res.count || 0),
        
        // Completed orders
        supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('client_id', user.id)
          .in('status', ['completed', 'delivered'])
          .then(res => res.count || 0),
        
        // Cancelled orders
        supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('client_id', user.id)
          .eq('status', 'cancelled')
          .then(res => res.count || 0)
      ]);
      
      // Construire une requête filtrée pour les commandes
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          service:service_id (
            title,
            description
          ),
          freelance:freelance_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('client_id', user.id);
      
      // Appliquer le filtre de statut si fourni
      if (options.status && options.status.length > 0) {
        if (options.status.length === 1) {
          ordersQuery = ordersQuery.eq('status', options.status[0]);
        } else {
          ordersQuery = ordersQuery.in('status', options.status);
        }
      }
      
      // Appliquer le tri
      switch (options.sortBy) {
        case 'recent':
          ordersQuery = ordersQuery.order('created_at', { ascending: false });
          break;
        case 'oldest':
          ordersQuery = ordersQuery.order('created_at', { ascending: true });
          break;
        case 'price_high':
          ordersQuery = ordersQuery.order('price', { ascending: false });
          break;
        case 'price_low':
          ordersQuery = ordersQuery.order('price', { ascending: true });
          break;
        default:
          ordersQuery = ordersQuery.order('created_at', { ascending: false });
      }
      
      // Appliquer la pagination
      ordersQuery = ordersQuery.range(from, to);
      
      // Récupérer les commandes
      const { data: ordersData, error: ordersError, count: filtered_count } = await ordersQuery;
      
      if (ordersError) throw ordersError;
      
      // Formater les données pour correspondre au format de la RPC
      const orders = ordersData.map(order => ({
        ...order,
        service: {
          title: order.service.title,
          description: order.service.description
        },
        freelance: {
          full_name: order.freelance.full_name,
          avatar_url: order.freelance.avatar_url
        }
      })) as OrderDetails[];
      
      // Construire l'objet de résultat
      const result: ClientOrdersResult = {
        counts: {
          total_count: total_count || 0,
          active_count: countsByStatus[0],
          pending_count: countsByStatus[1],
          completed_count: countsByStatus[2],
          cancelled_count: countsByStatus[3],
          filtered_count: filtered_count || 0
        },
        orders
      };
      
      return result;
    } catch (error) {
      console.error("[useClientOrders] Erreur lors du chargement des commandes avec la méthode legacy:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les commandes avec la fonction RPC
  const fetchOrders = async (options?: Partial<FetchOrdersOptions>) => {
    // Mettre à jour les options de requête avec les nouvelles options
    const newOptions = {
      ...currentOptions,
      ...options
    };
    setCurrentOptions(newOptions);
    
    // Vérifier si des données sont en cache et si elles sont encore valides
    const now = Date.now();
    if (
      ORDERS_CACHE.data &&
      ORDERS_CACHE.timestamp > 0 &&
      now - ORDERS_CACHE.timestamp < CACHE_DURATION &&
      JSON.stringify(ORDERS_CACHE.options) === JSON.stringify(newOptions)
    ) {
      console.log("[useClientOrders] Utilisation du cache (données de moins de 2 minutes)");
      setOrders(ORDERS_CACHE.data.orders);
      setCounts(ORDERS_CACHE.data.counts);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient();
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Utiliser le requestCoordinator pour éviter les requêtes multiples
      const result = await requestCoordinator.scheduleRequest(
        `client_orders_${user.id}_${JSON.stringify(newOptions)}`,
        async () => {
          try {
            // Tenter d'utiliser la fonction RPC optimisée
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_client_orders_with_counts', {
              p_client_id: user.id,
              p_page: newOptions.page,
              p_items_per_page: newOptions.itemsPerPage,
              p_status: newOptions.status,
              p_sort_by: newOptions.sortBy,
              p_search_query: newOptions.searchQuery
            });
            
            if (rpcError) {
              // Vérifier si c'est une erreur 404 (fonction RPC non trouvée)
              if (rpcError.code === "404" || rpcError.message?.includes("function") || rpcError.message?.includes("not found")) {
                console.warn("[useClientOrders] Fonction RPC 'get_client_orders_with_counts' non disponible, utilisation de la méthode traditionnelle");
                return await fetchOrdersLegacy(newOptions);
              }
              
              // Autre type d'erreur
              console.error("[useClientOrders] Erreur RPC:", rpcError);
              throw rpcError;
            }
            
            return rpcData as ClientOrdersResult;
          } catch (error) {
            console.error("[useClientOrders] Exception:", error);
            // Essayer la méthode de secours en cas d'erreur
            return await fetchOrdersLegacy(newOptions);
          }
        },
        'medium'
      );
      
      if (!result) {
        throw new Error('Erreur lors de la récupération des commandes');
      }
      
      // Mettre à jour le cache
      ORDERS_CACHE.data = result;
      ORDERS_CACHE.timestamp = now;
      ORDERS_CACHE.options = newOptions;
      
      // Mettre à jour l'état
      setOrders(result.orders);
      setCounts(result.counts);
    } catch (error) {
      console.error("[useClientOrders] Erreur générale:", error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rafraîchir les commandes avec les options courantes
  const refreshOrders = async () => {
    // Invalider le cache
    ORDERS_CACHE.timestamp = 0;
    
    // Recharger les commandes
    await fetchOrders();
  };

  // Charger les commandes au montage du composant
  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    counts,
    loading,
    error,
    fetchOrders,
    refreshOrders
  };
} 