import { useState, useCallback } from 'react';
import { useLastRefresh } from './useLastRefresh';

interface UseRefreshableDataOptions {
  fetchData: () => Promise<any>;
  cacheInvalidationKeys?: string[];
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
  onRefreshError?: (error: any) => void;
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
  onRefreshError
}: UseRefreshableDataOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Notification de début de rafraîchissement
      if (onRefreshStart) onRefreshStart();
      
      // Exécuter la fonction de récupération des données
      await fetchData();
      
      // Mettre à jour le timestamp de rafraîchissement
      updateLastRefresh();
      
      // Notification de fin de rafraîchissement
      if (onRefreshComplete) onRefreshComplete();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du rafraîchissement des données');
      
      // Notification d'erreur
      if (onRefreshError) onRefreshError(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData, isRefreshing, onRefreshStart, onRefreshComplete, onRefreshError, updateLastRefresh]);

  return {
    isRefreshing,
    error,
    refreshData,
    lastRefresh,
    getLastRefreshText
  };
} 