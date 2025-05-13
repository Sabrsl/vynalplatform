import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Cache des images de profil pour éviter les requêtes répétées
const profileImageCache = new Map<string, { url: string | null; timestamp: number }>();

// Requêtes en cours pour éviter les appels simultanés
const pendingImageRequests = new Set<string>();

// Durée du cache en ms (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Récupère l'image de profil d'un utilisateur avec gestion des erreurs et retries
 * Inclut une gestion de cache et prévention des requêtes simultanées
 * @param userId L'ID de l'utilisateur
 * @param maxRetries Nombre maximum de tentatives (par défaut: 2)
 * @returns L'URL de l'image de profil ou null
 */
export async function getProfileImage(userId: string, maxRetries = 2): Promise<string | null> {
  if (!userId) return null;
  
  // Vérifier le cache d'abord
  const cachedImage = profileImageCache.get(userId);
  if (cachedImage && Date.now() - cachedImage.timestamp < CACHE_DURATION) {
    return cachedImage.url;
  }
  
  // Si une requête est déjà en cours pour cet utilisateur, retourner le cache existant ou null
  if (pendingImageRequests.has(userId)) {
    return cachedImage?.url || null;
  }
  
  // Marquer cet utilisateur comme ayant une requête en cours
  pendingImageRequests.add(userId);
  
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
      
      // Si l'image est disponible, la retourner et la mettre en cache
      if (profile?.avatar_url) {
        profileImageCache.set(userId, {
          url: profile.avatar_url,
          timestamp: Date.now()
        });
        return profile.avatar_url;
      }
      
      // Si pas d'image et qu'on peut réessayer
      if (retryCount < maxRetries) {
        retryCount++;
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfileImage();
      }
      
      // Mettre en cache le résultat négatif pour éviter des requêtes répétées
      profileImageCache.set(userId, {
        url: null,
        timestamp: Date.now()
      });
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'image de profil pour ${userId}:`, error);
      
      // Si on peut réessayer
      if (retryCount < maxRetries) {
        retryCount++;
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfileImage();
      }
      
      // Mettre en cache l'erreur pour éviter des requêtes répétées
      profileImageCache.set(userId, {
        url: null,
        timestamp: Date.now()
      });
      
      return null;
    }
  };
  
  try {
    return await fetchProfileImage();
  } finally {
    pendingImageRequests.delete(userId);
  }
}

/**
 * Récupère les informations complètes d'un profil utilisateur
 * Utilise un cache pour éviter les requêtes répétées
 * @param userId L'ID de l'utilisateur
 * @param maxRetries Nombre maximum de tentatives (par défaut: 2)
 * @returns Les informations du profil ou null
 */
export async function getFullProfile(userId: string, maxRetries = 2): Promise<any | null> {
  // Fonctionnalité similaire à implémenter si nécessaire
  // Utilise le même principe de cache et de prévention de requêtes simultanées
  
  // Pour l'instant, on utilise la version simple
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
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfile();
      }
      
      return null;
    }
  };
  
  return fetchProfile();
} 