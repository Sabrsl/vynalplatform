import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCachedData, setCachedData } from '@/lib/optimizations/cache';
import { CACHE_EXPIRY } from '@/lib/optimizations';

export interface Payment {
  id: string;
  created_at: string;
  updated_at: string;
  order_id: string;
  client_id: string;
  freelance_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded';
  payment_method: string;
  order?: {
    service: {
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

export interface PaymentSummary {
  total_paid: number;
  total_pending: number;
  total_refunded: number;
  total_transactions: number;
}

interface UseClientPaymentsOptions {
  limit?: number;
  useCache?: boolean;
}

/**
 * Hook pour récupérer les paiements d'un client
 */
export function useClientPayments(options: UseClientPaymentsOptions = {}) {
  const { limit = 10, useCache = true } = options;
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_paid: 0,
    total_pending: 0,
    total_refunded: 0,
    total_transactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clé de cache unique
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `client_payments_${user.id}_limit_${limit}`;
  }, [user?.id, limit, useCache]);

  const summaryKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `client_payments_summary_${user.id}`;
  }, [user?.id, useCache]);

  // Fonction pour récupérer les paiements
  const fetchPayments = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setIsRefreshing(true);

    try {
      // Vérifier le cache si activé et pas de forceRefresh
      if (useCache && !forceRefresh) {
        const cachedData = getCachedData<Payment[]>(cacheKey);
        const cachedSummary = getCachedData<PaymentSummary>(summaryKey);
        
        if (cachedData && cachedSummary) {
          console.log("[ClientPayments] Utilisation des données en cache");
          setPayments(cachedData);
          setSummary(cachedSummary);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      console.log("[ClientPayments] Récupération des paiements pour l'utilisateur:", user.id);

      // Récupérer les paiements avec les détails de la commande et du freelance
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          created_at,
          updated_at,
          order_id,
          client_id,
          freelance_id,
          amount,
          status,
          payment_method,
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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[ClientPayments] Erreur lors de la récupération des données");
        setError(error.message);
      } else if (data) {
        console.log("[ClientPayments] Données reçues:", data);
        
        // Transformer les données pour correspondre à notre interface
        const transformedData = data.map((payment: any) => ({
          id: payment.id,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          order_id: payment.order_id,
          client_id: payment.client_id,
          freelance_id: payment.freelance_id,
          amount: payment.amount,
          status: payment.status,
          payment_method: payment.payment_method,
          order: {
            ...payment.order,
            service: payment.order?.service
          },
          freelance: payment.freelance
        })) as Payment[];

        // Mettre à jour l'état
        setPayments(transformedData);
        
        // Mettre en cache
        if (useCache) {
          setCachedData(cacheKey, transformedData, { 
            expiry: CACHE_EXPIRY.DAYS_3, // Augmenté à 3 jours (au lieu de 5 minutes)
            priority: 'high' 
          });
        }

        // Récupérer les statistiques de paiement
        await fetchPaymentSummary();
      }
    } catch (err) {
      console.error("[ClientPayments] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, cacheKey, limit, useCache, summaryKey]);

  // Fonction pour récupérer le résumé des paiements
  const fetchPaymentSummary = useCallback(async () => {
    if (!user) return;

    try {
      // Vérifier le cache
      if (useCache) {
        const cachedSummary = getCachedData<PaymentSummary>(summaryKey);
        if (cachedSummary) {
          console.log("[ClientPayments] Utilisation du résumé en cache");
          setSummary(cachedSummary);
          return;
        }
      }

      // Essayer d'utiliser une fonction RPC pour les statistiques
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_client_payment_stats', {
          p_client_id: user.id
        });
        
        if (!rpcError && rpcData) {
          console.log("[ClientPayments] Statistiques récupérées via RPC:", rpcData);
          setSummary(rpcData);
          if (useCache) {
            setCachedData(summaryKey, rpcData, { 
              expiry: CACHE_EXPIRY.DAYS_3, // Augmenté à 3 jours (au lieu de 10 minutes)
              priority: 'high'
            });
          }
          return;
        }
      } catch (rpcErr) {
        console.warn("[ClientPayments] Erreur RPC, retour au mode standard:", rpcErr);
      }

      // Si RPC n'est pas disponible, faire des requêtes individuelles
      // Total des transactions
      const { data: totalData, error: totalError } = await supabase
        .from('payments')
        .select('count')
        .eq('client_id', user.id);
        
      if (totalError) throw totalError;
      
      // Montant total payé
      const { data: paidData, error: paidError } = await supabase
        .from('payments')
        .select('amount')
        .eq('client_id', user.id)
        .eq('status', 'paid');
        
      if (paidError) throw paidError;
      
      // Montant total en attente
      const { data: pendingData, error: pendingError } = await supabase
        .from('payments')
        .select('amount')
        .eq('client_id', user.id)
        .eq('status', 'pending');
        
      if (pendingError) throw pendingError;
      
      // Montant total remboursé
      const { data: refundedData, error: refundedError } = await supabase
        .from('payments')
        .select('amount')
        .eq('client_id', user.id)
        .eq('status', 'refunded');
        
      if (refundedError) throw refundedError;
      
      // Calculer les totaux
      const totalPaid = paidData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalPending = pendingData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalRefunded = refundedData.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      // Calcul des statistiques manuellement
      const summaryData: PaymentSummary = {
        total_paid: totalPaid,
        total_pending: totalPending,
        total_refunded: totalRefunded,
        total_transactions: totalData[0]?.count || 0
      };
      
      setSummary(summaryData);
      if (useCache) {
        setCachedData(summaryKey, summaryData, { 
          expiry: CACHE_EXPIRY.DAYS_3, // Augmenté de 10 minutes à 3 jours
          priority: 'high'
        });
      }
    } catch (err) {
      console.error("[ClientPayments] Erreur lors du calcul des statistiques");
    }
  }, [user, useCache, summaryKey]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    summary,
    loading,
    error,
    isRefreshing,
    refresh: () => fetchPayments(true)
  };
} 