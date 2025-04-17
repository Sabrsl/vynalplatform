import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/types/database';

// Type pour le profil utilisateur complet
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  last_seen?: string | null;
};

export function useUser() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Mettre à jour le profil utilisateur
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Utilisateur non authentifié');
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { success: false, error };
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
  };
} 