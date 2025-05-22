import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { APP_URLS } from '@/lib/constants';
import { AUTH_ROUTES } from '@/config/routes';
import { AuthError, User, Session } from '@supabase/supabase-js';
import requestCoordinator from '@/lib/optimizations/requestCoordinator';

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

// Cache des sessions utilisateur avec contrôle des requêtes
const USER_SESSION_CACHE = {
  session: null as any | null,
  timestamp: 0,
  expiresAt: 0,
  pendingRequest: false // Ajout d'un indicateur pour éviter les requêtes simultanées
};

// Durée de validité du cache (5 minutes)
const SESSION_CACHE_DURATION = 5 * 60 * 1000;

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
    // Fonction pour éviter les appels multiples concurrents
    let isMounted = true;
    
    const checkSession = async () => {
      // Si une requête est déjà en cours, ignorer celle-ci
      if (USER_SESSION_CACHE.pendingRequest) return;
      
      try {
        setLoading(true);
        
        // Vérifier d'abord le cache
        const now = Date.now();
        if (USER_SESSION_CACHE.session && now < USER_SESSION_CACHE.expiresAt) {
          // Utiliser la session en cache
          if (USER_SESSION_CACHE.session.user) {
            setUser(USER_SESSION_CACHE.session.user as EnhancedUser);
          } else {
            setUser(null);
          }
          setLoading(false);
          return;
        }
        
        // Marquer comme requête en cours pour éviter les appels simultanés
        USER_SESSION_CACHE.pendingRequest = true;
        
        // Utiliser le coordinateur de requêtes pour éviter les appels multiples
        await requestCoordinator.scheduleRequest(
          'check_auth_session',
          async () => {
            if (!isMounted) return;
            
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) throw sessionError;
            
            // Mettre à jour le cache
            USER_SESSION_CACHE.session = session;
            USER_SESSION_CACHE.timestamp = now;
            USER_SESSION_CACHE.expiresAt = now + SESSION_CACHE_DURATION;
            
            if (session) {
              // Si l'utilisateur est connecté, récupérer également son profil pour vérifier le rôle
              try {
                // Utiliser les métadonnées si disponibles pour éviter une requête inutile
                if (session.user.user_metadata?.role) {
                  // Récupérer le profil pour s'assurer que les métadonnées sont à jour
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, username, avatar_url, role')
                    .eq('id', session.user.id)
                    .single();
                    
                  if (!profileError && profile) {
                    // Synchroniser les données du profil avec les métadonnées si nécessaire
                    const needsMetadataUpdate = 
                      (profile.full_name && !session.user.user_metadata?.full_name) || 
                      (profile.full_name && session.user.user_metadata?.full_name !== profile.full_name) ||
                      (profile.username && !session.user.user_metadata?.username) ||
                      (profile.username && session.user.user_metadata?.username !== profile.username) ||
                      (profile.avatar_url && !session.user.user_metadata?.avatar_url) ||
                      (profile.avatar_url && session.user.user_metadata?.avatar_url !== profile.avatar_url) ||
                      (profile.role && session.user.user_metadata?.role !== profile.role);
                    
                    if (needsMetadataUpdate) {
                      // Mettre à jour les métadonnées silencieusement
                      const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
                        data: {
                          full_name: profile.full_name,
                          username: profile.username,
                          avatar_url: profile.avatar_url,
                          role: profile.role
                        }
                      });
                      
                      if (!updateError && updatedUser) {
                        // Utiliser les métadonnées mises à jour
                        setUser(updatedUser.user as EnhancedUser);
                      } else {
                        setUser(session.user as EnhancedUser);
                      }
                    } else {
                      setUser(session.user as EnhancedUser);
                    }
                  } else {
                    setUser(session.user as EnhancedUser);
                  }
                } else {
                  // Sinon, vérifier le profil
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, username, avatar_url, role')
                    .eq('id', session.user.id)
                    .single();
                    
                  if (!profileError && profile && profile.role) {
                    // Synchroniser les rôles si nécessaire
                    await syncUserRole(session.user.id, session.user.user_metadata?.role, profile.role);
                    
                    // Mettre à jour les métadonnées localement pour éviter une autre requête
                    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
                      data: {
                        full_name: profile.full_name,
                        username: profile.username,
                        avatar_url: profile.avatar_url,
                        role: profile.role
                      }
                    });
                    
                    if (!updateError && updatedUser) {
                      setUser(updatedUser.user as EnhancedUser);
                    } else {
                      const updatedUser = {
                        ...session.user,
                        user_metadata: {
                          ...session.user.user_metadata,
                          full_name: profile.full_name,
                          username: profile.username,
                          avatar_url: profile.avatar_url,
                          role: profile.role
                        }
                      };
                      
                      setUser(updatedUser as EnhancedUser);
                    }
                  } else {
                    setUser(session.user as EnhancedUser);
                  }
                }
              } catch (profileError) {
                console.error("Erreur lors de la récupération du profil:", profileError);
                setUser(session.user as EnhancedUser);
              }
            } else {
              setUser(null);
            }
          },
          'high' // Priorité élevée pour l'authentification
        );
      } catch (err) {
        console.error("Erreur lors de la vérification de la session:", err);
        setError(err);
        setUser(null);
      } finally {
        USER_SESSION_CACHE.pendingRequest = false;
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Optimiser en évitant les mises à jour inutiles
        if (!isMounted) return;
        
        console.log("Événement d'authentification:", event);
        
        // Mettre à jour le cache avec la nouvelle session
        if (session) {
          USER_SESSION_CACHE.session = session;
          USER_SESSION_CACHE.timestamp = Date.now();
          USER_SESSION_CACHE.expiresAt = Date.now() + SESSION_CACHE_DURATION;
          setUser(session.user as EnhancedUser);
        } else {
          USER_SESSION_CACHE.session = null;
          USER_SESSION_CACHE.timestamp = Date.now();
          USER_SESSION_CACHE.expiresAt = 0;
          setUser(null);
        }
        
        setLoading(false);
      }
    );
    
    return () => {
      isMounted = false;
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
      
      // Utiliser la fonction centralisée de déconnexion
      const result = await import('@/lib/auth').then(m => m.signOut());
      
      // Mise à jour de l'état local
      setUser(null);
      
      return result;
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