/**
 * Module de gestion du cache pour le dashboard freelance
 * Ce module fournit des fonctions pour invalider le cache du dashboard freelance
 */

import { 
  invalidateCache, 
  invalidateCachesByEvent, 
  CACHE_KEYS, 
  CACHE_EVENT_TYPES 
} from './index';

/**
 * Invalide le cache des statistiques du freelance
 * @param userId ID de l'utilisateur
 * @returns Nombre de clés invalidées
 */
export function invalidateFreelanceStats(userId?: string): number {
  const keysToInvalidate = [CACHE_EVENT_TYPES.FREELANCE_STATS_UPDATED];
  
  if (userId) {
    // Invalider également la clé spécifique à cet utilisateur
    invalidateCache(`freelance_stats_${userId}`);
  }
  
  let count = 0;
  keysToInvalidate.forEach(key => {
    count += invalidateCachesByEvent(key as keyof typeof CACHE_EVENT_TYPES);
  });
  
  // Déclencher un événement pour informer les autres composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:freelance-stats-updated'));
  }
  
  return count;
}

/**
 * Invalide le cache des commandes du freelance
 * @param userId ID de l'utilisateur
 * @returns Nombre de clés invalidées
 */
export function invalidateFreelanceOrders(userId?: string): number {
  const keysToInvalidate = [CACHE_EVENT_TYPES.FREELANCE_ORDERS_UPDATED];
  
  if (userId) {
    // Invalider les clés spécifiques aux commandes du freelance
    invalidateCache(`orders_freelance_${userId}`);
    // Invalider tous les caches liés aux commandes de cet utilisateur
    if (typeof window !== 'undefined' && window.localStorage) {
      const allKeys = Object.keys(window.localStorage);
      const orderKeys = allKeys.filter(key => 
        key.startsWith(`vynal:cache:orders_freelance_${userId}`)
      );
      
      orderKeys.forEach(key => {
        invalidateCache(key.replace('vynal:cache:', ''));
      });
    }
  }
  
  let count = 0;
  keysToInvalidate.forEach(key => {
    count += invalidateCachesByEvent(key as keyof typeof CACHE_EVENT_TYPES);
  });
  
  // Déclencher un événement pour informer les autres composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:freelance-orders-updated'));
  }
  
  return count;
}

/**
 * Invalide tous les caches du dashboard freelance
 * @param userId ID de l'utilisateur
 * @returns Nombre de clés invalidées
 */
export function invalidateAllFreelanceCache(userId?: string): number {
  const keysToInvalidate = [
    CACHE_EVENT_TYPES.FREELANCE_STATS_UPDATED,
    CACHE_EVENT_TYPES.FREELANCE_ORDERS_UPDATED,
    CACHE_EVENT_TYPES.FREELANCE_SERVICES_UPDATED,
    CACHE_EVENT_TYPES.FREELANCE_PROFILE_UPDATED
  ];
  
  let count = 0;
  keysToInvalidate.forEach(key => {
    count += invalidateCachesByEvent(key as keyof typeof CACHE_EVENT_TYPES);
  });
  
  if (userId) {
    // Invalider également les clés spécifiques à cet utilisateur
    const keysToInvalidate = [
      `freelance_stats_${userId}`,
      `orders_stats_freelance_${userId}`
    ];
    
    keysToInvalidate.forEach(key => {
      if (invalidateCache(key)) count++;
    });
    
    // Invalider tous les caches liés à cet utilisateur freelance
    if (typeof window !== 'undefined' && window.localStorage) {
      const allKeys = Object.keys(window.localStorage);
      const userKeys = allKeys.filter(key => 
        key.startsWith(`vynal:cache:orders_freelance_${userId}`) ||
        key.startsWith(`vynal:cache:freelance_${userId}`)
      );
      
      userKeys.forEach(key => {
        if (invalidateCache(key.replace('vynal:cache:', ''))) count++;
      });
    }
  }
  
  // Déclencher un événement global pour informer tous les composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:freelance-cache-invalidated'));
  }
  
  return count;
}

/**
 * Écoute les événements qui nécessitent une invalidation du cache freelance
 * @param callback Fonction à appeler quand un cache est invalidé
 * @returns Fonction de nettoyage
 */
export function listenToFreelanceCacheInvalidation(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const events = [
    'vynal:freelance-orders-updated',
    'vynal:freelance-stats-updated', 
    'vynal:freelance-services-updated',
    'vynal:freelance-profile-updated',
    'vynal:freelance-cache-invalidated'
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