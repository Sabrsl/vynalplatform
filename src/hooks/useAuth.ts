import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { APP_URLS } from '@/lib/constants';
import { AUTH_ROUTES } from '@/config/routes';
import { AuthError, User, Session } from '@supabase/supabase-js';

// Interface pour l'utilisateur avec rôle
interface EnhancedUser extends User {
  user_metadata: {
    role?: 'admin' | 'client' | 'freelance';
    [key: string]: any;
  };
}

// Interface pour les résultats d'opérations d'authentification
export interface AuthResult {
  success: boolean;
  error?: AuthError | Error | unknown;
  message?: string;
}

/**
 * Hook optimisé pour gérer l'authentification
 */
export function useAuth() {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Résoudre l'URL de redirection complète
  const getRedirectUrl = useCallback((path: string): string => {
    // S'assurer que l'URL de redirection est complète et correcte pour Supabase
    if (path.startsWith('/auth/reset-password')) {
      // Pour la réinitialisation de mot de passe, nous retournons l'URL complète
      return `${APP_URLS.productionUrl}${path}`;
    } else {
      return `${APP_URLS.productionUrl}${path}`;
    }
  }, []);

  // Fonction améliorée pour synchroniser les rôles
  const syncUserRole = useCallback(async (
    userId: string,
    metadataRole: string | undefined,
    profileRole: string | undefined
  ): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      // Si le rôle existe dans le profil mais pas dans les métadonnées
      if (profileRole && !metadataRole) {
        await supabase.auth.updateUser({
          data: { role: profileRole }
        });
        return true;
      }
      
      // Si le rôle existe dans les métadonnées mais pas dans le profil
      if (metadataRole && !profileRole) {
        await supabase
          .from('profiles')
          .update({ role: metadataRole })
          .eq('id', userId);
        return true;
      }
      
      // Si les deux existent mais sont différents (privilégier le profil)
      if (profileRole && metadataRole && profileRole !== metadataRole) {
        await supabase.auth.updateUser({
          data: { role: profileRole }
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Erreur lors de la synchronisation du rôle:", error);
      return false;
    }
  }, []);

  // Vérifier et initialiser la session
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          // Si l'utilisateur est connecté, récupérer également son profil pour vérifier le rôle
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (!profileError && profile) {
            // Synchroniser les rôles si nécessaire
            const userMetadataRole = session.user.user_metadata?.role;
            const profileRole = profile.role;
            
            // Cette synchronisation résout le problème de cohérence des rôles
            await syncUserRole(session.user.id, userMetadataRole, profileRole);
            
            // Récupérer l'utilisateur mis à jour
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser as EnhancedUser);
          } else {
            setUser(session.user as EnhancedUser);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Mettre à jour l'utilisateur lors des changements d'état d'authentification
        if (session) {
          setUser(session.user as EnhancedUser);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserRole]);

  // Connexion avec email/mot de passe
  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResult> => {
    if (!email || !password) {
      return { success: false, message: "Email et mot de passe requis" };
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      // Gérer "se souvenir de moi" si nécessaire
      if (rememberMe) {
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError) {
          console.warn("Impossible de prolonger la session:", refreshError);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Erreur de connexion:", error);
      return { 
        success: false, 
        error,
        message: error instanceof AuthError ? 
          error.message : 
          "Une erreur est survenue lors de la connexion"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Connexion avec Google
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(APP_URLS.authCallbackUrl),
        },
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Erreur de connexion Google:", error);
      return { 
        success: false, 
        error,
        message: error instanceof AuthError ? 
          error.message : 
          "Une erreur est survenue lors de la connexion avec Google"
      };
    } finally {
      setLoading(false);
    }
  }, [getRedirectUrl]);

  // Inscription
  const signUp = useCallback(async (email: string, password: string, role: 'client' | 'freelance'): Promise<AuthResult> => {
    if (!email || !password) {
      return { success: false, message: "Email et mot de passe requis" };
    }
    
    if (!role) {
      return { success: false, message: "Rôle utilisateur requis" };
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(APP_URLS.authCallbackUrl),
          data: {
            role,
          },
        },
      });
      
      if (error) throw error;
      
      return { 
        success: true,
        message: "Vérifiez votre email pour confirmer votre inscription"
      };
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      return { 
        success: false, 
        error,
        message: error instanceof AuthError ? 
          error.message : 
          "Une erreur est survenue lors de l'inscription"
      };
    } finally {
      setLoading(false);
    }
  }, [getRedirectUrl]);

  // Déconnexion
  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('supabase.auth.expires_at');
      } catch (storageError) {
        console.warn("Erreur lors du nettoyage du stockage local:", storageError);
      }
      
      setUser(null);
      
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return { 
        success: false, 
        error,
        message: error instanceof AuthError ? 
          error.message : 
          "Une erreur est survenue lors de la déconnexion"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Réinitialisation de mot de passe
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!email) {
      return { success: false, message: "Email requis" };
    }
    
    try {
      setLoading(true);
      // Utiliser l'URL absolue pour être sûr que Supabase redirige correctement
      const redirectUrl = `${APP_URLS.productionUrl}${AUTH_ROUTES.RESET_PASSWORD}`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) throw error;
      
      return { 
        success: true,
        message: "Vérifiez votre email pour réinitialiser votre mot de passe"
      };
    } catch (error) {
      console.error("Erreur de réinitialisation:", error);
      return { 
        success: false, 
        error,
        message: error instanceof AuthError ? 
          error.message : 
          "Une erreur est survenue lors de la demande de réinitialisation"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Mise à jour du mot de passe
  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!password) {
      return { success: false, message: "Nouveau mot de passe requis" };
    }
    
    if (password.length < 6) {
      return { success: false, message: "Le mot de passe doit contenir au moins 6 caractères" };
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      return { 
        success: true,
        message: "Mot de passe mis à jour avec succès"
      };
    } catch (error) {
      console.error("Erreur de mise à jour:", error);
      return { 
        success: false, 
        error,
        message: error instanceof AuthError ? 
          error.message : 
          "Une erreur est survenue lors de la mise à jour du mot de passe"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Valeurs dérivées optimisées
  const isAuthenticated = useMemo(() => !!user, [user]);
  const userRole = useMemo(() => user?.user_metadata?.role || null, [user]);
  
  const hasRole = useCallback((role: 'admin' | 'client' | 'freelance'): boolean => {
    return user?.user_metadata?.role === role;
  }, [user]);
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    userRole,
    hasRole,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    syncUserRole
  };
} 