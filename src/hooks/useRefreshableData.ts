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
  debounceMs?: number; // Nouveau: contrôle le debounce des rafraîchissements
  minTimeBetweenRefreshes?: number; // Nouveau: temps minimum entre deux rafraîchissements
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

/**
 * Hook utilitaire optimisé pour gérer le rafraîchissement des données avec suivi d'état
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  
  // Références pour la gestion des états et des timers
  const isRefreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef<number>(0);
  const pendingRefreshRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mémoïser les callbacks pour éviter les récréations inutiles
  const refreshData = useCallback(async (showLoadingIndicator = true): Promise<void> => {
    // Vérifier si un rafraîchissement est déjà en cours ou si le temps minimum n'est pas écoulé
    const now = Date.now();
    if (isRefreshingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    
    // Throttling des rafraîchissements
    if (now - lastRefreshTimeRef.current < minTimeBetweenRefreshes) {
      // Mettre en file d'attente un rafraîchissement futur
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        refreshData(showLoadingIndicator);
      }, minTimeBetweenRefreshes);
      
      return;
    }
    
    try {
      // Mettre à jour les références d'état
      isRefreshingRef.current = true;
      lastRefreshTimeRef.current = now;
      
      // Mettre à jour l'état React pour l'UI
      if (showLoadingIndicator) {
        setIsRefreshing(true);
      }
      
      setError(null);
      
      // Notification de début de rafraîchissement
      if (onRefreshStart) onRefreshStart();
      
      // Exécuter la fonction de récupération des données
      await fetchData();
      
      // Mettre à jour le timestamp de rafraîchissement
      updateLastRefresh();
      
      // Incrémenter le compteur pour forcer la mise à jour des composants
      setRefreshCount(prev => prev + 1);
      
      // Notification de fin de rafraîchissement
      if (onRefreshComplete) onRefreshComplete();
    } catch (err: any) {
      const errorMessage = err?.message || 'Une erreur est survenue lors du rafraîchissement des données';
      setError(errorMessage);
      
      // Notification d'erreur
      if (onRefreshError) onRefreshError(err);
    } finally {
      // Réinitialiser les états
      isRefreshingRef.current = false;
      
      if (showLoadingIndicator) {
        setIsRefreshing(false);
      } else {
        // Petit délai pour éviter les flashs d'interface
        setTimeout(() => {
          setIsRefreshing(false);
        }, debounceMs);
      }
      
      // Traiter les rafraîchissements en attente
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        // Délai avant de lancer le rafraîchissement en attente
        setTimeout(() => {
          refreshData(false);
        }, minTimeBetweenRefreshes);
      }
    }
  }, [
    fetchData,
    updateLastRefresh,
    onRefreshStart,
    onRefreshComplete,
    onRefreshError,
    debounceMs,
    minTimeBetweenRefreshes
  ]);

  // Rafraîchir les données en arrière-plan (sans indicateur de chargement)
  const refreshDataInBackground = useCallback(() => {
    return refreshData(false);
  }, [refreshData]);

  // Gestionnaire d'invalidation de cache optimisé
  const handleCacheInvalidation = useCallback((event?: Event): void => {
    if (isRefreshingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    
    // Vérifier si l'événement contient des informations pertinentes
    if (event) {
      const customEvent = event as CustomEvent;
      const { fromPath, toPath, keys } = customEvent.detail || {};
      
      // Vérifier si les clés d'invalidation correspondent
      if (keys && cacheInvalidationKeys.length > 0) {
        const shouldRefresh = cacheInvalidationKeys.some(key => 
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
  }, [cacheInvalidationKeys, refreshDataInBackground]);

  // Gestionnaire pour les changements de visibilité de la page
  const handleVisibilityChange = useCallback((): void => {
    if (isRefreshingRef.current || !autoRefreshOnVisibilityChange) return;
    
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    // Ne rafraîchir que si la page était cachée pendant au moins 10 secondes
    if (document.visibilityState === 'visible' && timeSinceLastRefresh > 10000) {
      if (!NavigationLoadingState.isNavigating) {
        refreshDataInBackground();
      }
    }
  }, [autoRefreshOnVisibilityChange, refreshDataInBackground]);

  // Effet pour les événements d'invalidation de cache
  useEffect(() => {
    if (typeof window === 'undefined' || !autoRefreshOnNavigation) return;
    
    // Écouter l'événement personnalisé d'invalidation du cache
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    // Écouter les changements d'état de navigation
    const handleNavigationStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const isNavigating = customEvent.detail?.isNavigating || false;
      
      // Si la navigation est terminée, rafraîchir les données après un délai court
      if (!isNavigating && !NavigationLoadingState.isNavigating) {
        setTimeout(() => handleCacheInvalidation(), 100);
      }
    };
    
    window.addEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
      window.removeEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    };
  }, [autoRefreshOnNavigation, handleCacheInvalidation]);

  // Effet pour les événements de visibilité
  useEffect(() => {
    if (typeof window === 'undefined' || !autoRefreshOnVisibilityChange) return;
    
    // Gestionnaire d'événements pour le focus de la fenêtre
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastRefreshTimeRef.current > 10000) {
        handleVisibilityChange();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoRefreshOnVisibilityChange, handleVisibilityChange]);

  // Effet pour le rafraîchissement périodique
  useEffect(() => {
    // Nettoyer l'intervalle existant si présent
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
    
    // Configurer un nouvel intervalle si nécessaire
    if (refreshInterval && refreshInterval > 0) {
      intervalTimerRef.current = setInterval(() => {
        if (!isRefreshingRef.current && !NavigationLoadingState.isNavigating) {
          refreshDataInBackground();
        }
      }, refreshInterval);
    }
    
    // Nettoyage lors du démontage
    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [refreshInterval, refreshDataInBackground]);

  // Chargement initial des données
  useEffect(() => {
    const initialLoad = () => {
      if (!NavigationLoadingState.isNavigating) {
        refreshData();
      }
    };
    
    // Différer légèrement le chargement initial pour éviter les blocages de rendu
    const timer = setTimeout(initialLoad, 0);
    
    return () => clearTimeout(timer);
  }, [refreshData]);

  // Retourner un objet mémoïsé pour éviter les recréations inutiles
  return useMemo(() => ({
    isRefreshing,
    error,
    refreshData,
    refreshDataInBackground,
    lastRefresh,
    getLastRefreshText,
    refreshCount
  }), [isRefreshing, error, refreshData, refreshDataInBackground, lastRefresh, getLastRefreshText, refreshCount]);
} 