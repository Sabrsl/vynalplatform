/**
 * Module de protection CSRF sécurisé
 * Compatible avec l'existant et avec des améliorations de sécurité
 */

import crypto from 'crypto';
import { generateSecureToken } from './encryption';

// Durée de validité du token en millisecondes (1 heure par défaut)
const TOKEN_EXPIRY = parseInt(process.env.CSRF_TOKEN_EXPIRY || '3600000');

// Clé secrète pour signer les tokens
const TOKEN_SECRET = process.env.CSRF_TOKEN_SECRET;

interface CSRFToken {
  token: string;
  expiresAt: number;
}

// Stockage en mémoire des tokens (à remplacer par Redis en production)
// Note: cette Map sera réinitialisée à chaque redémarrage du serveur
const tokenStore = new Map<string, CSRFToken>();

/**
 * Signe un token CSRF
 * @param userId ID de l'utilisateur
 * @param token Token à signer
 * @returns Token signé
 */
function signToken(userId: string, token: string): string {
  if (!TOKEN_SECRET) {
    throw new Error('La clé secrète CSRF n\'est pas définie');
  }
  
  // Créer une signature avec HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${userId}:${token}`)
    .digest('hex');
  
  return `${token}.${signature}`;
}

/**
 * Vérifie la signature d'un token CSRF
 * @param userId ID de l'utilisateur
 * @param signedToken Token signé
 * @returns Token d'origine si valide, null sinon
 */
function verifyTokenSignature(userId: string, signedToken: string): string | null {
  // Vérifier le format
  const parts = signedToken.split('.');
  if (parts.length !== 2) {
    return null;
  }
  
  const [token, signature] = parts;
  
  // Recalculer la signature
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET || '')
    .update(`${userId}:${token}`)
    .digest('hex');
  
  // Comparaison à temps constant
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    return isValid ? token : null;
  } catch (error) {
    return null;
  }
}

/**
 * Génère un nouveau token CSRF
 * @param userId ID de l'utilisateur
 * @returns Token CSRF signé
 */
export function generateCSRFToken(userId: string): string {
  // Générer un token aléatoire
  const token = generateSecureToken();
  const expiresAt = Date.now() + TOKEN_EXPIRY;
  
  // Stocker le token
  tokenStore.set(userId, { token, expiresAt });
  
  // Retourner le token signé
  return signToken(userId, token);
}

/**
 * Valide un token CSRF
 * @param userId ID de l'utilisateur
 * @param signedToken Token à valider
 * @returns true si le token est valide
 */
export function validateCSRFToken(userId: string, signedToken: string): boolean {
  // Vérifier la signature
  const token = verifyTokenSignature(userId, signedToken);
  if (!token) {
    return false;
  }
  
  // Récupérer le token stocké
  const storedToken = tokenStore.get(userId);
  if (!storedToken) {
    return false;
  }
  
  // Vérifier l'expiration
  if (Date.now() > storedToken.expiresAt) {
    tokenStore.delete(userId);
    return false;
  }
  
  // Vérifier le token en utilisant une comparaison à temps constant
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(storedToken.token),
      Buffer.from(token)
    );
    
    if (isValid) {
      // Renouveler le token après validation réussie
      // (générer un nouveau token)
      generateCSRFToken(userId);
    }
    
    return isValid;
  } catch (error) {
    return false;
  }
}

/**
 * Supprime un token CSRF
 * @param userId ID de l'utilisateur
 */
export function deleteCSRFToken(userId: string): void {
  tokenStore.delete(userId);
}

/**
 * Nettoie les tokens expirés
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  
  for (const [userId, token] of tokenStore.entries()) {
    if (now > token.expiresAt) {
      tokenStore.delete(userId);
    }
  }
}

// Mise en place du nettoyage périodique des tokens expirés
// Note: en production, considérer une solution plus robuste (Redis + tâche Cron)
let cleanupInterval: NodeJS.Timeout;

// Fonction pour démarrer le nettoyage périodique
export function startTokenCleanup(): void {
  // Éviter les doublons d'intervalles
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  // Nettoyer les tokens expirés toutes les heures
  cleanupInterval = setInterval(cleanupExpiredTokens, TOKEN_EXPIRY);
}

// Fonction pour arrêter le nettoyage périodique
export function stopTokenCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
}

// Démarrer le nettoyage automatiquement
// (uniquement côté serveur)
if (typeof window === 'undefined') {
  startTokenCleanup();
}