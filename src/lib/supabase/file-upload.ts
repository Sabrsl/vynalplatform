import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

/**
 * Options pour l'upload de fichiers
 */
interface FileUploadOptions {
  cacheControl?: string;
  upsert?: boolean;
  contentType?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Résultat de l'upload de fichier
 */
interface FileUploadResult {
  url: string;
  name: string;
  type: string;
  path: string;
  success: boolean;
  error?: any;
}

/**
 * Upload un fichier vers un bucket Supabase avec des mécanismes de retry
 */
export async function uploadFile(
  file: File,
  path: string,
  bucketName: string = 'attachments',
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  const supabase = createClientComponentClient<Database>();
  
  const {
    cacheControl = '3600',
    upsert = true,
    contentType,
    maxRetries = 3,
    retryDelay = 800
  } = options;
  
  console.log(`[DEBUG-UPLOAD] Début upload dans ${bucketName}, chemin: ${path}`);
  
  // Paramètres pour l'upload
  const uploadOptions: any = { 
    cacheControl,
    upsert
  };
  
  // Ajouter le type de contenu si spécifié
  if (contentType) {
    uploadOptions.contentType = contentType;
  }
  
  let lastError: any = null;
  
  // Tentatives avec backoff exponentiel
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[DEBUG-UPLOAD] Tentative d'upload dans ${bucketName}, essai ${attempt + 1}/${maxRetries}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, uploadOptions);
      
      if (error) {
        console.error(`[DEBUG-UPLOAD] Erreur lors de l'upload (tentative ${attempt + 1}):`, error);
        console.error(`[DEBUG-UPLOAD] Message d'erreur:`, error.message || 'non disponible');
        // Utiliser any pour accéder aux propriétés qui peuvent ne pas être dans le type StorageError
        const errorAny = error as any;
        console.error(`[DEBUG-UPLOAD] Code d'erreur:`, errorAny.code || 'non disponible');
        console.error(`[DEBUG-UPLOAD] Détails:`, errorAny.details || 'non disponibles');
        lastError = error;
        
        // Attendre avant de réessayer (backoff exponentiel)
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`[DEBUG-UPLOAD] Attente de ${delay}ms avant la prochaine tentative`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.log(`[DEBUG-UPLOAD] Upload réussi dans ${bucketName}, path: ${path}`);
      
      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);
      
      if (!urlData || !urlData.publicUrl) {
        const err = new Error("Impossible d'obtenir l'URL publique du fichier");
        console.error(`[DEBUG-UPLOAD] ${err.message}`);
        throw err;
      }
      
      console.log(`[DEBUG-UPLOAD] URL publique obtenue: ${urlData.publicUrl}`);
      
      return {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        path,
        success: true
      };
    } catch (err) {
      console.error(`[DEBUG-UPLOAD] Exception lors de l'upload (tentative ${attempt + 1}):`, err);
      lastError = err;
      
      // Attendre avant de réessayer (backoff exponentiel)
      const delay = retryDelay * Math.pow(2, attempt);
      console.log(`[DEBUG-UPLOAD] Attente de ${delay}ms avant la prochaine tentative d'exception`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Si on arrive ici, toutes les tentatives ont échoué
  console.error(`[DEBUG-UPLOAD] Échec de l'upload après ${maxRetries} tentatives`);
  
  return {
    url: '',
    name: file.name,
    type: file.type,
    path,
    success: false,
    error: lastError
  };
}

/**
 * Upload un fichier avec fallback sur différents buckets
 * Essaie plusieurs buckets dans l'ordre spécifié
 */
export async function uploadFileWithFallback(
  file: File,
  path: string,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  // Liste des buckets à essayer dans l'ordre - attachments est maintenant en premier car il fonctionne correctement
  const buckets = ['attachments', 'tchatfiles', 'order-files'];
  let lastError: any = null;
  
  console.log(`[DEBUG-FALLBACK] Tentative d'upload de ${file.name} (${file.size} bytes) au chemin ${path}`);
  console.log(`[DEBUG-FALLBACK] Buckets disponibles: ${buckets.join(', ')}`);
  
  for (const bucket of buckets) {
    try {
      console.log(`[DEBUG-FALLBACK] Essai d'upload dans le bucket: ${bucket}`);
      const result = await uploadFile(file, path, bucket, options);
      
      if (result.success) {
        console.log(`[DEBUG-FALLBACK] Upload réussi dans le bucket: ${bucket}, URL: ${result.url}`);
        return result;
      }
      
      console.log(`[DEBUG-FALLBACK] Échec avec le bucket ${bucket}, erreur:`, result.error);
      lastError = result.error;
    } catch (err) {
      console.error(`[DEBUG-FALLBACK] Exception lors de l'upload dans ${bucket}:`, err);
      lastError = err;
    }
  }
  
  // Si on arrive ici, tous les buckets ont échoué
  console.error("[DEBUG-FALLBACK] Échec de l'upload dans tous les buckets disponibles");
  
  return {
    url: '',
    name: file.name,
    type: file.type,
    path,
    success: false,
    error: lastError
  };
}

/**
 * Génère un nom de fichier unique pour éviter les conflits
 */
export function generateUniqueFileName(file: File, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  
  return `${prefix ? `${prefix}_` : ''}${timestamp}_${random}_${safeFileName}`;
}

/**
 * Générer un chemin de fichier pour les messages d'une commande
 */
export function generateOrderMessageFilePath(orderId: string, file: File): string {
  const fileName = generateUniqueFileName(file);
  return `messages/${orderId}/${fileName}`;
}

/**
 * Upload un fichier pour une pièce jointe de message de commande
 * @param file Le fichier à uploader
 * @param orderId L'ID de la commande associée au message
 */
export async function uploadOrderMessageAttachment(
  file: File,
  orderId: string
): Promise<{
  success: boolean;
  url?: string;
  type?: string;
  name?: string;
  error?: Error;
}> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    // Générer un nom unique pour le fichier
    const uniqueId = crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${orderId}/${uniqueId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `order-messages/${fileName}`;
    
    // Upload du fichier vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
    
    if (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      return {
        success: false,
        error: new Error(error.message)
      };
    }
    
    // Récupérer l'URL publique du fichier
    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    
    return {
      success: true,
      url: publicUrlData.publicUrl,
      type: file.type,
      name: file.name
    };
    
  } catch (err) {
    console.error('Exception lors de l\'upload du fichier:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Erreur inconnue lors de l\'upload')
    };
  }
} 