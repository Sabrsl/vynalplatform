import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCachedData, setCachedData } from '@/lib/optimizations/cache';
import { Order, OrderService, OrderProfile, OrderStatus } from '@/hooks/useOrders';

interface UseRecentClientOrdersOptions {
  limit?: number;
  useCache?: boolean;
}

// Interface pour les données brutes reçues de Supabase
interface RawOrderData {
  id: string;
  created_at: string;
  status: string;
  service_id?: string;
  freelance_id?: string;
  client_id: string;
  price: number;
  delivery_time: number;
}

/**
 * Hook pour récupérer les commandes récentes d'un client
 */
export function useRecentClientOrders(options: UseRecentClientOrdersOptions = {}) {
  const { limit = 3, useCache = true } = options;
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clé de cache unique
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `recent_client_orders_${user.id}_limit_${limit}`;
  }, [user?.id, limit, useCache]);

  // Fonction pour récupérer les commandes récentes
  const fetchRecentOrders = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setIsRefreshing(true);

    try {
      // Vérifier le cache si activé et pas de forceRefresh
      if (useCache && !forceRefresh) {
        const cachedData = getCachedData<Order[]>(cacheKey);
        if (cachedData) {
          console.log("[RecentClientOrders] Utilisation des données en cache");
          setOrders(cachedData);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // Requête simplifiée pour éviter les erreurs
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status, service_id, freelance_id, price, delivery_time')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[RecentClientOrders] Erreur:", error);
        setError(error.message);
        setOrders([]);
      } else if (data) {
        // Vérifier que les données sont valides
        if (!Array.isArray(data)) {
          console.error("[RecentClientOrders] Format de données inattendu:", data);
          setError("Format de données inattendu");
          setOrders([]);
        } else {
          // Maintenant que nous avons les IDs des commandes, récupérons les détails pour chaque commande
          const enrichedOrders: Order[] = [];
          
          for (const orderBasic of data as RawOrderData[]) {
            try {
              if (!orderBasic.service_id || !orderBasic.freelance_id) {
                console.warn("[RecentClientOrders] Données de commande incomplètes:", orderBasic);
                continue;
              }
              
              // Récupérer les détails du service
              const { data: serviceData, error: serviceError } = await supabase
                .from('services')
                .select('id, title, price')
                .eq('id', orderBasic.service_id)
                .single();
                
              if (serviceError) {
                console.warn("[RecentClientOrders] Erreur service:", serviceError);
                continue;
              }
              
              // Récupérer les détails du freelance
              const { data: freelanceData, error: freelanceError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', orderBasic.freelance_id)
                .single();
                
              if (freelanceError) {
                console.warn("[RecentClientOrders] Erreur freelance:", freelanceError);
                continue;
              }
              
              // Récupérer les détails du client (nous-mêmes)
              const { data: clientData, error: clientError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', user.id)
                .single();
                
              if (clientError) {
                console.warn("[RecentClientOrders] Erreur client:", clientError);
                continue;
              }
              
              // Ajouter la commande enrichie
              enrichedOrders.push({
                id: orderBasic.id,
                created_at: orderBasic.created_at,
                status: orderBasic.status as OrderStatus,
                service: serviceData as OrderService,
                freelance: freelanceData as OrderProfile,
                client: clientData as OrderProfile,
                is_client_view: true,
                total_amount: orderBasic.price,
                delivery_time: orderBasic.delivery_time
              });
            } catch (err) {
              console.warn("[RecentClientOrders] Erreur enrichissement:", err);
            }
          }

          // Mettre à jour l'état avec les commandes enrichies
          setOrders(enrichedOrders);
          if (useCache && enrichedOrders.length > 0) {
            setCachedData(cacheKey, enrichedOrders, { expiry: 5 * 60 * 1000 }); // Cache de 5 minutes
          }
        }
      }
    } catch (err) {
      console.error("[RecentClientOrders] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setOrders([]); // Réinitialiser en cas d'erreur
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, cacheKey, limit, useCache]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  return {
    recentOrders: orders,
    loading,
    error,
    isRefreshing,
    refresh: () => fetchRecentOrders(true)
  };
} 