import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

interface UseAdminAuthReturn {
  user: any;
  loading: boolean;
  isAdmin: boolean;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkUserRole() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        // Vérifier le rôle de l'utilisateur dans la table profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Erreur lors de la vérification du rôle admin:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin');
        }
      } catch (error) {
        console.error('Exception lors de la vérification du rôle admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    
    if (!authLoading) {
      checkUserRole();
    }
  }, [user, authLoading]);
  
  return {
    user,
    loading: authLoading || loading,
    isAdmin
  };
} 