import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';
import { UserProfile } from '@/types';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS, 
  CACHE_EXPIRY 
} from '@/lib/optimizations';
import { useLastRefresh } from './useLastRefresh';

export function useOptimizedUser() {
  const { user } = useOptimizedAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  
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

  // Générer une clé de cache unique pour ce profil utilisateur
  const getProfileCacheKey = useCallback(() => {
    if (!user?.id) return null;
    return `${CACHE_KEYS.USER_PROFILE}${user.id}`;
  }, [user?.id]);

  // Récupérer le profil utilisateur depuis Supabase, mais seulement si nécessaire
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    // Si l'utilisateur n'est pas connecté, réinitialiser le profil
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    // Déterminer la clé de cache
    const cacheKey = getProfileCacheKey();
    
    // Si ce n'est pas un forceRefresh, vérifier d'abord le cache
    if (!forceRefresh && cacheKey) {
      const cachedProfile = getCachedData<UserProfile>(cacheKey);
      
      if (cachedProfile) {
        setProfile(cachedProfile);
        setLoading(false);
        
        // Rafraîchir en arrière-plan
        refreshProfileInBackground();
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);

      // Si le rôle est déjà dans user_metadata, optimiser la charge
      if (user.user_metadata?.role && !forceRefresh) {
        // Construire un profil partiel avec les données disponibles
        const partialProfile: UserProfile = {
          id: user.id,
          role: user.user_metadata.role as any,
          email: user.email || '',
          // Autres champs avec valeurs par défaut
          username: user.user_metadata?.username || null,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          created_at: null,
          updated_at: null
        };
        
        setProfile(partialProfile);
        setLoading(false);
        
        // Mettre en cache provisoirement
        if (cacheKey) {
          setCachedData(cacheKey, partialProfile, { 
            expiry: CACHE_EXPIRY.USER_SESSION_PARTIAL 
          });
        }
        
        // Continuer à charger le profil complet en arrière-plan
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (!error && data) {
            setProfile(data);
            
            // Mettre en cache le profil complet
            if (cacheKey) {
              setCachedData(cacheKey, data, { expiry: CACHE_EXPIRY.USER_PROFILE });
            }
            
            // Mettre à jour le dernier rafraîchissement
            updateLastRefresh();
          }
        } catch (err) {
          // Ignorer les erreurs en arrière-plan
        }
        
        return;
      }

      // Sinon, chercher le profil complet
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
      
      // Mettre en cache
      if (cacheKey) {
        setCachedData(cacheKey, data, { expiry: CACHE_EXPIRY.USER_PROFILE });
      }
      
      // Mettre à jour le dernier rafraîchissement
      updateLastRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, getProfileCacheKey, updateLastRefresh]);

  // Rafraîchir le profil en arrière-plan
  const refreshProfileInBackground = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchProfile(true);
  }, [isRefreshing, fetchProfile]);

  // Forcer un rafraîchissement complet du profil
  const refreshProfile = useCallback(() => {
    setLoading(true);
    
    // Invalider le cache explicitement
    const cacheKey = getProfileCacheKey();
    if (cacheKey) {
      invalidateCache(cacheKey);
    }
    
    // Recharger les données
    fetchProfile(true);
  }, [getProfileCacheKey, fetchProfile]);

  // Effet d'initialisation
  useEffect(() => {
    fetchProfile();
  }, [user, fetchProfile]);

  // Écouter les événements d'invalidation de cache
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Fonction de gestionnaire d'événement pour rafraîchir les données lorsque le cache est invalidé
    const handleCacheInvalidation = () => {
      console.log('Cache invalidé - rafraîchissement du profil utilisateur');
      refreshProfileInBackground();
    };
    
    // Écouter l'événement custom d'invalidation du cache
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    };
  }, [refreshProfileInBackground]);

  return {
    profile,
    loading,
    error,
    isClient,
    isFreelance,
    isAdmin,
    canAccess,
    getUserRole,
    refreshProfile,
    isRefreshing,
    lastRefresh,
    getLastRefreshText
  };
} 