import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/types/database';
import { PostgrestError } from '@supabase/supabase-js';

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
  updateError: any;
  isClient: boolean;
  isFreelance: boolean;
  isAdmin: boolean;
  canAccess: (requiredRoles: Array<'client' | 'freelance' | 'admin'>) => boolean;
  getUserRole: () => 'client' | 'freelance' | 'admin' | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UpdateProfileResult>;
  refreshProfile: () => Promise<void>;
  isRefreshing: boolean;
}

// Cache global pour le profil utilisateur (réduit les requêtes inutiles)
const userProfileCache = new Map<string, {
  timestamp: number;
  data: UserProfile;
}>();

// Durée de validité du cache (2 minutes)
const PROFILE_CACHE_TTL = 2 * 60 * 1000;

// Constantes pour l'optimisation
const THROTTLE_MS = 3000; // Minimium 3 sec entre les rafraîchissements
const DEBOUNCE_MS = 300; // Délai pour débouncer les mises à jour d'UI

/**
 * Hook optimisé pour accéder et gérer le profil utilisateur actuel
 */
export function useUser(): UseUserResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Références pour éviter les conditions de course et limiter les requêtes
  const loadingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const pendingRefreshRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  
  // Valeurs dérivées mémorisées pour réduire les calculs répétés
  const isClient = useMemo(() => 
    user?.user_metadata?.role === 'client' || profile?.role === 'client',
    [user?.user_metadata?.role, profile?.role]
  );
  
  const isFreelance = useMemo(() => 
    user?.user_metadata?.role === 'freelance' || profile?.role === 'freelance',
    [user?.user_metadata?.role, profile?.role]
  );
  
  const isAdmin = useMemo(() => 
    user?.user_metadata?.role === 'admin' || profile?.role === 'admin',
    [user?.user_metadata?.role, profile?.role]
  );

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

  // Nettoyer les ressources pour éviter les fuites mémoire
  const cleanup = useCallback(() => {
    // Annuler la requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Annuler le timer de rafraîchissement
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // Supprimer l'abonnement Supabase
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
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

  // Rafraîchissement optimisé du profil
  const refreshProfile = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    // Vérifier le cache d'abord si on ne force pas le rafraîchissement
    if (!forceRefresh && userProfileCache.has(user.id)) {
      const cached = userProfileCache.get(user.id)!;
      
      // Si le cache est encore valide
      if (Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
        setProfile(cached.data);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
    }
    
    // Éviter les requêtes trop fréquentes
    const now = Date.now();
    if (isRefreshingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    
    // Throttling pour réduire les appels API
    if (!forceRefresh && now - lastFetchTimeRef.current < THROTTLE_MS) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      refreshTimerRef.current = setTimeout(() => {
        refreshProfile(forceRefresh);
      }, THROTTLE_MS);
      
      return;
    }
    
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Mettre à jour les références d'état
    isRefreshingRef.current = true;
    lastFetchTimeRef.current = now;
    setIsRefreshing(true);
    
    // Créer un nouveau contrôleur d'annulation
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
      
      // Traiter les rafraîchissements en attente
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        setTimeout(() => refreshProfile(false), THROTTLE_MS);
      }
    }
  }, [user]);

  // Effet pour récupérer et maintenir le profil utilisateur synchronisé
  useEffect(() => {
    const fetchProfile = async () => {
      // Si l'utilisateur n'est pas connecté, réinitialiser le profil
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Vérifier le cache d'abord
      if (userProfileCache.has(user.id)) {
        const cached = userProfileCache.get(user.id)!;
        
        // Si le cache est encore valide
        if (Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
          setProfile(cached.data);
          setLoading(false);
          return;
        }
      }
      
      // Éviter les chargements multiples
      if (loadingRef.current) return;
      loadingRef.current = true;
      
      try {
        setLoading(true);
        setError(null);
        
        // Annuler toute requête en cours
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Créer un nouveau contrôleur d'annulation
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
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
          
          setProfile(tempProfile);
          
          // Stocker également dans le cache temporairement
          userProfileCache.set(user.id, {
            timestamp: Date.now(),
            data: tempProfile
          });
          
          setLoading(false);
        }
        
        // Récupérer le profil complet depuis la base de données
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
        
        // Si le profil existe mais que le rôle est manquant, utiliser celui des métadonnées
        if (data && !data.role && user.user_metadata?.role) {
          data.role = user.user_metadata.role as any;
          
          // Mise à jour asynchrone du profil dans la base
          supabase
            .from('profiles')
            .update({ role: user.user_metadata.role })
            .eq('id', user.id)
            .then(() => {
              // Silently handle success/failure
            });
        }
        
        // Mettre à jour le cache avec les données complètes
        userProfileCache.set(user.id, {
          timestamp: Date.now(),
          data: data as UserProfile
        });
        
        // Mettre à jour le profil avec les données complètes de la base
        setProfile(data);
        setError(null);
      } catch (err: any) {
        // Ne pas afficher d'erreur si la requête a été délibérément annulée
        if (err.name !== 'AbortError') {
          console.error('Erreur lors du chargement du profil:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
        lastFetchTimeRef.current = Date.now();
      }
    };
    
    fetchProfile();
    
    // Nettoyage à la désinscription
    return cleanup;
  }, [user, cleanup]);

  // Abonnement aux changements en temps réel des profils
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    
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

  // Synchronisation efficace lors des changements de route
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    
    // Limiteur de débits pour éviter les rafraîchissements trop fréquents
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const handleRouteChange = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        // Vérifier le cache d'abord
        if (userProfileCache.has(user.id)) {
          const cached = userProfileCache.get(user.id)!;
          
          // Si le cache est encore valide, ne pas rafraîchir
          if (Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
            return;
          }
        }
        
        if (!isRefreshingRef.current && Date.now() - lastFetchTimeRef.current > THROTTLE_MS) {
          refreshProfile(false);
        }
      }, DEBOUNCE_MS);
    };
    
    // Écouter les événements de navigation
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('vynal:cache-invalidated', handleRouteChange);
    
    // Nettoyer à la désinscription
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('vynal:cache-invalidated', handleRouteChange);
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [user, refreshProfile]);

  // Retourner un objet mémoïsé pour éviter les recréations inutiles
  return useMemo(() => ({
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
    refreshProfile: () => refreshProfile(true),
    isRefreshing
  }), [
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
  ]);
} 