import { supabase } from './supabase/client';

/**
 * Fonction optimisée pour la déconnexion
 * - Gère les erreurs proprement
 * - Utilise un timeout pour éviter les redirections bloquantes
 * - Nettoie le localStorage des clés liées à l'authentification
 */
export async function signOut() {
  try {
    // Nettoyer d'abord les données du localStorage liées à l'authentification
    try {
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_time');
      localStorage.removeItem('last_signup_attempt');
    } catch (e) {
      console.warn("Impossible de nettoyer le localStorage:", e);
    }
    
    // Déconnexion de Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Redirection vers la page d'accueil avec un léger délai
    // pour s'assurer que la session est bien détruite
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    return { success: false, error };
  }
} 