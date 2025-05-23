import { useCallback, useState } from 'react';
import { signOut } from '@/lib/auth';
import { NavigationLoadingState } from '@/app/providers';

/**
 * Hook personnalisé pour gérer la déconnexion de manière optimisée
 * - Gestion d'état pendant la déconnexion pour améliorer l'expérience utilisateur
 * - Nettoyage du stockage local et des sessions
 * - Intégration avec l'état de navigation global
 * - Protection contre les reconnexions automatiques
 */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setError(null);
      NavigationLoadingState.setIsNavigating(true);
      
      // Appeler la fonction de déconnexion optimisée
      await signOut();
      
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      setError(err instanceof Error ? err : new Error('Erreur de déconnexion'));
      setIsLoggingOut(false);
      NavigationLoadingState.setIsNavigating(false);
      
      // Redirection de secours en cas d'erreur
      window.location.href = '/?t=' + Date.now();
    }
  }, [isLoggingOut]);

  return {
    logout,
    isLoggingOut,
    error
  };
} 