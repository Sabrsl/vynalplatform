/**
 * Système de cache hybride pour optimiser les performances
 * Utilise à la fois un cache en mémoire et localStorage pour maximiser les performances
 */

// Types pour le système de cache
export interface CacheOptions {
  expiry?: number;
  storage?: 'memory' | 'local' | 'both';
  background?: boolean;
  priority?: 'high' | 'medium' | 'low'; // Priorité pour la gestion des quotas
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  priority?: 'high' | 'medium' | 'low';
  size?: number;
}

// Configuration du cache
const CACHE_CONFIG = {
  MAX_MEMORY_ITEMS: 200,           // Nombre maximum d'éléments en mémoire
  MAX_LOCALSTORAGE_SIZE: 10 * 1024 * 1024, // 10 Mo par défaut (peut être ajusté)
  CLEANUP_INTERVAL: 60000,         // 1 minute
  QUOTA_EXCEEDED_CLEANUP: 0.3,     // Nettoyer 30% du cache quand le quota est dépassé
  PREFIX: 'vynal:cache:'           // Préfixe pour les clés de cache
};

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
  const prefixedKey = CACHE_CONFIG.PREFIX + key;
  
  // Vérifier d'abord le cache en mémoire (plus rapide)
  if (storage === 'memory' || storage === 'both') {
    const memoryData = getMemoryCacheData<T>(prefixedKey);
    if (memoryData) return memoryData;
  }
  
  // Ensuite, vérifier localStorage
  if ((storage === 'local' || storage === 'both') && typeof window !== 'undefined') {
    return getLocalStorageCacheData<T>(prefixedKey);
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
  const { expiry = 5 * 60 * 1000, storage = 'both', priority = 'medium' } = options;
  const prefixedKey = CACHE_CONFIG.PREFIX + key;
  
  // Calculer la taille approximative des données
  const dataSize = estimateSize(data);
  
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiry,
    priority,
    size: dataSize
  };
  
  // Stocker en mémoire
  if (storage === 'memory' || storage === 'both') {
    // Vérifier si le cache mémoire est trop grand
    if (memoryCache.size >= CACHE_CONFIG.MAX_MEMORY_ITEMS) {
      pruneMemoryCache();
    }
    
    memoryCache.set(prefixedKey, entry);
  }
  
  // Stocker dans localStorage
  if ((storage === 'local' || storage === 'both') && typeof window !== 'undefined') {
    try {
      localStorage.setItem(prefixedKey, JSON.stringify(entry));
    } catch (error) {
      console.warn(`Échec de mise en cache dans localStorage pour ${key}:`, error);
      
      // Gérer le cas où localStorage est plein
      if (error instanceof DOMException && (
        error.name === 'QuotaExceededError' || 
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        // Nettoyer le localStorage et réessayer
        pruneLocalStorageCache();
        try {
          localStorage.setItem(prefixedKey, JSON.stringify(entry));
        } catch (retryError) {
          console.error(`Impossible de stocker dans localStorage même après nettoyage: ${key}`);
          // En cas d'échec, garder seulement en mémoire
          memoryCache.set(prefixedKey, entry);
        }
      } else {
        // Autre erreur - garder en mémoire
        memoryCache.set(prefixedKey, entry);
      }
    }
  }
}

/**
 * Invalide une entrée de cache ou toutes les entrées correspondant à un préfixe
 * @param keyOrPrefix Clé ou préfixe de clé à invalider
 */
export function invalidateCache(keyOrPrefix: string): void {
  const isPrefix = keyOrPrefix.endsWith('_') || keyOrPrefix.includes('*');
  const prefixedKey = CACHE_CONFIG.PREFIX + keyOrPrefix;
  
  // Log pour le débogage
  console.debug(`[Cache] Invalidation de ${isPrefix ? 'préfixe' : 'clé'}: ${keyOrPrefix}`);
  
  let invalidatedCount = 0;
  
  // Invalider le cache mémoire
  if (isPrefix) {
    // Supprimer toutes les entrées commençant par le préfixe
    const keysToRemove = [];
    for (const cacheKey of memoryCache.keys()) {
      if (keyOrPrefix.includes('*')) {
        // Gestion de jokers (par exemple "service_*_stats")
        const pattern = keyOrPrefix.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        if (regex.test(cacheKey.replace(CACHE_CONFIG.PREFIX, ''))) {
          keysToRemove.push(cacheKey);
        }
      } else if (cacheKey.startsWith(prefixedKey)) {
        keysToRemove.push(cacheKey);
      }
    }
    
    // Effectuer la suppression
    for (const key of keysToRemove) {
      memoryCache.delete(key);
      invalidatedCount++;
    }
    
    // Supprimer aussi de localStorage si disponible
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (keyOrPrefix.includes('*')) {
          // Gestion de jokers
          const pattern = keyOrPrefix.replace(/\*/g, '.*');
          const regex = new RegExp(pattern);
          const normalizedKey = key.replace(CACHE_CONFIG.PREFIX, '');
          if (regex.test(normalizedKey)) {
            keysToRemove.push(key);
          }
        } else if (key.startsWith(prefixedKey)) {
          keysToRemove.push(key);
        }
      }
      
      // Effectuer la suppression en une seule fois
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        invalidatedCount++;
      });
    }
  } else {
    // Supprimer une clé spécifique
    if (memoryCache.delete(prefixedKey)) {
      invalidatedCount++;
    }
    
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem(prefixedKey)) {
          localStorage.removeItem(prefixedKey);
          invalidatedCount++;
        }
      } catch (e) {
        console.warn('Erreur lors de la suppression du cache localStorage:', e);
      }
    }
  }
  
  // Si des entrées ont été invalidées, émettre un événement
  if (invalidatedCount > 0 && typeof window !== 'undefined') {
    const event = new CustomEvent('vynal:cache-invalidated', {
      detail: {
        key: keyOrPrefix,
        count: invalidatedCount,
        fromPath: window.location.pathname,
        isPrefix
      }
    });
    
    window.dispatchEvent(event);
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
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
    
    // S'assurer que l'intervalle est arrêté quand la page est fermée
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupInterval);
    });

    // Configurer l'invalidation du cache lors des changements de route dans Next.js
    setupRouteChangeInvalidation();
    
    // Configurer l'invalidation du cache lors des changements de visibilité
    setupVisibilityChangeInvalidation();
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
    'services_freelance_',
    'user_profile_',
    'message_counts_'
  ];

  // Dernière route visitée
  let lastPath = window.location.pathname;
  
  // Fonction qui invalide le cache lors des changements de route
  const invalidateRouteCache = (toPath?: string) => {
    const fromPath = lastPath;
    const targetPath = toPath || window.location.pathname;
    
    // Ne rien faire si le chemin n'a pas changé
    if (fromPath === targetPath) return;
    
    // Mise à jour de la dernière route
    lastPath = targetPath;
    
    // Log pour le débogage
    console.debug(`[Cache] Changement de route détecté: ${fromPath} -> ${targetPath}`);
    
    // Invalidations spécifiques basées sur les chemins
    let shouldInvalidateDashboard = false;
    let shouldInvalidateServices = false;
    
    // Vérifier les chemins spécifiques
    if (fromPath.includes('/dashboard/services') || targetPath.includes('/dashboard/services')) {
      shouldInvalidateServices = true;
    }
    
    if (fromPath.includes('/dashboard') || targetPath.includes('/dashboard')) {
      shouldInvalidateDashboard = true;
    }
    
    // Invalider les caches appropriés
    if (shouldInvalidateServices) {
      invalidateCache('services_freelance_');
    }
    
    if (shouldInvalidateDashboard) {
      invalidateCache('dashboard_stats_');
    }
    
    // Émettre un événement de changement de route
    window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
      detail: {
        fromPath,
        toPath: targetPath,
        type: 'route-change'
      }
    }));
  };

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
            // Si le chemin a changé, invalider le cache
            if (window.location.pathname !== lastPath) {
              invalidateRouteCache();
            }
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
        const path = link.pathname || link.href.replace(window.location.origin, '');
        setTimeout(() => invalidateRouteCache(path), 100);
      }
    });

    // Écouter les événements popstate et pushstate pour les changements de route
    window.addEventListener('popstate', () => {
      invalidateRouteCache();
    });
    
    // Intercepter les méthodes history.pushState et history.replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state, title, url) {
      originalPushState.call(this, state, title, url);
      if (url && typeof url === 'string') {
        const newPath = url.includes(window.location.origin) 
          ? url.replace(window.location.origin, '') 
          : url;
        invalidateRouteCache(newPath);
      }
    };
    
    history.replaceState = function(state, title, url) {
      originalReplaceState.call(this, state, title, url);
      if (url && typeof url === 'string') {
        const newPath = url.includes(window.location.origin) 
          ? url.replace(window.location.origin, '') 
          : url;
        invalidateRouteCache(newPath);
      }
    };
  };
  
  // Appliquer la capture d'événements
  captureNextEvents();
}

/**
 * Configure l'invalidation du cache lors des changements de visibilité de la page
 * (quand l'utilisateur revient sur l'onglet de l'application)
 */
function setupVisibilityChangeInvalidation(): void {
  if (typeof window === 'undefined') return;
  
  // Préfixes de cache prioritaires à invalider lors du retour sur l'application
  const priorityCachePrefixesToInvalidate = [
    'dashboard_stats_',
    'dashboard_activities_',
    'services_',
    'user_profile_',
    'message_counts_'
  ];
  
  // Timestamp du dernier changement de visibilité
  let lastVisibilityChangeTime = Date.now();
  
  // Gérer le changement de visibilité (onglet actif/inactif)
  const handleVisibilityChange = () => {
    const now = Date.now();
    
    // Ne rafraîchir que si la page était cachée pendant au moins 30 secondes
    if (document.visibilityState === 'visible' && (now - lastVisibilityChangeTime > 30000)) {
      console.log('Application de nouveau visible après inactivité - invalidation du cache');
      
      // Invalider les préfixes prioritaires
      priorityCachePrefixesToInvalidate.forEach(prefix => {
        invalidateCache(prefix);
      });
      
      // Émettre un événement d'invalidation
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
        detail: { reason: 'visibility_change' }
      }));
    }
    
    lastVisibilityChangeTime = now;
  };
  
  // Gérer l'événement de focus (similaire mais complémentaire à visibilitychange)
  const handleFocus = () => {
    const now = Date.now();
    
    // Ne rafraîchir que si la fenêtre était inactive pendant au moins 30 secondes
    if (now - lastVisibilityChangeTime > 30000) {
      console.log('Fenêtre de nouveau active après inactivité - invalidation du cache');
      
      // Invalider les préfixes prioritaires
      priorityCachePrefixesToInvalidate.forEach(prefix => {
        invalidateCache(prefix);
      });
      
      // Émettre un événement d'invalidation
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
        detail: { reason: 'window_focus' }
      }));
    }
    
    lastVisibilityChangeTime = now;
  };
  
  // Enregistrer les écouteurs d'événements
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
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

/**
 * Nettoie les entrées expirées du cache
 */
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
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(CACHE_CONFIG.PREFIX)) continue;
      
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;
        
        const entry = JSON.parse(data) as CacheEntry<any>;
        if (now - entry.timestamp > entry.expiry) {
          keysToRemove.push(key);
        }
      } catch (error) {
        // Si le format est incorrect, supprimer l'entrée
        keysToRemove.push(key);
      }
    }
    
    // Effectuer la suppression en une seule fois
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Nettoie le cache mémoire lorsque le nombre d'éléments dépasse la limite
 */
function pruneMemoryCache(): void {
  // Si le cache n'est pas trop grand, ne rien faire
  if (memoryCache.size < CACHE_CONFIG.MAX_MEMORY_ITEMS) return;
  
  // Calculer combien d'éléments doivent être supprimés
  const itemsToRemove = Math.floor(memoryCache.size * 0.2); // Supprimer 20% des entrées
  
  // Trier les entrées par priorité et ancienneté
  const entries = Array.from(memoryCache.entries())
    .map(([key, entry]) => ({ key, entry }))
    .sort((a, b) => {
      // D'abord par priorité (low = supprimé en premier)
      const priorityA = getPriorityValue(a.entry.priority);
      const priorityB = getPriorityValue(b.entry.priority);
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Ensuite par ancienneté (plus ancien = supprimé en premier)
      return a.entry.timestamp - b.entry.timestamp;
    });
  
  // Supprimer les éléments les moins importants
  for (let i = 0; i < itemsToRemove; i++) {
    if (i < entries.length) {
      memoryCache.delete(entries[i].key);
    }
  }
}

/**
 * Nettoie le localStorage lorsque le quota est atteint
 */
function pruneLocalStorageCache(): void {
  // Collecter toutes les entrées de cache
  const cacheEntries: { key: string, entry: CacheEntry<any> }[] = [];
  const keysToRemove: string[] = [];
  
  // Parcourir localStorage pour trouver les entrées de cache
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(CACHE_CONFIG.PREFIX)) continue;
    
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;
      
      const entry = JSON.parse(data) as CacheEntry<any>;
      
      // Vérifier si l'entrée est expirée
      if (Date.now() - entry.timestamp > entry.expiry) {
        keysToRemove.push(key);
        continue;
      }
      
      cacheEntries.push({ key, entry });
    } catch (error) {
      // Si l'entrée est corrompue, la supprimer
      keysToRemove.push(key);
    }
  }
  
  // D'abord supprimer les entrées expirées/corrompues
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Si le nettoyage des entrées expirées n'a pas libéré assez d'espace,
  // supprimer par ordre de priorité et d'ancienneté
  
  // Trier les entrées par priorité et ancienneté
  cacheEntries.sort((a, b) => {
    // D'abord par priorité (low = supprimé en premier)
    const priorityA = getPriorityValue(a.entry.priority);
    const priorityB = getPriorityValue(b.entry.priority);
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    // Ensuite par ancienneté (plus ancien = supprimé en premier)
    return a.entry.timestamp - b.entry.timestamp;
  });
  
  // Supprimer 30% des entrées
  const entriesToRemove = Math.floor(cacheEntries.length * CACHE_CONFIG.QUOTA_EXCEEDED_CLEANUP);
  
  for (let i = 0; i < entriesToRemove; i++) {
    if (i < cacheEntries.length) {
      localStorage.removeItem(cacheEntries[i].key);
    }
  }
}

/**
 * Estime la taille en octets d'une valeur JavaScript
 */
function estimateSize(value: any): number {
  // Cas de base pour les valeurs nulles
  if (value === null || value === undefined) return 0;
  
  // Pour les types primitifs
  if (typeof value === 'boolean') return 4;
  if (typeof value === 'number') return 8;
  if (typeof value === 'string') return value.length * 2;
  
  // Pour les dates
  if (value instanceof Date) return 8;
  
  // Pour les objets et tableaux, calculer récursivement
  if (typeof value === 'object') {
    let size = 0;
    
    // Pour les tableaux
    if (Array.isArray(value)) {
      size = 40; // Overhead pour le tableau
      for (const item of value) {
        size += estimateSize(item);
      }
      return size;
    }
    
    // Pour les objets
    size = 40; // Overhead pour l'objet
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        size += key.length * 2; // Taille de la clé
        size += estimateSize(value[key]); // Taille de la valeur
      }
    }
    return size;
  }
  
  // Valeur par défaut pour les autres types
  return 8;
}

/**
 * Convertit la priorité en valeur numérique pour le tri
 */
function getPriorityValue(priority?: 'high' | 'medium' | 'low'): number {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2; // 'medium' par défaut
  }
} 