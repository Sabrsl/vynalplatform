import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/types/database';
import { PostgrestError } from '@supabase/supabase-js';
import requestCoordinator from '@/lib/optimizations/requestCoordinator';

// Type pour le profil utilisateur
export interface UserProfile {
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
  last_data_download: string | null;
  last_profile_pdf_download: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  is_active: boolean | null;
  is_certified: boolean | null;
  certified_at: string | null;
  certification_type: 'standard' | 'premium' | 'expert' | null;
  user_settings?: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      orderUpdates: boolean;
      messages: boolean;
      marketing: boolean;
    };
    security: {
      twoFactor: boolean;
      emailVerification: boolean;
    };
  };
}

interface UpdateProfileResult {
  success: boolean;
  data?: UserProfile;
  error?: Error | PostgrestError;
}

interface UseUserResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateError: PostgrestError | null;
  isClient: boolean;
  isFreelance: boolean;
  isAdmin: boolean;
  canAccess: (requiredRoles: Array<'client' | 'freelance' | 'admin'>) => boolean;
  getUserRole: () => 'client' | 'freelance' | 'admin' | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UpdateProfileResult>;
  refreshProfile: () => Promise<void>;
  isRefreshing: boolean;
}

// Cache global optimisé pour les profils utilisateurs
const userProfileCache = new Map<string, { timestamp: number; data: UserProfile }>();

// Indicateur de requête en cours par userId pour éviter les requêtes simultanées
const pendingProfileRequests = new Set<string>();

// Fréquence minimale de rafraîchissement
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const THROTTLE_MS = 2000; // 2 secondes entre les requêtes

/**
 * Hook optimisé pour accéder et gérer le profil utilisateur actuel
 */
export function useUser(): UseUserResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<PostgrestError | null>(null);
  
  // Références pour contrôler le comportement du hook
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef<boolean>(true);
  const isRefreshingRef = useRef<boolean>(false);
  const pendingRefreshRef = useRef<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Fonction de nettoyage
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }
  }, []);

  // Options dérivées du profil
  const isClient = useMemo(() => profile?.role === 'client', [profile]);
  const isFreelance = useMemo(() => profile?.role === 'freelance', [profile]);
  const isAdmin = useMemo(() => Boolean(profile?.role === 'admin' || profile?.is_admin), [profile]);

  // Synchronisation des rôles entre les métadonnées et le profil
  const syncUserRole = useCallback(async (userId: string, metadataRole: string | undefined, profileRole: string | undefined): Promise<void> => {
    // Si les deux valeurs sont les mêmes ou manquantes, ne rien faire
    if (!metadataRole && !profileRole) return;
    if (metadataRole === profileRole) return;
    
    // Si la métadonnée a un rôle mais pas le profil, mettre à jour le profil
    if (metadataRole && !profileRole) {
      try {
        await supabase
          .from('profiles')
          .update({ role: metadataRole })
          .eq('id', userId);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle dans le profil:', error);
      }
    }
    
    // Si le profil a un rôle mais pas les métadonnées, mettre à jour les métadonnées
    if (profileRole && !metadataRole) {
      try {
        await supabase.auth.updateUser({
          data: { role: profileRole }
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle dans les métadonnées:', error);
      }
    }
    
    // Si les deux ont des valeurs différentes, privilégier le profil
    if (metadataRole && profileRole && metadataRole !== profileRole) {
      try {
        await supabase.auth.updateUser({
          data: { role: profileRole }
        });
      } catch (error) {
        console.error('Erreur lors de la synchronisation du rôle:', error);
      }
    }
  }, []);

  // Mise à jour du profil avec gestion optimisée des erreurs
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<UpdateProfileResult> => {
    if (!user) {
      return { success: false, error: new Error('Utilisateur non connecté') };
    }
    
    // Ne pas mettre à jour avec des valeurs vides si elles sont déjà nulles
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      // Ne pas inclure les propriétés undefined ou qui ne changent pas
      if (value !== undefined && profile?.[key as keyof UserProfile] !== value) {
        acc[key as keyof UserProfile] = value as any;
      }
      return acc;
    }, {} as Partial<UserProfile>);
    
    // Ne rien faire si aucune mise à jour n'est nécessaire
    if (Object.keys(cleanUpdates).length === 0) {
      return { success: true, data: profile as UserProfile };
    }
    
    // Ajouter le timestamp de mise à jour
    const updatesWithTimestamp = {
      ...cleanUpdates,
      updated_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatesWithTimestamp)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        setUpdateError(error);
        return { success: false, error };
      }
      
      // Mettre à jour le profil local
      setProfile(prev => prev ? { ...prev, ...data } : data);
      
      // Mettre à jour le cache
      if (user.id && data) {
        userProfileCache.set(user.id, {
          timestamp: Date.now(),
          data: data as UserProfile
        });
      }
      
      setUpdateError(null);
      return { success: true, data };
    } catch (error: any) {
      setUpdateError(error);
      return { success: false, error };
    }
  }, [user, profile]);

  // Rafraîchir le profil avec debounce et throttling
  const refreshProfile = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!user) {
      setIsRefreshing(false);
      return;
    }
    
    // Éviter les requêtes trop fréquentes à moins que forceRefresh ne soit true
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (!forceRefresh && timeSinceLastFetch < THROTTLE_MS) {
      // Si on est déjà en train de rafraîchir, marquer comme en attente
      if (isRefreshingRef.current) {
        pendingRefreshRef.current = true;
      } else {
        // Sinon, programmer un rafraîchissement après le délai
        setTimeout(() => {
          refreshProfile(false);
        }, THROTTLE_MS - timeSinceLastFetch);
      }
      return;
    }
    
    // Si déjà en cours de rafraîchissement, marquer comme en attente
    if (isRefreshingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    
    // Utiliser le coordinateur de requêtes pour éviter les appels multiples inutiles
    await requestCoordinator.scheduleRequest(
      `refresh_profile_${user.id}`,
      async () => {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        
        // Abandonner la requête précédente si elle existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Créer un nouveau contrôleur d'abandon
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .abortSignal(signal)
            .single();
            
          if (error) throw error;
          
          if (signal.aborted) {
            throw new Error('Requête annulée');
          }
          
          // Mettre à jour le cache
          if (data) {
            userProfileCache.set(user.id, {
              timestamp: Date.now(),
              data: data as UserProfile
            });
          }
          
          // Fusionner les données existantes avec les nouvelles pour éviter la perte d'information
          setProfile(prev => {
            // Si pas de données précédentes, utiliser les nouvelles
            if (!prev) return data;
            
            // Sinon, fusionner en privilégiant les nouvelles données
            return { ...prev, ...data };
          });
          
          setError(null);
        } catch (err: any) {
          // Ne pas afficher d'erreur si la requête a été délibérément annulée
          if (err.name !== 'AbortError') {
            console.error('Erreur lors du rafraîchissement du profil:', err);
          }
        } finally {
          setIsRefreshing(false);
          isRefreshingRef.current = false;
          lastFetchTimeRef.current = Date.now();
          
          // Traiter les rafraîchissements en attente
          if (pendingRefreshRef.current) {
            pendingRefreshRef.current = false;
            setTimeout(() => refreshProfile(false), THROTTLE_MS);
          }
        }
      },
      'medium' // Priorité moyenne pour les profils
    );
  }, [user]);

  // Effet pour charger le profil au montage et lors des changements d'utilisateur
  useEffect(() => {
    let isMounted = true;
    
    // Nettoyage des références au démontage
    loadingRef.current = true;
    setLoading(true);
    
    // Si pas d'utilisateur, ne rien faire
    if (!user) {
      setProfile(null);
      setLoading(false);
      loadingRef.current = false;
      return cleanup;
    }
    
    // Si une requête pour cet utilisateur est déjà en cours, ne pas en lancer une autre
    if (pendingProfileRequests.has(user.id)) {
      // Vérifier si on a des données en cache qu'on peut utiliser en attendant
      const cachedProfile = userProfileCache.get(user.id);
      if (cachedProfile) {
        setProfile(cachedProfile.data);
        setLoading(false);
      }
      return cleanup;
    }
    
    // Marquer cet utilisateur comme ayant une requête en cours
    pendingProfileRequests.add(user.id);
    
    // Abandonner la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau contrôleur d'abandon
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Utiliser le coordinateur de requêtes pour charger le profil
    requestCoordinator.scheduleRequest(
      `fetch_profile_${user.id}`,
      async () => {
        try {
          // Vérifier si on a déjà les données en cache
          const cachedProfile = userProfileCache.get(user.id);
          
          // Si le cache est valide et pas trop ancien, l'utiliser
          if (cachedProfile && Date.now() - cachedProfile.timestamp < CACHE_DURATION) {
            if (isMounted) {
              setProfile(cachedProfile.data);
              setLoading(false);
              loadingRef.current = false;
              lastFetchTimeRef.current = cachedProfile.timestamp;
            }
            pendingProfileRequests.delete(user.id);
            return;
          }
          
          // Si le rôle est déjà dans user_metadata, créer un profil temporaire
          // pendant le chargement des données complètes
          if (user.user_metadata?.role) {
            const tempProfile: UserProfile = {
              id: user.id,
              username: user.user_metadata?.username || null,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              email: user.email || null,
              role: user.user_metadata.role as 'client' | 'freelance' | 'admin',
              created_at: user.created_at,
              updated_at: user.updated_at || user.created_at,
              bio: user.user_metadata?.bio || null,
              verification_level: user.user_metadata?.verification_level || null,
              last_seen: null,
              phone: user.user_metadata?.phone || null,
              verified_at: null,
              last_data_download: null,
              last_profile_pdf_download: null,
              is_admin: user.user_metadata?.role === 'admin' || false,
              is_suspended: false,
              is_active: true,
              is_certified: false,
              certified_at: null,
              certification_type: null
            };
            
            if (isMounted) {
              setProfile(tempProfile);
              // On met à jour le loading ici pour avoir une interface réactive rapidement
              setLoading(false);
            }
            
            // Stocker également dans le cache temporairement
            userProfileCache.set(user.id, {
              timestamp: Date.now(),
              data: tempProfile
            });
          }
          
          // Récupérer le profil complet depuis la base de données
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .abortSignal(signal)
            .single();
            
          if (error) {
            if (error.code === 'PGRST116') {
              // Si le profil n'existe pas, on peut arrêter la requête et utiliser 
              // les métadonnées comme source de vérité
              pendingProfileRequests.delete(user.id);
              return;
            }
            throw error;
          }
          
          if (signal.aborted) {
            throw new Error('Requête annulée');
          }
          
          // Si le profil existe mais que le rôle est manquant, utiliser celui des métadonnées
          if (data && !data.role && user.user_metadata?.role) {
            data.role = user.user_metadata.role as any;
            
            // Mise à jour asynchrone du profil dans la base mais sans attendre le résultat
            supabase
              .from('profiles')
              .update({ role: user.user_metadata.role })
              .eq('id', user.id)
              .then(() => {
                // Silently handle success/failure
              });
          }
          
          // Synchroniser les métadonnées de l'utilisateur avec les données du profil
          if (data) {
            // Mettre à jour les métadonnées d'authentification si nécessaires
            const needsMetadataUpdate = 
              (data.full_name && !user.user_metadata?.full_name) || 
              (data.full_name && user.user_metadata?.full_name !== data.full_name) ||
              (data.username && !user.user_metadata?.username) ||
              (data.username && user.user_metadata?.username !== data.username) ||
              (data.avatar_url && !user.user_metadata?.avatar_url) ||
              (data.avatar_url && user.user_metadata?.avatar_url !== data.avatar_url);
              
            if (needsMetadataUpdate) {
              // Mettre à jour les métadonnées silencieusement
              supabase.auth.updateUser({
                data: {
                  full_name: data.full_name,
                  username: data.username,
                  avatar_url: data.avatar_url,
                  role: data.role // S'assurer que le rôle est également synchronisé
                }
              }).then(({ data: authData, error }) => {
                if (!error && authData?.user) {
                  console.log('Métadonnées d\'authentification mises à jour avec succès');
                }
              });
            }
          }
          
          // Mettre à jour le cache avec les données complètes
          userProfileCache.set(user.id, {
            timestamp: Date.now(),
            data: data as UserProfile
          });
          
          // Mettre à jour le profil avec les données complètes de la base uniquement si le composant est toujours monté
          if (isMounted) {
            setProfile(data);
            setError(null);
            setLoading(false);
            loadingRef.current = false;
            lastFetchTimeRef.current = Date.now();
          }
        } catch (err: any) {
          // Ne pas afficher d'erreur si la requête a été délibérément annulée
          if (err.name !== 'AbortError' && isMounted) {
            console.error('Erreur lors du chargement du profil:', err);
            setError(err.message);
          }
        } finally {
          pendingProfileRequests.delete(user.id);
          if (isMounted) {
            setLoading(false);
            loadingRef.current = false;
          }
        }
      },
      'high' // Priorité élevée pour le chargement initial du profil
    );
    
    // Nettoyage à la désinscription
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [user, cleanup]);

  // Abonnement aux changements en temps réel des profils
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    
    // Ne pas créer d'abonnement multiple
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }
    
    // Abonnement aux changements de profil en temps réel
    const subscription = supabase
      .channel(`profile-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        // Mettre à jour le profil avec les nouvelles données
        const newProfileData = payload.new as UserProfile;
        
        // Mettre à jour le cache
        userProfileCache.set(user.id, {
          timestamp: Date.now(),
          data: newProfileData
        });
        
        // Mettre à jour le profil dans l'état
        setProfile(prev => ({
          ...prev,
          ...newProfileData
        }));
      })
      .subscribe();
    
    // Stocker la référence de l'abonnement
    subscriptionRef.current = subscription;
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Fonction mémorisée pour vérifier les permissions
  const canAccess = useCallback((requiredRoles: Array<'client' | 'freelance' | 'admin'>): boolean => {
    // Vérifier d'abord user_metadata pour éviter des requêtes inutiles
    if (user?.user_metadata?.role && requiredRoles.includes(user.user_metadata.role as any)) {
      return true;
    }
    
    // Ensuite vérifier le profil
    if (profile?.role && requiredRoles.includes(profile.role)) {
      return true;
    }
    
    return false;
  }, [user?.user_metadata?.role, profile?.role]);
  
  // Obtenir le rôle utilisateur actuel
  const getUserRole = useCallback((): ('client' | 'freelance' | 'admin' | null) => {
    return (user?.user_metadata?.role as any) || profile?.role || null;
  }, [user?.user_metadata?.role, profile?.role]);

  return {
    profile,
    loading,
    error,
    isRefreshing,
    updateError,
    isClient,
    isFreelance,
    isAdmin,
    refreshProfile,
    updateProfile,
    canAccess,
    getUserRole
  };
} 