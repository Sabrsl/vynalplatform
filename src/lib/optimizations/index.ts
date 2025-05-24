/**
 * Module d'optimisations et performances
 * Ce module centralise les utilitaires pour optimiser le chargement des données et la navigation
 */

// Importation des fonctions pour pouvoir les utiliser localement
import { 
  createCacheManager as createCacheMgr, 
  getCachedData, 
  setCachedData, 
  invalidateCache,
  invalidateConversationMessages,
  invalidateSpecificMessages,
  CACHE_EXPIRY as CACHE_EXPIRY_ORIGINAL,
  type CacheOptions
} from './cache';

import { setupServiceWorker as setupSW } from './service-worker';
import { optimizedFetchWithRetry } from './network';
import {
  compressMessageData,
  compressConversationData,
  shouldCompressMessages,
  estimateObjectSize,
  type CompressedMessage, 
  type CompressedConversation
} from './compression';

// Importer les constantes centralisées
import { CACHE_KEYS, FETCH_CONFIG, CACHE_PRIORITIES, CACHE_EXPIRY, CACHE_EVENT_TYPES, invalidateCachesByEvent } from './constants-manager';
export { CACHE_KEYS, FETCH_CONFIG, CACHE_PRIORITIES, CACHE_EXPIRY, CACHE_EVENT_TYPES, invalidateCachesByEvent };

// Réexporter uniquement ce qui est nécessaire
export { 
  getCachedData, 
  setCachedData, 
  invalidateCache,
  invalidateConversationMessages,
  invalidateSpecificMessages,
  type CacheOptions
} from './cache';

export { setupServiceWorker } from './service-worker';
export { optimizedFetchWithRetry } from './network';
export { 
  estimateObjectSize,
  compressMessageData,
  compressConversationData,
  shouldCompressMessages,
  type CompressedMessage, 
  type CompressedConversation
} from './compression';

// Exporter les fonctions de safeCache
export {
  getSafeCachedData,
  isValidObjectArray,
  isValidObject
} from './safeCache';

// Exporter les fonctions de cache client
export {
  invalidateClientStats,
  invalidateClientOrders,
  invalidateAllClientCache,
  listenToClientCacheInvalidation
} from './client-cache';

// Exporter les fonctions de cache freelance
export {
  invalidateFreelanceStats,
  invalidateFreelanceOrders,
  invalidateAllFreelanceCache,
  listenToFreelanceCacheInvalidation
} from './freelance-cache';

// Configuration des tentatives de récupération de données
// Note: Nous utilisons FETCH_CONFIG depuis constants-manager.ts maintenant

// Réexporter createCacheManager
export const createCacheManager = createCacheMgr;

// Méthode pour préparer l'application et optimiser le chargement initial
export const initializeOptimizations = () => {
  // Configuration du gestionnaire de cache
  createCacheMgr('vynal');
  
  // Activer le service worker en production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    setupSW();
  }
};

// Réexporter tout depuis le module de compatibilité
export * from './compatibility'; 