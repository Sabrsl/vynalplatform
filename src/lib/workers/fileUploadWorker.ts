/**
 * Worker de téléversement de fichiers
 * 
 * Ce module est conçu pour optimiser le téléversement de fichiers hors du thread principal.
 * Il utilise les techniques de parallélisation et de mise en cache pour améliorer les performances.
 */

// Types pour les entrées/sorties du worker
export interface FileUploadPayload {
  file: File;
  path: string;
  bucketName: string;
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
  maxRetries?: number;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  name?: string;
  size?: number;
  type?: string;
  error?: string;
}

/**
 * Fonction principale de prétraitement des fichiers
 * Optimise les fichiers avant leur téléversement
 */
export async function preprocessFile(file: File): Promise<File> {
  // Pour les images, on pourrait implémenter une compression
  if (file.type.startsWith('image/')) {
    return file; // TODO: Implémenter la compression d'image si nécessaire
  }
  
  // Pour d'autres types de fichiers, retourner tel quel
  return file;
}

/**
 * Fonction pour générer un chemin de fichier optimisé
 * Utilise UUID v4 pour garantir l'unicité
 */
export function generateOptimizedFilePath(baseDir: string, fileName: string): string {
  const fileExt = fileName.split('.').pop();
  // Utiliser crypto.randomUUID() est plus rapide et plus sûr que Math.random()
  const uniqueId = crypto.randomUUID(); 
  const timestamp = Date.now();
  return `${baseDir}/${timestamp}-${uniqueId}.${fileExt}`;
}

/**
 * Fonction de découpage de fichiers volumineux en chunks
 * Permet de paralléliser les téléversements de grands fichiers
 */
export function splitFileIntoChunks(file: File, chunkSize: number = 1024 * 1024): Blob[] {
  const chunks = [];
  let start = 0;
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }
  
  return chunks;
}

/**
 * Fonction utilitaire pour la mise en cache des URLs de fichiers
 * Permet d'éviter des requêtes redondantes pour les mêmes URLs
 */
const fileUrlCache = new Map<string, string>();

export function cacheFileUrl(path: string, url: string): void {
  fileUrlCache.set(path, url);
}

export function getCachedFileUrl(path: string): string | undefined {
  return fileUrlCache.get(path);
}

export function clearFileUrlCache(): void {
  fileUrlCache.clear();
}

/**
 * Fonction utilitaire pour gérer les erreurs de téléversement avec retries
 */
export async function handleUploadWithRetries(
  uploadFn: () => Promise<any>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<any> {
  let currentTry = 0;
  let delay = initialDelay;
  
  while (currentTry < maxRetries) {
    try {
      return await uploadFn();
    } catch (error) {
      currentTry++;
      
      if (currentTry >= maxRetries) {
        throw error;
      }
      
      // Attente exponentielle pour éviter de saturer les serveurs
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
} 