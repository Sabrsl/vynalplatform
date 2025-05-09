import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { APP_URLS } from '@/lib/constants';
import { AuthError, User, Session } from '@supabase/supabase-js';

// Interface pour l'utilisateur augmenté avec le rôle
export interface EnhancedUser extends User {
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
  // États - doivent être définis au début et dans le même ordre à chaque rendu
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const isLoadingUser = useRef<boolean>(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const router = useRouter();

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

  // Fonction optimisée pour récupérer le rôle utilisateur
  const fetchUserRole = useCallback(async (currentUser: User): Promise<EnhancedUser> => {
    try {
      const { data: userRole, error } = await supabase.rpc('get_user_role');
      
      if (!error && userRole) {
        // Mettre à jour les métadonnées utilisateur avec le rôle
        return {
          ...currentUser,
          user_metadata: {
            ...currentUser.user_metadata,
            role: userRole
          }
        };
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du rôle:", err);
    }
    
    // Si erreur ou pas de rôle, retourner l'utilisateur inchangé
    return currentUser as EnhancedUser;
  }, []);

  // Fonction pour mettre à jour l'utilisateur basée sur une session
  const updateUserFromSession = useCallback(async (session: Session | null) => {
    try {
      if (session?.user) {
        const enhancedUser = await fetchUserRole(session.user);
        setUser(enhancedUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
      setUser(null);
    }
  }, [fetchUserRole]);

  // Initialiser la session et configurer les écouteurs
  useEffect(() => {
    if (initialized) return;
    
    const initializeAuth = async () => {
      if (isLoadingUser.current) return;
      
      isLoadingUser.current = true;
      setLoading(true);
      
      try {
        // Récupérer la session actuelle
        const { data: { session } } = await supabase.auth.getSession();
        await updateUserFromSession(session);
      } catch (err) {
        console.error("Erreur lors de l'initialisation de l'authentification:", err);
        setUser(null);
      } finally {
        setLoading(false);
        isLoadingUser.current = false;
        setInitialized(true);
      }
    };
    
    initializeAuth();

    // Configurer l'écouteur d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isLoadingUser.current) return;
        
        isLoadingUser.current = true;
        setLoading(true);
        
        try {
          await updateUserFromSession(session);
        } finally {
          setLoading(false);
          isLoadingUser.current = false;
        }
      }
    );
    
    // Stocker la référence de l'abonnement
    subscriptionRef.current = subscription;

    // Nettoyage lors du démontage
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [initialized, updateUserFromSession]);

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

  // Le reste de vos fonctions (signInWithGoogle, signUp, etc.)
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

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!email) {
      return { success: false, message: "Email requis" };
    }
    
    try {
      setLoading(true);
      // Utiliser l'URL absolue pour être sûr que Supabase redirige correctement
      const redirectUrl = `${APP_URLS.productionUrl}/auth/reset-password`;
      console.log("URL de redirection pour réinitialisation:", redirectUrl);
      
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

  // Valeurs dérivées
  const isAuthenticated = useMemo(() => !!user, [user]);
  
  const hasRole = useCallback((role: 'admin' | 'client' | 'freelance'): boolean => {
    return user?.user_metadata?.role === role;
  }, [user]);

  // Retourner un objet mémoïsé pour éviter les recréations inutiles
  return useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    hasRole,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }), [
    user,
    loading,
    isAuthenticated,
    hasRole,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  ]);
} 