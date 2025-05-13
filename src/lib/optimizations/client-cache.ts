/**
 * Module de gestion du cache pour le dashboard client
 * Ce module fournit des fonctions pour invalider le cache du dashboard client
 */

import { 
  invalidateCache, 
  invalidateCachesByEvent, 
  CACHE_KEYS, 
  CACHE_EVENT_TYPES 
} from './index';

/**
 * Invalide le cache des statistiques du client
 * @param userId ID de l'utilisateur
 * @returns Nombre de clés invalidées
 */
export function invalidateClientStats(userId?: string): number {
  const keysToInvalidate = [CACHE_EVENT_TYPES.CLIENT_STATS_UPDATED];
  
  if (userId) {
    // Invalider également la clé spécifique à cet utilisateur
    invalidateCache(`${CACHE_KEYS.CLIENT_STATS}${userId}`);
  }
  
  let count = 0;
  keysToInvalidate.forEach(key => {
    count += invalidateCachesByEvent(key as keyof typeof CACHE_EVENT_TYPES);
  });
  
  // Déclencher un événement pour informer les autres composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:stats-updated'));
  }
  
  return count;
}

/**
 * Invalide le cache des commandes du client
 * @param userId ID de l'utilisateur
 * @returns Nombre de clés invalidées
 */
export function invalidateClientOrders(userId?: string): number {
  const keysToInvalidate = [CACHE_EVENT_TYPES.CLIENT_ORDERS_UPDATED];
  
  if (userId) {
    // Invalider également les clés spécifiques à cet utilisateur
    invalidateCache(`${CACHE_KEYS.CLIENT_ORDERS}${userId}`);
    invalidateCache(`${CACHE_KEYS.CLIENT_RECENT_ORDERS}${userId}`);
  }
  
  let count = 0;
  keysToInvalidate.forEach(key => {
    count += invalidateCachesByEvent(key as keyof typeof CACHE_EVENT_TYPES);
  });
  
  // Déclencher un événement pour informer les autres composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:orders-updated'));
  }
  
  return count;
}

/**
 * Invalide tous les caches du dashboard client
 * @param userId ID de l'utilisateur
 * @returns Nombre de clés invalidées
 */
export function invalidateAllClientCache(userId?: string): number {
  const keysToInvalidate = [
    CACHE_EVENT_TYPES.CLIENT_STATS_UPDATED,
    CACHE_EVENT_TYPES.CLIENT_ORDERS_UPDATED,
    CACHE_EVENT_TYPES.CLIENT_PAYMENTS_UPDATED,
    CACHE_EVENT_TYPES.CLIENT_PROFILE_UPDATED
  ];
  
  let count = 0;
  keysToInvalidate.forEach(key => {
    count += invalidateCachesByEvent(key as keyof typeof CACHE_EVENT_TYPES);
  });
  
  if (userId) {
    // Invalider également les clés spécifiques à cet utilisateur
    [
      `${CACHE_KEYS.CLIENT_STATS}${userId}`,
      `${CACHE_KEYS.CLIENT_ORDERS}${userId}`,
      `${CACHE_KEYS.CLIENT_RECENT_ORDERS}${userId}`,
      `${CACHE_KEYS.CLIENT_RECOMMENDED_FREELANCERS}${userId}`,
      `${CACHE_KEYS.CLIENT_DASHBOARD_ACTIVITIES}${userId}`,
      `${CACHE_KEYS.CLIENT_PAYMENTS_HISTORY}${userId}`,
      `${CACHE_KEYS.CLIENT_DISPUTES}${userId}`
    ].forEach(key => {
      if (invalidateCache(key)) count++;
    });
  }
  
  // Déclencher un événement global pour informer tous les composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:client-cache-invalidated'));
  }
  
  return count;
}

/**
 * Écoute les événements qui nécessitent une invalidation du cache
 * @param callback Fonction à appeler quand un cache est invalidé
 * @returns Fonction de nettoyage
 */
export function listenToClientCacheInvalidation(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const events = [
    'vynal:orders-updated',
    'vynal:stats-updated',
    'vynal:profile-updated',
    'vynal:client-cache-invalidated'
  ];
  
  // Ajouter les écouteurs d'événements
  events.forEach(event => {
    window.addEventListener(event, callback);
  });
  
  // Retourner une fonction de nettoyage
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, callback);
    });
  };
} 