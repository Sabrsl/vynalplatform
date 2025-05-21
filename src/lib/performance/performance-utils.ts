/**
 * Utilitaires de performance avec gestion sécurisée du cache
 * Compatible avec le code existant mais renforce la protection des données sensibles
 */

import { encrypt, decrypt } from '../security/encryption';
import { createServerCryptoService } from '../security/server-crypto-service';

// Types pour la gestion du cache
interface CachedItem<T> {
  value: T;
  expires: number;
  sensitive?: boolean;
}

/**
 * Détermine si le code s'exécute côté serveur
 * @returns true si côté serveur
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Détermine si le code s'exécute côté client
 * @returns true si côté client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Détermine si l'environnement est de production
 * @returns true si en production
 */
export function isProduction(): boolean {
  if (isClient()) {
    return window.location.hostname !== 'localhost' && 
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('dev') &&
           !window.location.hostname.includes('staging');
  } else {
    return process.env.NODE_ENV === 'production';
  }
}

/**
 * Fonction sécurisée pour vérifier les données potentiellement sensibles
 * @param data Données à analyser
 * @returns true si les données semblent sensibles
 */
function detectSensitiveData(data: any): boolean {
  if (!data) return false;
  
  // Convertir en chaîne pour l'analyse
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Patterns de détection pour les données sensibles
  const sensitivePatterns = [
    // Informations personnelles
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,  // Email
    /\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/, // Téléphone
    
    // Données financières
    /\b(?:\d{4}[- ]?){3}\d{4}\b/, // Carte de crédit
    /\b\d{3}\b/, // CVV
    
    // Tokens et clés
    /\b[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/, // JWT
    /\bsk_(?:live|test)_[0-9a-zA-Z]{24,34}\b/, // Clé Stripe
    
    // Identifiants
    /password|mot[- ]?de[- ]?passe|secret|token|apikey|api[- ]?key/i,
  ];
  
  // Vérifier chaque pattern
  return sensitivePatterns.some(pattern => pattern.test(str));
}

/**
 * Stocke des données en cache de manière sécurisée
 * @param key Clé de cache
 * @param data Données à mettre en cache
 * @param expiryInMinutes Durée de validité en minutes
 * @param options Options supplémentaires
 */
export function setCachedData<T>(
  key: string,
  data: T,
  expiryInMinutes: number = 60,
  options: { sensitive?: boolean } = {}
): void {
  // Vérification des paramètres pour éviter les injection de clés
  if (!key || typeof key !== 'string') {
    throw new Error('La clé de cache doit être une chaîne non vide');
  }
  
  // Ignorer undefined ou null
  if (data === undefined || data === null) {
    return;
  }
  
  // Déterminer si les données sont sensibles
  const isSensitive = options.sensitive || detectSensitiveData(data);
  
  try {
    // Préparer l'objet à mettre en cache
    const cachedItem: CachedItem<T> = {
      value: data,
      expires: Date.now() + expiryInMinutes * 60 * 1000,
      sensitive: isSensitive
    };
    
    // Sérialiser les données
    const serialized = JSON.stringify(cachedItem);
    
    if (isClient()) {
      // Côté client
      if (isSensitive) {
        // Si les données sont sensibles, utiliser l'encryption locale
        // Note: Les données vraiment sensibles ne devraient jamais être stockées côté client
        // mais nous chiffrons quand même pour plus de sécurité
        try {
          localStorage.setItem(`cache_${key}`, encrypt(serialized));
          console.warn(
            `[Performance] Données sensibles détectées dans la clé de cache "${key}". ` +
            `Envisagez d'utiliser une API route avec le stockage côté serveur.`
          );
        } catch (error) {
          // Si le chiffrement échoue, ne pas stocker les données sensibles
          console.error(`[Performance] Erreur lors du chiffrement des données pour "${key}". Données non mises en cache.`);
        }
      } else {
        // Données non sensibles
        localStorage.setItem(`cache_${key}`, serialized);
      }
    } else {
      // Côté serveur, nous avons un cache en mémoire plus sécurisé
      // Cette partie serait idéalement implémentée avec Redis ou un autre stockage persistant
      
      // Ici, nous simulons un stockage en mémoire
      // En production, ceci devrait être remplacé par Redis ou équivalent
      if (!global.__SERVER_CACHE__) {
        global.__SERVER_CACHE__ = new Map<string, string>();
      }
      
      if (isSensitive) {
        // Utiliser le service de crypto serveur pour les données sensibles
        try {
          const cryptoService = createServerCryptoService();
          global.__SERVER_CACHE__.set(`cache_${key}`, cryptoService.encrypt(serialized));
        } catch (error) {
          console.error(`[Performance] Erreur lors du chiffrement côté serveur pour "${key}".`, error);
        }
      } else {
        global.__SERVER_CACHE__.set(`cache_${key}`, serialized);
      }
    }
  } catch (error) {
    // Journalisation en cas d'erreur
    if (!isProduction()) {
      console.error(`[Performance] Erreur lors de la mise en cache pour "${key}":`, error);
    }
  }
}

/**
 * Récupère des données du cache
 * @param key Clé de cache
 * @returns Données en cache ou null si non trouvées/expirées
 */
export function getCachedData<T>(key: string): T | null {
  try {
    let serialized: string | null = null;
    let isSensitive = false;
    
    if (isClient()) {
      // Récupérer depuis le stockage local
      serialized = localStorage.getItem(`cache_${key}`);
      
      if (serialized) {
        // Vérifier si les données sont chiffrées
        // (Les données chiffrées commencent toujours par un IV en hexadécimal suivi de ":")
        const isEncrypted = /^[0-9a-f]{32}:/.test(serialized);
        
        if (isEncrypted) {
          try {
            serialized = decrypt(serialized);
            isSensitive = true;
          } catch (error) {
            console.error(`[Performance] Erreur lors du déchiffrement des données pour "${key}".`);
            return null;
          }
        }
      }
    } else {
      // Récupérer depuis le cache serveur
      if (!global.__SERVER_CACHE__) {
        global.__SERVER_CACHE__ = new Map<string, string>();
      }
      
      serialized = global.__SERVER_CACHE__.get(`cache_${key}`) || null;
      
      if (serialized) {
        // Vérifier si les données sont chiffrées
        const isEncrypted = /^[0-9a-f]{32}:/.test(serialized);
        
        if (isEncrypted) {
          try {
            const cryptoService = createServerCryptoService();
            serialized = cryptoService.decrypt(serialized);
            isSensitive = true;
          } catch (error) {
            console.error(`[Performance] Erreur lors du déchiffrement côté serveur pour "${key}".`, error);
            return null;
          }
        }
      }
    }
    
    if (!serialized) {
      return null;
    }
    
    // Désérialiser et vérifier l'expiration
    const cachedItem = JSON.parse(serialized) as CachedItem<T>;
    
    // Vérifier si le cache a expiré
    if (Date.now() > cachedItem.expires) {
      // Supprimer du cache si expiré
      if (isClient()) {
        localStorage.removeItem(`cache_${key}`);
      } else {
        global.__SERVER_CACHE__.delete(`cache_${key}`);
      }
      return null;
    }
    
    return cachedItem.value;
  } catch (error) {
    // Journalisation en cas d'erreur
    if (!isProduction()) {
      console.error(`[Performance] Erreur lors de la récupération du cache pour "${key}":`, error);
    }
    return null;
  }
}

/**
 * Supprime des données du cache
 * @param key Clé de cache
 */
export function removeCachedData(key: string): void {
  try {
    if (isClient()) {
      localStorage.removeItem(`cache_${key}`);
    } else {
      if (global.__SERVER_CACHE__) {
        global.__SERVER_CACHE__.delete(`cache_${key}`);
      }
    }
  } catch (error) {
    // Journalisation en cas d'erreur
    if (!isProduction()) {
      console.error(`[Performance] Erreur lors de la suppression du cache pour "${key}":`, error);
    }
  }
}

/**
 * Nettoie les données de cache expirées
 */
export function cleanupExpiredCache(): void {
  try {
    if (isClient()) {
      // Récupérer toutes les clés de cache
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith('cache_'));
      
      for (const cacheKey of cacheKeys) {
        const serialized = localStorage.getItem(cacheKey);
        if (!serialized) continue;
        
        // Vérifier si les données sont chiffrées
        const isEncrypted = /^[0-9a-f]{32}:/.test(serialized);
        let deserialized: string;
        
        try {
          deserialized = isEncrypted ? decrypt(serialized) : serialized;
          const cachedItem = JSON.parse(deserialized) as CachedItem<any>;
          
          // Supprimer si expiré
          if (Date.now() > cachedItem.expires) {
            localStorage.removeItem(cacheKey);
          }
        } catch (error) {
          // Supprimer les entrées invalides
          localStorage.removeItem(cacheKey);
        }
      }
    } else {
      // Nettoyage côté serveur
      if (global.__SERVER_CACHE__) {
        const cryptoService = createServerCryptoService();
        
        for (const [cacheKey, serialized] of global.__SERVER_CACHE__.entries()) {
          if (!serialized) continue;
          
          // Vérifier si les données sont chiffrées
          const isEncrypted = /^[0-9a-f]{32}:/.test(serialized);
          let deserialized: string;
          
          try {
            deserialized = isEncrypted 
              ? cryptoService.decrypt(serialized) 
              : serialized;
            
            const cachedItem = JSON.parse(deserialized) as CachedItem<any>;
            
            // Supprimer si expiré
            if (Date.now() > cachedItem.expires) {
              global.__SERVER_CACHE__.delete(cacheKey);
            }
          } catch (error) {
            // Supprimer les entrées invalides
            global.__SERVER_CACHE__.delete(cacheKey);
          }
        }
      }
    }
  } catch (error) {
    // Journalisation en cas d'erreur
    if (!isProduction()) {
      console.error('[Performance] Erreur lors du nettoyage du cache:', error);
    }
  }
}

// Mettre en place le nettoyage périodique du cache
if (isClient()) {
  // Nettoyer le cache toutes les 30 minutes
  setInterval(cleanupExpiredCache, 30 * 60 * 1000);
}

// Ajouter une déclaration de type pour le cache global côté serveur
declare global {
  var __SERVER_CACHE__: Map<string, string>;
} 