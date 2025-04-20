import CryptoJS from 'crypto-js';

// Clé secrète pour la signature HMAC - en production, stockez cette clé dans les variables d'environnement
const SECRET_KEY = process.env.NEXT_PUBLIC_HMAC_SECRET_KEY || 'vynal-platform-document-verification-key';

/**
 * Génère une signature HMAC-SHA256 pour un document
 * @param payload Les données à signer
 * @returns La signature HMAC-SHA256 encodée en Base64
 */
export const signDocument = (payload: any): string => {
  // Conversion du payload en chaîne JSON triée par clés pour assurer la cohérence
  const sortedPayload = typeof payload === 'string' 
    ? payload 
    : JSON.stringify(payload, Object.keys(payload).sort());
    
  // Génération de la signature HMAC avec la clé secrète
  const hmac = CryptoJS.HmacSHA256(sortedPayload, SECRET_KEY);
  
  // Conversion en Base64 pour une représentation plus courte
  return hmac.toString(CryptoJS.enc.Base64);
};

/**
 * Vérifie une signature HMAC-SHA256 d'un document
 * @param payload Les données originales
 * @param signature La signature à vérifier
 * @returns true si la signature est valide, false sinon
 */
export const verifyDocumentSignature = (payload: any, signature: string): boolean => {
  // Recalcul de la signature à partir du payload
  const calculatedSignature = signDocument(payload);
  
  // Vérification par comparaison des signatures
  return calculatedSignature === signature;
};

/**
 * Génère un objet document signé avec les métadonnées nécessaires
 * @param data Les données du document
 * @param userId ID de l'utilisateur qui crée le document
 * @returns Un objet contenant les données, métadonnées et signature
 */
export const createSignedDocument = (data: any, userId: string) => {
  // Horodatage de création
  const timestamp = new Date().toISOString();
  
  // Construction de l'objet document avec métadonnées
  const document = {
    data,
    metadata: {
      createdAt: timestamp,
      createdBy: userId,
      version: '1.0',
      type: 'pdf-export'
    }
  };
  
  // Calcul de la signature
  const signature = signDocument(document);
  
  // Ajout de la signature au document
  return {
    ...document,
    signature
  };
};

/**
 * Extrait la signature et les données d'un document signé pour vérification
 * @param signedDocument Le document signé complet
 * @returns Un objet contenant la signature et le document sans la signature
 */
export const extractDocumentForVerification = (signedDocument: any) => {
  if (!signedDocument || typeof signedDocument !== 'object') {
    throw new Error('Document invalide');
  }
  
  const { signature, ...documentWithoutSignature } = signedDocument;
  
  if (!signature) {
    throw new Error('Signature manquante');
  }
  
  return {
    signature,
    document: documentWithoutSignature
  };
}; 