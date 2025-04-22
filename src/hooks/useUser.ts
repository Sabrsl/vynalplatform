import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/types/database';

// Type pour le profil utilisateur
export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: 'client' | 'freelance' | 'admin' | null;
  created_at: string;
  updated_at: string;
  bio: string | null;
  verification_level: number | null;
  last_seen: string | null;
  phone: string | null;
}

export function useUser() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Définir les rôles dérivés directement pour réduire les calculs répétés
  // Vérifier d'abord dans user_metadata pour une réponse immédiate si possible
  const isClient = user?.user_metadata?.role === 'client' || profile?.role === 'client';
  const isFreelance = user?.user_metadata?.role === 'freelance' || profile?.role === 'freelance';
  const isAdmin = user?.user_metadata?.role === 'admin' || profile?.role === 'admin';

  // Memoizer les fonctions pour éviter des recalculs
  const canAccess = useCallback((requiredRoles: Array<'client' | 'freelance' | 'admin'>) => {
    // Vérifier d'abord user_metadata pour éviter des requêtes inutiles
    if (user?.user_metadata?.role && requiredRoles.includes(user.user_metadata.role as any)) {
      return true;
    }
    
    // Ensuite vérifier le profil
    if (profile?.role && requiredRoles.includes(profile.role as any)) {
      return true;
    }
    
    return false;
  }, [user?.user_metadata?.role, profile?.role]);
  
  const getUserRole = useCallback(() => {
    return user?.user_metadata?.role || profile?.role || null;
  }, [user?.user_metadata?.role, profile?.role]);

  // Fonction pour mettre à jour le profil utilisateur
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, error: new Error('Utilisateur non connecté') };
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        setUpdateError(error);
        return { success: false, error };
      }
      
      setProfile(data);
      return { success: true, data };
    } catch (error: any) {
      setUpdateError(error);
      return { success: false, error };
    }
  }, [user]);

  // Fonction pour rafraîchir explicitement le profil utilisateur
  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      setProfile(data);
    } catch (err: any) {
      console.error('Erreur lors du rafraîchissement du profil:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  // Récupérer le profil utilisateur depuis Supabase, mais seulement si nécessaire
  useEffect(() => {
    const fetchProfile = async () => {
      // Si l'utilisateur n'est pas connecté, réinitialiser le profil
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Si le rôle est déjà dans user_metadata, pas besoin de chercher tout de suite
      if (user.user_metadata?.role) {
        setLoading(false);
        
        // Fetch profile in background for complete data
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (!error && data) {
            setProfile(data);
          }
        } catch (err) {
          // Ignorer les erreurs en arrière-plan
        }
        
        return;
      }

      // Sinon, chercher le profil complet
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Si le profil existe mais que le rôle est manquant, utiliser celui des métadonnées
        if (data && !data.role && user.user_metadata?.role) {
          // Mettre à jour le profil avec le rôle des métadonnées utilisateur
          await supabase
            .from('profiles')
            .update({ role: user.user_metadata.role })
            .eq('id', user.id);
            
          data.role = user.user_metadata.role;
        }

        setProfile(data);
      } catch (err: any) {
        // Supprimer le log d'erreur en production, utiliser seulement pour le débogage
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Écouter les changements de route pour rafraîchir le profil
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRouteChange = () => {
      if (!isRefreshing && user) {
        refreshProfile();
      }
    };
    
    // Écouter l'événement popstate pour les retours en arrière
    window.addEventListener('popstate', handleRouteChange);
    
    // Intercepter les méthodes history.pushState et history.replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments as any);
      handleRouteChange();
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments as any);
      handleRouteChange();
    };
    
    // Écouter l'événement personnalisé d'invalidation du cache
    window.addEventListener('vynal:cache-invalidated', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('vynal:cache-invalidated', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [user, isRefreshing, refreshProfile]);

  return {
    profile,
    loading,
    error,
    updateError,
    isClient,
    isFreelance,
    isAdmin,
    canAccess,
    getUserRole,
    updateProfile,
    refreshProfile,
    isRefreshing
  };
} 