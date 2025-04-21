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
}

export function useUser() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  return {
    profile,
    loading,
    error,
    isClient,
    isFreelance,
    isAdmin,
    canAccess,
    getUserRole,
  };
} 