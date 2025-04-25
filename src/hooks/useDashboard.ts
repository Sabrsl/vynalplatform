import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS, 
  CACHE_EXPIRY,
  CACHE_PRIORITIES
} from '@/lib/optimizations';
import { useLastRefresh } from './useLastRefresh';
import { NavigationLoadingState } from '@/app/providers';

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

// Configuration des timeouts pour éviter les cascades de requêtes
const REQUEST_TIMEOUT = 5000; // 5 secondes maximum pour une requête
const DASHBOARD_LOAD_TIMEOUT = 6000; // Réduit de 8 à 6 secondes pour le chargement complet
const SPINNER_DEBOUNCE_TIME = 300; // Augmenté de 200ms à 300ms pour éviter le clignotement

/**
 * Hook pour les données du tableau de bord
 */
export function useDashboard(options: UseDashboardOptions = {}) {
  const { useCache = true } = options;
  const { profile, isClient, isFreelance } = useUser({ useCache });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false); // Initialisé à false
  
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
  
  const [loadingStats, setLoadingStats] = useState(false); // Initialisé à false
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  // Références pour éviter les appels redondants
  const fetchingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadAttemptsRef = useRef(0); // Compter les tentatives de chargement

  // Clés de cache simplifiées
  const getCacheKey = useCallback(() => {
    if (!useCache || !profile?.id) return '';
    
    const role = isClient ? 'client' : 'freelance';
    return `dashboard_${role}_${profile.id}`;
  }, [profile?.id, isClient, useCache]);

  // Fonction spéciale pour afficher les spinners avec un délai
  const setDebouncedLoadingState = useCallback((
    setStatsLoading: boolean, 
    setActivitiesLoading: boolean
  ) => {
    // Annuler tout timer de spinner précédent
    if (spinnerTimeoutRef.current) {
      clearTimeout(spinnerTimeoutRef.current);
      spinnerTimeoutRef.current = null;
    }
    
    // Si on désactive le chargement, le faire immédiatement
    if (!setStatsLoading && !setActivitiesLoading) {
      setLoadingStats(false);
      setLoadingActivities(false);
      return;
    }
    
    // Vérifier si nous avons des données valides avant d'afficher des spinners
    const hasExistingStats = isClient 
      ? clientStats.activeOrders > 0 || clientStats.unreadMessages > 0
      : freelanceStats.activeOrders > 0 || freelanceStats.unreadMessages > 0;
    const hasExistingActivities = recentActivities.length > 0;
    
    // Si nous avons déjà des données, ne pas montrer les spinners sauf si forceRefresh est actif
    const hasExistingData = hasExistingStats && hasExistingActivities;
    
    // Seulement retarder l'affichage du spinner pour éviter le clignotement
    spinnerTimeoutRef.current = setTimeout(() => {
      // Seulement activer le spinner si on est toujours en chargement
      if (fetchingRef.current) {
        // Si nous avons des données, n'activons pas les spinners tous en même temps
        // pour éviter l'effet de cascade
        if (hasExistingData) {
          // Activer les spinners avec un délai entre eux si nécessaire
          if (setStatsLoading) {
            setLoadingStats(true);
            
            // Retarder l'activation du second spinner pour éviter la cascade
            if (setActivitiesLoading) {
              setTimeout(() => {
                if (fetchingRef.current) { // Vérifier qu'on est toujours en chargement
                  setLoadingActivities(true);
                }
              }, 300);
            }
          } else if (setActivitiesLoading) {
            setLoadingActivities(true);
          }
        } else {
          // Sans données existantes, on peut activer les deux en même temps
          if (setStatsLoading) setLoadingStats(true);
          if (setActivitiesLoading) setLoadingActivities(true);
        }
      }
    }, SPINNER_DEBOUNCE_TIME);
  }, [clientStats, freelanceStats, recentActivities, isClient]);

  // Fonction pour créer une requête avec timeout
  const createTimeoutRequest = useCallback(async (apiCall: any) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('La requête a pris trop de temps')), REQUEST_TIMEOUT);
    });
    
    // Retourne ce qui termine le premier: la requête ou le timeout
    return Promise.race([apiCall, timeoutPromise]);
  }, []);
  
  // Fonction pour regrouper les requêtes en un seul appel réseau lorsque possible
  const createBatchedRequest = useCallback(async (userId: string, role: 'client' | 'freelance') => {
    if (!userId) return { data: null, error: new Error('ID utilisateur manquant') };
    
    // Requête optimisée qui combine plusieurs informations en une seule requête
    try {
      const roleField = role === 'client' ? 'client_id' : 'freelance_id';
      
      // Utiliser une requête RPC pour obtenir toutes les statistiques en un seul appel
      return await createTimeoutRequest(
        supabase.rpc('get_dashboard_stats', { 
          p_user_id: userId,
          p_user_role: role
        })
      );
    } catch (error) {
      console.error('Erreur lors de la requête groupée:', error);
      return { data: null, error };
    }
  }, [createTimeoutRequest]);
  
  // Fonction optimisée pour charger les activités
  const loadActivities = useCallback(async (userId: string) => {
    if (!userId) return [];
    
    try {
      const result = await createTimeoutRequest(
        supabase
          .from('activities')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      );
      
      return result.data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      return [];
    }
  }, [createTimeoutRequest]);
  
  // Fonction unifiée pour charger toutes les données du dashboard
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Protection contre les requêtes concurrentes
    if (fetchingRef.current && !forceRefresh) {
      console.warn("Requête dashboard déjà en cours, nouvelle requête annulée");
      return;
    }
    
    // Vérifier que l'utilisateur est connecté
    if (!profile?.id) {
      console.warn("Tentative de chargement dashboard sans profil utilisateur");
      return;
    }
    
    // Protection contre les chargements pendant la navigation - sauf forceRefresh
    if (NavigationLoadingState.isNavigating && !forceRefresh) {
      console.warn("Navigation en cours, chargement dashboard reporté");
      return;
    }
    
    // Variable pour stocker le timeout global
    let dashboardTimeout: NodeJS.Timeout | null = null;
    
    try {
      // Incrémenter le compteur de tentatives
      loadAttemptsRef.current += 1;
      const currentAttempt = loadAttemptsRef.current;
      
      // Limiter le nombre de tentatives successives pour éviter les boucles infinies
      if (currentAttempt > 3 && !forceRefresh) {
        console.warn('Trop de tentatives successives de chargement du dashboard, abandon');
        return;
      }
      
      fetchingRef.current = true;
      
      // Utiliser notre fonction de debounce pour retarder l'affichage des spinners
      // Seulement si on n'a pas déjà des données
      const hasExistingStats = isClient 
        ? clientStats.activeOrders > 0 || clientStats.unreadMessages > 0
        : freelanceStats.activeOrders > 0 || freelanceStats.unreadMessages > 0;
      const hasExistingActivities = recentActivities.length > 0;
      
      if (!hasExistingStats) {
        setDebouncedLoadingState(true, false);
      }
      
      if (!hasExistingActivities) {
        setDebouncedLoadingState(false, true);
      }
      
      // Annuler toute requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Créer un nouveau contrôleur d'annulation
      abortControllerRef.current = new AbortController();
      
      // PROTECTION CRITIQUE: timeout global pour tout le chargement et nettoyage final
      dashboardTimeout = setTimeout(() => {
        if (fetchingRef.current) {
          // Annuler les requêtes en cours
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          
          // Terminer le chargement avec les données disponibles
          setDebouncedLoadingState(false, false);
          setIsRefreshing(false);
          fetchingRef.current = false;
          
          // Si une erreur existait déjà et qu'aucune donnée n'est disponible, conserver l'erreur
          // sinon afficher une erreur de timeout spécifique
          if (!error && ((isClient && clientStats.activeOrders === 0 && recentActivities.length === 0) || 
              (isFreelance && freelanceStats.activeOrders === 0 && recentActivities.length === 0))) {
            setError("Le chargement a pris trop de temps, veuillez réessayer");
          }
        }
      }, DASHBOARD_LOAD_TIMEOUT);
      
      // Étape critique : vérifier si une navigation est en cours
      // Si oui, utiliser les données du cache immédiatement plutôt que de charger
      if (NavigationLoadingState.isNavigating && !forceRefresh) {
        const cacheKey = getCacheKey();
        if (cacheKey) {
          const cachedStats = isClient 
            ? getCachedData<ClientStats>(`${cacheKey}_stats`)
            : getCachedData<FreelanceStats>(`${cacheKey}_stats`);
            
          const cachedActivities = getCachedData<Activity[]>(`${cacheKey}_activities`);
          
          if (cachedStats) {
            if (isClient) {
              setClientStats(cachedStats as ClientStats);
            } else {
              setFreelanceStats(cachedStats as FreelanceStats);
            }
            setLoadingStats(false);
          }
          
          if (cachedActivities) {
            setRecentActivities(cachedActivities);
            setLoadingActivities(false);
          }
          
          // Ne pas charger de données pendant une navigation, seulement utiliser le cache
          if (cachedStats || cachedActivities) {
            clearTimeout(dashboardTimeout);
            fetchingRef.current = false;
            return;
          }
        }
      }
      
      // Si on n'est pas en forceRefresh, vérifier le cache
      if (useCache && !forceRefresh) {
        const cacheKey = getCacheKey();
        
        if (cacheKey) {
          // Vérifier si nous avons des données en cache
          const cachedStats = isClient 
            ? getCachedData<ClientStats>(`${cacheKey}_stats`)
            : getCachedData<FreelanceStats>(`${cacheKey}_stats`);
            
          const cachedActivities = getCachedData<Activity[]>(`${cacheKey}_activities`);
          
          if (cachedStats || cachedActivities) {
            // Utiliser les données en cache si disponibles
            if (cachedStats) {
              if (isClient) {
                setClientStats(cachedStats as ClientStats);
              } else {
                setFreelanceStats(cachedStats as FreelanceStats);
              }
              setLoadingStats(false);
            }
            
            if (cachedActivities) {
              setRecentActivities(cachedActivities);
              setLoadingActivities(false);
            }
            
            // Si le cache est valide (moins de 2 minutes) et que toutes les données sont présentes, retourner
            const lastUpdate = getCachedData<number>(`${cacheKey}_timestamp`);
            const cacheValid = lastUpdate && (Date.now() - lastUpdate < 120000);
            
            if (cacheValid && cachedStats && cachedActivities) {
              // Précharger les données en arrière-plan pour la prochaine visite
              if (!NavigationLoadingState.isNavigating) {
                setTimeout(() => updateDataInBackground(), 1000);
              }
              
              // Nettoyer le timeout et désactiver l'état de chargement
              clearTimeout(dashboardTimeout);
              setDebouncedLoadingState(false, false);
              fetchingRef.current = false;
              
              // Réinitialiser le compteur de tentatives
              loadAttemptsRef.current = 0;
              return;
            }
          }
        }
      }
      
      // OPTIMISATION: Essayer d'abord d'utiliser la requête RPC optimisée
      try {
        // Commencer par charger les activités car elles sont indépendantes des stats
        const activitiesPromise = loadActivities(profile.id);
        
        // Tenter d'utiliser la requête RPC optimisée
        const role = isClient ? 'client' : 'freelance';
        const batchedStatsPromise = createBatchedRequest(profile.id, role);
        
        // Exécuter les requêtes en parallèle
        const [batchedStats, activities] = await Promise.allSettled([
          batchedStatsPromise,
          activitiesPromise
        ]);
        
        // Traiter les activités si disponibles
        if (activities.status === 'fulfilled' && activities.value) {
          setRecentActivities(activities.value);
          setDebouncedLoadingState(false, false);
        }
        
        // Vérifier si les statistiques optimisées ont fonctionné
        if (batchedStats.status === 'fulfilled' && batchedStats.value?.data) {
          const statsData = batchedStats.value.data;
          
          // Traiter selon le rôle
          if (isClient) {
            const newStats: ClientStats = {
              activeOrders: statsData.active_orders || 0,
              unreadMessages: statsData.unread_messages || 0,
              pendingDeliveries: statsData.pending_deliveries || 0,
              pendingReviews: statsData.pending_reviews || 0
            };
            
            setClientStats(newStats);
            setDebouncedLoadingState(false, false);
            
            // Mettre en cache
            if (useCache) {
              const cacheKey = getCacheKey();
              if (cacheKey) {
                setCachedData(`${cacheKey}_stats`, newStats, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
                if (activities.status === 'fulfilled' && activities.value) {
                  setCachedData(`${cacheKey}_activities`, activities.value, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
                }
                setCachedData(`${cacheKey}_timestamp`, Date.now());
              }
            }
          } else if (isFreelance) {
            const newStats: FreelanceStats = {
              activeOrders: statsData.active_orders || 0,
              unreadMessages: statsData.unread_messages || 0,
              pendingDeliveries: statsData.pending_deliveries || 0,
              totalEarnings: statsData.total_earnings || 0,
              servicesCount: statsData.services_count || 0
            };
            
            setFreelanceStats(newStats);
            setDebouncedLoadingState(false, false);
            
            // Mettre en cache
            if (useCache) {
              const cacheKey = getCacheKey();
              if (cacheKey) {
                setCachedData(`${cacheKey}_stats`, newStats, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
                if (activities.status === 'fulfilled' && activities.value) {
                  setCachedData(`${cacheKey}_activities`, activities.value, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
                }
                setCachedData(`${cacheKey}_timestamp`, Date.now());
              }
            }
          }
          
          // Si nous avons réussi à obtenir les données via RPC, terminer ici
          clearTimeout(dashboardTimeout);
          fetchingRef.current = false;
          setError(null);
          setRefreshCount(prev => prev + 1);
          updateLastRefresh();
          
          // Réinitialiser le compteur de tentatives
          loadAttemptsRef.current = 0;
          return;
        }
        
        // Si la requête RPC a échoué, poursuivre avec les requêtes individuelles
        console.warn("La requête RPC optimisée a échoué, utilisation des requêtes individuelles");
      } catch (rpcError) {
        console.error("Erreur lors de la requête RPC optimisée:", rpcError);
        // Continuer avec les requêtes individuelles
      }
      
      // Commun: Messages non lus
      const messagesPromise = createTimeoutRequest(
        supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', profile.id)
          .eq('read', false)
      );
      
      // Activités récentes
      const activitiesPromise = createTimeoutRequest(
        supabase
          .from('activities')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10)
      );
      
      // Requêtes spécifiques selon le rôle
      let roleSpecificPromises: Promise<any>[] = [];
      
      if (isClient) {
        roleSpecificPromises = [
          // Commandes actives
          createTimeoutRequest(
            supabase
              .from('orders')
              .select('id, status')
              .eq('client_id', profile.id)
              .in('status', ['pending', 'in_progress', 'revision_requested'])
          ),
          
          // Livraisons en attente
          createTimeoutRequest(
            supabase
              .from('orders')
              .select('id')
              .eq('client_id', profile.id)
              .eq('status', 'delivered')
              .is('completed_at', null)
          ),
          
          // Commandes complétées sans avis
          createTimeoutRequest(
            supabase
              .from('orders')
              .select('id, has_review')
              .eq('client_id', profile.id)
              .eq('status', 'completed')
              .eq('has_review', false)
          )
        ];
      } else {
        roleSpecificPromises = [
          // Commandes actives pour le freelance
          createTimeoutRequest(
            supabase
              .from('orders')
              .select('id, status')
              .eq('freelance_id', profile.id)
              .in('status', ['pending', 'in_progress', 'revision_requested'])
          ),
          
          // Livraisons en attente de validation
          createTimeoutRequest(
            supabase
              .from('orders')
              .select('id')
              .eq('freelance_id', profile.id)
              .eq('status', 'delivered')
              .is('completed_at', null)
          ),
          
          // Services proposés
          createTimeoutRequest(
            supabase
              .from('services')
              .select('id')
              .eq('freelance_id', profile.id)
          ),
          
          // Gains totaux
          createTimeoutRequest(
            supabase
              .from('orders')
              .select('amount')
              .eq('freelance_id', profile.id)
              .eq('status', 'completed')
          )
        ];
      }
      
      try {
        // Exécuter toutes les requêtes en parallèle
        const responses = await Promise.allSettled([messagesPromise, activitiesPromise, ...roleSpecificPromises]);
        
        // Traiter les résultats même si certaines requêtes ont échoué
        const messagesResponse = responses[0].status === 'fulfilled' ? responses[0].value : { data: [], error: null };
        const activitiesResponse = responses[1].status === 'fulfilled' ? responses[1].value : { data: [], error: null };
        
        // Collecter les réponses spécifiques au rôle
        const roleResponses = responses.slice(2).map(response => 
          response.status === 'fulfilled' ? response.value : { data: [], error: null }
        );
        
        // Mettre à jour les données des messages et activités (même partielles)
        const unreadMessages = messagesResponse.data?.length || 0;
        if (activitiesResponse.data) {
          setRecentActivities(activitiesResponse.data);
          setLoadingActivities(false);
        }
        
        // Mettre à jour les statistiques selon le rôle avec les données partielles disponibles
        if (isClient) {
          const [ordersResponse, deliveriesResponse, reviewsResponse] = roleResponses;
          
          const newStats = {
            activeOrders: ordersResponse.data?.length || 0,
            unreadMessages,
            pendingDeliveries: deliveriesResponse.data?.length || 0,
            pendingReviews: reviewsResponse.data?.length || 0
          };
          
          setClientStats(newStats);
          setLoadingStats(false);
          
          // Mettre en cache
          if (useCache) {
            const cacheKey = getCacheKey();
            if (cacheKey) {
              setCachedData(`${cacheKey}_stats`, newStats, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
              if (activitiesResponse.data) {
                setCachedData(`${cacheKey}_activities`, activitiesResponse.data, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
              }
              setCachedData(`${cacheKey}_timestamp`, Date.now());
            }
          }
        } 
        else if (isFreelance) {
          const [ordersResponse, deliveriesResponse, servicesResponse, earningsResponse] = roleResponses;
          
          const totalEarnings = earningsResponse.data?.reduce((sum: number, order: {amount?: number}) => sum + (order.amount || 0), 0) || 0;
          
          const newStats = {
            activeOrders: ordersResponse.data?.length || 0,
            unreadMessages,
            pendingDeliveries: deliveriesResponse.data?.length || 0,
            totalEarnings,
            servicesCount: servicesResponse.data?.length || 0
          };
          
          setFreelanceStats(newStats);
          setLoadingStats(false);
          
          // Mettre en cache
          if (useCache) {
            const cacheKey = getCacheKey();
            if (cacheKey) {
              setCachedData(`${cacheKey}_stats`, newStats, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
              if (activitiesResponse.data) {
                setCachedData(`${cacheKey}_activities`, activitiesResponse.data, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
              }
              setCachedData(`${cacheKey}_timestamp`, Date.now());
            }
          }
        }
        
        // Incrémenter le compteur pour forcer les mises à jour
        setRefreshCount(prev => prev + 1);
        updateLastRefresh();
        
        // Effacer l'erreur si le chargement a réussi
        setError(null);
      } catch (innerError: any) {
        console.error("Erreur lors du traitement des données:", innerError);
        setError("Certaines données n'ont pas pu être chargées");
        
        // S'assurer que les données de chargement sont réinitialisées même en cas d'erreur
        setLoadingStats(false);
        setLoadingActivities(false);
      }
      
    } catch (error: any) {
      console.error("Erreur lors du chargement des données de dashboard:", error);
      setError("Problème de connexion, veuillez réessayer");
      
      // S'assurer que les états de chargement sont réinitialisés
      setDebouncedLoadingState(false, false);
    } finally {
      // Nettoyer le timer global
      if (dashboardTimeout) {
        clearTimeout(dashboardTimeout);
      }
      
      // Réinitialiser les états
      setIsRefreshing(false);
      fetchingRef.current = false;
      
      // Nettoyer l'AbortController
      abortControllerRef.current = null;
    }
  }, [profile?.id, isClient, isFreelance, getCacheKey, updateLastRefresh, useCache, createTimeoutRequest, setDebouncedLoadingState, clientStats, freelanceStats, recentActivities]);

  // Mise à jour des données en arrière-plan sans état de chargement
  const updateDataInBackground = useCallback(() => {
    if (!fetchingRef.current && profile?.id) {
      try {
        // Utiliser un nouvel AbortController spécifique aux mises à jour en arrière-plan
        const abortController = new AbortController();
        
        // Effectuer les requêtes de manière groupée
        const role = isClient ? 'client' : 'freelance';
        
        // Attendre un court délai pour éviter de surcharger le réseau
        setTimeout(async () => {
          // Vérifier si l'utilisateur est toujours sur le dashboard
          if (typeof window !== 'undefined' && 
              window.location.pathname.startsWith('/dashboard') && 
              document.visibilityState === 'visible') {
            
            // Charger les données de base
            try {
              const batchedStatsPromise = createBatchedRequest(profile.id, role);
              const activitiesPromise = loadActivities(profile.id);
              
              const [batchedStats, activities] = await Promise.allSettled([
                batchedStatsPromise,
                activitiesPromise
              ]);
              
              // Mettre à jour le cache sans changer l'état UI
              const cacheKey = getCacheKey();
              if (cacheKey && batchedStats.status === 'fulfilled' && batchedStats.value.data) {
                // Traiter les données selon le rôle
                if (isClient) {
                  const clientData = batchedStats.value.data;
                  const newStats: ClientStats = {
                    activeOrders: clientData.active_orders || 0,
                    unreadMessages: clientData.unread_messages || 0,
                    pendingDeliveries: clientData.pending_deliveries || 0,
                    pendingReviews: clientData.pending_reviews || 0
                  };
                  
                  setCachedData(`${cacheKey}_stats`, newStats, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
                } else {
                  const freelanceData = batchedStats.value.data;
                  const newStats: FreelanceStats = {
                    activeOrders: freelanceData.active_orders || 0,
                    unreadMessages: freelanceData.unread_messages || 0,
                    pendingDeliveries: freelanceData.pending_deliveries || 0,
                    totalEarnings: freelanceData.total_earnings || 0,
                    servicesCount: freelanceData.services_count || 0
                  };
                  
                  setCachedData(`${cacheKey}_stats`, newStats, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
                }
              }
              
              // Mettre en cache les activités si disponibles
              if (cacheKey && activities.status === 'fulfilled' && activities.value.length > 0) {
                setCachedData(`${cacheKey}_activities`, activities.value, { expiry: CACHE_EXPIRY.DASHBOARD_DATA });
              }
              
              // Mettre à jour le timestamp du cache
              if (cacheKey) {
                setCachedData(`${cacheKey}_timestamp`, Date.now());
              }
            } catch (error) {
              console.error('Erreur lors de la mise à jour en arrière-plan:', error);
            }
          }
        }, 2000);
        
        return () => {
          abortController.abort();
        };
      } catch (error) {
        console.error('Erreur lors de la préparation de la mise à jour en arrière-plan:', error);
      }
    }
  }, [profile?.id, isClient, fetchingRef, getCacheKey, createBatchedRequest, loadActivities]);

  // Fonction publique pour rafraîchir le dashboard
  const refreshDashboard = useCallback(() => {
    // Vérification critique: si navigation en cours, annuler complètement le rafraîchissement
    if (NavigationLoadingState.isNavigating) {
      console.warn('Navigation en cours, rafraîchissement annulé');
      return;
    }
    
    // Vérifier si on est déjà en cours de rafraîchissement ou si l'ID du profil est manquant
    if (isRefreshing || !profile?.id) return;
    
    // Protection contre les rafraîchissements en cascade: vérifier l'état de fetchingRef
    if (fetchingRef.current) {
      console.warn('Requête déjà en cours, rafraîchissement ignoré');
      return;
    }
    
    // Éviter les multiples rafraîchissements en une courte période
    const now = Date.now();
    
    // S'assurer que lastRefresh est un nombre valide et non NaN
    const lastUpdateTime = typeof lastRefresh === 'number' && !isNaN(lastRefresh) 
      ? lastRefresh 
      : 0;
    
    // Ne permettre le rafraîchissement que 2 secondes après le dernier
    if (now - lastUpdateTime < 2000) {
      console.warn('Rafraîchissement trop fréquent, abandon');
      return;
    }
    
    // Marquer comme en cours de rafraîchissement
    setIsRefreshing(true);
    fetchingRef.current = true;
    
    // N'afficher le spinner que si la dernière mise à jour date de plus de 5 secondes
    if (now - lastUpdateTime > 5000) {
      // Activer le spinner avec un délai pour éviter le clignotement
      setDebouncedLoadingState(true, true);
    }
    
    // Invalider le cache
    if (useCache) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        invalidateCache(`${cacheKey}_stats`);
        invalidateCache(`${cacheKey}_activities`);
      }
    }
    
    // Protection contre les plantages: s'assurer que l'état de chargement se termine
    const safetyTimeout = setTimeout(() => {
      if (fetchingRef.current || isRefreshing) {
        console.warn('Délai de sécurité atteint, réinitialisation forcée des états de chargement');
        fetchingRef.current = false;
        setIsRefreshing(false);
        setDebouncedLoadingState(false, false);
      }
    }, 8000); // 8 secondes max pour tout le processus
    
    // Ajouter un délai minimal avant de recharger pour éviter le clignotement
    setTimeout(() => {
      try {
        // Recharger les données avec forceRefresh à true
        fetchDashboardData(true);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        // Réinitialiser l'état même en cas d'erreur
        fetchingRef.current = false;
        setIsRefreshing(false);
        setDebouncedLoadingState(false, false);
      }
      
      // Nettoyer le timeout de sécurité puisque fetchDashboardData a été appelé
      clearTimeout(safetyTimeout);
    }, 50);
  }, [getCacheKey, fetchDashboardData, isRefreshing, profile?.id, useCache, lastRefresh, setDebouncedLoadingState]);

  // Effet pour le chargement initial des données avec gestion des erreurs
  useEffect(() => {
    if (profile?.id) {
      // Nettoyer les précédents timeouts si existants
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Annuler tout timer de spinner précédent
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
        spinnerTimeoutRef.current = null;
      }
      
      // Réinitialiser le compteur de tentatives
      loadAttemptsRef.current = 0;
      
      // Vérifier s'il y a des données existantes avant de lancer le chargement
      const hasExistingData = isClient 
        ? clientStats.activeOrders > 0 || clientStats.unreadMessages > 0 || recentActivities.length > 0
        : freelanceStats.activeOrders > 0 || freelanceStats.unreadMessages > 0 || recentActivities.length > 0;
        
      // Si on a déjà des données, ne pas montrer de spinner immédiatement
      if (!hasExistingData) {
        setDebouncedLoadingState(true, true);
      }
      
      // Tentative initiale
      fetchDashboardData();
      
      // Établir un delay maximal pour terminer le chargement dans tous les cas
      timeoutRef.current = setTimeout(() => {
        if (loadingStats || loadingActivities) {
          setDebouncedLoadingState(false, false);
          
          // Ne pas afficher d'erreur si des données existent déjà
          const hasData = (isClient && clientStats.activeOrders > 0) || 
                         (isFreelance && freelanceStats.activeOrders > 0) ||
                         recentActivities.length > 0;
          
          if (!hasData) {
            setError("Problème de chargement des données, veuillez réessayer ultérieurement");
          }
        }
      }, DASHBOARD_LOAD_TIMEOUT);
    }
    
    return () => {
      // Nettoyer les timers lors du démontage
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
      }
      
      // Annuler les requêtes en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [profile?.id, fetchDashboardData, isClient, isFreelance, clientStats.activeOrders, freelanceStats.activeOrders, recentActivities.length, loadingStats, loadingActivities, setDebouncedLoadingState]);

  // Écouteur d'événements unifié pour éviter les doublons
  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined') return;
    
    const handleAppStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, fromPath, toPath, isVisible, inactiveDuration } = customEvent.detail || {};
      
      // Éviter les actualisations pendant la navigation
      if (NavigationLoadingState.isNavigating || fetchingRef.current) return;
      
      // Actualisation uniquement sur les routes pertinentes au dashboard
      const isDashboardPath = window.location.pathname.startsWith('/dashboard');
      
      // Traiter différents événements
      switch (type) {
        case 'route_change':
          // Si on navigue vers ou depuis le dashboard
          if ((fromPath && fromPath.startsWith('/dashboard')) || 
              (toPath && toPath.startsWith('/dashboard'))) {
            updateDataInBackground();
          }
          break;
          
        case 'visibility':
          // Si la page redevient visible après une longue inactivité
          if (isVisible && inactiveDuration > 60000 && isDashboardPath) {
            updateDataInBackground();
          }
          break;
          
        case 'service_change':
          // Si un service a été modifié et que l'utilisateur est freelance
          if (isFreelance && isDashboardPath) {
            updateDataInBackground();
          }
          break;
      }
    };
    
    // Un seul écouteur pour tous les événements
    window.addEventListener('vynal:app-state-changed', handleAppStateChange);
    
    // Écouter les changements de services via Supabase Realtime
    const servicesChannel = supabase.channel('public:services')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'services',
        filter: isFreelance ? `freelance_id=eq.${profile.id}` : undefined
      }, () => {
        // Émettre un événement unifié pour le changement de service
        window.dispatchEvent(new CustomEvent('vynal:app-state-changed', {
          detail: { type: 'service_change' }
        }));
      })
      .subscribe();
    
    return () => {
      window.removeEventListener('vynal:app-state-changed', handleAppStateChange);
      servicesChannel.unsubscribe();
    };
  }, [profile?.id, isFreelance, updateDataInBackground]);

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
    refreshCount
  };
}

/**
 * Re-export du hook pour compatibilité
 * @deprecated Utilisez useDashboard avec l'option {useCache: true}
 */
export function useOptimizedDashboard() {
  return useDashboard({ useCache: true });
} 