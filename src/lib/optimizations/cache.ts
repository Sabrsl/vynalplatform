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
  data?: T;
  timestamp: number;
  expiry: number;
  priority?: 'high' | 'medium' | 'low';
  size?: number;
  lastAccessed?: number;
  accessCount?: number;
}

// Configuration du cache
const CACHE_CONFIG = {
  MAX_MEMORY_ITEMS: 300,           // Augmenté de 200 à 300
  MAX_LOCALSTORAGE_SIZE: 15 * 1024 * 1024, // Augmenté à 15 Mo
  CLEANUP_INTERVAL: 120000,        // Augmenté à 2 minutes
  QUOTA_EXCEEDED_CLEANUP: 0.25,    // Réduire le nettoyage à 25% au lieu de 30%
  PREFIX: 'vynal:cache:',           // Préfixe pour les clés de cache
  HIGH_PRIORITY_RETENTION: 1.5,    // Multiplicateur de durée pour les entrées haute priorité
  DEFER_WRITE_DELAY: 100,          // Délai pour différer les écritures (ms)
};

// Cache en mémoire pour des performances optimales
const memoryCache: Map<string, CacheEntry<any>> = new Map();

// File d'attente d'écritures différées pour localStorage
let writeQueue: Set<string> = new Set();
let writeTimer: any = null;

// Durée d'expiration des différents types de données (en ms)
export const CACHE_EXPIRY = {
  CATEGORIES: 7 * 24 * 60 * 60 * 1000, // 7 jours (maximum)
  SERVICES: 24 * 60 * 60 * 1000,       // 24 heures (maximum)
  USER_DATA: 24 * 60 * 60 * 1000,      // 24 heures (maximum)
  USER_PROFILE: 7 * 24 * 60 * 60 * 1000, // 7 jours (maximum)
  USER_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 jours (maximum mais critique)
  USER_SESSION_PARTIAL: 24 * 60 * 60 * 1000, // 24 heures (maximum)
  EXTENDED_SESSION: 90 * 24 * 60 * 60 * 1000, // 90 jours (maximum)
  DASHBOARD_DATA: 7 * 24 * 60 * 60 * 1000, // 7 jours (maximum)
  DYNAMIC: 12 * 60 * 60 * 1000, // 12 heures (maximum raisonnable)
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
    if (memoryData) {
      // Mettre à jour les statistiques d'accès
      const entry = memoryCache.get(prefixedKey);
      if (entry) {
        entry.lastAccessed = Date.now();
        entry.accessCount = (entry.accessCount || 0) + 1;
      }
      return memoryData;
    }
  }
  
  // Ensuite, vérifier localStorage
  if ((storage === 'local' || storage === 'both') && typeof window !== 'undefined') {
    const localData = getLocalStorageCacheData<T>(prefixedKey);
    if (localData) {
      // Si trouvé dans localStorage mais pas dans la mémoire, ajouter en mémoire
      if ((storage === 'both') && !memoryCache.has(prefixedKey)) {
        try {
          const localEntryStr = localStorage.getItem(`${prefixedKey}_meta`);
          if (localEntryStr) {
            const localEntry = JSON.parse(localEntryStr) as CacheEntry<T>;
            memoryCache.set(prefixedKey, {
              ...localEntry,
              data: localData,
              lastAccessed: Date.now(),
              accessCount: 1
            });
          }
        } catch (e) {
          // Ignorer les erreurs de parse
        }
      }
      return localData;
    }
  }
  
  return null;
}

/**
 * Met à jour les données du cache
 * @param key Clé de cache
 * @param data Données à mettre en cache
 * @param options Options de cache
 * @returns Un booléen indiquant si l'opération a réussi
 */
export function setCachedData<T>(key: string, data: T, options: CacheOptions = {}): boolean {
  try {
    const { 
      expiry = 5 * 60 * 1000, // 5 minutes par défaut
      storage = 'both',
      priority = 'medium' 
    } = options;
    
    const prefixedKey = CACHE_CONFIG.PREFIX + key;
    
    // Calculer la taille approximative des données
    const size = estimateDataSize(data);
    
    // Déterminer l'expiration réelle basée sur la priorité
    const adjustedExpiry = priority === 'high' 
      ? expiry * CACHE_CONFIG.HIGH_PRIORITY_RETENTION 
      : expiry;
    
    // Créer l'entrée de cache
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: adjustedExpiry,
      priority,
      size,
      lastAccessed: Date.now(),
      accessCount: 1
    };
    
    // Mettre à jour le cache en mémoire
    if (storage === 'memory' || storage === 'both') {
      // Nettoyer le cache si nécessaire avant d'ajouter
      if (memoryCache.size >= CACHE_CONFIG.MAX_MEMORY_ITEMS) {
        pruneMemoryCache();
      }
      
      memoryCache.set(prefixedKey, entry);
    }
    
    // Mettre à jour le cache localStorage
    if ((storage === 'local' || storage === 'both') && typeof window !== 'undefined') {
      // Ajouter à la file d'attente d'écriture différée
      writeQueue.add(prefixedKey);
      
      // Utiliser un timer pour différer l'écriture
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        processWriteQueue(prefixedKey, entry);
      }, CACHE_CONFIG.DEFER_WRITE_DELAY);
    }
    
    return true;
  } catch (error) {
    console.warn('Erreur lors de la mise en cache des données:', error);
    return false;
  }
}

/**
 * Traite la file d'attente d'écritures différées au localStorage
 */
function processWriteQueue<T>(currentKey: string, currentEntry: CacheEntry<T>) {
  try {
    // Vérifier l'espace disponible
    if (isLocalStorageQuotaExceeded()) {
      cleanupLocalStorage();
    }
    
    // Traiter les écritures en attente
    writeQueue.forEach(key => {
      if (key === currentKey) {
        // Sauvegarder les données séparément des métadonnées pour optimiser
        localStorage.setItem(key, JSON.stringify(currentEntry.data));
        
        // Sauvegarder les métadonnées sans les données
        const metaEntry = { ...currentEntry };
        delete metaEntry.data;
        localStorage.setItem(`${key}_meta`, JSON.stringify(metaEntry));
      } else {
        const entry = memoryCache.get(key);
        if (entry) {
          localStorage.setItem(key, JSON.stringify(entry.data));
          
          const metaEntry = { ...entry };
          delete metaEntry.data;
          localStorage.setItem(`${key}_meta`, JSON.stringify(metaEntry));
        }
      }
    });
    
    writeQueue.clear();
    writeTimer = null;
  } catch (error) {
    console.warn('Erreur lors de l\'écriture différée dans localStorage:', error);
    
    // En cas d'erreur (quota dépassé), nettoyer et réessayer la clé courante uniquement
    cleanupLocalStorage();
    try {
      localStorage.setItem(currentKey, JSON.stringify(currentEntry.data));
      
      const metaEntry = { ...currentEntry };
      delete metaEntry.data;
      localStorage.setItem(`${currentKey}_meta`, JSON.stringify(metaEntry));
    } catch (e) {
      console.error('Impossible d\'écrire dans localStorage même après nettoyage:', e);
    }
    
    writeQueue.clear();
    writeTimer = null;
  }
}

/**
 * Invalide (supprime) une entrée du cache
 * @param key Clé de cache à invalider
 * @param options Options de cache
 * @returns Un booléen indiquant si l'opération a réussi
 */
export function invalidateCache(key: string, options: CacheOptions = {}): boolean {
  try {
    const { storage = 'both' } = options;
    const prefixedKey = CACHE_CONFIG.PREFIX + key;
    
    // Supprimer du cache en mémoire
    if (storage === 'memory' || storage === 'both') {
      memoryCache.delete(prefixedKey);
    }
    
    // Supprimer du localStorage
    if ((storage === 'local' || storage === 'both') && typeof window !== 'undefined') {
      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(`${prefixedKey}_meta`);
    }
    
    // Si l'invalidation concerne un élément spécifique important, émettre un événement
    // mais uniquement pour les clés qui ne sont pas trop fréquemment invalidées
    if (!key.includes('timestamp') && !key.includes('_temp') && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
        detail: { key } 
      }));
    }
    
    return true;
  } catch (error) {
    console.warn('Erreur lors de l\'invalidation du cache:', error);
    return false;
  }
}

/**
 * Utilitaire pour estimer la taille des données en octets
 */
function estimateDataSize(data: any): number {
  try {
    const jsonStr = JSON.stringify(data);
    return jsonStr.length * 2; // Approximation (2 octets par caractère)
  } catch (e) {
    return 1000; // Valeur par défaut si impossible à estimer
  }
}

/**
 * Vérifie si le quota de localStorage est dépassé
 */
function isLocalStorageQuotaExceeded(): boolean {
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.PREFIX)) {
        const value = localStorage.getItem(key) || '';
        totalSize += value.length * 2; // Approximation
      }
    }
    
    return totalSize > CACHE_CONFIG.MAX_LOCALSTORAGE_SIZE;
  } catch (e) {
    // En cas d'erreur, considérer que le quota est dépassé par sécurité
    return true;
  }
}

/**
 * Nettoie le localStorage en supprimant les entrées les moins prioritaires
 */
function cleanupLocalStorage(): void {
  try {
    // Collecter les métadonnées de toutes les entrées
    const entries: { key: string, meta: CacheEntry<any> }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith('_meta') && key.startsWith(CACHE_CONFIG.PREFIX)) {
        try {
          const metaStr = localStorage.getItem(key);
          if (metaStr) {
            const dataKey = key.substring(0, key.length - 5); // Enlever '_meta'
            const meta = JSON.parse(metaStr);
            entries.push({ key: dataKey, meta });
          }
        } catch (e) {
          // Ignorer les erreurs de parse
        }
      }
    }
    
    // Trier par priorité (la plus basse d'abord), puis par date d'accès (la plus ancienne d'abord)
    entries.sort((a, b) => {
      // D'abord par priorité
      const priorityA = getPriorityValue(a.meta.priority);
      const priorityB = getPriorityValue(b.meta.priority);
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Ensuite par date du dernier accès
      const lastAccessedA = a.meta.lastAccessed || a.meta.timestamp;
      const lastAccessedB = b.meta.lastAccessed || b.meta.timestamp;
      return lastAccessedA - lastAccessedB;
    });
    
    // Supprimer un pourcentage des entrées les moins prioritaires
    const itemsToRemove = Math.ceil(entries.length * CACHE_CONFIG.QUOTA_EXCEEDED_CLEANUP);
    for (let i = 0; i < itemsToRemove && i < entries.length; i++) {
      localStorage.removeItem(entries[i].key);
      localStorage.removeItem(`${entries[i].key}_meta`);
    }
  } catch (e) {
    console.error('Erreur lors du nettoyage du localStorage:', e);
  }
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
    // Vérifier d'abord les métadonnées pour l'expiration
    const metaStr = localStorage.getItem(`${key}_meta`);
    if (!metaStr) return null;
    
    const meta = JSON.parse(metaStr) as CacheEntry<any>;
    
    // Vérifier si les données sont expirées
    if (Date.now() - meta.timestamp > meta.expiry) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_meta`);
      return null;
    }
    
    // Si non expirées, récupérer les données
    const dataStr = localStorage.getItem(key);
    if (!dataStr) return null;
    
    return JSON.parse(dataStr) as T;
  } catch (error) {
    console.warn('Erreur lors de la récupération des données du localStorage:', error);
    return null;
  }
}

/**
 * Convertit une priorité en valeur numérique
 */
function getPriorityValue(priority?: 'high' | 'medium' | 'low'): number {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2; // medium par défaut
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
  
  // Trier les entrées par priorité, fréquence d'accès et ancienneté
  const entries = Array.from(memoryCache.entries())
    .map(([key, entry]) => ({ key, entry }))
    .sort((a, b) => {
      // D'abord par priorité (low = supprimé en premier)
      const priorityA = getPriorityValue(a.entry.priority);
      const priorityB = getPriorityValue(b.entry.priority);
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Ensuite par nombre d'accès (moins accédé = supprimé en premier)
      const accessCountA = a.entry.accessCount || 0;
      const accessCountB = b.entry.accessCount || 0;
      if (accessCountA !== accessCountB) return accessCountA - accessCountB;
      
      // Finalement par date du dernier accès (plus ancien = supprimé en premier)
      const lastAccessedA = a.entry.lastAccessed || a.entry.timestamp;
      const lastAccessedB = b.entry.lastAccessed || b.entry.timestamp;
      return lastAccessedA - lastAccessedB;
    });
  
  // Supprimer les éléments les moins importants
  for (let i = 0; i < itemsToRemove; i++) {
    if (i < entries.length) {
      memoryCache.delete(entries[i].key);
    }
  }
}

// Fonctions spécifiques pour les conversations et messages

/**
 * Invalide tous les messages d'une conversation spécifique
 */
export function invalidateConversationMessages(conversationId: string): boolean {
  try {
    // Collecter toutes les clés à invalider
    const keysToInvalidate: string[] = [];
    
    // Parcourir le cache mémoire
    for (const [key] of memoryCache.entries()) {
      if (key.includes(`messages_${conversationId}`)) {
        keysToInvalidate.push(key.replace(CACHE_CONFIG.PREFIX, ''));
      }
    }
    
    // Invalider toutes les clés collectées
    keysToInvalidate.forEach(key => invalidateCache(key));
    
    // Déclencher un seul événement global pour éviter les cascades
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:messages-invalidated', {
        detail: { conversationId }
      }));
    }
    
    return true;
  } catch (error) {
    console.warn('Erreur lors de l\'invalidation des messages:', error);
    return false;
  }
}

/**
 * Invalide des messages spécifiques
 */
export function invalidateSpecificMessages(messageIds: string[]): boolean {
  try {
    if (!messageIds.length) return false;
    
    // Parcourir le cache mémoire
    for (const [key] of memoryCache.entries()) {
      if (key.includes('messages_')) {
        // Invalider cette entrée car elle pourrait contenir un des messages
        invalidateCache(key.replace(CACHE_CONFIG.PREFIX, ''));
      }
    }
    
    return true;
  } catch (error) {
    console.warn('Erreur lors de l\'invalidation de messages spécifiques:', error);
    return false;
  }
}

/**
 * Crée un gestionnaire de cache avec un préfixe spécifique
 */
export function createCacheManager(prefix: string) {
  const fullPrefix = prefix ? `${prefix}_` : '';
  
  return {
    get: <T>(key: string, options: CacheOptions = {}): T | null => {
      return getCachedData<T>(`${fullPrefix}${key}`, options);
    },
    
    set: <T>(key: string, data: T, options: CacheOptions = {}): boolean => {
      return setCachedData<T>(`${fullPrefix}${key}`, data, options);
    },
    
    invalidate: (key: string, options: CacheOptions = {}): boolean => {
      return invalidateCache(`${fullPrefix}${key}`, options);
    },
    
    invalidateAll: (): boolean => {
      try {
        // Récupérer toutes les clés correspondant au préfixe
        const keysToInvalidate: string[] = [];
        for (const [key] of memoryCache.entries()) {
          if (key.includes(fullPrefix)) {
            keysToInvalidate.push(key.replace(CACHE_CONFIG.PREFIX, ''));
          }
        }
        
        // Invalider chaque clé
        keysToInvalidate.forEach(key => invalidateCache(key));
        return true;
      } catch (error) {
        console.warn('Erreur lors de l\'invalidation de toutes les entrées:', error);
        return false;
      }
    }
  };
} 