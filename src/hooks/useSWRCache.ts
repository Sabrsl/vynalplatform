import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getCachedData, 
  setCachedDataSafe, 
  invalidateCache,
  requestManager,
  CacheOptions 
} from '@/lib/optimizations/cache';
import { NavigationLoadingState } from '@/app/providers';

/**
 * Hook de mise en cache avec pattern SWR (Stale-While-Revalidate)
 * Permet d'afficher des données potentiellement obsolètes pendant le rechargement
 */
export function useSWRCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: CacheOptions & {
    revalidateOnMount?: boolean;
    revalidateOnFocus?: boolean;
    revalidateInterval?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    skipDuringNavigation?: boolean;
  } = {}
) {
  // Valeurs par défaut
  const {
    revalidateOnMount = true,
    revalidateOnFocus = true,
    revalidateInterval = 0,
    skipDuringNavigation = true,
    onSuccess,
    onError,
    ...cacheOptions
  } = options;

  // États
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  // Références pour éviter les race conditions
  const refs = useRef({
    isMounted: true,
    isCurrentlyValidating: false,
    lastRequestId: '',
    lastFetchTime: 0,
    intervalTimer: null as NodeJS.Timeout | null,
    currentVisibility: typeof document !== 'undefined' ? !document.hidden : true,
    queuedFetch: false,
  });

  // Fonction principale pour charger et mettre à jour les données
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Éviter les appels pendant la navigation si skipDuringNavigation est activé
    if (skipDuringNavigation && NavigationLoadingState.isNavigating) {
      // Mettre en file d'attente pour après la navigation
      refs.current.queuedFetch = true;
      return;
    }

    // Éviter les appels simultanés
    if (refs.current.isCurrentlyValidating) return;
    
    // Protéger contre les appels après démontage
    if (!refs.current.isMounted) return;

    // Vérifier d'abord le cache, sauf si forceRefresh est activé
    const cached = !forceRefresh ? getCachedData<T>(key) : null;
    const now = Date.now();

    // Définir l'état de stale si les données sont en cache mais seront rechargées
    setIsStale(cached !== null && forceRefresh);

    // Si nous avons des données en cache et pas de forceRefresh, les utiliser
    if (cached !== null && !forceRefresh) {
      setData(cached);
      
      // Si l'intervalle est trop court depuis la dernière validation, ne pas revalider
      if (now - refs.current.lastFetchTime < 1000) {
        return;
      }
    }

    // Marquer comme en cours de validation
    refs.current.isCurrentlyValidating = true;
    refs.current.lastFetchTime = now;
    setIsValidating(true);
    
    // Si c'est le premier chargement et pas de cache, afficher le loader complet
    if (data === null && cached === null) {
      setIsLoading(true);
    }

    // Enregistrer cette requête auprès du gestionnaire central
    const requestId = requestManager.registerRequest(key, cacheOptions.priority);
    refs.current.lastRequestId = requestId;

    try {
      // Vérifier si cette requête doit être annulée à cause d'une requête plus récente
      if (requestManager.shouldCancelRequest(requestId)) {
        console.debug(`Requête ${requestId} annulée car obsolète`);
        return;
      }

      // Acquérir un verrou
      const hasLock = requestManager.acquireLock(key, requestId);
      if (!hasLock) {
        console.debug(`Requête ${requestId} n'a pas pu obtenir de verrou, abandon`);
        return;
      }

      // Effectuer la requête
      const freshData = await fetchFunction();
      
      // Vérifier si cette requête est toujours pertinente
      if (requestId !== refs.current.lastRequestId || !refs.current.isMounted) {
        console.debug(`Requête ${requestId} abandonnée car une requête plus récente est en cours`);
        requestManager.releaseLock(key, requestId);
        return;
      }

      // Mettre à jour le cache
      setCachedDataSafe(key, freshData, cacheOptions, requestId);
      
      // Mettre à jour l'état
      setData(freshData);
      setIsStale(false);
      setError(null);
      setLastUpdated(Date.now());
      
      // Appeler le callback de succès
      if (onSuccess) onSuccess(freshData);
      
      // Relâcher le verrou
      requestManager.releaseLock(key, requestId);
      requestManager.completeRequest(requestId);
      
    } catch (err) {
      // Ne pas mettre à jour l'état si le composant est démonté
      if (!refs.current.isMounted) return;
      
      // Gestion des erreurs
      console.error(`Erreur dans useSWRCache pour la clé ${key}:`, err);
      
      const errorObj = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(errorObj);
      
      // Appeler le callback d'erreur
      if (onError) onError(errorObj);
      
      // Relâcher le verrou en cas d'erreur
      if (refs.current.lastRequestId) {
        requestManager.releaseLock(key, refs.current.lastRequestId);
      }
      
    } finally {
      // Réinitialiser les états de chargement
      if (refs.current.isMounted) {
        setIsLoading(false);
        setIsValidating(false);
        refs.current.isCurrentlyValidating = false;
      }
    }
  }, [key, fetchFunction, cacheOptions, data, onSuccess, onError, skipDuringNavigation]);
  
  // Force le rechargement des données
  const forceRefresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  
  // Effet pour gérer le revalidateInterval
  useEffect(() => {
    if (revalidateInterval && revalidateInterval > 0) {
      refs.current.intervalTimer = setInterval(() => {
        if (refs.current.isMounted && refs.current.currentVisibility && !NavigationLoadingState.isNavigating) {
          fetchData();
        }
      }, revalidateInterval);
    }
    
    return () => {
      if (refs.current.intervalTimer) {
        clearInterval(refs.current.intervalTimer);
        refs.current.intervalTimer = null;
      }
    };
  }, [revalidateInterval, fetchData]);
  
  // Effet pour gérer le focus de la fenêtre
  useEffect(() => {
    if (!revalidateOnFocus || typeof window === 'undefined') return;
    
    const handleFocus = () => {
      if (refs.current.isMounted && document.visibilityState === 'visible' && !NavigationLoadingState.isNavigating) {
        refs.current.currentVisibility = true;
        fetchData();
      }
    };
    
    const handleVisibilityChange = () => {
      refs.current.currentVisibility = document.visibilityState === 'visible';
      if (refs.current.currentVisibility && !NavigationLoadingState.isNavigating) {
        fetchData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [revalidateOnFocus, fetchData]);
  
  // Effet pour détecter la fin de la navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNavigationEnd = () => {
      // Si une requête était en attente pendant la navigation, l'exécuter maintenant
      if (refs.current.queuedFetch && refs.current.isMounted) {
        refs.current.queuedFetch = false;
        setTimeout(() => fetchData(), 100); // Petit délai pour assurer que la navigation est bien terminée
      }
    };

    // Écouter la fin de navigation
    window.addEventListener('vynal:navigation-end', handleNavigationEnd);
    
    return () => {
      window.removeEventListener('vynal:navigation-end', handleNavigationEnd);
    };
  }, [fetchData]);
  
  // Effet d'initialisation et de nettoyage
  useEffect(() => {
    refs.current.isMounted = true;
    
    // Chargement initial
    if (revalidateOnMount && (!skipDuringNavigation || !NavigationLoadingState.isNavigating)) {
      fetchData();
    } else if (revalidateOnMount && skipDuringNavigation && NavigationLoadingState.isNavigating) {
      // Mettre en file d'attente pour après la navigation
      refs.current.queuedFetch = true;
    }
    
    return () => {
      refs.current.isMounted = false;
      
      // Nettoyer les timers
      if (refs.current.intervalTimer) {
        clearInterval(refs.current.intervalTimer);
        refs.current.intervalTimer = null;
      }
      
      // S'assurer que tous les verrous sont libérés
      if (refs.current.lastRequestId) {
        requestManager.releaseLock(key, refs.current.lastRequestId);
      }
    };
  }, [key, revalidateOnMount, fetchData, skipDuringNavigation]);
  
  // Effet pour écouter les événements d'invalidation de cache
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCacheInvalidation = (event: CustomEvent) => {
      // Vérifier si cette clé est concernée par l'invalidation
      const invalidatedKey = event.detail?.key;
      if (!invalidatedKey || invalidatedKey === key || invalidatedKey.startsWith(key)) {
        // Ne pas revalider pendant la navigation si skipDuringNavigation est activé
        if (!skipDuringNavigation || !NavigationLoadingState.isNavigating) {
          fetchData();
        } else {
          // Mettre en file d'attente pour après la navigation
          refs.current.queuedFetch = true;
        }
      }
    };
    
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation as EventListener);
    
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation as EventListener);
    };
  }, [key, fetchData, skipDuringNavigation]);
  
  return {
    data,
    isLoading,
    isValidating,
    isStale,
    error,
    lastUpdated,
    refresh: forceRefresh,
    mutate: (newData: T, shouldRevalidate = true) => {
      setData(newData);
      setCachedDataSafe(key, newData, cacheOptions);
      if (shouldRevalidate && (!skipDuringNavigation || !NavigationLoadingState.isNavigating)) {
        fetchData();
      } else if (shouldRevalidate) {
        // Mettre en file d'attente pour après la navigation
        refs.current.queuedFetch = true;
      }
    }
  };
} 