import { useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSWRCache } from "./useSWRCache";
import {
  CACHE_KEYS,
  makeCacheKey,
  invalidateCacheGroup,
  invalidateUserCache,
} from "@/lib/optimizations/invalidation";
import { CACHE_EXPIRY } from "@/lib/optimizations/cache";
import { useUser } from "./useUser";

// Types pour les statistiques d'un client
export interface ClientStats {
  activeOrders: number;
  unreadMessages: number;
  pendingDeliveries: number;
  pendingReviews: number;
  lastActivity?: string;
}

// Types pour les activités récentes
export interface ClientActivity {
  id: string;
  type: "order" | "message" | "review" | "payment";
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

// Interface du dashboard client
export interface ClientDashboardData {
  stats: ClientStats;
  activities: ClientActivity[];
  recentOrders: any[];
  hasUnreadMessages: boolean;
}

// Options du hook
export interface UseClientDashboardOptions {
  includeActivities?: boolean;
  includeRecentOrders?: boolean;
}

/**
 * Hook optimisé pour le dashboard client
 * Utilise notre nouveau système de cache SWR avec gestion des race conditions
 */
export function useClientDashboard(options: UseClientDashboardOptions = {}) {
  // Options par défaut
  const { includeActivities = true, includeRecentOrders = true } = options;

  // Obtenir l'utilisateur courant
  const { profile } = useUser();
  const userId = profile?.id;

  // Construire la clé de cache
  const cacheKey = makeCacheKey(CACHE_KEYS.CLIENT_DASHBOARD, {
    userId,
    includeActivities,
    includeRecentOrders,
  });

  // Fonction de chargement des données du dashboard
  const fetchDashboardData =
    useCallback(async (): Promise<ClientDashboardData> => {
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }

      try {
        // Appeler la fonction RPC pour récupérer les statistiques client
        const { data: statsData, error: statsError } = await supabase.rpc(
          "get_client_dashboard_stats",
          { client_id: userId },
        );

        if (statsError) throw statsError;

        const stats: ClientStats = statsData || {
          activeOrders: 0,
          unreadMessages: 0,
          pendingDeliveries: 0,
          pendingReviews: 0,
        };

        // Initialiser les données de retour
        const dashboardData: ClientDashboardData = {
          stats,
          activities: [],
          recentOrders: [],
          hasUnreadMessages: stats.unreadMessages > 0,
        };

        // Récupérer les activités récentes si demandé
        if (includeActivities) {
          const { data: activitiesData, error: activitiesError } =
            await supabase
              .from("client_activities")
              .select("*")
              .eq("client_id", userId)
              .order("created_at", { ascending: false })
              .limit(10);

          if (activitiesError) throw activitiesError;

          dashboardData.activities = (activitiesData || []).map((activity) => ({
            id: activity.id,
            type: activity.activity_type,
            title: activity.title,
            description: activity.description,
            timestamp: activity.created_at,
            data: activity.data,
          }));
        }

        // Récupérer les commandes récentes si demandé
        if (includeRecentOrders) {
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select(
              `
            *,
            services (id, title, price, thumbnail),
            freelances: profiles!services_freelance_id_fkey (id, username, full_name, avatar_url)
          `,
            )
            .eq("client_id", userId)
            .not("status", "eq", "pre_payment")
            .order("created_at", { ascending: false })
            .limit(5);

          if (ordersError) throw ordersError;

          dashboardData.recentOrders = ordersData || [];
        }

        return dashboardData;
      } catch (err) {
        console.error("Erreur lors du chargement du dashboard client:", err);
        throw err;
      }
    }, [userId, includeActivities, includeRecentOrders]);

  // Utiliser le hook SWR pour gérer le cache avec les données obsolètes
  const { data, isLoading, isValidating, isStale, error, refresh } =
    useSWRCache(cacheKey, fetchDashboardData, {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateInterval: 0,
      priority: "high",
      expiry: CACHE_EXPIRY.DASHBOARD_DATA, // 7 jours de cache pour le dashboard
    });

  // Configurer les abonnements en temps réel pour actualiser automatiquement les données
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    // Handler pour les invalidations de cache
    const handleCacheInvalidation = (event: CustomEvent) => {
      // Vérifier si l'invalidation concerne cet utilisateur
      const detail = event.detail || {};
      if (detail.userId === userId || !detail.userId) {
        refresh();
      }
    };

    // S'abonner aux événements de Supabase Realtime
    const ordersSubscription = supabase
      .channel("client-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `client_id=eq.${userId}`,
        },
        () => {
          invalidateCacheGroup("client_dashboard");
        },
      )
      .subscribe();

    // S'abonner aux messages
    const messagesSubscription = supabase
      .channel("client-messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          invalidateUserCache(userId);
        },
      )
      .subscribe();

    // Écouter les événements système d'invalidation
    window.addEventListener(
      "vynal:cache-invalidated",
      handleCacheInvalidation as EventListener,
    );

    // Nettoyer les abonnements
    return () => {
      ordersSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      window.removeEventListener(
        "vynal:cache-invalidated",
        handleCacheInvalidation as EventListener,
      );
    };
  }, [userId, refresh]);

  // Valeurs par défaut si les données ne sont pas encore chargées
  const dashboardData = data || {
    stats: {
      activeOrders: 0,
      unreadMessages: 0,
      pendingDeliveries: 0,
      pendingReviews: 0,
    },
    activities: [],
    recentOrders: [],
    hasUnreadMessages: false,
  };

  return {
    ...dashboardData,
    isLoading,
    isValidating,
    isStale,
    error,
    refresh,
  };
}
