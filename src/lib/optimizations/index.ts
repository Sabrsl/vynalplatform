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

// Clés pour le système de cache
export const CACHE_KEYS = {
  // Données générales
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
  DISPUTE_LIST: 'dispute_list_',
  
  // Clés pour le dashboard admin
  ADMIN_ALERTS: 'admin_alerts_',
  ADMIN_WITHDRAWALS: 'admin_withdrawals_',
  ADMIN_MIN_WITHDRAWAL: 'admin_min_withdrawal_',
  ADMIN_USERS_LIST: 'admin_users_list_',
  ADMIN_SERVICES_LIST: 'admin_services_list_',
  ADMIN_VALIDATION_SERVICES: 'admin_validation_services_',
  ADMIN_SYSTEM_CONFIG: 'admin_system_config_',
  ADMIN_STATS: 'admin_stats_',
  ADMIN_CONTACT_MESSAGES: 'admin_contact_messages_',
  ADMIN_CONVERSATION_MESSAGES: 'admin_conversation_messages_',
  ADMIN_NOTIFICATIONS_COUNT: 'admin_notifications_count_',
  
  // Clés pour le dashboard client
  CLIENT_STATS: 'client_stats_',
  CLIENT_ORDERS: 'client_orders_',
  CLIENT_RECENT_ORDERS: 'client_recent_orders_', 
  CLIENT_RECOMMENDED_FREELANCERS: 'client_recommended_freelancers_',
  CLIENT_DASHBOARD_ACTIVITIES: 'client_dashboard_activities_',
  CLIENT_PAYMENTS_HISTORY: 'client_payments_history_',
  CLIENT_DISPUTES: 'client_disputes_',
  
  // Clés pour le dashboard freelance
  FREELANCE_STATS: 'freelance_stats_',
  FREELANCE_ORDERS: 'freelance_orders_',
  FREELANCE_SERVICES: 'freelance_services_', 
  FREELANCE_EARNINGS: 'freelance_earnings_',
  FREELANCE_PROFILE: 'freelance_profile_'
} as const;

// Durées d'expiration complètes du cache en millisecondes
export const CACHE_EXPIRY = {
  // Données relativement statiques
  CATEGORIES: 7 * 24 * 60 * 60 * 1000,     // 7 jours (maximum)
  SUBCATEGORIES: 7 * 24 * 60 * 60 * 1000,  // 7 jours (maximum)
  
  // Données des services (listing)
  SERVICES: 24 * 60 * 60 * 1000,           // 24 heures (maximum)
  SERVICES_DETAILS: 12 * 60 * 60 * 1000,   // 12 heures (maximum)
  
  // Données utilisateur
  USER_DATA: 12 * 60 * 60 * 1000,          // 12 heures (maximum)
  USER_PROFILE: 24 * 60 * 60 * 1000,       // 24 heures (maximum)
  USER_SESSION: 30 * 24 * 60 * 60 * 1000,  // 30 jours (maximum mais critique)
  USER_SESSION_PARTIAL: 60 * 60 * 1000,    // 1 heure (maximum)
  EXTENDED_SESSION: 90 * 24 * 60 * 60 * 1000, // 90 jours (maximum)
  
  // Données du tableau de bord
  DASHBOARD_DATA: 7 * 24 * 60 * 60 * 1000, // 7 jours (maximum)
  DASHBOARD_STATS: 14 * 24 * 60 * 60 * 1000, // 14 jours (maximum)
  DASHBOARD_ACTIVITIES: 7 * 24 * 60 * 60 * 1000, // 7 jours (maximum)
  
  // Données de messagerie (conservent une durée raisonnable car critiques)
  MESSAGES: 60 * 60 * 1000,                // 1 heure (maximum raisonnable)
  CONVERSATIONS: 4 * 60 * 60 * 1000,       // 4 heures (maximum raisonnable)
  MESSAGE_COUNTS: 60 * 60 * 1000,          // 1 heure (maximum raisonnable)
  NOTIFICATIONS: 30 * 60 * 1000,           // 30 minutes (maximum raisonnable)
  WALLET: 24 * 60 * 60 * 1000,             // 24 heures (maximum)
  
  // Divers
  DYNAMIC: 30 * 60 * 1000,                 // 30 minutes (maximum raisonnable)
  SETTINGS: 30 * 24 * 60 * 60 * 1000,      // 30 jours (maximum)
  SEARCH_RESULTS: 24 * 60 * 60 * 1000,     // 24 heures (maximum)
  
  // Compatibilité avec formats courts
  QUICK: 15 * 60 * 1000,                   // 15 minutes (maximum raisonnable)
  SHORT: 4 * 60 * 60 * 1000,               // 4 heures (maximum)
  MEDIUM: 24 * 60 * 60 * 1000,             // 24 heures (maximum)
  LONG: 7 * 24 * 60 * 60 * 1000,           // 7 jours (maximum)
  DAY: 24 * 60 * 60 * 1000,                // 1 jour (inchangé)
  
  // Durées spécifiques pour l'administration
  HOUR: 60 * 60 * 1000,                    // 1 heure (inchangé)
  HOURS_3: 3 * 60 * 60 * 1000,             // 3 heures (inchangé)
  HOURS_6: 6 * 60 * 60 * 1000,             // 6 heures (inchangé)
  HOURS_12: 12 * 60 * 60 * 1000,           // 12 heures (inchangé)
  DAYS_3: 3 * 24 * 60 * 60 * 1000,         // 3 jours (inchangé)
  DAYS_7: 7 * 24 * 60 * 60 * 1000,         // 7 jours (ajouté)
  DAYS_14: 14 * 24 * 60 * 60 * 1000,       // 14 jours (ajouté)
  DAYS_30: 30 * 24 * 60 * 60 * 1000,       // 30 jours (ajouté)
  WEEK: 7 * 24 * 60 * 60 * 1000,           // 1 semaine (inchangé)
  WEEKS_2: 14 * 24 * 60 * 60 * 1000,       // 2 semaines (ajouté)
  MINUTES_15: 15 * 60 * 1000,              // 15 minutes (inchangé)
  MINUTES_30: 30 * 60 * 1000               // 30 minutes (inchangé)
};

// Configurer les priorités de cache pour différents types de données
export const CACHE_PRIORITIES = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

// Configuration des événements d'invalidation par section
export const CACHE_EVENT_TYPES = {
  SERVICES_UPDATED: 'services_updated',
  USERS_UPDATED: 'users_updated',
  ORDERS_UPDATED: 'orders_updated',
  ADMIN_STATS_UPDATED: 'admin_stats_updated',
  SETTINGS_UPDATED: 'settings_updated',
  ALERTS_UPDATED: 'alerts_updated',
  NOTIFICATIONS_UPDATED: 'notifications_updated',
  // Nouveaux événements pour le dashboard client
  CLIENT_STATS_UPDATED: 'client_stats_updated',
  CLIENT_ORDERS_UPDATED: 'client_orders_updated',
  CLIENT_PAYMENTS_UPDATED: 'client_payments_updated',
  CLIENT_PROFILE_UPDATED: 'client_profile_updated',
  // Nouveaux événements pour le dashboard freelance
  FREELANCE_STATS_UPDATED: 'freelance_stats_updated',
  FREELANCE_ORDERS_UPDATED: 'freelance_orders_updated',
  FREELANCE_SERVICES_UPDATED: 'freelance_services_updated',
  FREELANCE_PROFILE_UPDATED: 'freelance_profile_updated'
};

// Configuration des groupes de cache par événement
export const CACHE_EVENT_GROUPS = {
  [CACHE_EVENT_TYPES.SERVICES_UPDATED]: [
    'admin_services_list',
    'admin_validation_services_',
    CACHE_KEYS.ADMIN_SERVICES_LIST,
    CACHE_KEYS.ADMIN_VALIDATION_SERVICES,
    CACHE_KEYS.SERVICES // Invalider aussi le cache des services côté client
  ],
  [CACHE_EVENT_TYPES.USERS_UPDATED]: [
    'admin_users_list',
    CACHE_KEYS.ADMIN_USERS_LIST,
    CACHE_KEYS.USER_PROFILE // Invalider aussi le cache du profil utilisateur
  ],
  [CACHE_EVENT_TYPES.ORDERS_UPDATED]: [
    'admin_orders_list',
    CACHE_KEYS.ADMIN_STATS, // Invalider aussi les statistiques admin qui incluent les commandes
    CACHE_KEYS.CLIENT_STATS, // Invalider les statistiques client
    CACHE_KEYS.CLIENT_ORDERS, // Invalider les commandes client
    CACHE_KEYS.CLIENT_RECENT_ORDERS // Invalider les commandes récentes client
  ],
  [CACHE_EVENT_TYPES.ADMIN_STATS_UPDATED]: [
    CACHE_KEYS.ADMIN_STATS,
    CACHE_KEYS.DASHBOARD_STATS // Invalider aussi les statistiques du dashboard
  ],
  [CACHE_EVENT_TYPES.SETTINGS_UPDATED]: [
    CACHE_KEYS.ADMIN_SYSTEM_CONFIG
  ],
  [CACHE_EVENT_TYPES.ALERTS_UPDATED]: [
    CACHE_KEYS.ADMIN_ALERTS,
    `${CACHE_KEYS.ADMIN_ALERTS}_pagination`
  ],
  [CACHE_EVENT_TYPES.NOTIFICATIONS_UPDATED]: [
    CACHE_KEYS.ADMIN_NOTIFICATIONS_COUNT,
    'admin_notifications_count_'
  ],
  // Nouveaux groupes pour le dashboard client
  [CACHE_EVENT_TYPES.CLIENT_STATS_UPDATED]: [
    CACHE_KEYS.CLIENT_STATS,
    CACHE_KEYS.CLIENT_DASHBOARD_ACTIVITIES
  ],
  [CACHE_EVENT_TYPES.CLIENT_ORDERS_UPDATED]: [
    CACHE_KEYS.CLIENT_ORDERS,
    CACHE_KEYS.CLIENT_RECENT_ORDERS,
    CACHE_KEYS.CLIENT_STATS // Invalider aussi les statistiques qui dépendent des commandes
  ],
  [CACHE_EVENT_TYPES.CLIENT_PAYMENTS_UPDATED]: [
    CACHE_KEYS.CLIENT_PAYMENTS_HISTORY,
    CACHE_KEYS.WALLET_DATA,
    CACHE_KEYS.PAYMENTS_DATA
  ],
  [CACHE_EVENT_TYPES.CLIENT_PROFILE_UPDATED]: [
    CACHE_KEYS.USER_PROFILE,
    CACHE_KEYS.CLIENT_RECOMMENDED_FREELANCERS // Les recommandations peuvent dépendre du profil
  ],
  // Nouveaux groupes pour le dashboard freelance
  [CACHE_EVENT_TYPES.FREELANCE_STATS_UPDATED]: [
    CACHE_KEYS.FREELANCE_STATS,
    CACHE_KEYS.DASHBOARD_STATS,
    'freelance_stats_'
  ],
  [CACHE_EVENT_TYPES.FREELANCE_ORDERS_UPDATED]: [
    CACHE_KEYS.FREELANCE_ORDERS,
    CACHE_KEYS.FREELANCE_STATS, // Invalider aussi les statistiques qui dépendent des commandes
    'orders_freelance_'
  ],
  [CACHE_EVENT_TYPES.FREELANCE_SERVICES_UPDATED]: [
    CACHE_KEYS.FREELANCE_SERVICES,
    CACHE_KEYS.SERVICES, // Invalider aussi le cache global des services
    'freelance_services_'
  ],
  [CACHE_EVENT_TYPES.FREELANCE_PROFILE_UPDATED]: [
    CACHE_KEYS.FREELANCE_PROFILE,
    CACHE_KEYS.USER_PROFILE, // Invalider aussi le profil utilisateur
    'freelance_profile_'
  ]
};

/**
 * Invalide un groupe de caches associés à un type d'événement
 * @param eventType Type d'événement déclenchant l'invalidation 
 * @returns Nombre de clés invalidées
 */
export function invalidateCachesByEvent(eventType: keyof typeof CACHE_EVENT_GROUPS): number {
  const keysToInvalidate = CACHE_EVENT_GROUPS[eventType] || [];
  let invalidatedCount = 0;
  
  keysToInvalidate.forEach(key => {
    if (invalidateCache(key)) {
      invalidatedCount++;
    }
  });
  
  return invalidatedCount;
}

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