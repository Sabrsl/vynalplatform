import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_EXPIRY 
} from '@/lib/optimizations';

// Type pour les statistiques de freelance
interface FreelanceStatsData {
  active: number;
  inactive: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalRatings: number;
}

export function useFreelanceStats(freelanceId: string | undefined) {
  const [stats, setStats] = useState<FreelanceStatsData>({
    active: 0,
    inactive: 0,
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalRatings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize la fonction fetchStats pour éviter les recréations inutiles
  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!freelanceId) {
      setLoading(false);
      return;
    }

    // Vérifie si la fonction est déjà en cours d'exécution
    if (isRefreshing && !forceRefresh) return;
    
    try {
      setLoading(true);
      if (forceRefresh) setIsRefreshing(true);
      
      // Vérifier le cache si ce n'est pas un rafraîchissement forcé
      const cacheKey = `freelance_stats_${freelanceId}`;
      
      if (!forceRefresh) {
        const cachedStats = getCachedData<FreelanceStatsData>(cacheKey);
        if (cachedStats) {
          setStats(cachedStats);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // Fetch services stats (active/inactive)
      const servicesPromise = supabase
        .from('services')
        .select('id, active')
        .eq('freelance_id', freelanceId);

      // Fetch orders stats
      const ordersPromise = supabase
        .from('orders')
        .select('id, status, price')
        .eq('freelance_id', freelanceId);

      // Fetch ratings stats
      const ratingsPromise = supabase
        .from('reviews')
        .select('id, rating')
        .eq('freelance_id', freelanceId);

      // Execute all promises in parallel
      const [servicesResponse, ordersResponse, ratingsResponse] = await Promise.all([
        servicesPromise,
        ordersPromise,
        ratingsPromise
      ]);

      // Handle errors
      if (servicesResponse.error) throw servicesResponse.error;
      if (ordersResponse.error) throw ordersResponse.error;
      if (ratingsResponse.error) throw ratingsResponse.error;

      // Calculate services stats
      const activeServices = servicesResponse.data.filter(s => s.active).length;
      const inactiveServices = servicesResponse.data.filter(s => !s.active).length;

      // Calculate orders stats
      const activeOrders = ordersResponse.data.filter(o => 
        ['pending', 'in_progress', 'revision_requested', 'delivered'].includes(o.status)
      ).length;
      
      const completedOrders = ordersResponse.data.filter(o => o.status === 'completed').length;
      
      const totalRevenue = ordersResponse.data
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + (order.price || 0), 0);

      // Calculate ratings stats
      const ratings = ratingsResponse.data;
      const totalRatings = ratings.length;
      const ratingSum = ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

      // Update state with calculated stats
      const newStats = {
        active: activeServices,
        inactive: inactiveServices,
        totalOrders: ordersResponse.data.length,
        activeOrders,
        completedOrders,
        totalRevenue,
        averageRating: avgRating,
        totalRatings
      };
      
      setStats(newStats);
      setError(null);
      
      // Cache the results
      setCachedData(cacheKey, newStats, { 
        expiry: CACHE_EXPIRY.DASHBOARD_DATA,
      });
      
    } catch (err: any) {
      console.error("Error fetching freelance stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [freelanceId, isRefreshing]);

  // Initial load and subscription setup
  useEffect(() => {
    if (!freelanceId) return;
    
    // Load stats
    fetchStats();
    
    // Set up subscriptions for real-time updates
    const ordersChannel = supabase.channel('orders-stats-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `freelance_id=eq.${freelanceId}`
      }, () => {
        // Use throttling to avoid too many refreshes
        if (!isRefreshing) {
          console.log("Orders changed, refreshing stats");
          invalidateCache(`freelance_stats_${freelanceId}`);
          fetchStats(true);
        }
      })
      .subscribe();
      
    const servicesChannel = supabase.channel('services-stats-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
        filter: `freelance_id=eq.${freelanceId}`
      }, () => {
        if (!isRefreshing) {
          console.log("Services changed, refreshing stats");
          invalidateCache(`freelance_stats_${freelanceId}`);
          fetchStats(true);
        }
      })
      .subscribe();
      
    const reviewsChannel = supabase.channel('reviews-stats-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews',
        filter: `freelance_id=eq.${freelanceId}`
      }, () => {
        if (!isRefreshing) {
          console.log("Reviews changed, refreshing stats");
          invalidateCache(`freelance_stats_${freelanceId}`);
          fetchStats(true);
        }
      })
      .subscribe();
    
    return () => {
      ordersChannel.unsubscribe();
      servicesChannel.unsubscribe();
      reviewsChannel.unsubscribe();
    };
  }, [freelanceId, fetchStats, isRefreshing]);

  // Fonction pour forcer le rafraîchissement des statistiques
  const refreshStats = useCallback(() => {
    console.log("Manually refreshing freelance stats");
    if (freelanceId) {
      invalidateCache(`freelance_stats_${freelanceId}`);
      fetchStats(true);
    }
  }, [freelanceId, fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    isRefreshing
  };
} 