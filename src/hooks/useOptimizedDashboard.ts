import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS, 
  CACHE_EXPIRY 
} from '@/lib/optimizations';
import { useLastRefresh } from './useLastRefresh';

// Type pour les statistiques d'un client
export interface ClientStats {
  activeOrders: number;
  unreadMessages: number;
  pendingDeliveries: number;
  pendingReviews: number;
}

// Type pour les statistiques d'un freelance
export interface FreelanceStats {
  activeOrders: number;
  unreadMessages: number;
  pendingDeliveries: number;
  totalEarnings: number;
  servicesCount: number;
}

// Type pour les activités récentes
export interface Activity {
  id: string;
  type: string;
  content: string;
  created_at: string;
  user_id: string;
  related_id?: string;
  extra_data?: any;
}

/**
 * Hook optimisé pour les données du tableau de bord
 */
export function useOptimizedDashboard() {
  const { profile, isClient, isFreelance } = useUser();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // Statistiques pour les clients
  const [clientStats, setClientStats] = useState<ClientStats>({
    activeOrders: 0,
    unreadMessages: 0,
    pendingDeliveries: 0,
    pendingReviews: 0
  });
  
  // Statistiques pour les freelances
  const [freelanceStats, setFreelanceStats] = useState<FreelanceStats>({
    activeOrders: 0,
    unreadMessages: 0,
    pendingDeliveries: 0,
    totalEarnings: 0,
    servicesCount: 0
  });
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();

  // Clés de cache spécifiques à l'utilisateur
  const getStatsCacheKey = useCallback(() => {
    if (!profile?.id) return '';
    
    const role = isClient ? 'client' : 'freelance';
    return `${CACHE_KEYS.DASHBOARD_STATS}_${role}_${profile.id}`;
  }, [profile?.id, isClient]);
  
  const getActivitiesCacheKey = useCallback(() => {
    if (!profile?.id) return '';
    return `${CACHE_KEYS.DASHBOARD_ACTIVITIES}_${profile.id}`;
  }, [profile?.id]);

  // Charger les statistiques avec cache et optimisation
  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!profile?.id) return;
    
    try {
      const cacheKey = getStatsCacheKey();
      
      // Si ce n'est pas un forceRefresh, vérifier d'abord le cache
      if (!forceRefresh && cacheKey) {
        const cachedStats = isClient 
          ? getCachedData<ClientStats>(cacheKey)
          : getCachedData<FreelanceStats>(cacheKey);
        
        if (cachedStats) {
          if (isClient) {
            setClientStats(cachedStats as ClientStats);
          } else {
            setFreelanceStats(cachedStats as FreelanceStats);
          }
          setLoadingStats(false);
          
          // Rafraîchir en arrière-plan
          refreshStatsInBackground();
          return;
        }
      }
      
      // Messages non lus (commun aux deux rôles)
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', profile.id)
        .eq('read', false);
        
      if (messagesError) throw messagesError;
      
      const unreadMessages = messagesData?.length || 0;
      
      // Statistiques spécifiques au client
      if (isClient) {
        // Commandes actives
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, status')
          .eq('client_id', profile.id)
          .in('status', ['pending', 'in_progress', 'revision_requested']);
          
        if (ordersError) throw ordersError;
        
        // Livraisons en attente
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('orders')
          .select('id')
          .eq('client_id', profile.id)
          .eq('status', 'delivered')
          .is('completed_at', null);
          
        if (deliveriesError) throw deliveriesError;
        
        // Commandes complétées sans avis
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('orders')
          .select('id, has_review')
          .eq('client_id', profile.id)
          .eq('status', 'completed')
          .eq('has_review', false);
          
        if (reviewsError) throw reviewsError;
        
        // Mettre à jour les statistiques client
        const newStats = {
          activeOrders: ordersData?.length || 0,
          unreadMessages,
          pendingDeliveries: deliveriesData?.length || 0,
          pendingReviews: reviewsData?.length || 0
        };
        
        setClientStats(newStats);
        
        // Mettre en cache pour 5 minutes
        if (cacheKey) {
          setCachedData<ClientStats>(cacheKey, newStats, { 
            expiry: CACHE_EXPIRY.DASHBOARD_DATA 
          });
        }
      } 
      // Statistiques spécifiques au freelance
      else if (isFreelance) {
        // Commandes actives pour le freelance
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, status')
          .eq('freelance_id', profile.id)
          .in('status', ['pending', 'in_progress', 'revision_requested']);
          
        if (ordersError) throw ordersError;
        
        // Livraisons en attente de validation
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('orders')
          .select('id')
          .eq('freelance_id', profile.id)
          .eq('status', 'delivered')
          .is('completed_at', null);
          
        if (deliveriesError) throw deliveriesError;
        
        // Services proposés
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id')
          .eq('freelance_id', profile.id);
          
        if (servicesError) throw servicesError;
        
        // Gains totaux
        const { data: earningsData, error: earningsError } = await supabase
          .from('orders')
          .select('amount')
          .eq('freelance_id', profile.id)
          .eq('status', 'completed');
          
        if (earningsError) throw earningsError;
        
        const totalEarnings = earningsData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
        
        // Mettre à jour les statistiques freelance
        const newStats = {
          activeOrders: ordersData?.length || 0,
          unreadMessages,
          pendingDeliveries: deliveriesData?.length || 0,
          totalEarnings,
          servicesCount: servicesData?.length || 0
        };
        
        setFreelanceStats(newStats);
        
        // Mettre en cache pour 5 minutes
        if (cacheKey) {
          setCachedData<FreelanceStats>(cacheKey, newStats, { 
            expiry: CACHE_EXPIRY.DASHBOARD_DATA 
          });
        }
      }
      
      setError(null);
    } catch (error: any) {
      console.error("Erreur lors du chargement des statistiques:", error);
      setError(error.message || "Erreur lors du chargement des données");
    } finally {
      setLoadingStats(false);
      setIsRefreshing(false);
    }
  }, [profile?.id, isClient, isFreelance, getStatsCacheKey]);

  // Rafraîchir les stats en arrière-plan
  const refreshStatsInBackground = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchStats(true);
  };
  
  // Charger les activités récentes avec mise en cache
  const fetchActivities = useCallback(async (forceRefresh = false) => {
    if (!profile?.id) return;
    
    setLoadingActivities(true);
    
    try {
      const cacheKey = getActivitiesCacheKey();
      
      // Vérifier d'abord le cache si ce n'est pas un forceRefresh
      if (!forceRefresh && cacheKey) {
        const cachedActivities = getCachedData<Activity[]>(cacheKey);
        
        if (cachedActivities) {
          setRecentActivities(cachedActivities);
          setLoadingActivities(false);
          return;
        }
      }
      
      // En production, cela serait remplacé par un vrai appel API
      // Pour l'instant, exemple avec des données simulées
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      const activities = data || [];
      
      setRecentActivities(activities);
      
      // Mettre en cache
      if (cacheKey) {
        setCachedData<Activity[]>(cacheKey, activities, { 
          expiry: CACHE_EXPIRY.DASHBOARD_DATA 
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des activités:", error);
      // En cas d'erreur, utiliser un tableau vide
      setRecentActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, [profile?.id, getActivitiesCacheKey]);

  // Forcer un rafraîchissement complet
  const refreshDashboard = () => {
    setLoadingStats(true);
    setLoadingActivities(true);
    
    // Invalider les caches
    const statsCacheKey = getStatsCacheKey();
    const activitiesCacheKey = getActivitiesCacheKey();
    
    if (statsCacheKey) invalidateCache(statsCacheKey);
    if (activitiesCacheKey) invalidateCache(activitiesCacheKey);
    
    // Recharger les données
    fetchStats(true);
    fetchActivities(true);
  };

  // Charger les données au montage du composant
  useEffect(() => {
    if (profile?.id) {
      fetchStats();
      fetchActivities();
    }
  }, [profile?.id, fetchStats, fetchActivities]);
  
  // Écouter les mises à jour des commandes et messages en temps réel
  useEffect(() => {
    if (!profile?.id) return;
    
    // Créer un canal pour surveiller les changements dans les commandes
    const ordersChannel = supabase
      .channel('db-orders-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: isClient 
          ? `client_id=eq.${profile.id}` 
          : `freelance_id=eq.${profile.id}`
      }, () => {
        refreshStatsInBackground();
      })
      .subscribe();
      
    // Créer un canal pour surveiller les messages non lus
    const messagesChannel = supabase
      .channel('db-messages-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${profile.id}`
      }, () => {
        refreshStatsInBackground();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${profile.id}`
      }, () => {
        refreshStatsInBackground();
      })
      .subscribe();
    
    // Nettoyer les abonnements
    return () => {
      ordersChannel.unsubscribe();
      messagesChannel.unsubscribe();
    };
  }, [profile?.id, isClient, refreshStatsInBackground]);
  
  return {
    clientStats,
    freelanceStats,
    recentActivities,
    loadingStats,
    loadingActivities,
    error,
    isRefreshing,
    refreshDashboard,
    lastRefresh,
    getLastRefreshText
  };
} 