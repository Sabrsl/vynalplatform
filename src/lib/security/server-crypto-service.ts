/**
 * Service de chiffrement côté serveur uniquement
 * Ce module ne doit jamais être importé côté client
 */

import crypto from 'crypto';

// Variables de configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; // Pour AES, c'est toujours 16 bytes

// Type pour le service de cryptographie
export interface ServerCryptoService {
  encrypt: (text: string) => string;
  decrypt: (encryptedText: string) => string;
}

/**
 * Vérifie que le code s'exécute côté serveur uniquement
 * @throws Error si utilisé côté client
 */
function ensureServerSideExecution() {
  if (typeof window !== 'undefined') {
    throw new Error('Ce service ne doit être utilisé que côté serveur');
  }
}

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
 * Crée un service de cryptographie pour le serveur uniquement
 * @returns Service avec méthodes encrypt et decrypt
 */
export function createServerCryptoService(): ServerCryptoService {
  // Vérifier que nous sommes côté serveur
  ensureServerSideExecution();
  
  // Vérifier les clés
  checkEncryptionKeys();
  
  return {
    /**
     * Chiffre une donnée sensible
     * @param text Donnée à chiffrer
     * @returns Donnée chiffrée au format hex
     */
    encrypt(text: string): string {
      try {
        // Générer un IV aléatoire pour chaque opération
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = Buffer.from(ENCRYPTION_KEY as string, 'base64');
        
        // Créer le cipher avec AES-256-CBC
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        // Chiffrer les données
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Concaténer IV et données chiffrées pour stockage
        return iv.toString('hex') + ':' + encrypted;
      } catch (error) {
        // Journalisation minimaliste en production
        if (process.env.NODE_ENV !== 'production') {
          console.error('Erreur lors du chiffrement côté serveur:', error);
        }
        throw new Error('Erreur lors du chiffrement des données côté serveur');
      }
    },

    /**
     * Déchiffre une donnée
     * @param encryptedText Donnée chiffrée au format hex
     * @returns Donnée déchiffrée
     */
    decrypt(encryptedText: string): string {
      try {
        // Séparer IV et données chiffrées
        const textParts = encryptedText.split(':');
        
        // Vérifier le format des données
        if (textParts.length !== 2) {
          throw new Error('Format de données chiffrées invalide');
        }
        
        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedData = Buffer.from(textParts[1], 'hex');
        const key = Buffer.from(ENCRYPTION_KEY as string, 'base64');
        
        // Créer le decipher
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        // Déchiffrer les données
        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString('utf8');
      } catch (error) {
        // Journalisation minimaliste en production
        if (process.env.NODE_ENV !== 'production') {
          console.error('Erreur lors du déchiffrement côté serveur:', error);
        }
        throw new Error('Erreur lors du déchiffrement des données côté serveur');
      }
    }
  };
}

/**
 * Exemple d'utilisation dans une API route
 * 
 * import { createServerCryptoService } from '../lib/security/server-crypto-service';
 * 
 * export default async function handler(req, res) {
 *   try {
 *     const cryptoService = createServerCryptoService();
 *     
 *     // Chiffrer des données sensibles
 *     const encryptedData = cryptoService.encrypt(JSON.stringify(req.body.sensitiveData));
 *     
 *     // Stocker encryptedData dans la base de données
 *     // ...
 *     
 *     // Pour déchiffrer
 *     const decryptedData = JSON.parse(cryptoService.decrypt(encryptedData));
 *     
 *     res.status(200).json({ success: true });
 *   } catch (error) {
 *     res.status(500).json({ error: 'Une erreur est survenue' });
 *   }
 * }
 */ 