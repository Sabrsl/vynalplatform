import { generateSecureToken } from './encryption';

// Durée de validité du token en millisecondes (1 heure)
const TOKEN_EXPIRY = 60 * 60 * 1000;

interface CSRFToken {
  token: string;
  expiresAt: number;
}

// Stockage en mémoire des tokens (à remplacer par Redis en production)
const tokenStore = new Map<string, CSRFToken>();

/**
 * Génère un nouveau token CSRF
 * @param userId ID de l'utilisateur
 * @returns Token CSRF
 */
export function generateCSRFToken(userId: string): string {
  const token = generateSecureToken();
  const expiresAt = Date.now() + TOKEN_EXPIRY;
  
  tokenStore.set(userId, { token, expiresAt });
  
  return token;
}

/**
 * Valide un token CSRF
 * @param userId ID de l'utilisateur
 * @param token Token à valider
 * @returns true si le token est valide
 */
export function validateCSRFToken(userId: string, token: string): boolean {
  const storedToken = tokenStore.get(userId);
  
  if (!storedToken) {
    return false;
  }
  
  // Vérifier l'expiration
  if (Date.now() > storedToken.expiresAt) {
    tokenStore.delete(userId);
    return false;
  }
  
  // Vérifier le token
  const isValid = storedToken.token === token;
  
  if (isValid) {
    // Renouveler le token
    generateCSRFToken(userId);
  }
  
  return isValid;
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

// Nettoyer les tokens expirés toutes les heures
setInterval(cleanupExpiredTokens, TOKEN_EXPIRY); 