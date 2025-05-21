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
 * Récupérer les clés de cryptage des variables d'environnement
 * Les valeurs de fallback ne sont utilisées qu'en environnement de développement
 */
const getEncryptionKeys = () => {
  const key = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
  const iv = process.env.ENCRYPTION_IV || process.env.NEXT_PUBLIC_ENCRYPTION_IV;
  
  if (!key || !iv) {
    throw new Error('Les clés de chiffrement ne sont pas définies dans les variables d\'environnement');
  }
  
  return {
    key,
    iv,
    isProduction: process.env.NODE_ENV === 'production'
  };
};

/**
 * Fonction pour crypter une chaîne
 * Utilise les clés d'environnement pour le cryptage
 */
function simpleEncrypt(data: string): string {
  if (typeof window === 'undefined') return data;
  
  try {
    const { key, iv, isProduction } = getEncryptionKeys();
    
    // En production, ne jamais retourner les données non cryptées
    if (!key && isProduction) {
      console.error('Clé de cryptage non définie dans l\'environnement de production');
      return '';
    }
    
    // Méthode basique de chiffrement avec les clés d'environnement
    const encodedData = encodeURIComponent(data);
    const encodedKey = btoa(key).substring(0, 32);
    const encodedIv = btoa(iv).substring(0, 16);
    
    const encrypted = Array.from(encodedData)
      .map((char, index) => {
        const keyChar = encodedKey.charCodeAt(index % encodedKey.length);
        const ivChar = encodedIv.charCodeAt(index % encodedIv.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar ^ ivChar);
      })
      .join('');
    
    return btoa(encrypted);
  } catch (error) {
    console.error('Erreur lors du cryptage des données:', error);
    // En cas d'erreur, ne retourner les données non cryptées qu'en dev
    return process.env.NODE_ENV === 'production' ? '' : data;
  }
}

/**
 * Fonction pour décrypter une chaîne cryptée
 * Utilise les mêmes clés d'environnement que pour le cryptage
 */
function simpleDecrypt(encryptedData: string): string {
  if (typeof window === 'undefined') return encryptedData;
  
  try {
    const { key, iv, isProduction } = getEncryptionKeys();
    
    // En production, ne jamais continuer sans clé de décryptage
    if (!key && isProduction) {
      console.error('Clé de décryptage non définie dans l\'environnement de production');
      return '';
    }
    
    const encodedKey = btoa(key).substring(0, 32);
    const encodedIv = btoa(iv).substring(0, 16);
    
    const decrypted = Array.from(atob(encryptedData))
      .map((char, index) => {
        const keyChar = encodedKey.charCodeAt(index % encodedKey.length);
        const ivChar = encodedIv.charCodeAt(index % encodedIv.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar ^ ivChar);
      })
      .join('');
    
    return decodeURIComponent(decrypted);
  } catch (error) {
    console.error('Erreur lors du décryptage des données:', error);
    // En cas d'erreur, retourner une chaîne vide ou les données cryptées
    return encryptedData;
  }
}

/**
 * Récupérer des données du cache local
 * @param key La clé du cache à récupérer
 * @returns Les données récupérées ou null si absentes/expirées
 */
export function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedItem = localStorage.getItem(key);
    if (!storedItem) return null;
    
    // Décrypter les données si nécessaire
    const decryptedItem = simpleDecrypt(storedItem);
    const item = JSON.parse(decryptedItem);
    
    // Vérifier l'expiration
    if (item.expiry < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data as T;
  } catch (error) {
    console.warn(`Erreur lors de la récupération du cache pour "${key}"`, error);
    return null;
  }
}

/**
 * Stocker des données dans le cache local
 * @param key La clé de cache
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
    
    // Liste des mots-clés sensibles qui devraient être évités dans les clés de cache
    const sensitiveKeys = [
      'token', 'password', 'credit', 'card', 'cvv', 'secret', 'api_key',
      'apikey', 'auth', 'credentials', 'session', 'private'
    ];
    
    // Vérifier si la clé contient des mots-clés sensibles
    const isSensitiveKey = sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
    
    if (isSensitiveKey) {
      console.warn(`Tentative de mise en cache d'une donnée potentiellement sensible avec la clé "${key}". Opération ignorée.`);
      return;
    }
    
    // Masquer les données sensibles avant stockage
    let safeData: any = data;
    
    // Si c'est un objet, vérifier les propriétés sensibles
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      safeData = JSON.parse(JSON.stringify(data));
      
      // Parcourir l'objet et masquer les propriétés sensibles
      const maskSensitiveFields = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(prop => {
          const propLower = prop.toLowerCase();
          
          // Vérifier si la propriété pourrait être sensible
          if (sensitiveKeys.some(key => propLower.includes(key))) {
            obj[prop] = typeof obj[prop] === 'string' ? '******' : null;
          } 
          // Récursion pour les objets imbriqués
          else if (obj[prop] && typeof obj[prop] === 'object') {
            maskSensitiveFields(obj[prop]);
          }
        });
      };
      
      maskSensitiveFields(safeData);
    }
    
    const item = {
      data: safeData,
      expiry: Date.now() + expiry,
      priority,
      timestamp: Date.now(),
    };
    
    // Crypter les données avant stockage
    const encryptedData = simpleEncrypt(JSON.stringify(item));
    localStorage.setItem(key, encryptedData);
  } catch (error) {
    console.warn(`Erreur lors du stockage en cache pour "${key}"`, error);
    
    // En cas d'erreur de stockage (par exemple, quota dépassé),
    // essayer de libérer de l'espace en supprimant les éléments de faible priorité
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearLowPriorityCache();
      
      // Réessayer après nettoyage avec les mêmes mécanismes de sécurité
      try {
        const { expiry = CACHE_EXPIRY.MEDIUM, priority = 'medium' } = options;
        
        // Vérifier à nouveau la clé sensible
        const sensitiveKeys = [
          'token', 'password', 'credit', 'card', 'cvv', 'secret', 'api_key',
          'apikey', 'auth', 'credentials', 'session', 'private'
        ];
        
        const isSensitiveKey = sensitiveKeys.some(sensitiveKey => 
          key.toLowerCase().includes(sensitiveKey)
        );
        
        if (isSensitiveKey) {
          return;
        }
        
        // Masquer les données sensibles avant stockage
        let safeData: any = data;
        
        // Si c'est un objet, vérifier les propriétés sensibles
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          safeData = JSON.parse(JSON.stringify(data));
          
          // Parcourir l'objet et masquer les propriétés sensibles
          const maskSensitiveFields = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            
            Object.keys(obj).forEach(prop => {
              const propLower = prop.toLowerCase();
              
              // Vérifier si la propriété pourrait être sensible
              if (sensitiveKeys.some(key => propLower.includes(key))) {
                obj[prop] = typeof obj[prop] === 'string' ? '******' : null;
              } 
              // Récursion pour les objets imbriqués
              else if (obj[prop] && typeof obj[prop] === 'object') {
                maskSensitiveFields(obj[prop]);
              }
            });
          };
          
          maskSensitiveFields(safeData);
        }
        
        const item = {
          data: safeData,
          expiry: Date.now() + (options.expiry || CACHE_EXPIRY.MEDIUM),
          priority: options.priority || 'medium',
          timestamp: Date.now(),
        };
        
        // Crypter les données avant stockage
        const encryptedData = simpleEncrypt(JSON.stringify(item));
        localStorage.setItem(key, encryptedData);
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