import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLastRefresh } from './useLastRefresh';
import { 
  getCachedData, 
  setCachedData 
} from '@/lib/optimizations/cache';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/use-toast';
import { NavigationLoadingState } from '@/app/providers';
import { debounce } from 'lodash-es';
import { DisputeWithDetails, getDisputeById } from '@/lib/supabase/disputes';
import { useSearchParams } from 'next/navigation';
import { create } from 'zustand';

// Types pour les onglets et options de tri
export type DisputeStatus = 'all' | 'open' | 'resolved' | 'closed';
export type DisputeSortOption = 'newest' | 'oldest' | 'status';

// Type pour les statistiques des litiges
export interface DisputeStats {
  totalCount: number;
  openCount: number;
  resolvedCount: number;
  closedCount: number;
  recentDisputes: DisputeWithDetails[];
}

// Options pour le hook
interface UseDisputesOptions {
  initialTab?: DisputeStatus;
  itemsPerPage?: number;
  useCache?: boolean;
  initialSortOption?: DisputeSortOption;
}

// Constantes
const CACHE_EXPIRY = {
  DISPUTES_LIST: 5 * 60 * 1000, // 5 minutes
  DISPUTES_STATS: 5 * 60 * 1000, // 5 minutes
  SEARCH_DEBOUNCE_TIME: 300 // ms
};

// Store pour la mise en cache des litiges
interface DisputeStore {
  disputeCache: Record<string, DisputeWithDetails[]>;
  statsCache: Record<string, DisputeStats>;
  setDisputeCache: (key: string, disputes: DisputeWithDetails[]) => void;
  setStatsCache: (key: string, stats: DisputeStats) => void;
  getDisputeCache: (key: string) => DisputeWithDetails[] | undefined;
  getStatsCache: (key: string) => DisputeStats | undefined;
  clearCache: () => void;
}

const useDisputeStore = create<DisputeStore>((set, get) => ({
  disputeCache: {},
  statsCache: {},
  setDisputeCache: (key, disputes) => 
    set(state => ({ 
      disputeCache: { ...state.disputeCache, [key]: disputes }
    })),
  setStatsCache: (key, stats) => 
    set(state => ({ 
      statsCache: { ...state.statsCache, [key]: stats }
    })),
  getDisputeCache: (key) => get().disputeCache[key],
  getStatsCache: (key) => get().statsCache[key],
  clearCache: () => set({ disputeCache: {}, statsCache: {} }),
}));

// Vérifier si la fonction RPC existe
async function checkRPCFunctionExists(functionName: string): Promise<boolean> {
  try {
    // Tentative d'appel de la fonction avec des paramètres invalides pour vérifier son existence
    const { error } = await supabase.rpc(functionName, { 
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_user_role: 'invalid'
    });
    
    // Si l'erreur contient "function does not exist", la fonction n'existe pas
    const doesNotExist = error?.message?.includes('function does not exist') || 
                         error?.message?.includes('fonction inexistante');
    
    return !doesNotExist;
  } catch (e) {
    console.error(`Erreur lors de la vérification de la fonction RPC ${functionName}:`, e);
    return false;
  }
}

/**
 * Hook optimisé pour gérer les litiges
 * Inclut la mise en cache, les abonnements en temps réel et les statistiques
 */
export function useDisputes(options: UseDisputesOptions = {}) {
  const { 
    initialTab = 'all', 
    itemsPerPage = 12,
    useCache = true,
    initialSortOption = 'newest'
  } = options;
  
  const { profile, isClient, isFreelance } = useUser();
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const search = searchParams?.get('search') || '';
  
  // États
  const [activeTab, setActiveTab] = useState<DisputeStatus>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<DisputeWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sortOption, setSortOption] = useState<DisputeSortOption>(initialSortOption);
  const [stats, setStats] = useState<DisputeStats>({
    totalCount: 0,
    openCount: 0,
    resolvedCount: 0,
    closedCount: 0,
    recentDisputes: []
  });
  const [rpcAvailable, setRpcAvailable] = useState<boolean | null>(null);

  // Références pour éviter les effets de bord
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Fonction pour construire les clés de cache
  const cacheKey = useMemo(() => {
    if (!useCache || !profile?.id) return '';
    return `disputes_${isClient ? 'client' : 'freelance'}_${profile.id}_${activeTab}_${sortOption}_${debouncedSearchQuery}_page_${currentPage}`;
  }, [profile?.id, isClient, activeTab, sortOption, debouncedSearchQuery, currentPage, useCache]);

  const statsKey = useMemo(() => {
    if (!useCache || !profile?.id) return '';
    return `disputes_stats_${isClient ? 'client' : 'freelance'}_${profile.id}`;
  }, [profile?.id, isClient, useCache]);

  // Créer un debounced search handler pour améliorer les performances
  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value);
    }, CACHE_EXPIRY.SEARCH_DEBOUNCE_TIME),
    []
  );
  
  // Gérer le changement de requête de recherche avec debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchQuery(value);
  }, [debouncedSetSearchQuery]);

  // Vérifier si la fonction RPC est disponible (une seule fois)
  useEffect(() => {
    if (rpcAvailable === null) {
      checkRPCFunctionExists('get_disputes_stats').then(available => {
        console.log("[Disputes] Fonction RPC get_disputes_stats disponible:", available);
        setRpcAvailable(available);
      });
    }
  }, [rpcAvailable]);

  // Fonction pour récupérer les statistiques via RPC
  const fetchStatsViaRPC = useCallback(async (): Promise<DisputeStats | null> => {
    if (!profile?.id) return null;
    
    try {
      const role = isClient ? 'client' : (isFreelance ? 'freelance' : 'admin');
      console.log(`[Disputes] Appel RPC get_disputes_stats avec user_id=${profile.id}, role=${role}`);
      
      const { data, error } = await supabase.rpc('get_disputes_stats', { 
        user_id: profile.id,
        is_client: isClient
      });
      
      if (error) {
        console.error("[Disputes] Erreur RPC stats:", error.message, error.details);
        return null;
      }
      
      if (data) {
        console.log("[Disputes] Statistiques récupérées via RPC:", data);
        return data as DisputeStats;
      }
      
      return null;
    } catch (e) {
      console.error("[Disputes] Exception lors de l'appel RPC pour les stats:", e);
      return null;
    }
  }, [profile?.id, isClient, isFreelance]);

  // Fonction pour calculer les statistiques à partir des données locales
  const calculateStatsLocally = useCallback((disputesList: DisputeWithDetails[]): DisputeStats => {
    return {
      totalCount: disputesList.length,
      openCount: disputesList.filter(d => d.status === 'open').length,
      resolvedCount: disputesList.filter(d => d.status === 'resolved').length,
      closedCount: disputesList.filter(d => d.status === 'closed').length,
      recentDisputes: [...disputesList].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 3)
    };
  }, []);

  // Fonction pour obtenir les litiges depuis le backend
  const getUserDisputesFromBackend = useCallback(async (): Promise<DisputeWithDetails[]> => {
    if (!profile?.id) return [];
  
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        client:profiles!disputes_client_id_fkey(*),
        freelance:profiles!disputes_freelance_id_fkey(*),
        order:orders(*)
      `)
      .or(`client_id.eq.${profile.id},freelance_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erreur lors de la récupération des litiges:', error);
      throw new Error(`Erreur lors de la récupération des litiges: ${error.message}`);
    }
  
    return data as DisputeWithDetails[];
  }, [profile?.id]);

  // Fonction optimisée pour récupérer les litiges
  const fetchDisputes = useCallback(async (forceRefresh = false) => {
    // Protection contre les requêtes concurrentes ou pendant la navigation
    if (isFetchingRef.current || (!forceRefresh && NavigationLoadingState.isNavigating)) {
      console.log("[Disputes] Requête ignorée: déjà en cours ou navigation en cours");
      return;
    }

    if (!profile?.id) {
      console.log("[Disputes] Requête ignorée: pas de profil utilisateur");
      return;
    }
    
    // Limiter la fréquence des requêtes
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTimeRef.current < 3000)) {
      console.log("[Disputes] Requête ignorée: throttling (3s)");
      return;
    }
    
    try {
      console.log(`[Disputes] Début de la récupération des litiges (${isClient ? 'client' : 'freelance'})`);
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      // Indicateurs de chargement
      if (forceRefresh) {
        setIsRefreshing(true);
      } else if (!initialLoadComplete) {
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
        const cachedStats = getCachedData<DisputeStats>(statsKey);
        
        if (cachedStats) {
          console.log("[Disputes] Statistiques récupérées du cache");
          setStats(cachedStats);
          
          // Si le cache est récent, ne pas recharger les stats
          const lastStatsUpdate = getCachedData<number>(`${statsKey}_timestamp`);
          if (lastStatsUpdate && (Date.now() - lastStatsUpdate < 60000)) { // moins d'une minute
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
            console.log("[Disputes] Mise en cache des statistiques");
            setCachedData(statsKey, rpcStats, {
              expiry: CACHE_EXPIRY.DISPUTES_STATS
            });
            setCachedData(`${statsKey}_timestamp`, Date.now(), {
              expiry: CACHE_EXPIRY.DISPUTES_STATS
            });
          }
          
          // Mettre à jour le total count pour la référence
          setTotalCount(rpcStats.totalCount);
        }
      }
      
      // Vérifier le cache des litiges
      if (useCache && cacheKey && !forceRefresh) {
        const cachedData = getCachedData<DisputeWithDetails[]>(cacheKey);
        
        if (cachedData) {
          console.log("[Disputes] Données récupérées du cache", cachedData.length);
          setDisputes(cachedData);
          setLoading(false);
          setError(null);
          
          // Si le cache est récent, terminer ici et déclencher un refresh en arrière-plan
          const lastUpdate = getCachedData<number>(`${cacheKey}_timestamp`);
          if (lastUpdate && (Date.now() - lastUpdate < 60000)) { // moins d'une minute
            setInitialLoadComplete(true);
            setTimeout(() => fetchDisputes(true), 500);
            isFetchingRef.current = false;
            setIsRefreshing(false);
            setRetryCount(0);
            return;
          }
        }
      }
      
      // Charger les litiges
      try {
        console.log("[Disputes] Récupération des litiges depuis le backend");
        
        // Récupérer les données depuis l'API
        const userDisputes = await getUserDisputesFromBackend();
        
        // Mise à jour des données
        setDisputes(userDisputes);
        
        // Si RPC n'est pas disponible, calculer les stats localement
        if (!rpcAvailable) {
          const localStats = calculateStatsLocally(userDisputes);
          setStats(localStats);
          
          // Mise en cache des statistiques locales
          if (useCache && statsKey) {
            console.log("[Disputes] Mise en cache des statistiques calculées localement");
            setCachedData(statsKey, localStats, {
              expiry: CACHE_EXPIRY.DISPUTES_STATS
            });
            setCachedData(`${statsKey}_timestamp`, Date.now(), {
              expiry: CACHE_EXPIRY.DISPUTES_STATS
            });
          }
        }
        
        // Mise en cache des résultats complets (non filtrés)
        if (useCache && profile?.id) {
          const baseKey = `disputes_${isClient ? 'client' : 'freelance'}_${profile.id}_all`;
          console.log("[Disputes] Mise en cache des données complètes");
          setCachedData(baseKey, userDisputes, {
            expiry: CACHE_EXPIRY.DISPUTES_LIST
          });
          setCachedData(`${baseKey}_timestamp`, Date.now(), {
            expiry: CACHE_EXPIRY.DISPUTES_LIST
          });
        }
        
        // Nettoyage des états
        setError(null);
        setRetryCount(0);
        updateLastRefresh();
      } catch (innerError: any) {
        console.error("[Disputes] Exception pendant l'exécution de la requête:", innerError);
        setError(`Erreur pendant la récupération: ${innerError.message || 'Erreur inconnue'}`);
        
        // Stratégie de réessai
        if (retryCount < 3) {
          const timeout = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchDisputes(false);
          }, timeout);
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les litiges après plusieurs tentatives.",
            variant: "destructive"
          });
        }
      }
    } catch (e: any) {
      console.error("[Disputes] Exception globale:", e);
      setError(`Erreur générale: ${e.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setInitialLoadComplete(true);
      isFetchingRef.current = false;
    }
  }, [
    profile?.id, isClient, cacheKey, useCache, initialLoadComplete, retryCount, 
    getUserDisputesFromBackend, calculateStatsLocally, rpcAvailable, fetchStatsViaRPC,
    statsKey, toast, updateLastRefresh
  ]);

  // Filtrer et trier les disputes - optimisé avec useEffect
  useEffect(() => {
    if (!disputes.length) {
      setFilteredDisputes([]);
      return;
    }
    
    console.log(`[Disputes] Filtrage et tri des litiges (${disputes.length} disponibles)`);
    
    let filtered = [...disputes];
    
    // Filtrer par statut
    if (activeTab !== "all") {
      filtered = filtered.filter((dispute) => dispute.status === activeTab);
    }
    
    // Filtrer par recherche
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((dispute) => 
        dispute.reason.toLowerCase().includes(query) ||
        (isClient ? 
          (dispute.freelance.full_name?.toLowerCase().includes(query) || 
           dispute.freelance.username?.toLowerCase().includes(query))
          : 
          (dispute.client.full_name?.toLowerCase().includes(query) || 
           dispute.client.username?.toLowerCase().includes(query))
        )
      );
    }
    
    // Trier les disputes
    switch (sortOption) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "status":
        const statusWeight = { 'open': 0, 'resolved': 1, 'closed': 2 };
        filtered.sort((a, b) => {
          // Trier d'abord par statut, puis par date de création (du plus récent au plus ancien)
          const statusDiff = statusWeight[a.status as keyof typeof statusWeight] - statusWeight[b.status as keyof typeof statusWeight];
          return statusDiff !== 0 ? statusDiff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
    }
    
    // Mettre à jour le nombre total pour la pagination
    setTotalCount(filtered.length);
    
    // Mettre à jour les résultats filtrés
    setFilteredDisputes(filtered);
    
    // Mise en cache des résultats filtrés
    if (useCache && cacheKey) {
      console.log("[Disputes] Mise en cache des données filtrées");
      setCachedData(cacheKey, filtered, {
        expiry: CACHE_EXPIRY.DISPUTES_LIST
      });
      setCachedData(`${cacheKey}_timestamp`, Date.now(), {
        expiry: CACHE_EXPIRY.DISPUTES_LIST
      });
    }
  }, [disputes, activeTab, debouncedSearchQuery, sortOption, isClient, cacheKey, useCache]);

  // Chargement initial
  useEffect(() => {
    if (profile?.id && !NavigationLoadingState.isNavigating) {
      console.log("[Disputes] Chargement initial des litiges");
      fetchDisputes();
    }
  }, [profile?.id, fetchDisputes]);

  // Abonnement aux changements en temps réel
  useEffect(() => {
    if (!profile?.id) return;
    
    console.log("[Disputes] Configuration de l'abonnement aux changements en temps réel");
    
    const disputesSubscription = supabase
      .channel('disputes-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'disputes',
        filter: isClient 
          ? `client_id=eq.${profile.id}` 
          : `freelance_id=eq.${profile.id}`
      }, (payload: any) => {
        console.log("[Disputes] Changement détecté, rechargement des données");
        fetchDisputes(true);
      })
      .subscribe();
    
    return () => {
      console.log("[Disputes] Désinscription des changements en temps réel");
      disputesSubscription.unsubscribe();
    };
  }, [profile?.id, isClient, fetchDisputes]);

  // Obtenir les disputes de la page actuelle
  const currentDisputes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDisputes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDisputes, currentPage, itemsPerPage]);
  
  // Nombre total de pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredDisputes.length / itemsPerPage)), [filteredDisputes.length, itemsPerPage]);

  // Méthodes utilitaires pour la pagination
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Fonctions de filtrage et recherche
  const setTab = useCallback((tab: DisputeStatus) => {
    setActiveTab(tab);
    setCurrentPage(1); // Réinitialiser la pagination lors du changement de filtre
  }, []);

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSetSearchQuery(query);
    setCurrentPage(1); // Réinitialiser la pagination lors d'une nouvelle recherche
  }, [debouncedSetSearchQuery]);

  // Fonction pour changer l'option de tri
  const changeSortOption = useCallback((option: DisputeSortOption) => {
    setSortOption(option);
  }, []);

  // Fonction pour rafraîchir manuellement
  const refreshDisputes = useCallback(() => {
    console.log("[Disputes] Rafraîchissement manuel demandé");
    fetchDisputes(true);
    toast({
      title: "Actualisation",
      description: "La liste des litiges est en cours d'actualisation.",
    });
  }, [fetchDisputes, toast]);
  
  // Fetch disputes when profile changes
  useEffect(() => {
    if (profile?.id) {
      fetchDisputes();
    }
  }, [profile?.id, fetchDisputes]);

  // Fetch a single dispute by ID
  const fetchDispute = async (id: string) => {
    try {
      const dispute = await getDisputeById(id);
      
      if (!dispute) {
        return { dispute: null, error: 'Impossible de récupérer les détails du litige.' };
      }
      
      return { dispute, error: null };
    } catch (err) {
      console.error('Erreur dans fetchDispute:', err);
      return { dispute: null, error: 'Une erreur inattendue est survenue.' };
    }
  };

  return {
    // État
    disputes: currentDisputes,
    allDisputes: disputes,
    loading,
    isRefreshing,
    initialLoadComplete,
    error,
    activeTab,
    searchQuery,
    currentPage,
    totalCount,
    totalPages,
    itemsPerPage,
    sortOption,
    lastRefresh,
    stats,
    
    // Actions
    fetchDisputes,
    refreshDisputes,
    setTab,
    setSearch,
    handleSearchChange,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    changeSortOption,
    fetchDispute,
    
    // Utilitaires
    getLastRefreshText
  };
} 