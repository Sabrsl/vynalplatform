import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Récupère l'image de profil d'un utilisateur avec gestion des erreurs et retries
 * @param userId L'ID de l'utilisateur
 * @param maxRetries Nombre maximum de tentatives (par défaut: 2)
 * @returns L'URL de l'image de profil ou null
 */
export async function getProfileImage(userId: string, maxRetries = 2): Promise<string | null> {
  if (!userId) return null;
  
  const supabase = createClientComponentClient();
  let retryCount = 0;
  
  const fetchProfileImage = async (): Promise<string | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Si l'image est disponible, la retourner
      if (profile?.avatar_url) {
        return profile.avatar_url;
      }
      
      // Si pas d'image et qu'on peut réessayer
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Image de profil non trouvée pour ${userId}, nouvelle tentative (${retryCount}/${maxRetries})...`);
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfileImage();
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'image de profil pour ${userId}:`, error);
      
      // Si on peut réessayer
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Erreur lors de la récupération de l'image de profil, nouvelle tentative (${retryCount}/${maxRetries})...`);
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfileImage();
      }
      
      return null;
    }
  };
  
  return fetchProfileImage();
}

/**
 * Récupère les informations complètes d'un profil utilisateur
 * @param userId L'ID de l'utilisateur
 * @param maxRetries Nombre maximum de tentatives (par défaut: 2)
 * @returns Les informations du profil ou null
 */
export async function getFullProfile(userId: string, maxRetries = 2): Promise<any | null> {
  if (!userId) return null;
  
  const supabase = createClientComponentClient();
  let retryCount = 0;
  
  const fetchProfile = async (): Promise<any | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, last_seen')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Si le profil est disponible, le retourner
      if (profile) {
        return profile;
      }
      
      // Si pas de profil et qu'on peut réessayer
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Profil non trouvé pour ${userId}, nouvelle tentative (${retryCount}/${maxRetries})...`);
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfile();
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du profil pour ${userId}:`, error);
      
      // Si on peut réessayer
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Erreur lors de la récupération du profil, nouvelle tentative (${retryCount}/${maxRetries})...`);
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfile();
      }
      
      return null;
    }
  };
  
  return fetchProfile();
} 