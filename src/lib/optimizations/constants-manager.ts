/**
 * Gestionnaire de constantes pour les optimisations
 * Ce fichier centralise toutes les constantes utilisées dans le système d'optimisation
 * et assure la compatibilité entre l'ancien et le nouveau format.
 */

import { CacheKeyPrefix, CACHE_KEY_MAP } from './cache-keys';

// ======== CONSTANTES RÉSEAU ========
/**
 * Configuration unique des tentatives de récupération de données
 * SOURCE UNIQUE - Ne pas redéfinir ces valeurs ailleurs
 */
export const FETCH_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 8000
};

// ======== PRIORITÉS DE CACHE ========
/**
 * Priorités de cache pour la gestion des ressources
 * SOURCE UNIQUE - Ne pas redéfinir ces valeurs ailleurs
 */
export const CACHE_PRIORITIES = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

// ======== DURÉES D'EXPIRATION ========
/**
 * Durées d'expiration complètes du cache en millisecondes
 * SOURCE UNIQUE - Ne pas redéfinir ces valeurs ailleurs
 */
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

// ======== ÉVÉNEMENTS DE CACHE ========
/**
 * Types d'événements pour les invalidations de cache
 * SOURCE UNIQUE - Ne pas redéfinir ces valeurs ailleurs
 */
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

// ======== CLÉS DE CACHE ANCIENNES (COMPATIBILITÉ) ========
/**
 * Clés de cache au format ancien pour compatibilité
 * À terme, remplacer par le nouveau format (CacheKeyPrefix)
 */
export const LEGACY_CACHE_KEYS = {
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
  FREELANCE_PROFILE: 'freelance_profile_',
  
  // Ajout pour compatibilité
  PAYMENTS_DATA: 'payments_data_',
  WALLET_DATA: 'wallet_data_',
  PAYMENT_METHODS: 'payment_methods_',
  DISPUTE_LIST: 'dispute_list_',
} as const;

// ======== GROUPES D'INVALIDATION ========
/**
 * Configuration des groupes de cache par événement
 * Utilisé pour invalider des groupes de clés liées lors d'un événement
 */
export const CACHE_EVENT_GROUPS = {
  [CACHE_EVENT_TYPES.SERVICES_UPDATED]: [
    'admin_services_list',
    'admin_validation_services_',
    LEGACY_CACHE_KEYS.ADMIN_SERVICES_LIST,
    LEGACY_CACHE_KEYS.ADMIN_VALIDATION_SERVICES,
    LEGACY_CACHE_KEYS.SERVICES, // Invalider aussi le cache des services côté client
    'freelance_services_', // Préfixe pour les services des freelances
    LEGACY_CACHE_KEYS.FREELANCE_SERVICES, // Clé pour les services freelance si existante
    'service_details_' // Préfixe pour les détails des services
  ],
  [CACHE_EVENT_TYPES.USERS_UPDATED]: [
    'admin_users_list',
    LEGACY_CACHE_KEYS.ADMIN_USERS_LIST,
    LEGACY_CACHE_KEYS.USER_PROFILE // Invalider aussi le cache du profil utilisateur
  ],
  [CACHE_EVENT_TYPES.ORDERS_UPDATED]: [
    'admin_orders_list',
    LEGACY_CACHE_KEYS.ADMIN_STATS, // Invalider aussi les statistiques admin qui incluent les commandes
    LEGACY_CACHE_KEYS.CLIENT_STATS, // Invalider les statistiques client
    LEGACY_CACHE_KEYS.CLIENT_ORDERS, // Invalider les commandes client
    LEGACY_CACHE_KEYS.CLIENT_RECENT_ORDERS // Invalider les commandes récentes client
  ],
  [CACHE_EVENT_TYPES.ADMIN_STATS_UPDATED]: [
    LEGACY_CACHE_KEYS.ADMIN_STATS,
    LEGACY_CACHE_KEYS.DASHBOARD_STATS // Invalider aussi les statistiques du dashboard
  ],
  [CACHE_EVENT_TYPES.SETTINGS_UPDATED]: [
    LEGACY_CACHE_KEYS.ADMIN_SYSTEM_CONFIG
  ],
  [CACHE_EVENT_TYPES.ALERTS_UPDATED]: [
    LEGACY_CACHE_KEYS.ADMIN_ALERTS,
    `${LEGACY_CACHE_KEYS.ADMIN_ALERTS}_pagination`
  ],
  [CACHE_EVENT_TYPES.NOTIFICATIONS_UPDATED]: [
    LEGACY_CACHE_KEYS.ADMIN_NOTIFICATIONS_COUNT,
    'admin_notifications_count_'
  ],
  // Nouveaux groupes pour le dashboard client
  [CACHE_EVENT_TYPES.CLIENT_STATS_UPDATED]: [
    LEGACY_CACHE_KEYS.CLIENT_STATS,
    LEGACY_CACHE_KEYS.CLIENT_DASHBOARD_ACTIVITIES
  ],
  [CACHE_EVENT_TYPES.CLIENT_ORDERS_UPDATED]: [
    LEGACY_CACHE_KEYS.CLIENT_ORDERS,
    LEGACY_CACHE_KEYS.CLIENT_RECENT_ORDERS,
    LEGACY_CACHE_KEYS.CLIENT_STATS // Invalider aussi les statistiques qui dépendent des commandes
  ],
  [CACHE_EVENT_TYPES.CLIENT_PAYMENTS_UPDATED]: [
    LEGACY_CACHE_KEYS.CLIENT_PAYMENTS_HISTORY,
    LEGACY_CACHE_KEYS.WALLET_DATA,
    LEGACY_CACHE_KEYS.PAYMENTS_DATA
  ],
  [CACHE_EVENT_TYPES.CLIENT_PROFILE_UPDATED]: [
    LEGACY_CACHE_KEYS.USER_PROFILE,
    LEGACY_CACHE_KEYS.CLIENT_RECOMMENDED_FREELANCERS // Les recommandations peuvent dépendre du profil
  ],
  // Nouveaux groupes pour le dashboard freelance
  [CACHE_EVENT_TYPES.FREELANCE_STATS_UPDATED]: [
    LEGACY_CACHE_KEYS.FREELANCE_STATS,
    LEGACY_CACHE_KEYS.DASHBOARD_STATS,
    'freelance_stats_'
  ],
  [CACHE_EVENT_TYPES.FREELANCE_ORDERS_UPDATED]: [
    LEGACY_CACHE_KEYS.FREELANCE_ORDERS,
    LEGACY_CACHE_KEYS.FREELANCE_STATS, // Invalider aussi les statistiques qui dépendent des commandes
    'orders_freelance_'
  ],
  [CACHE_EVENT_TYPES.FREELANCE_SERVICES_UPDATED]: [
    LEGACY_CACHE_KEYS.FREELANCE_SERVICES,
    LEGACY_CACHE_KEYS.SERVICES, // Invalider aussi le cache global des services
    'freelance_services_'
  ],
  [CACHE_EVENT_TYPES.FREELANCE_PROFILE_UPDATED]: [
    LEGACY_CACHE_KEYS.FREELANCE_PROFILE,
    LEGACY_CACHE_KEYS.USER_PROFILE, // Invalider aussi le profil utilisateur
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
  
  // Nous avons besoin d'importer invalidateCache ici
  const { invalidateCache } = require('./cache');
  
  keysToInvalidate.forEach(key => {
    if (invalidateCache(key)) {
      invalidatedCount++;
    }
  });
  
  return invalidatedCount;
}

// ======== MAPPEUR DE COMPATIBILITÉ ========

/**
 * Convertit une clé du nouveau format vers l'ancien
 * @param newKey Clé au nouveau format
 * @returns Clé équivalente à l'ancien format ou null si pas de correspondance
 */
export function newToLegacyKey(newKey: CacheKeyPrefix): string | null {
  // Maping inverse de CACHE_KEY_MAP
  const inverseMap = Object.entries(CACHE_KEY_MAP).reduce((acc, [legacyKey, newKeyValue]) => {
    acc[newKeyValue] = LEGACY_CACHE_KEYS[legacyKey as keyof typeof LEGACY_CACHE_KEYS] || null;
    return acc;
  }, {} as Record<string, string | null>);
  
  return inverseMap[newKey] || null;
}

/**
 * Convertit une clé de l'ancien format vers le nouveau
 * @param legacyKey Clé à l'ancien format
 * @returns Clé équivalente au nouveau format ou null si pas de correspondance
 */
export function legacyToNewKey(legacyKey: string): CacheKeyPrefix | null {
  // Trouver la clé LEGACY_CACHE_KEYS qui correspond à legacyKey
  const matchingKey = Object.entries(LEGACY_CACHE_KEYS).find(([_, value]) => 
    legacyKey.startsWith(value)
  );
  
  if (!matchingKey) return null;
  
  // Récupérer la clé du CACHE_KEY_MAP correspondante
  return CACHE_KEY_MAP[matchingKey[0]] || null;
}

// Pour l'export unifié, nous utilisons l'ancien format pour éviter les ruptures
// mais nous préparons la transition vers le nouveau format
export const CACHE_KEYS = LEGACY_CACHE_KEYS; 