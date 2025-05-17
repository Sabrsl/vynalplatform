import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCachedData, setCachedData } from '@/lib/optimizations/cache';
import { CACHE_EXPIRY } from '@/lib/optimizations';

export interface Dispute {
  id: string;
  created_at: string;
  updated_at: string;
  order_id: string;
  client_id: string;
  freelance_id: string;
  status: 'open' | 'resolved' | 'closed';
  reason: string;
  resolution: string | null;
  resolved_by: string | null;
  order?: {
    service?: {
      id: string;
      title: string;
    };
  };
  freelance?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface DisputeSummary {
  total_open: number;
  total_resolved: number;
  total_closed: number;
  total_disputes: number;
}

interface UseClientDisputesOptions {
  limit?: number;
  useCache?: boolean;
  status?: 'open' | 'resolved' | 'closed' | 'all';
  search?: string;
}

/**
 * Hook pour récupérer les litiges d'un client
 */
export function useClientDisputes(options: UseClientDisputesOptions = {}) {
  const { limit = 10, useCache = true, status = 'all', search = '' } = options;
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [summary, setSummary] = useState<DisputeSummary>({
    total_open: 0,
    total_resolved: 0,
    total_closed: 0,
    total_disputes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clé de cache unique
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `client_disputes_${user.id}_limit_${limit}_status_${status}_search_${search}`;
  }, [user?.id, limit, status, search, useCache]);

  const summaryKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `client_disputes_summary_${user.id}`;
  }, [user?.id, useCache]);

  // Filtrer les litiges en fonction du statut et de la recherche
  const filterDisputes = useCallback((disputes: Dispute[]) => {
    return disputes.filter(dispute => {
      // Filtrer par statut
      if (status !== 'all' && dispute.status !== status) {
        return false;
      }
      
      // Filtrer par recherche
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          dispute.order?.service?.title.toLowerCase().includes(searchLower) ||
          dispute.freelance?.full_name?.toLowerCase().includes(searchLower) ||
          dispute.order_id.toLowerCase().includes(searchLower) ||
          dispute.reason.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [status, search]);

  // Fonction pour récupérer les litiges
  const fetchDisputes = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setIsRefreshing(true);

    try {
      // Vérifier le cache si activé et pas de forceRefresh
      if (useCache && !forceRefresh) {
        const cachedData = getCachedData<Dispute[]>(cacheKey);
        const cachedSummary = getCachedData<DisputeSummary>(summaryKey);
        
        if (cachedData && cachedSummary) {
          console.log("[ClientDisputes] Utilisation des données en cache");
          setDisputes(filterDisputes(cachedData));
          setSummary(cachedSummary);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // Construire la requête
      let query = supabase
        .from('disputes')
        .select(`
          id,
          created_at,
          updated_at,
          order_id,
          client_id,
          freelance_id,
          status,
          reason,
          resolution,
          resolved_by,
          order:orders(
            id,
            service:services(
              id,
              title
            )
          ),
          freelance:profiles!freelance_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
        
      // Appliquer la limite seulement si nécessaire
      if (limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[ClientDisputes] Erreur:", error);
        setError(error.message);
      } else if (data) {
        // Vérifier qu'on a bien des données
        console.log("[ClientDisputes] Données reçues:", data);
        
        // Transformer les données pour correspondre à notre interface
        const transformedData = data.map((dispute: any) => ({
          id: dispute.id,
          created_at: dispute.created_at,
          updated_at: dispute.updated_at,
          order_id: dispute.order_id,
          client_id: dispute.client_id,
          freelance_id: dispute.freelance_id,
          status: dispute.status,
          reason: dispute.reason,
          resolution: dispute.resolution,
          resolved_by: dispute.resolved_by,
          order: {
            ...dispute.order,
            service: dispute.order?.service
          },
          freelance: dispute.freelance
        })) as Dispute[];

        // Mettre en cache
        if (useCache) {
          setCachedData(cacheKey, transformedData, { 
            expiry: CACHE_EXPIRY.DAYS_3, // Augmenté de 5 minutes à 3 jours
            priority: 'high'
          });
        }
        
        // Filtrer et mettre à jour l'état
        setDisputes(filterDisputes(transformedData));

        // Calculer les statistiques
        await fetchDisputeSummary();
      }
    } catch (err) {
      console.error("[ClientDisputes] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, cacheKey, limit, useCache, summaryKey, filterDisputes]);

  // Fonction pour récupérer le résumé des litiges
  const fetchDisputeSummary = useCallback(async () => {
    if (!user) return;

    try {
      // Vérifier le cache
      if (useCache) {
        const cachedSummary = getCachedData<DisputeSummary>(summaryKey);
        if (cachedSummary) {
          console.log("[ClientDisputes] Utilisation du résumé en cache");
          setSummary(cachedSummary);
          return;
        }
      }

      // Essayer d'utiliser une fonction RPC pour les statistiques
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_client_dispute_stats', {
          p_client_id: user.id
        });
        
        if (!rpcError && rpcData) {
          console.log("[ClientDisputes] Statistiques récupérées via RPC:", rpcData);
          setSummary(rpcData);
          if (useCache) {
            setCachedData(summaryKey, rpcData, { 
              expiry: CACHE_EXPIRY.DAYS_3, // Augmenté de 10 minutes à 3 jours
              priority: 'high'
            });
          }
          return;
        }
      } catch (rpcErr) {
        console.log("[ClientDisputes] RPC non disponible:", rpcErr);
        // On continue avec les requêtes individuelles
      }

      // Si RPC n'est pas disponible, faire des requêtes individuelles
      // Total des litiges
      const { data: totalData, error: totalError } = await supabase
        .from('disputes')
        .select('count')
        .eq('client_id', user.id);
        
      if (totalError) throw totalError;
      
      // Litiges ouverts
      const { data: openData, error: openError } = await supabase
        .from('disputes')
        .select('count')
        .eq('client_id', user.id)
        .eq('status', 'open');
        
      if (openError) throw openError;
      
      // Litiges résolus
      const { data: resolvedData, error: resolvedError } = await supabase
        .from('disputes')
        .select('count')
        .eq('client_id', user.id)
        .eq('status', 'resolved');
        
      if (resolvedError) throw resolvedError;
      
      // Litiges fermés
      const { data: closedData, error: closedError } = await supabase
        .from('disputes')
        .select('count')
        .eq('client_id', user.id)
        .eq('status', 'closed');
        
      if (closedError) throw closedError;
      
      // Composer les statistiques
      const summaryData: DisputeSummary = {
        total_open: openData[0]?.count || 0,
        total_resolved: resolvedData[0]?.count || 0,
        total_closed: closedData[0]?.count || 0,
        total_disputes: totalData[0]?.count || 0
      };
      
      // Mettre à jour l'état et le cache
      setSummary(summaryData);
      if (useCache) {
        setCachedData(summaryKey, summaryData, { 
          expiry: CACHE_EXPIRY.DAYS_3, // Augmenté de 10 minutes à 3 jours
          priority: 'high'
        });
      }
    } catch (err) {
      console.error("[ClientDisputes] Exception lors du calcul des statistiques:", err);
    }
  }, [user, useCache, summaryKey]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return {
    disputes,
    summary,
    loading,
    error,
    isRefreshing,
    refresh: () => fetchDisputes(true)
  };
} 