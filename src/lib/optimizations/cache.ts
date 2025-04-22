/**
 * Système de cache hybride pour optimiser les performances
 * Utilise à la fois un cache en mémoire et localStorage pour maximiser les performances
 */

// Types pour le système de cache
export interface CacheOptions {
  expiry?: number;
  storage?: 'memory' | 'local' | 'both';
  background?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Cache en mémoire pour des performances optimales
const memoryCache: Map<string, CacheEntry<any>> = new Map();

// Durée d'expiration des différents types de données (en ms)
export const CACHE_EXPIRY = {
  CATEGORIES: 24 * 60 * 60 * 1000, // 24 heures
  SERVICES: 10 * 60 * 1000, // 10 minutes
  USER_DATA: 30 * 60 * 1000, // 30 minutes
  USER_PROFILE: 60 * 60 * 1000, // 1 heure
  USER_SESSION: 30 * 60 * 1000, // 30 minutes
  USER_SESSION_PARTIAL: 5 * 60 * 1000, // 5 minutes
  EXTENDED_SESSION: 7 * 24 * 60 * 60 * 1000, // 7 jours
  DASHBOARD_DATA: 5 * 60 * 1000, // 5 minutes
  DYNAMIC: 60 * 1000, // 1 minute (pour les données très dynamiques)
  ROUTE_CHANGE: 0, // Invalider immédiatement lors des changements de route
};

/**
 * Récupère les données du cache (mémoire ou localStorage)
 * @param key Clé de cache
 * @param options Options de cache
 * @returns Les données si présentes et valides, null sinon
 */
export function getCachedData<T>(key: string, options: CacheOptions = {}): T | null {
  const { storage = 'both' } = options;
  
  // Vérifier d'abord le cache en mémoire (plus rapide)
  if (storage === 'memory' || storage === 'both') {
    const memoryData = getMemoryCacheData<T>(key);
    if (memoryData) return memoryData;
  }
  
  // Ensuite, vérifier localStorage
  if ((storage === 'local' || storage === 'both') && typeof window !== 'undefined') {
    return getLocalStorageCacheData<T>(key);
  }
  
  return null;
}

/**
 * Stocke des données dans le cache
 * @param key Clé de cache
 * @param data Données à stocker
 * @param options Options de cache
 */
export function setCachedData<T>(key: string, data: T, options: CacheOptions = {}): void {
  const { expiry = 5 * 60 * 1000, storage = 'both' } = options;
  
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiry
  };
  
  // Stocker en mémoire
  if (storage === 'memory' || storage === 'both') {
    memoryCache.set(key, entry);
  }
  
  // Stocker dans localStorage
  if ((storage === 'local' || storage === 'both') && typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn(`Échec de mise en cache dans localStorage pour ${key}:`, error);
      // En cas d'erreur localStorage (ex: quota dépassé), au moins garder en mémoire
      memoryCache.set(key, entry);
    }
  }
}

/**
 * Invalide une entrée de cache ou toutes les entrées correspondant à un préfixe
 * @param keyOrPrefix Clé ou préfixe de clé à invalider
 */
export function invalidateCache(keyOrPrefix: string): void {
  const isPrefix = keyOrPrefix.endsWith(':');
  
  // Invalider le cache mémoire
  if (isPrefix) {
    // Supprimer toutes les entrées commençant par le préfixe
    for (const cacheKey of memoryCache.keys()) {
      if (cacheKey.startsWith(keyOrPrefix)) {
        memoryCache.delete(cacheKey);
      }
    }
    
    // Supprimer aussi de localStorage si disponible
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(keyOrPrefix)) {
          localStorage.removeItem(key);
        }
      }
    }
  } else {
    // Supprimer une clé spécifique
    memoryCache.delete(keyOrPrefix);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(keyOrPrefix);
    }
  }
}

/**
 * Initialise le gestionnaire de cache et active le nettoyage périodique
 */
export function createCacheManager(): void {
  if (typeof window !== 'undefined') {
    // Nettoyer les entrées expirées périodiquement
    const cleanupInterval = setInterval(() => {
      cleanExpiredCache();
    }, 60000); // Nettoyage toutes les minutes
    
    // S'assurer que l'intervalle est arrêté quand la page est fermée
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupInterval);
    });

    // Configurer l'invalidation du cache lors des changements de route dans Next.js
    setupRouteChangeInvalidation();
  }
}

/**
 * Configure l'invalidation du cache lors des changements de route dans Next.js
 */
function setupRouteChangeInvalidation(): void {
  if (typeof window === 'undefined') return;

  // Liste des préfixes de clés à invalider lors des changements de route
  // Ces clés correspondent aux données qui doivent être rafraîchies entre les pages
  const cachePrefixesToInvalidateOnRouteChange = [
    'dashboard_stats_',
    'dashboard_activities_',
    'services_',
    'user_profile_',
    'message_counts_'
  ];

  // Capture des événements de changement de route de Next.js
  const captureNextEvents = () => {
    // next/router est déprécié en faveur de next/navigation dans Next.js 13+
    // Vérifions les deux pour la compatibilité

    // Pour Next.js 13+ avec le router App
    if ((window as any).__NEXT_DATA__?.buildId) {
      // Utiliser la MutationObserver pour détecter les changements de route
      // car Next.js App Router ne fournit pas d'API d'événement externe pour les changements de route
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            // Une mutation du DOM qui pourrait indiquer un changement de route
            // Invalider le cache
            invalidateRouteCache();
          }
        }
      });

      // Observer les changements dans l'élément racine next
      const nextRoot = document.querySelector('#__next') || document.body;
      observer.observe(nextRoot, { childList: true, subtree: true });
    }

    // Méthode alternative pour tous les cas - écouter les clics sur les liens
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        // C'est une navigation interne - invalider le cache après un court délai
        setTimeout(invalidateRouteCache, 100);
      }
    });

    // Écouter les événements popstate et pushstate pour les changements de route
    window.addEventListener('popstate', invalidateRouteCache);
    
    // Intercepter les méthodes history.pushState et history.replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments as any);
      invalidateRouteCache();
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments as any);
      invalidateRouteCache();
    };
  };

  // Fonction d'invalidation du cache spécifique aux changements de route
  const invalidateRouteCache = () => {
    console.log('Invalidation du cache après changement de route');
    
    // Invalider les préfixes de cache concernés
    cachePrefixesToInvalidateOnRouteChange.forEach(prefix => {
      invalidateCache(prefix);
    });
    
    // Signaler l'événement pour que les composants puissent réagir
    window.dispatchEvent(new CustomEvent('vynal:cache-invalidated'));
  };

  // Initialiser la capture des événements de changement de route
  captureNextEvents();
}

// Fonctions utilitaires privées

function getMemoryCacheData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  
  if (!entry) return null;
  
  // Vérifier si les données sont expirées
  if (Date.now() - entry.timestamp > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.data;
}

function getLocalStorageCacheData<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const entry = JSON.parse(data) as CacheEntry<T>;
    
    // Vérifier si les données sont expirées
    if (Date.now() - entry.timestamp > entry.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    // Synchroniser avec le cache mémoire pour les prochains accès
    memoryCache.set(key, entry);
    
    return entry.data;
  } catch (error) {
    console.warn(`Erreur lors de la lecture du cache pour ${key}:`, error);
    localStorage.removeItem(key);
    return null;
  }
}

function cleanExpiredCache(): void {
  const now = Date.now();
  
  // Nettoyer le cache en mémoire
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp > entry.expiry) {
      memoryCache.delete(key);
    }
  }
  
  // Nettoyer localStorage
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('app:')) continue;
      
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;
        
        const entry = JSON.parse(data) as CacheEntry<any>;
        if (now - entry.timestamp > entry.expiry) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Si le format est incorrect, supprimer l'entrée
        localStorage.removeItem(key);
      }
    }
  }
} 