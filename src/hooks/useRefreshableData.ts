import { useState, useCallback, useEffect } from 'react';
import { useLastRefresh } from './useLastRefresh';
import { NavigationLoadingState } from '@/app/providers';

interface UseRefreshableDataOptions {
  fetchData: () => Promise<any>;
  cacheInvalidationKeys?: string[];
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
  onRefreshError?: (error: any) => void;
  autoRefreshOnNavigation?: boolean;
  refreshInterval?: number;  // Nouvel paramètre pour le rafraîchissement périodique
  autoRefreshOnVisibilityChange?: boolean; // Nouveau paramètre pour le rafraîchissement lors du retour sur la page
}

/**
 * Hook utilitaire pour gérer le rafraîchissement des données avec suivi d'état
 * Peut être utilisé pour envelopper n'importe quelle fonction de récupération de données
 */
export function useRefreshableData({
  fetchData,
  cacheInvalidationKeys = [],
  onRefreshStart,
  onRefreshComplete,
  onRefreshError,
  autoRefreshOnNavigation = true,
  refreshInterval = 0,  // 0 = désactivé
  autoRefreshOnVisibilityChange = true // Activé par défaut
}: UseRefreshableDataOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0); // Compteur pour forcer la mise à jour
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  
  const refreshData = useCallback(async (showLoadingIndicator = true) => {
    if (isRefreshing) return;
    
    try {
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
      setError(err.message || 'Une erreur est survenue lors du rafraîchissement des données');
      
      // Notification d'erreur
      if (onRefreshError) onRefreshError(err);
    } finally {
      if (showLoadingIndicator) {
        setIsRefreshing(false);
      } else {
        // Petit délai pour éviter les flashs d'interface
        setTimeout(() => {
          setIsRefreshing(false);
        }, 300);
      }
    }
  }, [fetchData, isRefreshing, onRefreshStart, onRefreshComplete, onRefreshError, updateLastRefresh]);

  // Rafraîchir les données en arrière-plan (sans indicateur de chargement)
  const refreshDataInBackground = useCallback(() => {
    return refreshData(false);
  }, [refreshData]);

  // Écouter les événements d'invalidation de cache (navigation)
  useEffect(() => {
    if (typeof window === 'undefined' || !autoRefreshOnNavigation) return;
    
    const handleCacheInvalidation = (event?: Event) => {
      if (!isRefreshing) {
        console.log('Cache invalidé - rafraîchissement des données');
        
        // Vérifier si l'événement contient des informations sur les chemins
        if (event) {
          const customEvent = event as CustomEvent;
          const { fromPath, toPath } = customEvent.detail || {};
          
          // Si navigation vers une nouvelle page qui nécessite des données fraîches
          if (fromPath && toPath && fromPath !== toPath) {
            refreshDataInBackground();
          }
        } else {
          // Cas général - invalidation sans information de chemin
          refreshDataInBackground();
        }
      }
    };
    
    // Écouter l'événement personnalisé d'invalidation du cache
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    // Écouter les changements d'état de navigation
    const handleNavigationStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const isNavigating = customEvent.detail?.isNavigating || false;
      
      // Si la navigation est terminée, rafraîchir les données
      if (!isNavigating && !NavigationLoadingState.isNavigating) {
        // Délai court pour s'assurer que tout est prêt
        setTimeout(() => handleCacheInvalidation(), 100);
      }
    };
    
    window.addEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
      window.removeEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    };
  }, [isRefreshing, refreshDataInBackground, autoRefreshOnNavigation]);

  // Écouter les événements de visibilité et de focus
  useEffect(() => {
    if (typeof window === 'undefined' || !autoRefreshOnVisibilityChange) return;
    
    let lastVisibilityTime = Date.now();
    
    // Gérer le changement de visibilité (onglet actif/inactif)
    const handleVisibilityChange = () => {
      const now = Date.now();
      // Ne rafraîchir que si la page était cachée pendant au moins 10 secondes
      // pour éviter les rafraîchissements trop fréquents
      if (document.visibilityState === 'visible' && (now - lastVisibilityTime > 10000)) {
        console.log('Retour sur l\'application après période d\'inactivité - rafraîchissement des données');
        if (!isRefreshing && !NavigationLoadingState.isNavigating) {
          refreshDataInBackground();
        }
      }
      
      lastVisibilityTime = now;
    };
    
    // Gérer l'événement de focus sur la fenêtre
    const handleFocus = () => {
      const now = Date.now();
      // Ne rafraîchir que si la fenêtre était inactive pendant au moins 10 secondes
      if (now - lastVisibilityTime > 10000) {
        console.log('Retour sur l\'application après période d\'inactivité - rafraîchissement des données');
        if (!isRefreshing && !NavigationLoadingState.isNavigating) {
          refreshDataInBackground();
        }
      }
      
      lastVisibilityTime = now;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isRefreshing, refreshDataInBackground, autoRefreshOnVisibilityChange]);

  // Rafraîchissement périodique si configuré
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    
    // Configurer l'intervalle de rafraîchissement
    const interval = setInterval(() => {
      if (!isRefreshing && !NavigationLoadingState.isNavigating) {
        refreshDataInBackground();
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, isRefreshing, refreshDataInBackground]);

  // Chargement initial des données
  useEffect(() => {
    if (!NavigationLoadingState.isNavigating) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRefreshing,
    error,
    refreshData,
    refreshDataInBackground,
    lastRefresh,
    getLastRefreshText,
    refreshCount // Exposer le compteur pour permettre aux composants de réagir
  };
} 