/**
 * Module de compatibilité pour garantir la cohérence des imports
 * Centralise tous les exports nécessaires pour l'application
 */

// Imports du système de cache
import {
  getCachedData,
  setCachedData,
  invalidateCache,
  invalidateConversationMessages,
  invalidateSpecificMessages,
  CACHE_EXPIRY,
  createCacheManager,
  type CacheOptions
} from './cache';

// Imports des fonctions de compression
import {
  compressMessageData,
  compressConversationData,
  shouldCompressMessages,
  estimateObjectSize,
  type CompressedMessage,
  type CompressedConversation
} from './compression';

// Imports des utilitaires réseau
import { 
  optimizedFetchWithRetry 
} from './network';

// Imports du service worker
import { 
  setupServiceWorker 
} from './service-worker';

// Imports des constantes centralisées
import { 
  CACHE_KEYS, 
  CACHE_PRIORITIES, 
  FETCH_CONFIG 
} from './constants-manager';

export { 
  CACHE_KEYS, 
  CACHE_PRIORITIES, 
  FETCH_CONFIG 
};

// Réexporter toutes les fonctions et constantes
export {
  // Exports du système de cache
  getCachedData,
  setCachedData,
  invalidateCache,
  invalidateConversationMessages,
  invalidateSpecificMessages,
  CACHE_EXPIRY,
  createCacheManager,
  type CacheOptions,
  
  // Exports des fonctions de compression
  compressMessageData,
  compressConversationData,
  shouldCompressMessages,
  estimateObjectSize,
  type CompressedMessage,
  type CompressedConversation,
  
  // Exports des utilitaires réseau
  optimizedFetchWithRetry,
  
  // Exports du service worker
  setupServiceWorker
};

// Initialisation des optimisations
export const initializeOptimizations = (): void => {
  // Configuration du gestionnaire de cache
  createCacheManager('app');
  
  // Activer le service worker en production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    setupServiceWorker();
  }
}; 