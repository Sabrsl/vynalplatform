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
      setUser(session?.user ?? null);
      
      setLoading(false);
    };
    
    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null);
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
      // Définir la persistance de la session en fonction de l'option "Se souvenir de moi"
      const persistSession = rememberMe;
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
      }, {
        persistSession 
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/'); // Rediriger vers la page d'accueil après déconnexion
      return { success: true };
    } catch (error) {
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