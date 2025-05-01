import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLastRefresh } from './useLastRefresh';
import { NavigationLoadingState } from '@/app/providers';

interface UseRefreshableDataOptions {
  fetchData: () => Promise<any>;
  cacheInvalidationKeys?: string[];
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
  onRefreshError?: (error: any) => void;
  autoRefreshOnNavigation?: boolean;
  refreshInterval?: number;
  autoRefreshOnVisibilityChange?: boolean;
  debounceMs?: number;
  minTimeBetweenRefreshes?: number;
}

interface UseRefreshableDataResult {
  isRefreshing: boolean;
  error: string | null;
  refreshData: (showLoadingIndicator?: boolean) => Promise<void>;
  refreshDataInBackground: () => Promise<void>;
  lastRefresh: number | null;
  getLastRefreshText: (shortFormat?: boolean) => string;
  refreshCount: number;
}

// Constantes pour les valeurs par défaut
const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_TIME_BETWEEN_REFRESHES = 2000; // 2 secondes minimum entre les rafraîchissements
const VISIBILITY_REFRESH_THRESHOLD = 10000; // 10 secondes

// État initial mémorisé pour éviter les recréations
const INITIAL_STATE = {
  isRefreshing: false,
  error: null as string | null,
  refreshCount: 0
};

/**
 * Hook utilitaire optimisé pour gérer le rafraîchissement des données avec suivi d'état
 * Version améliorée avec moins d'effets secondaires et meilleure gestion de la mémoire
 */
export function useRefreshableData({
  fetchData,
  cacheInvalidationKeys = [],
  onRefreshStart,
  onRefreshComplete,
  onRefreshError,
  autoRefreshOnNavigation = true,
  refreshInterval = 0,
  autoRefreshOnVisibilityChange = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minTimeBetweenRefreshes = DEFAULT_MIN_TIME_BETWEEN_REFRESHES
}: UseRefreshableDataOptions): UseRefreshableDataResult {
  // État consolidé pour éviter les rendus multiples
  const [state, setState] = useState(INITIAL_STATE);
  
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  
  // Références consolidées pour la gestion des états et des timers
  const refs = useRef({
    isRefreshing: false,
    lastRefreshTime: 0,
    pendingRefresh: false,
    debounceTimer: null as NodeJS.Timeout | null,
    intervalTimer: null as NodeJS.Timeout | null,
    isMounted: true,
    eventHandlersAttached: false,
    cacheInvalidationKeys, // Pour éviter une capture obsolète dans closure
    documentIsVisible: typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
    fetchInProgress: false
  });
  
  // Mettre à jour la référence quand les clés d'invalidation changent
  useEffect(() => {
    refs.current.cacheInvalidationKeys = cacheInvalidationKeys;
  }, [cacheInvalidationKeys]);
  
  // Nettoyer les timers - fonction utilitaire mémorisée
  const clearTimers = useCallback(() => {
    if (refs.current.debounceTimer) {
      clearTimeout(refs.current.debounceTimer);
      refs.current.debounceTimer = null;
    }
    
    if (refs.current.intervalTimer) {
      clearInterval(refs.current.intervalTimer);
      refs.current.intervalTimer = null;
    }
  }, []);
  
  // Fonction principale de rafraîchissement, mémorisée pour stabilité des références
  const refreshData = useCallback(async (showLoadingIndicator = true): Promise<void> => {
    // Vérifier si composant démonté
    if (!refs.current.isMounted) return;
    
    // Vérifier si un rafraîchissement est déjà en cours ou si le temps minimum n'est pas écoulé
    const now = Date.now();
    if (refs.current.isRefreshing) {
      refs.current.pendingRefresh = true;
      return;
    }
    
    // Throttling des rafraîchissements
    if (now - refs.current.lastRefreshTime < minTimeBetweenRefreshes) {
      // Mettre en file d'attente un rafraîchissement futur
      if (refs.current.debounceTimer) {
        clearTimeout(refs.current.debounceTimer);
      }
      
      refs.current.debounceTimer = setTimeout(() => {
        if (refs.current.isMounted) {
          refreshData(showLoadingIndicator);
        }
      }, minTimeBetweenRefreshes - (now - refs.current.lastRefreshTime));
      
      return;
    }
    
    try {
      // Éviter les appels simultanés
      if (refs.current.fetchInProgress) return;
      refs.current.fetchInProgress = true;
      
      // Mettre à jour les références d'état
      refs.current.isRefreshing = true;
      refs.current.lastRefreshTime = now;
      
      // Mettre à jour l'état React pour l'UI
      if (showLoadingIndicator && refs.current.isMounted) {
        setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      } else if (refs.current.isMounted) {
        setState(prev => ({ ...prev, error: null }));
      }
      
      // Notification de début de rafraîchissement
      if (onRefreshStart) onRefreshStart();
      
      // Exécuter la fonction de récupération des données
      await fetchData();
      
      // Mettre à jour le timestamp de rafraîchissement
      if (refs.current.isMounted) {
        updateLastRefresh();
        
        // Incrémenter le compteur pour forcer la mise à jour des composants
        setState(prev => ({ 
          ...prev, 
          refreshCount: prev.refreshCount + 1,
          isRefreshing: false
        }));
      }
      
      // Notification de fin de rafraîchissement
      if (onRefreshComplete) onRefreshComplete();
    } catch (err: any) {
      const errorMessage = err?.message || 'Une erreur est survenue lors du rafraîchissement des données';
      
      if (refs.current.isMounted) {
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          isRefreshing: false 
        }));
      }
      
      // Notification d'erreur
      if (onRefreshError) onRefreshError(err);
    } finally {
      // Réinitialiser les états
      refs.current.isRefreshing = false;
      refs.current.fetchInProgress = false;
      
      // Traiter les rafraîchissements en attente
      if (refs.current.pendingRefresh && refs.current.isMounted) {
        refs.current.pendingRefresh = false;
        
        // Créer un timer pour le prochain rafraîchissement
        refs.current.debounceTimer = setTimeout(() => {
          if (refs.current.isMounted) {
            refreshData(false);
          }
        }, minTimeBetweenRefreshes);
      }
    }
  }, [fetchData, updateLastRefresh, onRefreshStart, onRefreshComplete, onRefreshError, minTimeBetweenRefreshes]);

  // Rafraîchir les données en arrière-plan (sans indicateur de chargement)
  const refreshDataInBackground = useCallback((): Promise<void> => {
    return refreshData(false);
  }, [refreshData]);

  // Gestionnaire d'invalidation de cache optimisé
  const handleCacheInvalidation = useCallback((event?: Event): void => {
    if (!refs.current.isMounted || refs.current.isRefreshing) {
      if (refs.current.isMounted) {
        refs.current.pendingRefresh = true;
      }
      return;
    }
    
    // Ne pas rafraîchir si la page n'est pas visible
    if (!refs.current.documentIsVisible) return;
    
    // Vérifier si l'événement contient des informations pertinentes
    if (event) {
      const customEvent = event as CustomEvent;
      const { fromPath, toPath, keys } = customEvent.detail || {};
      
      // Vérifier si les clés d'invalidation correspondent
      if (keys && refs.current.cacheInvalidationKeys.length > 0) {
        const shouldRefresh = refs.current.cacheInvalidationKeys.some(key => 
          keys.includes(key) || keys.some((k: string) => k.startsWith(key))
        );
        
        if (!shouldRefresh) return;
      }
      
      // Si navigation vers une nouvelle page qui nécessite des données fraîches
      if (fromPath && toPath && fromPath !== toPath) {
        refreshDataInBackground();
      }
    } else {
      // Cas général - invalidation sans information spécifique
      refreshDataInBackground();
    }
  }, [refreshDataInBackground]);

  // Gestionnaire pour les changements de visibilité de la page - optimisé
  const handleVisibilityChange = useCallback((): void => {
    if (!refs.current.isMounted || !autoRefreshOnVisibilityChange) return;
    
    // Mettre à jour l'état de visibilité
    refs.current.documentIsVisible = document.visibilityState === 'visible';
    
    // Ne rafraîchir que si la page devient visible et assez de temps s'est écoulé
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      const timeSinceLastRefresh = now - refs.current.lastRefreshTime;
      
      // Ne rafraîchir que si la page était cachée pendant suffisamment longtemps
      if (timeSinceLastRefresh > VISIBILITY_REFRESH_THRESHOLD) {
        if (!NavigationLoadingState.isNavigating && !refs.current.isRefreshing) {
          refreshDataInBackground();
        }
      }
    }
  }, [autoRefreshOnVisibilityChange, refreshDataInBackground]);

  // Effet unique pour configurer les écouteurs d'événements - combiné et optimisé
  useEffect(() => {
    refs.current.isMounted = true;
    
    const setupEventListeners = () => {
      if (refs.current.eventHandlersAttached || typeof window === 'undefined') return;
      
      // Initialiser l'état de visibilité
      refs.current.documentIsVisible = document.visibilityState === 'visible';
      
      // Créer des références aux gestionnaires d'événements (pour assurer la cohérence lors du nettoyage)
      const handleNavigationStateChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        const isNavigating = customEvent.detail?.isNavigating || false;
        
        // Si la navigation est terminée, rafraîchir les données après un délai court
        if (!isNavigating && !NavigationLoadingState.isNavigating && refs.current.isMounted && refs.current.documentIsVisible) {
          setTimeout(() => {
            if (refs.current.isMounted && !refs.current.isRefreshing) {
              handleCacheInvalidation();
            }
          }, 100);
        }
      };
      
      const handleFocus = () => {
        const now = Date.now();
        if (now - refs.current.lastRefreshTime > VISIBILITY_REFRESH_THRESHOLD && 
            refs.current.isMounted && 
            !refs.current.isRefreshing && 
            refs.current.documentIsVisible) {
          handleVisibilityChange();
        }
      };
      
      // Enregistrer les écouteurs d'événements
      const registeredHandlers: Array<[string, EventListener, Document | Window]> = [];
      
      if (autoRefreshOnNavigation) {
        // Écouter l'événement personnalisé d'invalidation du cache
        window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
        registeredHandlers.push(['vynal:cache-invalidated', handleCacheInvalidation as EventListener, window]);
        
        // Écouter les changements d'état de navigation
        window.addEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
        registeredHandlers.push(['vynal:navigation-state-changed', handleNavigationStateChange as EventListener, window]);
      }
      
      if (autoRefreshOnVisibilityChange) {
        // Écouteur pour les changements de visibilité
        document.addEventListener('visibilitychange', handleVisibilityChange);
        registeredHandlers.push(['visibilitychange', handleVisibilityChange as EventListener, document]);
        
        // Écouteur pour le focus de la fenêtre
        window.addEventListener('focus', handleFocus);
        registeredHandlers.push(['focus', handleFocus as EventListener, window]);
      }
      
      refs.current.eventHandlersAttached = true;
      
      // Nettoyer à la fin du montage
      return () => {
        // Détacher tous les écouteurs d'événements enregistrés
        registeredHandlers.forEach(([eventName, handler, target]) => {
          (target as any).removeEventListener(eventName, handler);
        });
      };
    };
    
    const cleanup = setupEventListeners();
    
    // Configurer l'intervalle de rafraîchissement si nécessaire
    if (refreshInterval > 0) {
      refs.current.intervalTimer = setInterval(() => {
        if (refs.current.isMounted && 
            !refs.current.isRefreshing && 
            document.visibilityState === 'visible' &&
            !NavigationLoadingState.isNavigating) {
          refreshDataInBackground();
        }
      }, refreshInterval);
    }
    
    // Chargement initial des données avec un court délai pour permettre au composant de se monter
    setTimeout(() => {
      if (refs.current.isMounted) {
        refreshData();
      }
    }, 0);
    
    // Nettoyage au démontage
    return () => {
      refs.current.isMounted = false;
      
      // Nettoyer les timers
      clearTimers();
      
      // Nettoyer les écouteurs
      if (cleanup) cleanup();
    };
  }, [
    handleCacheInvalidation, 
    handleVisibilityChange, 
    refreshInterval,
    autoRefreshOnNavigation,
    autoRefreshOnVisibilityChange,
    refreshData,
    refreshDataInBackground,
    clearTimers
  ]);

  // Retourner un objet mémoïsé pour éviter les recréations
  return useMemo(() => ({
    isRefreshing: state.isRefreshing,
    error: state.error,
    refreshData,
    refreshDataInBackground,
    lastRefresh,
    getLastRefreshText,
    refreshCount: state.refreshCount
  }), [
    state.isRefreshing,
    state.error,
    state.refreshCount,
    refreshData,
    refreshDataInBackground,
    lastRefresh,
    getLastRefreshText
  ]);
} 