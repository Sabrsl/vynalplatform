import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLastRefresh } from './useLastRefresh';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache
} from '@/lib/optimizations/cache';
import { useUser } from '@/hooks/useUser';
import { NavigationLoadingState } from '@/app/providers';
import { getDashboardConfig } from '@/config/dashboard-config';
import { createWalletIfNotExists } from '@/lib/supabase/wallets';

// Constantes locales pour éviter les dépendances problématiques
const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard_stats_',
  DASHBOARD_ACTIVITIES: 'dashboard_activities_'
};

// Définition locale des priorités de cache
const CACHE_PRIORITIES = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

// Durées d'expiration pour le dashboard
const CACHE_EXPIRY = {
  DASHBOARD_STATS: 20 * 60 * 1000,     // 20 minutes
  DASHBOARD_ACTIVITIES: 20 * 60 * 1000  // 20 minutes
};

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

interface UseDashboardOptions {
  useCache?: boolean;
}

/**
 * Hook pour les données du tableau de bord - Version optimisée
 */
export function useDashboard(options: UseDashboardOptions = {}) {
  const { useCache = true } = options;
  const { profile, isClient, isFreelance } = useUser();
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  const router = useRouter();
  
  // Récupérer la configuration du dashboard en fonction du rôle de l'utilisateur
  const dashboardConfig = useMemo(() => getDashboardConfig(isClient), [isClient]);

  // États principaux
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats>({
    activeOrders: 0,
    unreadMessages: 0,
    pendingDeliveries: 0,
    pendingReviews: 0
  });
  const [freelanceStats, setFreelanceStats] = useState<FreelanceStats>({
    activeOrders: 0,
    unreadMessages: 0,
    pendingDeliveries: 0,
    totalEarnings: 0,
    servicesCount: 0
  });
  
  // États d'UI et contrôle
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [rpcAvailable, setRpcAvailable] = useState<boolean | null>(null);
  
  // Références pour éviter les effets de bord
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Fonction memoïsée pour la clé de cache
  const cacheKey = useMemo(() => {
    if (!useCache || !profile?.id) return '';
    return `${dashboardConfig.cache.keyPrefix}${profile.id}`;
  }, [profile?.id, dashboardConfig.cache.keyPrefix, useCache]);

  // S'assurer que l'utilisateur a un wallet lors du premier accès au dashboard
  useEffect(() => {
    if (profile?.id) {
      createWalletIfNotExists(profile.id)
        .then(walletId => {
          if (walletId) {
            console.log(`[Dashboard] Wallet vérifié/créé pour l'utilisateur ${profile.id}: ${walletId}`);
          } else {
            console.warn(`[Dashboard] Impossible de vérifier/créer un wallet pour l'utilisateur ${profile.id}`);
          }
        })
        .catch(err => {
          console.error('[Dashboard] Erreur lors de la vérification/création du wallet:', err);
        });
    }
  }, [profile?.id]);

  // Vérifier si la fonction RPC est disponible (une seule fois)
  useEffect(() => {
    if (rpcAvailable === null) {
      // Désactiver temporairement la fonction RPC à cause du problème de colonne is_deleted
      console.log("[Dashboard] Désactivation temporaire de la fonction RPC get_dashboard_stats");
      setRpcAvailable(false);
      
      // Commenté pour éviter l'erreur "column is_deleted does not exist"
      // checkRPCFunctionExists('get_dashboard_stats').then(available => {
      //   console.log("[Dashboard] Fonction RPC get_dashboard_stats disponible:", available);
      //   setRpcAvailable(available);
      // });
    }
  }, [rpcAvailable]);

  // Fonction pour vérifier si la fonction RPC existe
  async function checkRPCFunctionExists(functionName: string): Promise<boolean> {
    try {
      // Tentative d'appel de la fonction avec des paramètres valides pour vérifier son existence
      const { error } = await supabase.rpc(functionName, { 
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_user_role: 'client' // Utiliser toujours 'client' pour la vérification
      });
      
      // Si l'erreur ne contient pas "function does not exist", la fonction existe
      // mais peut échouer pour d'autres raisons comme les paramètres invalides
      const doesNotExist = error?.message?.includes('function does not exist') || 
                         error?.message?.includes('fonction inexistante');
      
      // Vérifier s'il y a une erreur concernant la colonne is_deleted
      const hasColumnError = error?.message?.includes('column "is_deleted" does not exist');
      
      // Si l'erreur est due à la colonne manquante, on considère que la fonction n'est pas disponible
      if (hasColumnError) {
        console.log("[Dashboard] La fonction RPC existe mais a une erreur de schéma (colonne is_deleted manquante)");
        return false;
      }
      
      return !doesNotExist;
    } catch (e) {
      console.error(`Erreur lors de la vérification de la fonction RPC ${functionName}:`, e);
      return false;
    }
  }

  // Méthode alternative pour récupérer les statistiques client
  const fetchClientStatsDirectly = useCallback(async (userId: string): Promise<ClientStats> => {
    console.log("[Dashboard] Récupération directe des statistiques client");
    
    try {
      // Stats par défaut
      const defaultStats: ClientStats = {
        activeOrders: 0,
        unreadMessages: 0,
        pendingDeliveries: 0,
        pendingReviews: 0
      };
      
      // Récupérer les commandes actives
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('client_id', userId)
          .in('status', ['pending', 'in_progress', 'revision_requested']);
        
        if (!ordersError && orders) {
          defaultStats.activeOrders = orders.length;
        } else if (ordersError) {
          console.error("[Dashboard] Erreur récupération commandes client:", ordersError);
        }
      } catch (orderError) {
        console.error("[Dashboard] Exception lors de la récupération des commandes client:", orderError);
      }
      
      // Récupérer les messages non lus
      try {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .neq('sender_id', userId)
          .eq('read', false)
          .or(`conversation_id.in.(select conversation_id from conversation_participants where participant_id.eq.${userId})`);
        
        if (!messagesError && messages) {
          defaultStats.unreadMessages = messages.length;
        } else if (messagesError) {
          console.error("[Dashboard] Erreur récupération messages client:", messagesError);
        }
      } catch (msgError) {
        console.error("[Dashboard] Exception lors de la récupération des messages client:", msgError);
      }
      
      // Livraisons en attente - la table n'existe pas, on met 0 par défaut
      defaultStats.pendingDeliveries = 0;
      
      // Récupérer les avis en attente
      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from('orders')
          .select('id')
          .eq('client_id', userId)
          .eq('status', 'completed')
          .is('review_id', null);
        
        if (!reviewsError && reviews) {
          defaultStats.pendingReviews = reviews.length;
        } else if (reviewsError) {
          console.error("[Dashboard] Erreur récupération avis client:", reviewsError);
        }
      } catch (reviewError) {
        console.error("[Dashboard] Exception lors de la récupération des avis client:", reviewError);
      }
      
      console.log("[Dashboard] Statistiques client récupérées directement:", defaultStats);
      return defaultStats;
    } catch (error) {
      console.error("[Dashboard] Erreur lors de la récupération directe des stats client:", error);
      return {
        activeOrders: 0,
        unreadMessages: 0,
        pendingDeliveries: 0,
        pendingReviews: 0
      };
    }
  }, []);
  
  // Méthode alternative pour récupérer les statistiques freelance
  const fetchFreelanceStatsDirectly = useCallback(async (userId: string): Promise<FreelanceStats> => {
    console.log("[Dashboard] Récupération directe des statistiques freelance");
    
    try {
      // Stats par défaut
      const defaultStats: FreelanceStats = {
        activeOrders: 0,
        unreadMessages: 0,
        pendingDeliveries: 0,
        totalEarnings: 0,
        servicesCount: 0
      };
      
      // Récupérer les commandes actives (toutes les commandes reçues)
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, status')
          .eq('freelance_id', userId);
        
        if (!ordersError && orders) {
          defaultStats.activeOrders = orders.length;
          // Compter les commandes en cours pour les livraisons en attente
          defaultStats.pendingDeliveries = orders.filter(order => 
            order.status === 'in_progress' || order.status === 'delivered'
          ).length;
        } else if (ordersError) {
          console.error("[Dashboard] Erreur récupération commandes:", ordersError);
        }
      } catch (orderError) {
        console.error("[Dashboard] Exception lors de la récupération des commandes:", orderError);
      }
      
      // Récupérer les messages non lus (reçus par le freelance et non lus)
      try {
        // D'abord récupérer les conversations où l'utilisateur est participant
        const { data: conversationIds, error: convoError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('participant_id', userId);
        
        if (!convoError && conversationIds && conversationIds.length > 0) {
          // Ensuite récupérer les messages non lus dans ces conversations
          const convIds = conversationIds.map(c => c.conversation_id);
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('id')
            .neq('sender_id', userId)  // Messages envoyés par quelqu'un d'autre
            .eq('read', false)         // Non lus
            .in('conversation_id', convIds); // Dans les conversations du freelance
          
          if (!messagesError && messages) {
            defaultStats.unreadMessages = messages.length;
            console.log(`[Dashboard] ${messages.length} messages non lus trouvés`);
          } else if (messagesError) {
            console.error("[Dashboard] Erreur récupération messages:", messagesError);
          }
        } else {
          console.log("[Dashboard] Aucune conversation trouvée pour cet utilisateur");
        }
      } catch (msgError) {
        console.error("[Dashboard] Erreur lors de la récupération des messages:", msgError);
      }
      
      // Récupérer les revenus totaux
      let totalEarnings = 0;
      
      // Récupérer le wallet id de manière plus robuste
      try {
        const { data: wallets, error: walletsError } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', userId);
        
        if (!walletsError && wallets && wallets.length > 0) {
          // Ne pas utiliser single() qui peut retourner 406
          const walletId = wallets[0].id;
          // Ensuite récupérer les transactions associées à ce wallet
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('wallet_id', walletId)
            .eq('type', 'earning');
          
          if (!transactionsError && transactions && transactions.length > 0) {
            totalEarnings = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          }
        }
      } catch (walletError) {
        console.error("[Dashboard] Erreur récupération wallet/transactions:", walletError);
      }
      
      // Fallback: utiliser la table orders si pas de transactions
      if (totalEarnings === 0) {
        const { data: earnings, error: earningsError } = await supabase
          .from('orders')
          .select('price')
          .eq('freelance_id', userId)
          .eq('status', 'completed');
        
        if (!earningsError && earnings) {
          totalEarnings = earnings.reduce((sum, order) => sum + (order.price || 0), 0);
        } else if (earningsError) {
          console.error("[Dashboard] Erreur récupération revenus:", earningsError);
        }
      }
      
      defaultStats.totalEarnings = totalEarnings;
      
      // Récupérer le nombre de services
      try {
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id')
          .eq('freelance_id', userId)
          .eq('active', true);
        
        if (!servicesError && services) {
          defaultStats.servicesCount = services.length;
        } else if (servicesError) {
          console.error("[Dashboard] Erreur récupération services:", servicesError);
        }
      } catch (serviceError) {
        console.error("[Dashboard] Exception lors de la récupération des services:", serviceError);
      }
      
      console.log("[Dashboard] Statistiques freelance récupérées directement:", defaultStats);
      return defaultStats;
    } catch (error) {
      console.error("[Dashboard] Erreur lors de la récupération directe des stats freelance:", error);
      return {
        activeOrders: 0,
        unreadMessages: 0,
        pendingDeliveries: 0,
        totalEarnings: 0,
        servicesCount: 0
      };
    }
  }, []);

  // Fonction optimisée pour charger les activités récentes
  const fetchRecentActivities = useCallback(async (userId: string) => {
    try {
      // Vérifier le cache d'abord
      if (useCache && cacheKey) {
        const cachedActivities = getCachedData<Activity[]>(`${cacheKey}_activities`);
        if (cachedActivities) {
          console.log("[Dashboard] Activités récupérées du cache", cachedActivities.length);
          setRecentActivities(cachedActivities);
          setLoadingActivities(false);
          return;
        }
      }
      
      console.log("[Dashboard] Récupération des activités depuis Supabase...");
      
      // Créer une activité factice en attendant l'implémentation de la table des activités
      const mockActivities: Activity[] = [];
      
      // Récupérer les commandes récentes pour créer des activités
      try {
        const { data: recentOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, status, client_id, freelance_id')
          .or(`client_id.eq.${userId},freelance_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (!ordersError && recentOrders && recentOrders.length > 0) {
          recentOrders.forEach((order, index) => {
            mockActivities.push({
              id: `order-${order.id}`,
              type: order.status === 'completed' ? 'order_completed' : 'order_created',
              content: `Commande #${order.id ? order.id.substring(0, 8) : 'inconnue'} ${order.status === 'completed' ? 'terminée' : 'créée'}`,
              created_at: order.created_at,
              user_id: userId,
              related_id: order.id
            });
          });
        }
      } catch (e) {
        console.error("[Dashboard] Erreur lors de la récupération des commandes récentes:", e);
      }
      
      // Récupérer les messages récents pour créer des activités
      try {
        const { data: recentMessages, error: messagesError } = await supabase
          .from('messages')
          .select('id, created_at, conversation_id')
          .neq('sender_id', userId)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(2);
          
        if (!messagesError && recentMessages && recentMessages.length > 0) {
          recentMessages.forEach((message, index) => {
            mockActivities.push({
              id: `message-${message.id}`,
              type: 'message_received',
              content: `Nouveau message reçu dans la conversation #${message.conversation_id ? message.conversation_id.substring(0, 8) : 'inconnue'}`,
              created_at: message.created_at,
              user_id: userId,
              related_id: message.conversation_id
            });
          });
        }
      } catch (e) {
        console.error("[Dashboard] Erreur lors de la récupération des messages récents:", e);
      }
      
      // Si aucune activité n'a été trouvée, créer une activité de bienvenue
      if (mockActivities.length === 0) {
        mockActivities.push({
          id: '0',
          type: 'info',
          content: 'Bienvenue sur votre tableau de bord',
          created_at: new Date().toISOString(),
          user_id: userId
        });
      }
      
      // Trier les activités par date de création (la plus récente en premier)
      mockActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setRecentActivities(mockActivities);
      
      // Mettre en cache les activités
      if (useCache && cacheKey) {
        setCachedData(`${cacheKey}_activities`, mockActivities, { 
          expiry: dashboardConfig.cache.expiry.activities 
        });
      }
      
    } catch (e) {
      console.error("[Dashboard] Exception lors du chargement des activités:", e);
      
      // Utiliser une activité fictive en cas d'erreur
      const fallbackActivity = [{
        id: '0',
        type: 'info',
        content: 'Aucune activité récente',
        created_at: new Date().toISOString(),
        user_id: userId
      }];
      
      setRecentActivities(fallbackActivity);
    } finally {
      setLoadingActivities(false);
    }
  }, [cacheKey, useCache, dashboardConfig]);

  // Fonction optimisée pour charger toutes les données du dashboard
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Protection contre les requêtes concurrentes ou pendant la navigation
    if (isFetchingRef.current || (!forceRefresh && NavigationLoadingState.isNavigating)) {
      console.log("[Dashboard] Requête ignorée: déjà en cours ou navigation en cours");
      return;
    }
    
    if (!profile?.id) {
      console.log("[Dashboard] Requête ignorée: pas de profil utilisateur");
      return;
    }
    
    // Limiter la fréquence des requêtes
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTimeRef.current < 5000)) {
      console.log("[Dashboard] Requête ignorée: throttling (5s)");
      return;
    }
    
    try {
      console.log(`[Dashboard] Début de la récupération des données du dashboard (${isClient ? 'client' : 'freelance'})`);
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      // Indicateurs de chargement
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoadingStats(true);
        setLoadingActivities(true);
      }
      
      // Annuler les requêtes précédentes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Vérifier le cache d'abord
      if (useCache && cacheKey && !forceRefresh) {
        const cachedStats = isClient 
          ? getCachedData<ClientStats>(`${cacheKey}_stats`)
          : getCachedData<FreelanceStats>(`${cacheKey}_stats`);
        
        if (cachedStats) {
          console.log("[Dashboard] Données récupérées du cache");
          if (isClient) {
            setClientStats(cachedStats as ClientStats);
          } else {
            setFreelanceStats(cachedStats as FreelanceStats);
          }
          setLoadingStats(false);
          
          // Si le cache est très récent, terminer ici
          const lastUpdate = getCachedData<number>(`${cacheKey}_timestamp`);
          if (lastUpdate && (Date.now() - lastUpdate < 60000)) {
            console.log("[Dashboard] Cache récent (<1min), arrêt du chargement");
            setLoadingActivities(false);
            isFetchingRef.current = false;
            setIsRefreshing(false);
            return;
          }
        }
      }
      
      // Appel à la fonction RPC consolidée - si disponible
      if (rpcAvailable) {
        try {
          // S'assurer que le rôle est exactement 'client' ou 'freelance' pour éviter les problèmes d'ambiguïté
          const role = isClient ? 'client' : 'freelance';
          console.log(`[Dashboard] Appel RPC get_dashboard_stats avec user_id=${profile.id}, role=${role}`);
          
          // Appel de la fonction RPC
          try {
            const { data: consolidatedData, error: rpcError } = await supabase.rpc('get_dashboard_stats', { 
              p_user_id: profile.id,
              p_user_role: role
            });
            
            console.log("[Dashboard] Résultat brut de l'appel RPC:", { data: consolidatedData, error: rpcError });
            
            if (rpcError) {
              console.error("[Dashboard] Erreur RPC:", rpcError.message, rpcError.details, rpcError.hint);
              throw new Error("RPC error");
            }
            
            if (consolidatedData) {
              console.log("[Dashboard] Données RPC récupérées:", consolidatedData);
              let statsData;
              
              if (isClient) {
                const clientData = consolidatedData as ClientStats;
                setClientStats(clientData);
                statsData = clientData;
              } else {
                const freelanceData = consolidatedData as FreelanceStats;
                setFreelanceStats(freelanceData);
                statsData = freelanceData;
              }
              
              // Mise à jour du cache
              if (useCache && cacheKey) {
                console.log("[Dashboard] Mise en cache des statistiques");
                setCachedData(`${cacheKey}_stats`, statsData, { 
                  expiry: dashboardConfig.cache.expiry.stats 
                });
                setCachedData(`${cacheKey}_timestamp`, Date.now(), { 
                  expiry: dashboardConfig.cache.expiry.stats 
                });
              }
              
              // Nettoyer et terminer
              setLoadingStats(false);
              setError(null);
              
              // Charger les activités
              await fetchRecentActivities(profile.id);
              
              // Mettre à jour l'interface
              updateLastRefresh();
              setRefreshCount(prev => prev + 1);
              
              return; // Terminer si tout s'est bien passé avec l'appel RPC
            } else {
              console.warn("[Dashboard] Pas de données retournées par l'RPC");
              throw new Error("No RPC data");
            }
          } catch (rpcCallError) {
            console.error("[Dashboard] Erreur lors de l'appel RPC:", rpcCallError);
            throw new Error("RPC call failed");
          }
        } catch (error) {
          console.error("[Dashboard] Exception avec RPC, fallback sur les méthodes directes:", error);
          // Continuer avec le fallback
        }
      } else {
        console.log("[Dashboard] RPC non disponible, utilisation des méthodes directes");
      }
      
      // Méthode alternative (fallback) pour récupérer les données
      try {
        console.log("[Dashboard] Tentative de récupération alternative des données");
        
        if (isClient) {
          // Récupérer les stats client via des requêtes directes
          const clientFallbackStats = await fetchClientStatsDirectly(profile.id);
          setClientStats(clientFallbackStats);
        } else {
          // Récupérer les stats freelance via des requêtes directes
          const freelanceFallbackStats = await fetchFreelanceStatsDirectly(profile.id);
          console.log("[Dashboard] Stats freelance récupérées:", freelanceFallbackStats);
          setFreelanceStats(freelanceFallbackStats);
        }
        
        setLoadingStats(false);
        setError(null);
        
        // Charger les activités dans tous les cas
        await fetchRecentActivities(profile.id);
        
        // Mise à jour de l'interface
        updateLastRefresh();
        setRefreshCount(prev => prev + 1);
      } catch (fallbackError) {
        console.error("[Dashboard] Erreur lors de la récupération alternative:", fallbackError);
        setError(`Une erreur est survenue lors du chargement des données du ${isClient ? 'tableau de bord client' : 'tableau de bord freelance'}.`);
      }
    } catch (e) {
      console.error("[Dashboard] Exception globale:", e);
      setError("Une erreur inattendue est survenue.");
      setLoadingStats(false);
      setLoadingActivities(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [profile?.id, isClient, useCache, cacheKey, updateLastRefresh, fetchRecentActivities, dashboardConfig, fetchClientStatsDirectly, fetchFreelanceStatsDirectly, rpcAvailable]);

  // Effet optimisé pour charger les données initialement et lors des changements d'utilisateur
  useEffect(() => {
    if (profile?.id && !NavigationLoadingState.isNavigating) {
      console.log("[Dashboard] Chargement initial des données");
      fetchDashboardData();
    }
  }, [profile?.id, fetchDashboardData]);

  // Effet consolidé pour les abonnements aux changements en temps réel et événements d'application
  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined') return;
    
    console.log("[Dashboard] Configuration des abonnements et écouteurs");
    
    // 1. Abonnements aux changements de base de données
    const ordersSubscription = supabase
      .channel('dashboard-orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: isClient 
          ? `client_id=eq.${profile.id}` 
          : `freelance_id=eq.${profile.id}`
      }, () => {
        console.log("[Dashboard] Changement détecté dans les commandes, rechargement des données");
        fetchDashboardData(true);
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('dashboard-messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `read.eq.false` 
      }, () => {
        console.log("[Dashboard] Changement détecté dans les messages, rechargement des données");
        fetchDashboardData(true);
      })
      .subscribe();
    
    // 2. Écouteur pour changements d'état de l'application
    const handleAppVisibility = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === 'visibility' && customEvent.detail?.isVisible) {
        // Ne rafraîchir que si le temps d'inactivité est significatif (>30s)
        if (customEvent.detail?.inactiveDuration > 30000) {
          console.log("[Dashboard] Rafraîchissement automatique après inactivité");
          fetchDashboardData();
        }
      }
    };

    window.addEventListener('vynal:app-state-changed', handleAppVisibility as EventListener);
    
    // Nettoyage de tous les abonnements et écouteurs
    return () => {
      console.log("[Dashboard] Nettoyage des abonnements et écouteurs");
      ordersSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      window.removeEventListener('vynal:app-state-changed', handleAppVisibility as EventListener);
    };
  }, [profile?.id, isClient, fetchDashboardData, supabase]);

  // Fonction pour déclencher un rafraîchissement manuel
  const refreshDashboard = useCallback((force = true) => {
    console.log("[Dashboard] Rafraîchissement manuel demandé");
    fetchDashboardData(force);
  }, [fetchDashboardData]);

  return {
    clientStats,
    freelanceStats,
    recentActivities,
    loadingStats,
    loadingActivities,
    error,
    refreshDashboard,
    isRefreshing,
    lastRefresh,
    getLastRefreshText,
    refreshCount,
    dashboardConfig
  };
}

/**
 * Version simplifiée du hook useDashboard pour les composants légers
 */
export function useOptimizedDashboard() {
  const { isClient } = useUser();
  const dashboard = useDashboard({ useCache: true });
  
  // Renvoyer uniquement les données pertinentes selon le type d'utilisateur
  return {
    stats: isClient ? dashboard.clientStats : dashboard.freelanceStats,
    isLoading: dashboard.loadingStats,
    refreshDashboard: dashboard.refreshDashboard,
    isRefreshing: dashboard.isRefreshing,
    getLastRefreshText: dashboard.getLastRefreshText,
    dashboardConfig: dashboard.dashboardConfig,
    error: dashboard.error
  };
}
