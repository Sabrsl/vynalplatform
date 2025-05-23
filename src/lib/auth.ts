import { supabase } from './supabase/client';

/**
 * Fonction optimisée pour la déconnexion
 * - Gère les erreurs proprement
 * - Utilise un timeout pour éviter les redirections bloquantes
 * - Nettoie le localStorage des clés liées à l'authentification
 * - Nettoie le cache de l'application et du navigateur
 */
export async function signOut() {
  try {
    // Nettoyer d'abord les données du localStorage liées à l'authentification
    try {
      // Suppression complète des clés Supabase dans localStorage
      const localStorageKeys = Object.keys(localStorage);
      for (const key of localStorageKeys) {
        if (key.startsWith('sb-') || key.includes('supabase.auth')) {
          localStorage.removeItem(key);
        }
      }
      localStorage.removeItem('last_refresh');
      sessionStorage.clear();
      
      // Suppression des cookies liés à l'authentification
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        
        if (name.startsWith('sb-') || name.includes('supabase.auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        }
      }
    } catch (e) {
      console.warn("Impossible de nettoyer le stockage:", e);
    }
    
    // Déconnexion de Supabase
    await supabase.auth.signOut({ scope: 'global' });
    
    // Délai avant redirection
    setTimeout(() => {
      window.location.href = '/?t=' + Date.now();
    }, 350);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    window.location.href = '/?t=' + Date.now();
    return { success: false, error };
  }
} 