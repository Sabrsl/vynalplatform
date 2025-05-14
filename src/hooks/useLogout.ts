import { useCallback, useState } from 'react';
import { signOut } from '@/lib/auth';
import { NavigationLoadingState } from '@/app/providers';

/**
 * Hook personnalisé pour gérer la déconnexion de manière optimisée
 * - Gestion d'état pendant la déconnexion pour améliorer l'expérience utilisateur
 * - Nettoyage du stockage local et des sessions
 * - Intégration avec l'état de navigation global
 */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logout = useCallback(async () => {
    if (isLoggingOut) return; // Éviter les déconnexions concurrentes
    
    try {
      setIsLoggingOut(true);
      setError(null);
      
      // Indiquer le début de la navigation pour montrer un indicateur de chargement
      NavigationLoadingState.setIsNavigating(true);
      
      // Appeler la fonction de déconnexion optimisée
      const result = await signOut();
      
      // Gérer les erreurs
      if (!result.success && result.error) {
        console.error('Erreur lors de la déconnexion');
        setError(result.error instanceof Error ? result.error : new Error('Échec de la déconnexion'));
        NavigationLoadingState.setIsNavigating(false);
      }
      
      // Note: Pas besoin de redirection ici, car la fonction signOut() s'en occupe
    } catch (err) {
      console.error('Erreur lors de la déconnexion');
      setError(err instanceof Error ? err : new Error('Une erreur inattendue est survenue'));
      NavigationLoadingState.setIsNavigating(false);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return {
    logout,
    isLoggingOut,
    error
  };
} 