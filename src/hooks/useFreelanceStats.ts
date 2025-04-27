import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { getActiveServices } from '../data/services';
import { createClient } from '@/lib/supabase/client';
import { ActiveService } from '../types/service';

interface FreelanceStats {
  active: number;
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  averageRating: number;
  unreadMessages: number;
  notifications: number;
  activeServicesCount: number;
  completedServicesCount: number;
  activeServices: ActiveService[];
  isLoading: boolean;
  error: Error | null;
  servicesCount: number;
  totalEarnings: number;
  pendingDeliveries: number;
}

interface UseFreelanceStatsReturn {
  stats: FreelanceStats;
  loading: boolean;
  error: Error | PostgrestError | null;
  refreshStats: (forceRefresh?: boolean) => Promise<void>;
  lastUpdated: number | null;
}

const DEFAULT_STATS: FreelanceStats = {
  active: 0,
  totalRevenue: 0,
  totalOrders: 0,
  activeOrders: 0,
  averageRating: 0,
  unreadMessages: 0,
  notifications: 0,
  activeServicesCount: 0,
  completedServicesCount: 0,
  activeServices: [],
  isLoading: true,
  error: null,
  servicesCount: 0,
  totalEarnings: 0,
  pendingDeliveries: 0
};

const THROTTLE_MS = 5000; // 5 seconds throttle

export function useFreelanceStats(freelanceId: string | undefined): UseFreelanceStatsReturn {
  const [stats, setStats] = useState<FreelanceStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | PostgrestError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // References to prevent race conditions and redundant fetches
  const loadingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch stats with comprehensive error handling and optimization
  const fetchStats = useCallback(async (forceRefresh = false): Promise<void> => {
    // Early return if no freelanceId provided
    if (!freelanceId) {
      setError(new Error('No freelance ID provided'));
      return;
    }
    
    // Prevent too frequent refreshes unless forced
    const now = Date.now();
    if (!forceRefresh && now - lastFetchRef.current < THROTTLE_MS) {
      return;
    }
    
    // Cancel any existing request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Prevent concurrent fetches
    if (loadingRef.current && !forceRefresh) {
      return;
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      lastFetchRef.current = now;
      
      // Run parallel requests for better performance
      const [
        servicesResponse,
        ordersResponse,
        conversationsResponse,
        notificationsResponse
      ] = await Promise.all([
        // Active services
        supabase
          .from('services')
          .select('id, active, price')
          .eq('freelance_id', freelanceId)
          .throwOnError(),
        
        // All orders
        supabase
          .from('orders')
          .select('id, status')
          .eq('freelance_id', freelanceId)
          .throwOnError(),
        
        // Conversation IDs
        supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('participant_id', freelanceId)
          .throwOnError(),
        
        // Unread notifications
        supabase
          .from('notifications')
          .select('id')
          .eq('user_id', freelanceId)
          .eq('read', false)
          .throwOnError()
      ]);
      
      // Process services data
      const activeServices = servicesResponse.data?.filter(s => s.active).length || 0;
      
      // Éviter l'erreur "JSON object requested, multiple (or no) rows returned"
      let totalRevenue = 0;
      try {
        // D'abord, récupérer le wallet de l'utilisateur
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', freelanceId)
          .single();
        
        if (wallet && wallet.id) {
          // Puis récupérer les transactions liées à ce wallet
          const { data: transactionsData } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('wallet_id', wallet.id)
            .eq('type', 'earning');
            
          // Calculer le total des revenus
          if (transactionsData && transactionsData.length > 0) {
            totalRevenue = transactionsData.reduce((sum, transaction) => 
              sum + (transaction.amount || 0), 0);
          }
        } else {
          console.log(`Aucun wallet trouvé pour l'utilisateur ${freelanceId}`);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
        // Continuer avec totalRevenue = 0
      }
      
      // Process orders data
      const totalOrders = ordersResponse.data?.length || 0;
      const activeOrders = ordersResponse.data?.filter(order => 
        ['pending', 'in_progress', 'revision_requested'].includes(order.status)
      ).length || 0;
      
      // Process unread messages
      let unreadMessages = 0;
      const orderIds = ordersResponse.data?.map(order => order.id) || [];
      const conversationIds = conversationsResponse.data?.map(conv => conv.conversation_id) || [];
      
      if (orderIds.length > 0 || conversationIds.length > 0) {
        try {
          const query = supabase
            .from('messages')
            .select('id')
            .eq('read', false)
            .neq('sender_id', freelanceId);
          
          if (orderIds.length > 0 && conversationIds.length > 0) {
            query.or(`order_id.in.(${orderIds.join(',')}),conversation_id.in.(${conversationIds.join(',')})`);
          } else if (orderIds.length > 0) {
            query.in('order_id', orderIds);
          } else if (conversationIds.length > 0) {
            query.in('conversation_id', conversationIds);
          }
          
          const { data: messagesData } = await query;
          unreadMessages = messagesData?.length || 0;
        } catch (messagesErr) {
          console.warn('Erreur lors de la récupération des messages non lus:', messagesErr);
          // Continue with unreadMessages = 0
        }
      }
      
      // Process notifications
      const notifications = notificationsResponse.data?.length || 0;
      
      // Calculate average rating
      let averageRating = 0;
      if (servicesResponse.data && servicesResponse.data.length > 0) {
        try {
          const serviceIds = servicesResponse.data.map(service => service.id);
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('rating')
            .in('service_id', serviceIds)
            .throwOnError();

          if (reviewsData && reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
            averageRating = Number((totalRating / reviewsData.length).toFixed(2));
          }
        } catch (ratingErr) {
          console.warn('Erreur lors de la récupération des évaluations:', ratingErr);
          // Continue with averageRating = 0
        }
      }
      
      // Update stats
      const newStats = {
        active: activeServices,
        totalRevenue,
        totalOrders,
        activeOrders,
        averageRating,
        unreadMessages,
        notifications,
        activeServicesCount: activeServices,
        completedServicesCount: 0,
        activeServices: [],
        isLoading: false,
        error: null,
        servicesCount: activeServices,
        totalEarnings: totalRevenue,
        pendingDeliveries: 0
      };
      
      setStats(newStats);
      setLastUpdated(now);
      
    } catch (err) {
      console.error('Error loading freelance stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to load freelance statistics'));
      // Ne pas réinitialiser les statistiques en cas d'erreur, garder les précédentes
      // setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [freelanceId]);

  // Load stats when component mounts or freelanceId changes
  useEffect(() => {
    fetchStats();
    
    // Clean up on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  return { 
    stats, 
    loading, 
    error, 
    refreshStats: fetchStats,
    lastUpdated
  };
} 