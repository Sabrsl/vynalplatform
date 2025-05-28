import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useLastRefresh } from "./useLastRefresh";
import {
  getCachedData,
  setCachedData,
  CACHE_EXPIRY,
} from "@/lib/optimizations/cache";
import { useUser } from "@/hooks/useUser";
import { NavigationLoadingState } from "@/app/providers";
import {
  invalidateFreelanceOrders,
  invalidateFreelanceStats,
} from "@/lib/optimizations/freelance-cache";
import {
  invalidateClientOrders,
  invalidateClientStats,
} from "@/lib/optimizations/client-cache";

// Types
export type OrderStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "delivered"
  | "revision_requested"
  | "cancelled";
export type TabValue = OrderStatus | "all";

export interface OrderService {
  id: string;
  title: string;
  price: number;
  description?: string;
}

export interface OrderProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  service: OrderService;
  freelance: OrderProfile;
  client: OrderProfile;
  is_client_view: boolean;
  total_amount?: number;
  delivery_time: number;
}

export interface OrderStats {
  totalCount: number;
  activeOrders: number;
  completedOrders: number;
  pendingDelivery: number;
  totalValue: number;
}

// Options pour le hook
interface UseOrdersOptions {
  initialTab?: TabValue;
  itemsPerPage?: number;
  useCache?: boolean;
}

// Vérifier si la fonction RPC existe
async function checkRPCFunctionExists(functionName: string): Promise<boolean> {
  try {
    // Tentative d'appel de la fonction avec des paramètres invalides pour vérifier son existence
    const { error } = await supabase.rpc(functionName, {
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_user_role: "invalid",
    });

    // Si l'erreur contient "function does not exist", la fonction n'existe pas
    const doesNotExist =
      error?.message?.includes("function does not exist") ||
      error?.message?.includes("fonction inexistante");

    return !doesNotExist;
  } catch (e) {
    console.error(`Erreur lors de la vérification de la fonction RPC`);
    return false;
  }
}

/**
 * Hook pour gérer les commandes - Version optimisée
 */
export function useOrders(options: UseOrdersOptions = {}) {
  const { initialTab = "all", itemsPerPage = 9, useCache = true } = options;

  const { profile, isFreelance } = useUser();
  const { lastRefresh, updateLastRefresh, getLastRefreshText } =
    useLastRefresh();

  // États
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    totalCount: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingDelivery: 0,
    totalValue: 0,
  });
  const [rpcAvailable, setRpcAvailable] = useState<boolean | null>(null);

  // Références pour éviter les effets de bord
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Fonction pour construire la clé de cache
  const cacheKey = useMemo(() => {
    if (!useCache || !profile?.id) return "";
    return `orders_${isFreelance ? "freelance" : "client"}_${profile.id}_${activeTab}_${searchQuery}_page_${currentPage}`;
  }, [profile?.id, isFreelance, activeTab, searchQuery, currentPage, useCache]);

  const statsKey = useMemo(() => {
    if (!useCache || !profile?.id) return "";
    return `orders_stats_${isFreelance ? "freelance" : "client"}_${profile.id}`;
  }, [profile?.id, isFreelance, useCache]);

  // Vérifier si la fonction RPC est disponible (une seule fois)
  useEffect(() => {
    if (rpcAvailable === null) {
      checkRPCFunctionExists("get_orders_stats").then((available) => {
        console.log(
          "[Orders] Fonction RPC get_orders_stats disponible:",
          available,
        );
        setRpcAvailable(available);
      });
    }
  }, [rpcAvailable]);

  // Fonction pour récupérer les statistiques via RPC
  const fetchStatsViaRPC = useCallback(async (): Promise<OrderStats | null> => {
    if (!profile?.id) return null;

    try {
      const role = isFreelance ? "freelance" : "client";
      console.log(
        `[Orders] Appel RPC get_orders_stats avec user_id=${profile.id}, role=${role}`,
      );

      const { data, error } = await supabase.rpc("get_orders_stats", {
        p_user_id: profile.id,
        p_user_role: role,
      });

      if (error) {
        console.error("Erreur RPC stats");
        return null;
      }

      if (data) {
        console.log("[Orders] Statistiques récupérées via RPC:", data);
        return data as OrderStats;
      }

      return null;
    } catch (e) {
      console.error("Exception lors de l'appel RPC pour les stats");
      return null;
    }
  }, [profile?.id, isFreelance]);

  // Fonction pour calculer les statistiques à partir des données locales
  const calculateStatsLocally = useCallback(
    (ordersList: Order[], total: number): OrderStats => {
      return {
        totalCount: total,
        activeOrders: ordersList.filter(
          (o) =>
            o.status === "in_progress" ||
            o.status === "pending" ||
            o.status === "revision_requested",
        ).length,
        completedOrders: ordersList.filter((o) => o.status === "completed")
          .length,
        pendingDelivery: ordersList.filter((o) => o.status === "delivered")
          .length,
        totalValue: ordersList.reduce(
          (sum, order) =>
            sum + (order.total_amount || order.service?.price || 0),
          0,
        ),
      };
    },
    [],
  );

  // Fonction optimisée pour récupérer les commandes
  const fetchOrders = useCallback(
    async (forceRefresh = false) => {
      // Protection contre les requêtes concurrentes ou pendant la navigation
      if (
        isFetchingRef.current ||
        (!forceRefresh && NavigationLoadingState.isNavigating)
      ) {
        console.log(
          "[Orders] Requête ignorée: déjà en cours ou navigation en cours",
        );
        return;
      }

      if (!profile?.id) {
        console.log("[Orders] Requête ignorée: pas de profil utilisateur");
        return;
      }

      // Limiter la fréquence des requêtes
      const now = Date.now();
      if (!forceRefresh && now - lastFetchTimeRef.current < 3000) {
        console.log("[Orders] Requête ignorée: throttling (3s)");
        return;
      }

      try {
        console.log(
          `[Orders] Début de la récupération des commandes (${isFreelance ? "freelance" : "client"})`,
        );
        isFetchingRef.current = true;
        lastFetchTimeRef.current = now;

        // Indicateurs de chargement
        if (forceRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        // Annuler les requêtes précédentes
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // Récupérer les statistiques via RPC si disponible
        let shouldFetchStats = true;

        // Vérifier le cache des statistiques
        if (useCache && statsKey && !forceRefresh) {
          const cachedStats = getCachedData<OrderStats>(statsKey);

          if (cachedStats) {
            console.log("[Orders] Statistiques récupérées du cache");
            setStats(cachedStats);

            // Si le cache est récent, ne pas recharger les stats
            const lastStatsUpdate = getCachedData<number>(
              `${statsKey}_timestamp`,
            );
            if (lastStatsUpdate && Date.now() - lastStatsUpdate < 60000) {
              // moins d'une minute
              shouldFetchStats = false;
            }
          }
        }

        // Récupérer les statistiques via RPC si disponible et nécessaire
        if (shouldFetchStats && rpcAvailable) {
          const rpcStats = await fetchStatsViaRPC();

          if (rpcStats) {
            setStats(rpcStats);

            // Mise en cache des statistiques
            if (useCache && statsKey) {
              console.log("[Orders] Mise en cache des statistiques");
              setCachedData(statsKey, rpcStats, {
                expiry: CACHE_EXPIRY.DASHBOARD_DATA,
              });
              setCachedData(`${statsKey}_timestamp`, Date.now(), {
                expiry: CACHE_EXPIRY.DASHBOARD_DATA,
              });
            }

            // Mettre à jour le total count pour la pagination
            setTotalCount(rpcStats.totalCount);
          }
        }

        // Vérifier le cache des commandes
        if (useCache && cacheKey && !forceRefresh) {
          const cachedData = getCachedData<{ orders: Order[]; total: number }>(
            cacheKey,
          );

          if (cachedData) {
            console.log(
              "[Orders] Données récupérées du cache",
              cachedData.orders.length,
            );
            setOrders(cachedData.orders);
            setTotalCount(cachedData.total);
            setLoading(false);
            setError(null);

            // Si le cache est récent, terminer ici et déclencher un refresh en arrière-plan
            const lastUpdate = getCachedData<number>(`${cacheKey}_timestamp`);
            if (lastUpdate && Date.now() - lastUpdate < 60000) {
              // moins d'une minute
              setTimeout(() => fetchOrders(true), 500);
              isFetchingRef.current = false;
              setIsRefreshing(false);
              return;
            }
          }
        }

        // Construire la requête Supabase
        try {
          console.log(
            `[Orders] Construction de la requête pour tab=${activeTab}, page=${currentPage}, search=${searchQuery || "none"}`,
          );

          // Requête de base
          let query = supabase
            .from("orders")
            .select(
              `
            *,
            services (*),
            profiles!orders_client_id_fkey (id, username, full_name, avatar_url),
            freelance:profiles!orders_freelance_id_fkey (id, username, full_name, avatar_url)
          `,
              { count: "exact" },
            )
            .eq(isFreelance ? "freelance_id" : "client_id", profile.id)
            .not("status", "eq", "pre_payment");

          // Filtrer par statut si nécessaire
          if (activeTab !== "all") {
            query = query.eq("status", activeTab);
          }

          // Appliquer la recherche si elle est définie
          if (searchQuery.trim()) {
            query = query.or(
              `services.title.ilike.%${searchQuery}%,services.description.ilike.%${searchQuery}%`,
            );
          }

          // Appliquer la pagination
          query = query
            .range(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage - 1,
            )
            .order("created_at", { ascending: false });

          // Exécuter la requête
          const { data, error, count } = await query;

          if (error) {
            console.error("Erreur Supabase");
            setError(`Erreur de récupération: ${error.message}`);
            return;
          }

          if (data) {
            console.log(
              `[Orders] ${data.length} commandes récupérées sur ${count} total`,
            );

            // Transformer les données
            const transformedOrders = data.map((order: any) => ({
              id: order.id,
              created_at: order.created_at,
              status: order.status,
              service: order.services,
              freelance: order.freelance,
              client: order.profiles,
              is_client_view: !isFreelance,
              total_amount: order.price,
              delivery_time: order.delivery_time,
            }));

            setOrders(transformedOrders);

            // Si RPC n'est pas disponible ou si c'est un filtre spécifique, calculer les stats localement
            if (!rpcAvailable || activeTab !== "all" || searchQuery) {
              if (activeTab === "all" && !searchQuery) {
                // Uniquement pour la vue complète non filtrée, sinon les stats seraient partielles
                const localStats = calculateStatsLocally(
                  transformedOrders,
                  count || 0,
                );
                setStats(localStats);

                // Mise en cache des statistiques locales
                if (
                  useCache &&
                  statsKey &&
                  activeTab === "all" &&
                  !searchQuery
                ) {
                  console.log(
                    "[Orders] Mise en cache des statistiques calculées localement",
                  );
                  setCachedData(statsKey, localStats, {
                    expiry: CACHE_EXPIRY.DASHBOARD_DATA,
                  });
                  setCachedData(`${statsKey}_timestamp`, Date.now(), {
                    expiry: CACHE_EXPIRY.DASHBOARD_DATA,
                  });
                }
              }
            }

            setTotalCount(count || 0);
            setError(null);

            // Mise en cache des résultats
            if (useCache && cacheKey) {
              console.log("[Orders] Mise en cache des données");
              setCachedData(
                cacheKey,
                {
                  orders: transformedOrders,
                  total: count || 0,
                },
                {
                  expiry: CACHE_EXPIRY.DASHBOARD_DATA,
                },
              );
              setCachedData(`${cacheKey}_timestamp`, Date.now(), {
                expiry: CACHE_EXPIRY.DASHBOARD_DATA,
              });
            }

            // Mettre à jour le timestamp de dernier rafraîchissement
            updateLastRefresh();
          } else {
            console.log("[Orders] Aucune commande trouvée");
            setOrders([]);
            setTotalCount(0);
          }
        } catch (innerError: any) {
          console.error("Exception pendant l'exécution de la requête");
          setError(
            `Erreur pendant la récupération: ${innerError.message || "Erreur inconnue"}`,
          );
        }
      } catch (e: any) {
        console.error("Exception globale");
        setError(`Erreur générale: ${e.message || "Erreur inconnue"}`);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [
      profile?.id,
      isFreelance,
      activeTab,
      searchQuery,
      currentPage,
      itemsPerPage,
      cacheKey,
      useCache,
      updateLastRefresh,
      rpcAvailable,
      fetchStatsViaRPC,
      statsKey,
      calculateStatsLocally,
    ],
  );

  // Chargement initial
  useEffect(() => {
    if (profile?.id && !NavigationLoadingState.isNavigating) {
      console.log("[Orders] Chargement initial des commandes");
      fetchOrders();
    }
  }, [profile?.id, fetchOrders]);

  // Recharger quand les filtres ou la pagination changent
  useEffect(() => {
    if (profile?.id && !isFetchingRef.current) {
      console.log("[Orders] Paramètres modifiés, rechargement des commandes");
      fetchOrders();
    }
  }, [activeTab, currentPage, searchQuery, fetchOrders, profile?.id]);

  // Abonnement aux changements en temps réel
  useEffect(() => {
    if (!profile?.id) return;

    console.log(
      "[Orders] Configuration de l'abonnement aux changements en temps réel",
    );

    const ordersSubscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: isFreelance
            ? `freelance_id=eq.${profile.id}`
            : `client_id=eq.${profile.id}`,
        },
        () => {
          console.log("[Orders] Changement détecté, rechargement des données");
          // Invalider le cache
          if (isFreelance) {
            invalidateFreelanceOrders(profile.id);
            invalidateFreelanceStats(profile.id);
          } else {
            invalidateClientOrders(profile.id);
            invalidateClientStats(profile.id);
          }
          // Forcer un rechargement des données
          fetchOrders(true);
        },
      )
      .subscribe();

    return () => {
      console.log("[Orders] Désinscription des changements en temps réel");
      ordersSubscription.unsubscribe();
    };
  }, [profile?.id, isFreelance, fetchOrders]);

  // Méthodes utilitaires pour la pagination
  const goToNextPage = useCallback(() => {
    if (currentPage < Math.ceil(totalCount / itemsPerPage)) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  }, [currentPage, totalCount, itemsPerPage]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (
        pageNumber >= 1 &&
        pageNumber <= Math.ceil(totalCount / itemsPerPage)
      ) {
        setCurrentPage(pageNumber);
      }
    },
    [totalCount, itemsPerPage],
  );

  // Fonctions de filtrage et recherche
  const setTab = useCallback((tab: TabValue) => {
    setActiveTab(tab);
    setCurrentPage(1); // Réinitialiser la pagination lors du changement de filtre
  }, []);

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Réinitialiser la pagination lors d'une nouvelle recherche
  }, []);

  // Fonction pour rafraîchir manuellement
  const refreshOrders = useCallback(() => {
    console.log("[Orders] Rafraîchissement manuel demandé");
    fetchOrders(true);
  }, [fetchOrders]);

  // Status labels pour l'affichage
  const statusLabels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    delivered: "Livrée",
    revision_requested: "Révision demandée",
    cancelled: "Annulée",
  };

  return {
    // État
    orders,
    loading,
    isRefreshing,
    error,
    activeTab,
    searchQuery,
    currentPage,
    totalCount,
    itemsPerPage,
    lastRefresh,

    // Actions
    fetchOrders,
    refreshOrders,
    setTab,
    setSearch,
    goToNextPage,
    goToPreviousPage,
    goToPage,

    // Utilitaires
    getLastRefreshText,
    statusLabels,

    // Stats
    stats,
  };
}
