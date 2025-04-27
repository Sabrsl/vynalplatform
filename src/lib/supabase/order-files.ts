import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { uploadFileWithFallback, generateUniqueFileName } from './file-upload';

export interface OrderFile {
  id: string;
  order_id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Upload un fichier pour une commande spécifique
 */
export async function uploadOrderFile(
  orderId: string,
  file: File
): Promise<OrderFile | null> {
  try {
    console.log(`[DEBUG] Début d'upload pour la commande ${orderId}, fichier: ${file.name} (${file.size} bytes)`);
    
    // Générer un nom de fichier unique
    const fileName = generateUniqueFileName(file);
    const filePath = `orders/${orderId}/${fileName}`;
    
    console.log(`[DEBUG] Chemin du fichier généré: ${filePath}`);
    
    // Upload le fichier avec fallback sur différents buckets
    console.log(`[DEBUG] Tentative d'upload avec fallback sur les buckets disponibles`);
    const result = await uploadFileWithFallback(file, filePath);
    
    if (!result.success) {
      console.error("[DEBUG] Échec de l'upload du fichier:", result.error);
      return null;
    }
    
    console.log(`[DEBUG] Upload réussi, URL: ${result.url}`);
    
    // Formater la taille du fichier
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const formattedSize = `${sizeInMB} MB`;
    
    // Créer un enregistrement dans la table order_files
    console.log(`[DEBUG] Création de l'enregistrement dans la table order_files`);
    const supabase = createClientComponentClient<Database>();
    
    const { data, error } = await supabase
      .from('order_files')
      .insert({
        order_id: orderId,
        name: file.name,
        url: result.url,
        size: formattedSize,
        type: file.type,
        storage_path: filePath
      })
      .select()
      .single();
    
    if (error) {
      console.error("[DEBUG] Erreur lors de l'enregistrement du fichier dans la base de données:", error);
      console.error("[DEBUG] Code d'erreur:", error.code);
      console.error("[DEBUG] Message d'erreur:", error.message);
      console.error("[DEBUG] Détails:", error.details);
      return null;
    }
    
    console.log(`[DEBUG] Enregistrement créé avec succès, ID: ${data.id}`);
    return data as OrderFile;
  } catch (err) {
    console.error("[DEBUG] Exception lors de l'upload du fichier de commande:", err);
    return null;
  }
}

/**
 * Récupère les fichiers associés à une commande
 */
export async function getOrderFiles(orderId: string): Promise<OrderFile[]> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    const { data, error } = await supabase
      .from('order_files')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des fichiers:", error);
      return [];
    }
    
    return data as OrderFile[];
  } catch (err) {
    console.error("Exception lors de la récupération des fichiers de commande:", err);
    return [];
  }
}

/**
 * Supprime un fichier de commande
 */
export async function deleteOrderFile(fileId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    // D'abord récupérer les informations du fichier pour avoir le chemin de stockage
    const { data: fileData, error: fetchError } = await supabase
      .from('order_files')
      .select('storage_path')
      .eq('id', fileId)
      .single();
    
    if (fetchError || !fileData) {
      console.error("Erreur lors de la récupération des informations du fichier:", fetchError);
      return false;
    }
    
    // Supprimer le fichier du stockage
    const { error: storageError } = await supabase.storage
      .from('tchatfiles')
      .remove([fileData.storage_path]);
    
    if (storageError) {
      console.error("Erreur lors de la suppression du fichier du stockage:", storageError);
      // Continuer pour supprimer la référence de la base de données même si la suppression du stockage échoue
    }
    
    // Supprimer l'enregistrement de la base de données
    const { error: deleteError } = await supabase
      .from('order_files')
      .delete()
      .eq('id', fileId);
    
    if (deleteError) {
      console.error("Erreur lors de la suppression de l'enregistrement du fichier:", deleteError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception lors de la suppression du fichier:", err);
    return false;
  }
} 