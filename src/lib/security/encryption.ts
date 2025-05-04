import crypto from 'crypto';

// Clé de chiffrement (à stocker dans les variables d'environnement)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'votre-cle-de-chiffrement-secrete';
const IV_LENGTH = 16; // Pour AES, c'est toujours 16 bytes

/**
 * Chiffre une donnée sensible
 * @param text Donnée à chiffrer
 * @returns Donnée chiffrée au format base64
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Déchiffre une donnée
 * @param text Donnée chiffrée au format base64
 * @returns Donnée déchiffrée
 */
export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Hache une donnée (pour les mots de passe, etc.)
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
 * Génère un token sécurisé
 * @param length Longueur du token
 * @returns Token aléatoire
 */
export function generateSecureToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('hex');
}

/**
 * Vérifie si un hash correspond à une donnée
 * @param text Donnée à vérifier
 * @param hash Hash à comparer
 * @returns true si le hash correspond
 */
export function verifyHash(text: string, hash: string): boolean {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex') === hash;
} 