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
      // Jetons d'authentification Supabase
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('supabase.auth.expires_at');
      
      // Jetons supplémentaires de l'application
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_time');
      localStorage.removeItem('last_signup_attempt');
      localStorage.removeItem('last_refresh');
      localStorage.removeItem('active_path');
    } catch (e) {
      console.warn("Impossible de nettoyer le localStorage:", e);
    }
    
    // Déconnexion de Supabase avec option scope: 'global' pour déconnecter de tous les onglets
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) throw error;
    
    // Ajouter un délai avant la redirection pour s'assurer que la session est bien détruite
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    
    // En cas d'échec, tenter une redirection de secours
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
    
    return { success: false, error };
  }
} 