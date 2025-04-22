import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { APP_URLS } from '@/lib/constants';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS,
  CACHE_EXPIRY
} from '@/lib/optimizations';

const USER_CACHE_KEY = CACHE_KEYS.USER_SESSION;
const PROFILE_CACHE_KEY = CACHE_KEYS.USER_PROFILE;

/**
 * Hook optimisé pour la gestion de l'authentification
 * Utilise le système de cache pour réduire les appels à l'API
 */
export function useOptimizedAuth() {
  // Utilisons any pour simplifier le typage et éviter les problèmes
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Résoudre l'URL de redirection complète
  const getRedirectUrl = useCallback((path: string): string => {
    // Nous utilisons l'URL de production pour les redirections depuis Supabase
    return `${APP_URLS.productionUrl}${path}`;
  }, []);

  // Fonction optimisée pour récupérer le rôle utilisateur
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      // Vérifier d'abord le cache
      const cacheKey = `${PROFILE_CACHE_KEY}_role_${userId}`;
      const cachedRole = getCachedData<string>(cacheKey);
      
      if (cachedRole) {
        return { data: cachedRole, error: null };
      }
      
      // Si pas dans le cache, faire la requête
      const { data: userRole, error } = await supabase.rpc('get_user_role');
      
      if (!error && userRole) {
        // Mettre en cache pour 1 heure
        setCachedData<string>(cacheKey, userRole, { expiry: CACHE_EXPIRY.USER_DATA });
      }
      
      return { data: userRole, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  // Mettre à jour l'utilisateur avec son rôle
  const updateUserWithRole = useCallback(async (sessionUser: any) => {
    if (!sessionUser) return null;
    
    try {
      const { data: userRole, error } = await fetchUserRole(sessionUser.id);
      
      if (!error && userRole) {
        // Mettre à jour les métadonnées utilisateur avec le rôle
        const updatedUser = {
          ...sessionUser,
          user_metadata: {
            ...sessionUser.user_metadata,
            role: userRole
          }
        };
        
        // Mettre en cache l'utilisateur complet
        setCachedData(USER_CACHE_KEY, updatedUser, { expiry: CACHE_EXPIRY.USER_SESSION });
        
        return updatedUser;
      }
      
      return sessionUser;
    } catch (err) {
      console.error("Erreur lors de la récupération du rôle:", err);
      return sessionUser;
    }
  }, [fetchUserRole]);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté et mis en cache
    const getInitialSession = async () => {
      setLoading(true);
      
      // Vérifier d'abord le cache
      const cachedUser = getCachedData(USER_CACHE_KEY);
      
      if (cachedUser) {
        setUser(cachedUser);
        setLoading(false);
        
        // Vérifier la session en arrière-plan pour s'assurer qu'elle est toujours valide
        checkSessionInBackground();
        return;
      }
      
      // Si pas de cache, vérifier la session Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Ajouter le rôle utilisateur
        const updatedUser = await updateUserWithRole(session.user);
        setUser(updatedUser);
      } else {
        setUser(null);
        // Effacer le cache si la session n'est plus valide
        invalidateCache(USER_CACHE_KEY);
      }
      
      setLoading(false);
    };
    
    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          // Ajouter le rôle utilisateur
          const updatedUser = await updateUserWithRole(session.user);
          setUser(updatedUser);
        } else {
          setUser(null);
          // Effacer le cache si l'utilisateur est déconnecté
          invalidateCache(USER_CACHE_KEY);
          invalidateCache(PROFILE_CACHE_KEY);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [updateUserWithRole]);

  // Vérifier la session en arrière-plan pour actualiser le cache si nécessaire
  const checkSessionInBackground = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Mettre à jour le cache avec les dernières données
        const updatedUser = await updateUserWithRole(session.user);
        setUser(updatedUser);
      } else {
        // Si aucune session valide, déconnecter l'utilisateur local
        setUser(null);
        invalidateCache(USER_CACHE_KEY);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification de la session:", err);
    }
  };

  // Méthodes optimisées pour gérer l'authentification
  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      // Mettre en cache la session avec une expiration étendue si "Se souvenir de moi"
      if (data.user && rememberMe) {
        const updatedUser = await updateUserWithRole(data.user);
        setCachedData(USER_CACHE_KEY, updatedUser, { 
          expiry: CACHE_EXPIRY.EXTENDED_SESSION // Plus longue durée pour "Se souvenir de moi"
        });
      }
      
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
      
      // Nettoyer le cache
      invalidateCache(USER_CACHE_KEY);
      invalidateCache(PROFILE_CACHE_KEY);
      invalidateCache(`${PROFILE_CACHE_KEY}_role_${user?.id}`);
      
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
      
      // Forcer une actualisation de la session après mise à jour du mot de passe
      checkSessionInBackground();
      
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