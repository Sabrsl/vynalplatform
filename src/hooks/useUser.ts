import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/types/database';

// Type pour le profil utilisateur complet
export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'client' | 'freelance' | 'admin';
  email: string | null;
  last_seen: string | null;
  verification_level: number | null;
  verified_at: string | null;
  phone: string | null;
};

export function useUser() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [updateError, setUpdateError] = useState<{ message: string; code: string } | null>(null);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, réinitialiser le profil
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Charger le profil de l'utilisateur
    const fetchProfile = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Erreur lors du chargement du profil:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
      
      setLoading(false);
    };
    
    fetchProfile();
    
    // Souscrire aux changements du profil en temps réel
    const subscription = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload: { new: any; old: any }) => {
        setProfile(payload.new as Profile);
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Fonction pour mettre à jour le profil
  const updateProfile = async (updates: Partial<Profile>) => {
    setIsLoading(true);
    try {
      // Filtrer les valeurs undefined, vides et null
      const filteredUpdates: Partial<Profile> = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ) as Partial<Profile>;
      
      // Si aucune valeur à mettre à jour, ne pas continuer
      if (Object.keys(filteredUpdates).length === 0) {
        console.log("Aucune donnée à mettre à jour");
        setUpdateError(null);
        return { success: true, data: null, error: null };
      }
      
      // Ajouter le timestamp updated_at
      const updatesWithTimestamp = {
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      };
      
      console.log("Mises à jour filtrées:", updatesWithTimestamp);
      
      const { data, error } = await supabase
        .from("profiles")
        .update(updatesWithTimestamp)
        .eq("id", user?.id)
        .select();
      
      if (error) {
        console.error("Erreur détaillée lors de la mise à jour du profil:", error);
        
        // Gestion spécifique des erreurs de contrainte unique
        if (error.code === '23505' || error.message?.includes('unique constraint')) {
          const message = "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre.";
          setUpdateError({ message, code: error.code });
          return { success: false, data: null, error: { message, code: error.code } };
        } 
        
        setUpdateError(error);
        return { success: false, data: null, error };
      }
      
      if (data && data.length > 0) {
        setProfile(data[0]);
        setUpdateError(null);
        return { success: true, data: data[0], error: null };
      } else {
        return { success: true, data: null, error: null };
      }
    } catch (error: any) {
      console.error("Erreur inattendue lors de la mise à jour du profil:", error);
      const errorMessage = error?.message || "Une erreur est survenue lors de la mise à jour du profil";
      setUpdateError({ message: errorMessage, code: error?.code || "UNKNOWN" });
      return { success: false, data: null, error: { message: errorMessage, code: error?.code || "UNKNOWN" } };
    } finally {
      setIsLoading(false);
    }
  };

  // Déterminer si l'utilisateur est un client, freelance ou admin
  const isClient = profile?.role === 'client';
  const isFreelance = profile?.role === 'freelance';
  const isAdmin = profile?.role === 'admin';

  return {
    profile,
    loading,
    updateProfile,
    isClient,
    isFreelance,
    isAdmin,
    isLoading,
    updateError,
  };
} 