import { supabase } from './supabase/client';

/**
 * Fonction simplifiée pour la déconnexion
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Redirection vers la page d'accueil
    window.location.href = '/';
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    return { success: false, error };
  }
} 