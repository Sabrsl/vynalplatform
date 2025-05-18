/**
 * Utilitaires d'optimisation des performances pour l'application
 * Ces fonctions permettent d'améliorer les performances, notamment via le cache
 */

// Durées d'expiration du cache en millisecondes
export const CACHE_EXPIRY = {
  QUICK: 30 * 1000, // 30 secondes
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  DASHBOARD_DATA: 10 * 60 * 1000, // 10 minutes
  DAY: 24 * 60 * 60 * 1000, // 1 jour
  // Nouvelles durées optimisées pour les données administratives
  HOUR: 60 * 60 * 1000, // 1 heure
  HOURS_3: 3 * 60 * 60 * 1000, // 3 heures
  HOURS_6: 6 * 60 * 60 * 1000, // 6 heures
  HOURS_12: 12 * 60 * 60 * 1000, // 12 heures
  DAYS_3: 3 * 24 * 60 * 60 * 1000, // 3 jours
  WEEK: 7 * 24 * 60 * 60 * 1000, // 1 semaine
};

// Clés de cache prédéfinies
export const CACHE_KEYS = {
  PAYMENTS_DATA: 'payments_data',
  WALLET_DATA: 'wallet_data',
  PAYMENT_METHODS: 'payment_methods',
  DISPUTE_LIST: 'dispute_list',
  // Clés pour les données publiques
  SERVICES_LIST: 'public_services_list',
  FREELANCERS_LIST: 'public_freelancers_list',
  // Nouvelles clés pour les données administratives
  ADMIN_ALERTS: 'admin_alerts_count',
  ADMIN_WITHDRAWALS: 'admin_withdrawals',
  ADMIN_MIN_WITHDRAWAL: 'admin_min_withdrawal',
  ADMIN_USERS_LIST: 'admin_users_list',
  ADMIN_SERVICES_LIST: 'admin_services_list',
  ADMIN_SYSTEM_CONFIG: 'admin_system_config',
  ADMIN_STATS: 'admin_dashboard_stats',
};

// Options pour le cache
export interface CacheOptions {
  expiry?: number;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Récupère des données du cache
 * @param key La clé du cache
 * @returns Les données ou null si non trouvées ou expirées
 */
export function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const { data, expiry } = JSON.parse(item);
    
    // Vérifier si les données ont expiré
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.warn(`Erreur lors de la récupération des données en cache pour "${key}"`, error);
    return null;
  }
}

/**
 * Stocke des données dans le cache
 * @param key La clé du cache
 * @param data Les données à stocker
 * @param options Options de cache (expiration, priorité)
 */
export function setCachedData<T>(
  key: string, 
  data: T, 
  options: CacheOptions = {}
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const { expiry = CACHE_EXPIRY.MEDIUM, priority = 'medium' } = options;
    
    const item = {
      data,
      expiry: Date.now() + expiry,
      priority,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn(`Erreur lors du stockage en cache pour "${key}"`, error);
    
    // En cas d'erreur de stockage (par exemple, quota dépassé),
    // essayer de libérer de l'espace en supprimant les éléments de faible priorité
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearLowPriorityCache();
      
      // Réessayer après nettoyage
      try {
        const item = {
          data,
          expiry: Date.now() + (options.expiry || CACHE_EXPIRY.MEDIUM),
          priority: options.priority || 'medium',
          timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch (retryError) {
        console.error(`Impossible de stocker en cache même après nettoyage pour "${key}"`, retryError);
      }
    }
  }
}

/**
 * Nettoie les éléments du cache de faible priorité
 */
export function clearLowPriorityCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Collecter tous les éléments du cache
    const cacheItems: Array<{ key: string; priority: string; timestamp: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        const { priority = 'low', timestamp = 0 } = JSON.parse(item);
        cacheItems.push({ key, priority, timestamp });
      } catch {
        // Ignorer les éléments qui ne sont pas au format JSON
      }
    }
    
    // Trier les éléments par priorité et horodatage (supprimer d'abord les plus anciens de faible priorité)
    cacheItems.sort((a, b) => {
      // Priorité d'abord
      const priorityOrder = { low: 0, medium: 1, high: 2 };
      const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                          (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Puis horodatage (du plus ancien au plus récent)
      return a.timestamp - b.timestamp;
    });
    
    // Supprimer les 30% d'éléments les plus anciens et de faible priorité
    const itemsToRemove = Math.max(1, Math.floor(cacheItems.length * 0.3));
    for (let i = 0; i < itemsToRemove; i++) {
      if (i < cacheItems.length) {
        localStorage.removeItem(cacheItems[i].key);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache', error);
  }
}

/**
 * Invalide une clé de cache spécifique
 * @param key La clé à invalider
 */
export function invalidateCacheKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

/**
 * Alias de invalidateCacheKey pour plus de cohérence sémantique
 * @param key La clé de cache à invalider
 */
export function invalidateCache(key: string): void {
  invalidateCacheKey(key);
}

/**
 * Invalide toutes les clés correspondant à un pattern
 * @param pattern Le motif à rechercher dans les clés
 */
export function invalidateCachePattern(pattern: string): void {
  if (typeof window === 'undefined') return;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(pattern)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Exécute une fonction avec debounce
 * @param fn Fonction à exécuter
 * @param wait Délai d'attente en ms
 * @returns Fonction avec debounce
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      fn(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Exécute une fonction avec throttle
 * @param fn Fonction à exécuter
 * @param limit Délai minimal entre les exécutions en ms
 * @returns Fonction avec throttle
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      fn(...args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
} 