import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface FreelanceStats {
  active: number;
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  averageRating: number;
}

interface UseFreelanceStatsReturn {
  stats: FreelanceStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useFreelanceStats(freelanceId: string | undefined): UseFreelanceStatsReturn {
  const [stats, setStats] = useState<FreelanceStats>({
    active: 0,
    totalRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger les statistiques - mémorisée avec useCallback
  const fetchStats = useCallback(async () => {
    if (!freelanceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer tous les services pour les statistiques
      const { data: allServicesData, error: allServicesError } = await supabase
        .from('services')
        .select('id, active, price')
        .eq('freelance_id', freelanceId);
        
      if (allServicesError) {
        console.error('Erreur lors du chargement des statistiques de services:', allServicesError);
        throw new Error('Impossible de charger les données statistiques de vos services.');
      }
      
      // Calculer les statistiques de base sur tous les services
      const activeServices = allServicesData.filter((s: any) => s.active);
      
      // Récupérer le wallet du freelance et ses transactions
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, transactions(*)')
        .eq('user_id', freelanceId)
        .single();
        
      // Déterminer le revenu total à partir des transactions du wallet
      let totalRevenue = 0;
      if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = "No rows returned"
        console.error('Erreur lors du chargement des revenus:', walletError);
      } else if (!walletError && walletData && walletData.transactions) {
        // Calculer la somme des transactions de type 'earning' (revenus)
        totalRevenue = walletData.transactions
          .filter((transaction: any) => transaction.type === 'earning')
          .reduce((sum: number, transaction: any) => sum + (transaction.amount || 0), 0);
      }
      
      // Récupérer le nombre de commandes pour ce freelance
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('freelance_id', freelanceId);
        
      if (ordersError) {
        console.error('Erreur lors du chargement des commandes:', ordersError);
      }
      
      const totalOrders = !ordersError && ordersData ? ordersData.length : 0;
      // Compter les commandes en cours (status = 'pending', 'in_progress' ou 'revision_requested')
      const activeOrders = !ordersError && ordersData 
        ? ordersData.filter((order: any) => 
            ['pending', 'in_progress', 'revision_requested'].includes(order.status)).length 
        : 0;

      // Récupérer les avis pour tous les services de ce freelance
      let averageRating = 0;
      
      if (allServicesData && allServicesData.length > 0) {
        const serviceIds = allServicesData.map((service: any) => service.id);
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .in('service_id', serviceIds);

        if (reviewsError) {
          console.error('Erreur lors du chargement des avis:', reviewsError);
        } else if (reviewsData && reviewsData.length > 0) {
          // Calculer la note moyenne sur 5
          const totalRating = reviewsData.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
          averageRating = totalRating / reviewsData.length;
        }
      }
      
      // Mettre à jour toutes les statistiques
      setStats({
        active: activeServices.length,
        totalRevenue,
        totalOrders,
        activeOrders,
        averageRating
      });
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [freelanceId]);

  // Charger les statistiques au chargement du composant et lorsque freelanceId change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // Dépendance à fetchStats qui est mémorisée et ne change que lorsque freelanceId change

  return { stats, loading, error, refreshStats: fetchStats };
} 