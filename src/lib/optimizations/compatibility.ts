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

// Définition des clés de cache cohérentes
export const CACHE_KEYS = {
  CATEGORIES: 'categories_',
  SUBCATEGORIES: 'subcategories_',
  SERVICES: 'services_',
  USER_PROFILE: 'user_profile_',
  USER_SESSION: 'user_session_',
  WALLET: 'wallet_',
  DASHBOARD_STATS: 'dashboard_stats_',
  DASHBOARD_ACTIVITIES: 'dashboard_activities_',
  MESSAGE_COUNTS: 'message_counts_',
  CONVERSATIONS: 'conversations_',
  MESSAGES: 'messages_',
  // Compatibilité avec l'existant
  PAYMENTS_DATA: 'payments_data_',
  WALLET_DATA: 'wallet_data_',
  PAYMENT_METHODS: 'payment_methods_',
  DISPUTE_LIST: 'dispute_list_'
};

// Priorités de cache pour la gestion des ressources
export const CACHE_PRIORITIES = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

// Configuration des tentatives de récupération
export const FETCH_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 8000
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