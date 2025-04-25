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

interface UseAuthOptions {
  useCache?: boolean;
}

/**
 * Hook pour la gestion de l'authentification
 * @param options Configuration du hook
 * @param options.useCache Utiliser le système de cache pour réduire les appels à l'API (défaut: false)
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { useCache = false } = options;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Résoudre l'URL de redirection complète
  const getRedirectUrl = useCallback((path: string): string => {
    // Nous utilisons l'URL de production pour les redirections depuis Supabase
    return `${APP_URLS.productionUrl}${path}`;
  }, []);

  // Fonction pour récupérer le rôle utilisateur
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      // Vérifier d'abord le cache si l'option est activée
      if (useCache) {
        const cacheKey = `${PROFILE_CACHE_KEY}_role_${userId}`;
        const cachedRole = getCachedData<string>(cacheKey);
        
        if (cachedRole) {
          return { data: cachedRole, error: null };
        }
      }
      
      // Si pas dans le cache ou cache désactivé, faire la requête
      const { data: userRole, error } = await supabase.rpc('get_user_role');
      
      if (!error && userRole && useCache) {
        // Mettre en cache pour 1 heure si le cache est activé
        const cacheKey = `${PROFILE_CACHE_KEY}_role_${userId}`;
        setCachedData<string>(cacheKey, userRole, { expiry: CACHE_EXPIRY.USER_DATA });
      }
      
      return { data: userRole, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [useCache]);

  // Mettre à jour l'utilisateur avec son rôle
  const updateUserWithRole = useCallback(async (sessionUser: any) => {
    if (!sessionUser) return null;
    
    try {
      // Si le rôle est déjà dans les métadonnées, éviter une requête inutile
      if (sessionUser.user_metadata?.role) {
        // Mettre en cache l'utilisateur complet si l'option est activée
        if (useCache) {
          setCachedData(USER_CACHE_KEY, sessionUser, { expiry: CACHE_EXPIRY.USER_SESSION });
        }
        return sessionUser;
      }
      
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
        
        // Mettre en cache l'utilisateur complet si l'option est activée
        if (useCache) {
          setCachedData(USER_CACHE_KEY, updatedUser, { expiry: CACHE_EXPIRY.USER_SESSION });
        }
        
        return updatedUser;
      }
      
      return sessionUser;
    } catch (err) {
      console.error("Erreur lors de la récupération du rôle:", err);
      return sessionUser;
    }
  }, [fetchUserRole, useCache]);

  // Vérifier la session en arrière-plan pour actualiser le cache si nécessaire
  const checkSessionInBackground = useCallback(async () => {
    if (!useCache) return; // Ne pas exécuter cette fonction si le cache est désactivé
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erreur lors de la vérification de la session:", sessionError);
        return;
      }
      
      if (session?.user) {
        // Si l'utilisateur est toujours connecté mais que son ID diffère du cache
        if (user?.id !== session.user.id) {
          // Mettre à jour le cache avec les dernières données
          const updatedUser = await updateUserWithRole(session.user);
          setUser(updatedUser);
        }
      } else if (user !== null) {
        // Si aucune session valide, avant de déconnecter, essayer une deuxième fois
        setTimeout(async () => {
          try {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (!retrySession) {
              // Confirme qu'il n'y a vraiment pas de session
              setUser(null);
              invalidateCache(USER_CACHE_KEY);
              
              // Tenter une reconnexion automatique si on a un refresh token
              const storedRefreshToken = localStorage.getItem('sb-refresh-token');
              if (storedRefreshToken) {
                try {
                  await supabase.auth.refreshSession();
                  // Revérifier la session après la tentative de refresh
                  const { data: { session: refreshedSession } } = await supabase.auth.getSession();
                  if (refreshedSession?.user) {
                    const refreshedUser = await updateUserWithRole(refreshedSession.user);
                    setUser(refreshedUser);
                  }
                } catch (refreshErr) {
                  console.error("Échec de la tentative de reconnexion:", refreshErr);
                }
              }
            }
          } catch (retryErr) {
            console.error("Erreur lors de la seconde vérification de session:", retryErr);
            setUser(null);
            invalidateCache(USER_CACHE_KEY);
          }
        }, 3000); // Attendre 3 secondes avant de réessayer
      }
    } catch (err) {
      console.error("Erreur lors de la vérification de la session:", err);
    }
  }, [user, updateUserWithRole, useCache]);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const getInitialSession = async () => {
      setLoading(true);
      
      // Vérifier d'abord le cache si l'option est activée
      if (useCache) {
        const cachedUser = getCachedData(USER_CACHE_KEY);
        
        if (cachedUser) {
          setUser(cachedUser);
          setLoading(false);
          
          // Vérifier la session en arrière-plan
          setTimeout(() => checkSessionInBackground(), 1000);
          return;
        }
      }
      
      // Si pas de cache ou cache désactivé, vérifier la session Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Ajouter le rôle utilisateur
          const updatedUser = await updateUserWithRole(session.user);
          setUser(updatedUser);
        } else {
          setUser(null);
          // Effacer le cache si l'option est activée
          if (useCache) {
            invalidateCache(USER_CACHE_KEY);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
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
          // Effacer le cache si l'option est activée
          if (useCache) {
            invalidateCache(USER_CACHE_KEY);
            invalidateCache(PROFILE_CACHE_KEY);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [updateUserWithRole, checkSessionInBackground, useCache]);

  // Méthodes pour gérer l'authentification
  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      // Mettre en cache la session avec une expiration étendue si "Se souvenir de moi" et si cache activé
      if (data.user && rememberMe && useCache) {
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

  const signInWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
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

  const signInWithLinkedIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin',
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
      
      // Si cache activé, invalider les caches potentiellement obsolètes
      if (useCache) {
        invalidateCache(USER_CACHE_KEY);
        invalidateCache(PROFILE_CACHE_KEY);
      }
      
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
      
      // Nettoyage complet du stockage local
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('supabase.auth.expires_at');
      
      // Réinitialiser les données utilisateur en local
      setUser(null);
      
      // Effacer le cache si l'option est activée
      if (useCache) {
        invalidateCache(USER_CACHE_KEY);
        invalidateCache(PROFILE_CACHE_KEY);
      }
      
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
    signInWithGithub,
    signInWithLinkedIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
} 