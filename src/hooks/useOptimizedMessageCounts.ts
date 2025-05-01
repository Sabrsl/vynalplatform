import { useMemo, useCallback } from 'react';
import { useMessageCounts } from './useMessageCounts';

/**
 * Version hautement optimisée du hook useMessageCounts
 * - Mémorise le résultat complet pour éviter les re-rendus inutiles
 * - Conserve la même interface que le hook original pour compatibilité
 * - Wrapper léger qui n'ajoute pas de logique supplémentaire
 */
export function useOptimizedMessageCounts() {
  // Utiliser le hook original avec le cache activé par défaut
  const originalResult = useMessageCounts({ useCache: true });
  
  // Mémoriser les méthodes individuellement pour garantir la stabilité des références
  const refreshCounts = useCallback(() => {
    return originalResult.refreshCounts();
  }, [originalResult.refreshCounts]);
  
  const getLastRefreshText = useCallback(() => {
    return originalResult.getLastRefreshText();
  }, [originalResult.getLastRefreshText]);
  
  // Mémoiser le résultat complet pour éviter les reconstructions d'objets
  // qui pourraient déclencher des rendus inutiles chez les consommateurs
  return useMemo(() => ({
    totalUnread: originalResult.totalUnread,
    conversationCounts: originalResult.conversationCounts,
    loading: originalResult.loading,
    error: originalResult.error,
    isRefreshing: originalResult.isRefreshing,
    lastRefresh: originalResult.lastRefresh,
    
    // Utiliser les versions mémorisées des fonctions
    refreshCounts,
    getLastRefreshText,
    
    // Ajouter un détecteur d'activité pour les consommateurs qui peuvent
    // optimiser leurs rendus en fonction de l'état de chargement
    hasActivity: originalResult.loading || originalResult.isRefreshing,
  }), [
    originalResult.totalUnread,
    originalResult.conversationCounts,
    originalResult.loading,
    originalResult.isRefreshing,
    originalResult.error,
    originalResult.lastRefresh,
    refreshCounts,
    getLastRefreshText
  ]);
} 