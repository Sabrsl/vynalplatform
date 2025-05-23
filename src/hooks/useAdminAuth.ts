import { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

interface UseAdminAuthReturn {
  user: any;
  loading: boolean;
  isAdmin: boolean;
  error?: Error | null;
}

/**
 * Hook optimisé pour vérifier si l'utilisateur est admin
 * Utilise les données déjà disponibles dans useAuth sans requête supplémentaire
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const { user, loading, hasRole } = useAuth();
  
  // Calculer isAdmin directement depuis les métadonnées
  const isAdmin = useMemo(() => {
    return hasRole('admin');
  }, [hasRole]);
  
  return {
    user,
    loading,
    isAdmin,
    error: null
  };
}

/**
 * Version alternative si vous voulez absolument vérifier dans la DB
 * (mais ce n'est pas recommandé car redondant)
 */
export function useAdminAuthWithDBCheck(): UseAdminAuthReturn {
  const { user, loading: authLoading, hasRole } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    // D'abord vérifier les métadonnées (cache)
    if (hasRole('admin')) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }
    
    // Si pas connecté, pas besoin de vérifier
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    // Seulement vérifier la DB si nécessaire
    async function checkUserRole() {
      try {
        if (!user) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!isMountedRef.current) return;
          
        if (error) {
          console.error('Erreur lors de la vérification du rôle admin:', error);
          setError(new Error(`Erreur de vérification: ${error.message}`));
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin');
        }
      } catch (err) {
        console.error('Exception lors de la vérification du rôle admin:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Erreur inconnue'));
          setIsAdmin(false);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }
    
    if (!authLoading) {
      checkUserRole();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user, authLoading, hasRole]);
  
  return {
    user,
    loading: authLoading || loading,
    isAdmin,
    error
  };
}