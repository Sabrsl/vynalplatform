/**
 * Module d'optimisations et performances
 * Ce module centralise les utilitaires pour optimiser le chargement des données et la navigation
 */

import { 
  createCacheManager, 
  getCachedData, 
  setCachedData, 
  invalidateCache 
} from './cache';
import { setupServiceWorker } from './service-worker';
import { optimizedFetchWithRetry } from './network';

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
  MESSAGE_COUNTS: 'message_counts_'
};

// Durées d'expiration du cache en millisecondes
export const CACHE_EXPIRY = {
  CATEGORIES: 30 * 60 * 1000, // 30 minutes
  SERVICES: 5 * 60 * 1000,    // 5 minutes
  USER_DATA: 60 * 60 * 1000,  // 1 heure
  USER_PROFILE: 60 * 60 * 1000, // 1 heure
  USER_SESSION: 24 * 60 * 60 * 1000, // 24 heures
  USER_SESSION_PARTIAL: 5 * 60 * 1000, // 5 minutes
  EXTENDED_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 jours
  DASHBOARD_DATA: 5 * 60 * 1000, // 5 minutes
  DYNAMIC: 60 * 1000           // 1 minute (pour les données très dynamiques)
};

// Configuration des tentatives de récupération de données
export const FETCH_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 8000
};

// Méthode pour préparer l'application et optimiser le chargement initial
export const initializeOptimizations = () => {
  // Configuration du gestionnaire de cache
  createCacheManager();
  
  // Activer le service worker en production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    setupServiceWorker();
  }
};

// Exposer les fonctions d'optimisation principales
export {
  getCachedData,
  setCachedData,
  invalidateCache,
  optimizedFetchWithRetry
};

// Exporter le type principal utilisé par ce module
export type { CacheOptions } from './cache'; 