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
  activeServices: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    freelance_id: string;
    category_id: string;
    created_at: string;
    updated_at: string;
    status: string;
    images: string[];
    delivery_time: number;
    slug: string;
    active: boolean;
    admin_notes: string | null;
    validated_at: string | null;
    validated_by: string | null;
    subcategory_id: string | null;
    currency_code: string | null;
    bookings_count: number;
    last_booked_at: string | null;
  }>;
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
          .select('id, created_at, updated_at, title, slug, description, price, delivery_time, category_id, subcategory_id, freelance_id, active, images, status, admin_notes, validated_at, validated_by, currency_code')
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
      
      // Process orders data
      const totalOrders = ordersResponse.data?.length || 0;
      const activeOrders = ordersResponse.data?.filter(order => 
        ['pending', 'in_progress', 'revision_requested'].includes(order.status)
      ).length || 0;
      
      // Process notifications
      const notifications = notificationsResponse.data?.length || 0;
      
      // Calculate total revenue from active services
      const totalRevenue = servicesResponse.data?.reduce((sum, service) => 
        sum + (service.active ? (service.price || 0) : 0), 0) || 0;
      
      // Map active services to correct type
      const activeServicesList = servicesResponse.data?.filter(s => s.active).map(service => ({
        id: service.id,
        title: service.title,
        description: service.description,
        price: service.price,
        freelance_id: service.freelance_id,
        category_id: service.category_id,
        created_at: service.created_at,
        updated_at: service.updated_at,
        status: service.status,
        images: service.images || [],
        delivery_time: service.delivery_time,
        slug: service.slug,
        active: service.active,
        admin_notes: service.admin_notes,
        validated_at: service.validated_at,
        validated_by: service.validated_by,
        subcategory_id: service.subcategory_id,
        currency_code: service.currency_code,
        bookings_count: 0,
        last_booked_at: null
      })) || [];
      
      // Update stats
      const newStats = {
        active: activeServices,
        totalRevenue,
        totalOrders,
        activeOrders,
        averageRating: 0, // Will be updated in the next step
        unreadMessages: 0, // Will be updated in the next step
        notifications,
        activeServicesCount: activeServices,
        completedServicesCount: totalOrders - activeOrders,
        activeServices: activeServicesList,
        isLoading: false,
        error: null,
        servicesCount: activeServices,
        totalEarnings: totalRevenue,
        pendingDeliveries: activeOrders
      };
      
      setStats(newStats);
      setLastUpdated(now);
      
    } catch (error) {
      console.error("[useFreelanceStats] Erreur lors de la récupération des statistiques");
      setError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      loadingRef.current = false;
      setLoading(false);
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