import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { APP_URLS } from '@/lib/constants';

export function useAuth() {
  // Utilisons any pour simplifier le typage et éviter les problèmes
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Résoudre l'URL de redirection complète
  const getRedirectUrl = (path: string): string => {
    // Nous utilisons l'URL de production pour les redirections depuis Supabase
    return `${APP_URLS.productionUrl}${path}`;
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const getInitialSession = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Si l'utilisateur est connecté, récupérer son rôle explicitement
        try {
          const { data: userRole, error } = await supabase.rpc('get_user_role');
          
          if (!error && userRole) {
            // Mettre à jour les métadonnées utilisateur avec le rôle
            const updatedUser = {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                role: userRole
              }
            };
            setUser(updatedUser);
          } else {
            setUser(session.user);
          }
        } catch (err) {
          console.error("Erreur lors de la récupération du rôle:", err);
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          // Si l'utilisateur est connecté, récupérer son rôle explicitement
          try {
            const { data: userRole, error } = await supabase.rpc('get_user_role');
            
            if (!error && userRole) {
              // Mettre à jour les métadonnées utilisateur avec le rôle
              const updatedUser = {
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  role: userRole
                }
              };
              setUser(updatedUser);
            } else {
              setUser(session.user);
            }
          } catch (err) {
            console.error("Erreur lors de la récupération du rôle:", err);
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Méthodes pour gérer l'authentification
  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(APP_URLS.authCallbackUrl),
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string, role: 'client' | 'freelance') => {
    try {
      const { error, data } = await supabase.auth.signUp({
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
      
      // Nous ne créons plus manuellement le profil utilisateur ici
      // Supabase s'en chargera automatiquement via des triggers
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      // Déconnexion sécurisée avec Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Réinitialiser les données utilisateur en local
      setUser(null);
      
      // Redirection vers la page d'accueil
      window.location.href = '/';
      
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return { success: false, error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl('/auth/reset-password'),
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
} 