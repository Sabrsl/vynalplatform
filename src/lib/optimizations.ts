/**
 * Utilitaires d'optimisation des performances pour l'application
 * Ces fonctions permettent d'améliorer les performances, notamment via le cache
 * Version sécurisée - Compatible avec la production
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
  sensitive?: boolean; // Nouveau paramètre pour indiquer des données sensibles
}

// Liste des mots-clés sensibles qui devraient être évités dans les clés de cache
const SENSITIVE_KEYWORDS = [
  'token', 'password', 'credit', 'card', 'cvv', 'secret', 'api_key',
  'apikey', 'auth', 'credentials', 'session', 'private', 'key',
  'access', 'jwt', 'oauth', 'login', 'pass', 'pwd', 'ssn', 'fiscal'
];

/**
 * Version sécurisée de la récupération des clés de cryptage
 * Compatibilité maintenue avec l'ancien code
 */
const getEncryptionKeys = () => {
  const key = process.env.ENCRYPTION_KEY;
  const iv = process.env.ENCRYPTION_IV;
  
  // Utiliser ces clés seulement côté serveur
  if (typeof window !== 'undefined') {
    // En environnement client, retourner un objet compatible
    // mais ne contenant pas de vraies clés
    return {
      key: 'secure-placeholder-key',
      iv: 'secure-placeholder-iv', 
      isProduction: process.env.NODE_ENV === 'production'
    };
  }
  
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
 * Vérifie si une chaîne contient des mots-clés sensibles
 * @param input Chaîne à vérifier
 * @returns true si la chaîne contient des mots sensibles
 */
function containsSensitiveInfo(input: string): boolean {
  const inputLower = input.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => inputLower.includes(keyword));
}

/**
 * Masque les données sensibles dans un objet
 * @param data Les données à analyser
 * @returns Les données avec champs sensibles masqués
 */
function maskSensitiveData(data: any): any {
  // Si ce n'est pas un objet, retourner tel quel
  if (!data || typeof data !== 'object') return data;
  
  // Créer une copie pour ne pas modifier l'original
  const safeData = Array.isArray(data) 
    ? [...data] 
    : { ...data };
  
  // Parcourir l'objet et masquer les données sensibles
  const processObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(prop => {
      const propLower = prop.toLowerCase();
      
      // Vérifier si la propriété semble sensible
      if (SENSITIVE_KEYWORDS.some(key => propLower.includes(key))) {
        obj[prop] = typeof obj[prop] === 'string' ? '[MASQUÉ]' : null;
      }
      // Vérifier si la valeur ressemble à un JWT (format eyJ...)
      else if (
        typeof obj[prop] === 'string' && 
        obj[prop].match(/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\./)
      ) {
        obj[prop] = '[TOKEN MASQUÉ]';
      }
      // Récursion pour les objets imbriqués
      else if (obj[prop] && typeof obj[prop] === 'object') {
        processObject(obj[prop]);
      }
    });
  };
  
  processObject(safeData);
  return safeData;
}

/**
 * Version sécurisée de simpleEncrypt maintenant la compatibilité
 * Cette fonction ne fait plus de vrai chiffrement côté client
 */
function simpleEncrypt(data: string): string {
  if (typeof window === 'undefined') return data;
  
  try {
    // Vérifier si les données contiennent des informations sensibles
    if (containsSensitiveInfo(data)) {
      // Ne pas stocker les données sensibles côté client
      if (process.env.NODE_ENV === 'development') {
        console.warn('Tentative de stockage de données sensibles évitée');
      }
      return btoa(JSON.stringify({ data: {}, sensitive: true }));
    }
    
    // Limiter la taille des données pour éviter les problèmes de performance
    if (data.length > 1000000) { // Limite de 1MB
      if (process.env.NODE_ENV === 'development') {
        console.warn('Données trop volumineuses pour le cache, troncation');
      }
      // Stocker un résultat vide mais valide
      return btoa(JSON.stringify({ data: { truncated: true }, sensitive: false }));
    }
    
    // Utiliser btoa de manière sécurisée
    try {
      return btoa(data);
    } catch (encodingError) {
      // En cas d'erreur d'encodage (caractères non-ASCII), utiliser une méthode plus robuste
      return btoa(unescape(encodeURIComponent(data)));
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Erreur lors du formatage des données pour le cache', error);
    }
    // En cas d'erreur, retourner une chaîne encodée vide mais valide
    return btoa(JSON.stringify({ data: {}, error: true }));
  }
}

/**
 * Version sécurisée de simpleDecrypt maintenant la compatibilité
 */
function simpleDecrypt(encryptedData: string): string {
  if (typeof window === 'undefined') return encryptedData;
  
  try {
    // Tenter de décoder les données
    let decoded;
    try {
      decoded = atob(encryptedData);
    } catch (decodingError) {
      // Si l'atob échoue, retourner un JSON valide vide
      return JSON.stringify({ data: {}, expiry: 0 });
    }
    
    // Vérifier si c'est un marqueur de données sensibles ou tronquées
    if (decoded.includes('"sensitive":true') || decoded.includes('"truncated":true') || decoded.includes('"error":true')) {
      return JSON.stringify({ data: {}, expiry: 0 });
    }
    
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Erreur lors du décodage des données du cache', error);
    }
    // En cas d'erreur, retourner un JSON valide
    return JSON.stringify({ data: {}, expiry: 0 });
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
    // Vérifier si la clé contient des mots-clés sensibles
    if (containsSensitiveInfo(key)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Tentative de récupération d'une clé sensible "${key}". Cette opération est ignorée.`);
      }
      return null;
    }
    
    const storedItem = localStorage.getItem(key);
    if (!storedItem) return null;
    
    // Décoder les données
    const decryptedItem = simpleDecrypt(storedItem);
    const item = JSON.parse(decryptedItem);
    
    // Vérifier l'expiration
    if (item.expiry < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data as T;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Erreur lors de la récupération du cache pour "${key}"`);
    }
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
    const { expiry = CACHE_EXPIRY.MEDIUM, priority = 'medium', sensitive = false } = options;
    
    // Si data est null, supprimer la clé de cache
    if (data === null) {
      localStorage.removeItem(key);
      return;
    }
    
    // Vérifier si la clé contient des mots-clés sensibles
    if (containsSensitiveInfo(key) || sensitive) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Tentative de mise en cache d'une donnée potentiellement sensible avec la clé "${key}". Opération ignorée.`);
      }
      return;
    }
    
    // Masquer les données sensibles avant stockage
    const safeData = maskSensitiveData(data);
    
    const item = {
      data: safeData,
      expiry: Date.now() + expiry,
      priority,
      timestamp: Date.now(),
    };
    
    // Formater les données pour le stockage avec une gestion d'erreurs améliorée
    try {
      const jsonString = JSON.stringify(item);
      
      // Vérifier la taille des données avant tentative de stockage (limite de localStorage ~5MB)
      if (jsonString.length > 4000000) { // Limite prudente à 4MB
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Données trop volumineuses pour le cache (${Math.round(jsonString.length/1024)}KB) pour "${key}". Opération ignorée.`);
        }
        return;
      }
      
      const encodedData = simpleEncrypt(jsonString);
      localStorage.setItem(key, encodedData);
    } catch (stringifyError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Erreur lors de la sérialisation des données pour "${key}"`, stringifyError);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Erreur lors du stockage en cache pour "${key}"`, error);
    }
    
    // En cas d'erreur de stockage (quota dépassé),
    // essayer de libérer de l'espace
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearLowPriorityCache();
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
        
        // Tenter de décoder et parser l'élément
        const decryptedItem = simpleDecrypt(item);
        const parsedItem = JSON.parse(decryptedItem);
        
        const priority = parsedItem.priority || 'low';
        const timestamp = parsedItem.timestamp || 0;
        
        cacheItems.push({ key, priority, timestamp });
      } catch {
        // Ignorer les éléments qui ne sont pas au format attendu
      }
    }
    
    // Trier les éléments par priorité et horodatage
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur lors du nettoyage du cache');
    }
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

// ====== API sécurisée côté serveur ======

/**
 * Interface pour le service de cryptographie côté serveur
 * À utiliser uniquement dans les API routes et composants serveur
 * @deprecated Utilisez l'implémentation de src/lib/security/server-crypto-service.ts à la place
 */
export interface ServerCryptoService {
  encrypt: (data: string) => Promise<string>;
  decrypt: (encryptedData: string) => Promise<string>;
}

/**
 * Crée une instance du service de cryptographie serveur
 * @deprecated Utilisez createServerCryptoService depuis '@/lib/security/server-crypto-service' à la place
 * @returns Service de cryptographie
 */
export async function createServerCryptoService(): Promise<ServerCryptoService | null> {
  // Cette fonction est maintenant dépréciée
  console.warn('Cette fonction est dépréciée. Utilisez createServerCryptoService depuis @/lib/security/server-crypto-service');
  
  // Cette fonction ne doit être appelée que côté serveur
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Le service de cryptographie serveur ne peut pas être créé côté client');
    }
    return null;
  }
  
  try {
    // Utiliser l'implémentation officielle de manière asynchrone
    const { createServerCryptoService: officialCreateService } = await import('./security/server-crypto-service');
    const officialService = officialCreateService();
    
    // Wrapper pour adapter l'interface synchrone à une interface asynchrone
    return {
      encrypt: async (data: string): Promise<string> => {
        return officialService.encrypt(data);
      },
      decrypt: async (encryptedData: string): Promise<string> => {
        return officialService.decrypt(encryptedData);
      }
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur lors de la création du service de cryptographie:', error);
    }
    throw new Error('Impossible de créer le service de cryptographie');
  }
}