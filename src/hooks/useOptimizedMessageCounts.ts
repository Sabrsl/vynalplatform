import { useMessageCounts } from './useMessageCounts';

/**
 * Re-export du hook pour compatibilité
 * @deprecated Utilisez useMessageCounts avec l'option {useCache: true} 
 */
export function useOptimizedMessageCounts() {
  return useMessageCounts({ useCache: true });
} 