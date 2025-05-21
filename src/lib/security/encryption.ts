/**
 * Module de cryptographie sécurisé
 * Compatible avec l'ancien code tout en renforçant la sécurité
 */

import crypto from 'crypto';

// Variables de configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; // Pour AES, c'est toujours 16 bytes
const HASH_ITERATIONS = parseInt(process.env.PASSWORD_HASH_ITERATIONS || '100000');
const HASH_KEYLEN = parseInt(process.env.PASSWORD_HASH_KEYLEN || '64');
const HASH_DIGEST = process.env.PASSWORD_HASH_DIGEST || 'sha512';

/**
 * Vérifie la disponibilité des clés de cryptage
 * @throws Error si les clés ne sont pas configurées
 */
function checkEncryptionKeys(): void {
  if (!ENCRYPTION_KEY) {
    throw new Error('La clé de chiffrement n\'est pas définie dans les variables d\'environnement');
  }
}

/**
 * Chiffre une donnée sensible
 * @param text Donnée à chiffrer
 * @returns Donnée chiffrée au format hex
 */
export function encrypt(text: string): string {
  checkEncryptionKeys();
  
  try {
    // Générer un IV aléatoire
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY as string, 'base64');
    
    // Créer le cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Chiffrer les données
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Concaténer IV et données chiffrées
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    // Journalisation minimaliste en production
    if (process.env.NODE_ENV !== 'production') {
      console.error('Erreur lors du chiffrement:', error);
    }
    throw new Error('Erreur lors du chiffrement des données');
  }
}

/**
 * Déchiffre une donnée
 * @param text Donnée chiffrée au format hex
 * @returns Donnée déchiffrée
 */
export function decrypt(text: string): string {
  checkEncryptionKeys();
  
  try {
    // Séparer IV et données chiffrées
    const textParts = text.split(':');
    
    // Vérifier le format des données
    if (textParts.length !== 2) {
      throw new Error('Format de données chiffrées invalide');
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const key = Buffer.from(ENCRYPTION_KEY as string, 'base64');
    
    // Créer le decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Déchiffrer les données
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    // Journalisation minimaliste en production
    if (process.env.NODE_ENV !== 'production') {
      console.error('Erreur lors du déchiffrement:', error);
    }
    throw new Error('Erreur lors du déchiffrement des données');
  }
}

/**
 * Génère un salt aléatoire pour le hachage
 * @returns Salt au format hex
 */
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hache un mot de passe de manière sécurisée avec un salt
 * @param password Mot de passe à hacher
 * @returns Objet contenant le hash et le salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  // Générer un salt aléatoire
  const salt = generateSalt();
  
  // Hacher le mot de passe avec PBKDF2
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    HASH_KEYLEN,
    HASH_DIGEST
  ).toString('hex');
  
  return { hash, salt };
}

/**
 * Vérifie si un mot de passe correspond à un hash
 * @param password Mot de passe à vérifier
 * @param hashedPassword Hash du mot de passe
 * @param salt Salt utilisé pour le hash
 * @returns true si le mot de passe correspond
 */
export function verifyPassword(
  password: string,
  hashedPassword: string,
  salt: string
): boolean {
  // Hacher le mot de passe avec le même salt
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    HASH_KEYLEN,
    HASH_DIGEST
  ).toString('hex');
  
  // Comparaison à temps constant pour éviter les timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(hashedPassword, 'hex')
  );
}

/**
 * Hache une donnée (fonction de compatibilité avec l'ancien code)
 * @param text Donnée à hacher
 * @returns Hash de la donnée
 */
export function hash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}

/**
 * Vérifie si un hash correspond à une donnée (fonction de compatibilité)
 * @param text Donnée à vérifier
 * @param hash Hash à comparer
 * @returns true si le hash correspond
 */
export function verifyHash(text: string, hash: string): boolean {
  const calculatedHash = crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
  
  // Comparaison à temps constant
  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch (error) {
    // En cas d'erreur (par exemple, longueurs différentes)
    return false;
  }
}

/**
 * Génère un token sécurisé
 * @param length Longueur du token
 * @returns Token aléatoire au format hex
 */
export function generateSecureToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('hex');
}

/**
 * Génère un UUID v4
 * @returns UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Crée un HMAC pour vérifier l'intégrité des données
 * @param data Données à signer
 * @param secret Clé secrète (utilise HMAC_SECRET_KEY par défaut)
 * @returns Signature HMAC
 */
export function createHMAC(data: string, secret?: string): string {
  const hmacKey = secret || process.env.HMAC_SECRET_KEY;
  
  if (!hmacKey) {
    throw new Error('Clé HMAC non définie');
  }
  
  return crypto
    .createHmac('sha256', hmacKey)
    .update(data)
    .digest('hex');
}

/**
 * Vérifie un HMAC
 * @param data Données à vérifier
 * @param signature Signature HMAC à comparer
 * @param secret Clé secrète (utilise HMAC_SECRET_KEY par défaut)
 * @returns true si la signature est valide
 */
export function verifyHMAC(data: string, signature: string, secret?: string): boolean {
  const calculatedHmac = createHMAC(data, secret);
  
  // Comparaison à temps constant
  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    // En cas d'erreur (par exemple, longueurs différentes)
    return false;
  }
}