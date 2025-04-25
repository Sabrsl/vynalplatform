import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/types/database';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS, 
  CACHE_EXPIRY 
} from '@/lib/optimizations';
import { useLastRefresh } from './useLastRefresh';

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

interface UseUserOptions {
  useCache?: boolean;
}

export function useUser(options: UseUserOptions = {}) {
  const { useCache = false } = options;
  const { user } = useAuth({ useCache });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  
  // Référence unique pour éviter les requêtes simultanées
  const fetchingRef = useRef<boolean>(false);
  
  // Calcul memoïsé du rôle pour éviter les recalculs inutiles
  const userRole = useMemo(() => {
    return user?.user_metadata?.role || profile?.role || null;
  }, [user?.user_metadata?.role, profile?.role]);
  
  // Définir les rôles dérivés directement des valeurs calculées
  const isClient = userRole === 'client';
  const isFreelance = userRole === 'freelance';
  const isAdmin = userRole === 'admin';

  // Fonction memoïsée pour vérifier les permissions selon le rôle
  const canAccess = useCallback((requiredRoles: Array<'client' | 'freelance' | 'admin'>) => {
    return requiredRoles.includes(userRole as any);
  }, [userRole]);

  // Clé de cache simplifiée
  const getProfileCacheKey = useCallback(() => {
    if (!useCache) return null;
    return user?.id ? `${CACHE_KEYS.USER_PROFILE}_${user.id}` : null;
  }, [user?.id, useCache]);

  // Fonction centralisée pour récupérer le profil utilisateur
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    // Éviter les requêtes simultanées
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      setLoading(true);
      
      // Déterminer la clé de cache
      const cacheKey = getProfileCacheKey();
      
      // Vérifier le cache si l'option est activée et pas de rafraîchissement forcé
      if (useCache && !forceRefresh && cacheKey) {
        const cachedProfile = getCachedData<UserProfile>(cacheKey);
        const cacheTimestamp = getCachedData<number>(`${cacheKey}_timestamp`);
        const isCacheValid = cacheTimestamp && (Date.now() - cacheTimestamp < 300000); // 5 minutes
        
        if (cachedProfile && isCacheValid) {
          setProfile(cachedProfile);
          setLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      // Créer un profil partiel si le rôle est disponible en métadonnées et si l'option de cache est activée
      if (user.user_metadata?.role && !forceRefresh && useCache) {
        const partialProfile: UserProfile = {
          id: user.id,
          role: user.user_metadata.role as any,
          email: user.email || '',
          username: user.user_metadata?.username || null,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          created_at: '',
          updated_at: '',
          verification_level: null,
          last_seen: null,
          phone: null
        };
        
        setProfile(partialProfile);
        setLoading(false);
        
        // Mettre en cache provisoire et continuer le chargement complet en arrière-plan
        if (cacheKey) {
          setCachedData(cacheKey, partialProfile, { expiry: CACHE_EXPIRY.USER_SESSION_PARTIAL });
          setCachedData(`${cacheKey}_timestamp`, Date.now());
        }
        
        // Chargement en arrière-plan du profil complet
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setProfile(data);
              if (cacheKey) {
                setCachedData(cacheKey, data, { expiry: CACHE_EXPIRY.USER_PROFILE });
                setCachedData(`${cacheKey}_timestamp`, Date.now());
              }
              updateLastRefresh();
            }
          })
          .then(undefined, (e: Error) => {
            // Ignorer les erreurs en arrière-plan
            console.debug('Erreur lors du chargement du profil en arrière-plan:', e);
          })
          .then(() => {
            fetchingRef.current = false;
          });
          
        return;
      }

      // Chargement du profil complet directement
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Synchroniser le rôle si nécessaire
      if (data && !data.role && user.user_metadata?.role) {
        data.role = user.user_metadata.role;
        
        // Mise à jour en arrière-plan dans la base de données
        supabase
          .from('profiles')
          .update({ role: user.user_metadata.role })
          .eq('id', user.id)
          .then(() => {
            // Mise à jour réussie
          })
          .then(undefined, (e: Error) => {
            // Ignorer les erreurs en arrière-plan
            console.debug('Erreur lors de la mise à jour du rôle:', e);
          });
      }

      // Mise à jour de l'état et du cache
      setProfile(data);
      if (useCache && cacheKey) {
        setCachedData(cacheKey, data, { expiry: CACHE_EXPIRY.USER_PROFILE });
        setCachedData(`${cacheKey}_timestamp`, Date.now());
      }
      if (useCache) {
        updateLastRefresh();
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      fetchingRef.current = false;
    }
  }, [user, getProfileCacheKey, updateLastRefresh, useCache]);

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
      
      // Mettre à jour le cache si l'option est activée
      if (useCache) {
        const cacheKey = getProfileCacheKey();
        if (cacheKey) {
          setCachedData(cacheKey, data, { expiry: CACHE_EXPIRY.USER_PROFILE });
          setCachedData(`${cacheKey}_timestamp`, Date.now());
        }
        updateLastRefresh();
      }
      
      return { success: true, data };
    } catch (error: any) {
      setUpdateError(error);
      return { success: false, error };
    }
  }, [user, getProfileCacheKey, updateLastRefresh, useCache]);

  // Fonction publique pour forcer le rafraîchissement du profil
  const refreshProfile = useCallback(() => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    // Nettoyer le cache si l'option est activée
    if (useCache) {
      const cacheKey = getProfileCacheKey();
      if (cacheKey) {
        invalidateCache(cacheKey);
      }
    }
    
    // Recharger les données
    fetchProfile(true);
  }, [getProfileCacheKey, fetchProfile, isRefreshing, useCache]);

  // Initialisation et nettoyage au montage/démontage
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id, fetchProfile]);

  // Écouteur unifié d'événements d'application
  useEffect(() => {
    if (typeof window === 'undefined' || !useCache) return;
    
    const handleRefreshTrigger = () => {
      if (!isRefreshing && user) {
        refreshProfile();
      }
    };
    
    const isProfileRoute = (path: string) => 
      path?.includes('/profile') || path?.includes('/settings');
    
    const handleRouteChange = () => {
      if (isProfileRoute(window.location.pathname)) {
        handleRefreshTrigger();
      }
    };
    
    // Écouter les événements personnalisés de l'application
    window.addEventListener('cache-invalidation', handleRefreshTrigger);
    window.addEventListener('profile-refresh', handleRefreshTrigger);
    
    // Écouter les changements de route
    window.addEventListener('popstate', handleRouteChange);
    
    // Intercepter les méthodes history
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
    
    return () => {
      window.removeEventListener('cache-invalidation', handleRefreshTrigger);
      window.removeEventListener('profile-refresh', handleRefreshTrigger);
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [user, refreshProfile, isRefreshing, useCache]);

  return {
    profile,
    loading,
    error,
    updateError,
    updateProfile,
    refreshProfile,
    isClient,
    isFreelance,
    isAdmin,
    canAccess,
    lastRefresh: useCache ? lastRefresh : null,
    getLastRefreshText: useCache ? getLastRefreshText : () => '',
    isRefreshing
  };
} 