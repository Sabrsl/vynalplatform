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

// Clés pour le système de cache
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
  // Ajout pour compatibilité
  PAYMENTS_DATA: 'payments_data_',
  WALLET_DATA: 'wallet_data_',
  PAYMENT_METHODS: 'payment_methods_',
  DISPUTE_LIST: 'dispute_list_'
};

// Durées d'expiration complètes du cache en millisecondes
export const CACHE_EXPIRY = {
  // Données relativement statiques
  CATEGORIES: 2 * 60 * 60 * 1000,    // 2 heures
  SUBCATEGORIES: 2 * 60 * 60 * 1000, // 2 heures
  
  // Données des services (listing)
  SERVICES: 10 * 60 * 1000,          // 10 minutes
  SERVICES_DETAILS: 5 * 60 * 1000,   // 5 minutes
  
  // Données utilisateur
  USER_DATA: 60 * 60 * 1000,         // 1 heure
  USER_PROFILE: 60 * 60 * 1000,      // 1 heure 
  USER_SESSION: 24 * 60 * 60 * 1000, // 24 heures
  USER_SESSION_PARTIAL: 5 * 60 * 1000, // 5 minutes
  EXTENDED_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 jours
  
  // Données du tableau de bord
  DASHBOARD_DATA: 5 * 60 * 1000,     // 5 minutes
  DASHBOARD_STATS: 5 * 60 * 1000,    // 5 minutes
  DASHBOARD_ACTIVITIES: 5 * 60 * 1000, // 5 minutes
  
  // Données de messagerie
  MESSAGES: 2 * 60 * 1000,           // 2 minutes
  CONVERSATIONS: 3 * 60 * 1000,      // 3 minutes
  MESSAGE_COUNTS: 1 * 60 * 1000,     // 1 minute
  NOTIFICATIONS: 60 * 1000,          // 1 minute
  WALLET: 5 * 60 * 1000,             // 5 minutes
  
  // Divers
  DYNAMIC: 60 * 1000,                // 1 minute (pour les données très dynamiques)
  SETTINGS: 12 * 60 * 60 * 1000,     // 12 heures
  SEARCH_RESULTS: 3 * 60 * 1000,     // 3 minutes
  
  // Compatibilité avec formats courts
  QUICK: 60 * 1000,                  // 1 minute
  SHORT: 5 * 60 * 1000,              // 5 minutes
  MEDIUM: 15 * 60 * 1000,            // 15 minutes
  LONG: 60 * 60 * 1000,              // 1 heure
  DAY: 24 * 60 * 60 * 1000           // 1 jour
};

// Configurer les priorités de cache pour différents types de données
export const CACHE_PRIORITIES = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

// Configuration des tentatives de récupération de données
export const FETCH_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 8000
};

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