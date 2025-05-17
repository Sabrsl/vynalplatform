import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { useUser } from './useUser';
import { CACHE_EXPIRY } from '@/lib/optimizations/cache';

// Types pour les services
export type Service = Database['public']['Tables']['services']['Row'];

export type ServiceWithFreelanceAndCategories = Service & {
  profiles: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
    role?: string | null;
    bio?: string | null;
    is_certified?: boolean;
    certification_type?: 'standard' | 'premium' | 'expert' | null;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
  };
  subcategories: {
    id: string;
    name: string;
    slug: string;
  } | null;
  active?: boolean;
  slug?: string;
  moderation_comment?: string;
  admin_notes?: string | null;
};

interface UseServicesParams {
  categoryId?: string;
  subcategoryId?: string;
  freelanceId?: string;
  active?: boolean;
  limit?: number;
}

interface CreateServiceParams extends Omit<Partial<Service>, 'id' | 'created_at' | 'updated_at'> {
  freelance_id: string;
  images?: string[];
  delivery_time?: number;
  slug?: string;
  active?: boolean;
  subcategory_id?: string | null;
}

interface UpdateServiceParams {
  title?: string;
  description?: string;
  price?: number;
  category_id?: string;
  subcategory_id?: string | null;
  status?: 'active' | 'pending' | 'approved' | 'rejected';
  images?: string[];
  active?: boolean | string;
  moderation_comment?: string;
  delivery_time?: number;
  slug?: string;
}

interface ServiceResult<T> {
  success: boolean;
  service?: T;
  error?: string | PostgrestError;
}

interface UseServicesResult {
  services: ServiceWithFreelanceAndCategories[];
  loading: boolean;
  error: string | null;
  getServiceById: (id: string) => Promise<{ service: ServiceWithFreelanceAndCategories | null, error: string | null }>;
  getServiceBySlug: (slug: string) => Promise<{ service: ServiceWithFreelanceAndCategories | null, error: string | null }>;
  createService: (serviceData: CreateServiceParams) => Promise<ServiceResult<Service>>;
  updateService: (serviceId: string, updates: UpdateServiceParams) => Promise<ServiceResult<Service>>;
  deleteService: (id: string) => Promise<{ success: boolean, error?: string }>;
  fetchServices: () => Promise<void>;
  isRefreshing: boolean;
}

// Constantes d'optimisation
const DEFAULT_THROTTLE_MS = 2000; // Temps minimum entre les rafraîchissements
const DEFAULT_SERVICE_FIELDS = `
  *,
  profiles (id, username, full_name, avatar_url, bio, email, role, is_certified, certification_type),
  categories (id, name, slug),
  subcategories (id, name, slug)
`;

// Durée de validité du cache en ms (mise à jour pour utiliser les constantes)
const CACHE_TTL = CACHE_EXPIRY.SERVICES;
const VALIDATED_SERVICES_CACHE_TTL = CACHE_EXPIRY.VALIDATED_SERVICES;

// Cache en mémoire pour stocker les services transformés
const servicesCache = new Map<string, {
  timestamp: number;
  data: ServiceWithFreelanceAndCategories[];
}>();

// Cache spécifique pour les services individuels consultés récemment
const recentServiceCache = new Map<string, {
  timestamp: number;
  data: ServiceWithFreelanceAndCategories;
}>();

// Fonction globale pour invalider le cache d'un service spécifique
export const invalidateServiceCache = (serviceId: string) => {
  // Invalider dans le cache des services individuels
  recentServiceCache.delete(serviceId);
  
  // Invalider dans le cache des listes
  servicesCache.forEach((cacheEntry, key) => {
    const hasService = cacheEntry.data.some(service => service.id === serviceId);
    if (hasService) {
      servicesCache.delete(key);
    }
  });
  
  // Émettre un événement pour informer tous les composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:service-updated', { 
      detail: { serviceId, type: 'status-change' }
    }));
  }
};

/**
 * Détermine la durée de cache appropriée pour un service
 * @param service Le service à évaluer
 * @returns La durée de cache en ms
 */
const getServiceCacheTTL = (service: ServiceWithFreelanceAndCategories | null): number => {
  if (!service) return CACHE_TTL;
  
  // Si le service est validé par l'admin, utiliser une durée plus longue
  if (service.status === 'approved') {
    return VALIDATED_SERVICES_CACHE_TTL;
  }
  
  return CACHE_TTL;
};

/**
 * Hook optimisé pour accéder et gérer les services.
 * Inclut le chargement, la création, la mise à jour et la suppression des services.
 */
export function useServices(params: UseServicesParams = {}): UseServicesResult {
  // États
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Références pour éviter les conditions de course
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const subscriptionRef = useRef<any>(null);
  const cacheInvalidationListenerRef = useRef<((e: Event) => void) | null>(null);
  
  // Extraire l'objet profile du hook useUser
  const { profile } = useUser();
  
  // Extraire les paramètres avec mémoisation pour éviter des recréations inutiles
  const { categoryId, subcategoryId, freelanceId, active, limit } = params;
  
  // Signature unique des paramètres pour détecter les changements
  const paramsSignature = useMemo(() => {
    return JSON.stringify({ categoryId, subcategoryId, freelanceId, active, limit });
  }, [categoryId, subcategoryId, freelanceId, active, limit]);

  // Fonction optimisée pour transformer les données de service (avec mémoisation)
  const transformService = useCallback((data: any): ServiceWithFreelanceAndCategories => {
    if (!data) {
      throw new Error('Données de service invalides');
    }
    
    // Utiliser l'ID comme clé unique pour ne pas transformer inutilement
    const cacheKey = `service_${data.id}`;
    
    // Vérifier si le service est déjà transformé dans notre cache local
    if ((window as any).__serviceTransformCache?.[cacheKey]) {
      return (window as any).__serviceTransformCache[cacheKey];
    }
    
    // Initialiser le cache s'il n'existe pas
    if (!(window as any).__serviceTransformCache) {
      (window as any).__serviceTransformCache = {};
    }
    
    // Transformer et mettre en cache
    const transformedService = {
      ...data,
      profiles: data.profiles || {
        id: data.freelance_id || '',
        username: 'utilisateur',
        full_name: 'Utilisateur',
        avatar_url: null,
        bio: null,
        is_certified: false,
        certification_type: null
      },
      categories: data.categories || {
        id: data.category_id || '',
        name: 'Catégorie',
        slug: 'categorie'
      },
      subcategories: data.subcategories || null,
      moderation_comment: data.admin_notes || null
    };
    
    // Stocker dans notre cache local
    (window as any).__serviceTransformCache[cacheKey] = transformedService;
    
    return transformedService;
  }, []);

  // Nettoyer les anciens abonnements et écouteurs
  const cleanup = useCallback(() => {
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Supprimer l'abonnement Supabase actif
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Nettoyer l'écouteur d'invalidation du cache
    if (cacheInvalidationListenerRef.current) {
      window.removeEventListener('vynal:cache-invalidated', cacheInvalidationListenerRef.current as EventListener);
      cacheInvalidationListenerRef.current = null;
    }
  }, []);

  // Fonction pour charger les services avec gestion des erreurs améliorée
  const fetchServices = useCallback(async (forceFetch: boolean = false): Promise<void> => {
    // Vérifier d'abord le cache avant de faire une requête réseau
    if (!forceFetch) {
      const cachedData = servicesCache.get(paramsSignature);
      
      // Pour les services en liste, on utilise la durée standard
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
        setServices(cachedData.data);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
    }
    
    // Éviter les requêtes simultanées ou trop fréquentes
    const now = Date.now();
    if (loadingRef.current || (!forceFetch && now - lastFetchTimeRef.current < DEFAULT_THROTTLE_MS && services.length > 0)) {
      setIsRefreshing(true);
      return;
    }
    
    // Mettre à jour les références d'état
    loadingRef.current = true;
    lastFetchTimeRef.current = now;
    
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau contrôleur d'annulation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Initialiser les états
    setLoading(services.length === 0);
    setIsRefreshing(services.length > 0);
    setError(null);
    
    try {
      // Construire la requête
      let query = supabase
        .from('services')
        .select(DEFAULT_SERVICE_FIELDS)
        .abortSignal(signal);
      
      // Appliquer les filtres en fonction des paramètres
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
      }
      
      if (freelanceId) {
        query = query.eq('freelance_id', freelanceId);
      }
      
      // Par défaut, ne montrer que les services actifs sauf indication contraire
      if (active !== undefined) {
        query = query.eq('active', active);
      } else {
        query = query.eq('active', true);
      }
      
      // Limiter le nombre de résultats si demandé
      if (limit && typeof limit === 'number' && limit > 0) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      // Vérifier si la requête a été annulée délibérément
      if (signal.aborted) {
        // Requête annulée, ne rien faire
        console.log('Requête de services annulée');
        loadingRef.current = false;
        return;
      }
      
      if (error) {
        throw error;
      }
      
      // Transformer les données
      const transformedServices = (data || []).map(transformService);
      
      // Mettre en cache les données pour les requêtes futures
      servicesCache.set(paramsSignature, {
        timestamp: Date.now(),
        data: transformedServices
      });
      
      // Mettre à jour l'état
      setServices(transformedServices);
    } catch (err: any) {
      // Ne pas définir d'erreur si la requête a été annulée délibérément
      if (
        err.name === 'AbortError' || 
        err.message === 'AbortError' || 
        err.message === 'The user aborted a request.' || 
        err.message?.includes('aborted') || 
        err.message?.includes('abort') || 
        err.message?.includes('signal is aborted')
      ) {
        console.log('Requête de services annulée');
      } else {
        console.error('Erreur lors du chargement des services');
        setError(`Erreur lors du chargement des services: ${err.message || 'Erreur inconnue'}`);
      }
    } finally {
      // Mettre à jour les états
      if (!signal.aborted) {
        setLoading(false);
        setIsRefreshing(false);
      }
      loadingRef.current = false;
    }
  }, [categoryId, subcategoryId, freelanceId, active, limit, paramsSignature, services.length, transformService]);

  // Récupérer un service par son ID (avec cache en mémoire optimisé)
  const getServiceById = useCallback(async (id: string) => {
    if (!id) {
      return { service: null, error: 'ID non fourni' };
    }
    
    try {
      // Vérifier d'abord le cache
      const cachedService = recentServiceCache.get(id);
      if (cachedService) {
        const cacheTTL = getServiceCacheTTL(cachedService.data);
        if ((Date.now() - cachedService.timestamp) < cacheTTL) {
          return { service: cachedService.data, error: null };
        }
      }
      
      // Ensuite vérifier dans le cache des listes
      const cachedServices = Array.from(servicesCache.values()).flatMap(cache => cache.data);
      const cachedListService = cachedServices.find(s => s.id === id);
      
      if (cachedListService) {
        // Mettre à jour aussi le cache individuel
        recentServiceCache.set(id, {
          timestamp: Date.now(),
          data: cachedListService
        });
        return { service: cachedListService, error: null };
      }
      
      // Créer un nouveau contrôleur d'annulation pour cette requête spécifique
      const abortController = new AbortController();
      const signal = abortController.signal;
      
      console.log(`Récupération du service ${id} depuis la base de données`);
      
      // Pour les freelances, utiliser une requête qui vérifie aussi les services inactifs 
      // et les services dont ils sont propriétaires
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles:freelance_id (
            id, 
            username, 
            full_name, 
            avatar_url, 
            email, 
            role,
            bio,
            is_certified,
            certification_type
          ),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('id', id)
        .abortSignal(signal)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return { service: null, error: 'Service introuvable' };
        }
        console.error('Erreur lors du chargement du service');
        return { service: null, error: fetchError.message || 'Erreur lors du chargement du service' };
      }
      
      if (!data) {
        return { service: null, error: 'Service introuvable' };
      }
      
      // Vérifier les permissions si le profil existe
      if (profile && data.freelance_id !== profile.id && profile.role !== 'admin' && !data.active) {
        console.warn("Accès refusé: Service inactif et l'utilisateur n'est pas le propriétaire ou admin");
        return { service: null, error: 'Vous n\'êtes pas autorisé à accéder à ce service' };
      }
      
      const transformedService = {
        ...data,
        profiles: data.profiles || {
          id: data.freelance_id || '',
          username: 'utilisateur',
          full_name: 'Utilisateur',
          avatar_url: null,
          bio: null,
          is_certified: false,
          certification_type: null
        },
        categories: data.categories || {
          id: data.category_id || '',
          name: 'Catégorie',
          slug: 'categorie'
        },
        subcategories: data.subcategories || null,
        active: data.active === true || data.active === 'true',
        moderation_comment: data.moderation_comment || data.admin_notes || null,
      };
      
      // Mettre à jour le cache des services individuels
      recentServiceCache.set(id, {
        timestamp: Date.now(),
        data: transformedService
      });
      
      // S'abonner aux mises à jour de ce service spécifique
      setupServiceSubscription(id);
      
      return { 
        service: transformedService, 
        error: null 
      };
    } catch (err: any) {
      console.warn('Erreur lors de la récupération du service:', err);
      return { 
        service: null, 
        error: err.message || 'Une erreur est survenue lors du chargement du service' 
      };
    }
  }, [profile]);

  // Fonction pour configurer un abonnement à un service spécifique
  const serviceSubscriptions = new Map<string, { channel: any }>();

  const setupServiceSubscription = useCallback((serviceId: string) => {
    // Éviter les abonnements en double
    if (serviceSubscriptions.has(serviceId)) {
      return;
    }
    
    console.log(`Configuration de l'abonnement pour le service ${serviceId}`);
    
    // Créer un canal de souscription pour ce service spécifique
    const channel = supabase
      .channel(`service-realtime-${serviceId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'services',
          filter: `id=eq.${serviceId}`
        }, 
        (payload) => {
          console.log(`Mise à jour reçue pour le service ${serviceId}:`, payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            // Mettre à jour le cache individuel avec les nouvelles données
            const cachedService = recentServiceCache.get(serviceId);
            
            if (cachedService) {
              const updatedService = { 
                ...cachedService.data, 
                ...payload.new,
                // Préserver les relations qui ne sont pas dans la payload
                profiles: cachedService.data.profiles,
                categories: cachedService.data.categories,
                subcategories: cachedService.data.subcategories,
              };
              
              // Mettre à jour le cache
              recentServiceCache.set(serviceId, {
                timestamp: Date.now(),
                data: updatedService
              });
              
              // Invalider tous les caches de liste contenant ce service
              invalidateServiceCache(serviceId);
              
              // Notifier les composants de l'interface utilisateur
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('vynal:service-status-change', { 
                  detail: { 
                    serviceId,
                    status: payload.new.status,
                    active: payload.new.active,
                  }
                }));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // Supprimer du cache et notifier
            recentServiceCache.delete(serviceId);
            invalidateServiceCache(serviceId);
          }
        })
      .subscribe();

    // Stocker l'abonnement pour le nettoyage ultérieur
    serviceSubscriptions.set(serviceId, { channel });
    
    return () => {
      // Fonction de nettoyage
      if (serviceSubscriptions.has(serviceId)) {
        const subscription = serviceSubscriptions.get(serviceId);
        if (subscription) {
          supabase.removeChannel(subscription.channel);
          serviceSubscriptions.delete(serviceId);
          console.log(`Abonnement supprimé pour le service ${serviceId}`);
        }
      }
    };
  }, []);

  // Nettoyer les abonnements inutilisés périodiquement
  useEffect(() => {
    // Nettoyer les abonnements aux services qui ne sont plus dans le cache
    const cleanupInterval = setInterval(() => {
      const currentServiceIds = Array.from(recentServiceCache.keys());
      
      serviceSubscriptions.forEach((_, serviceId) => {
        if (!currentServiceIds.includes(serviceId)) {
          const unsubscribe = setupServiceSubscription(serviceId);
          if (unsubscribe) unsubscribe();
        }
      });
    }, 5 * 60 * 1000); // Vérifier toutes les 5 minutes
    
    return () => clearInterval(cleanupInterval);
  }, [setupServiceSubscription]);

  // Récupérer un service par son slug (avec cache en mémoire)
  const getServiceBySlug = useCallback(async (slug: string) => {
    if (!slug) {
      return { service: null, error: 'Slug non fourni' };
    }
    
    try {
      // Vérifier si le service est dans le cache
      const cachedServices = Array.from(servicesCache.values()).flatMap(cache => cache.data);
      const cachedService = cachedServices.find(s => s.slug === slug);
      
      if (cachedService) {
        // Utiliser le TTL dynamique selon le statut du service
        const cacheTTL = getServiceCacheTTL(cachedService);
        const cacheEntry = Array.from(servicesCache.entries()).find(
          ([_, entry]) => entry.data.some(s => s.slug === slug)
        );
        
        if (cacheEntry && (Date.now() - cacheEntry[1].timestamp) < cacheTTL) {
          return { service: cachedService, error: null };
        }
      }
      
      // Créer un nouveau contrôleur d'annulation pour cette requête spécifique
      const abortController = new AbortController();
      const signal = abortController.signal;
      
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(DEFAULT_SERVICE_FIELDS)
        .eq('slug', slug)
        .eq('active', true)
        .abortSignal(signal)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return { service: null, error: 'Service introuvable' };
        }
        throw fetchError;
      }
      
      if (!data) {
        return { service: null, error: 'Service introuvable' };
      }
      
      const transformedService = transformService(data);
      
      // Mettre à jour le cache pour ce service individuel
      const cacheKey = `service_slug_${slug}`;
      servicesCache.set(cacheKey, {
        timestamp: Date.now(),
        data: [transformedService]
      });
      
      // Aussi stocker dans le cache individuel des services par ID pour les recherches futures
      recentServiceCache.set(transformedService.id, {
        timestamp: Date.now(),
        data: transformedService
      });
      
      return { 
        service: transformedService, 
        error: null 
      };
    } catch (err: any) {
      console.warn('Erreur lors de la récupération du service par slug:', err);
      return { 
        service: null, 
        error: 'Erreur de chargement du service' 
      };
    }
  }, [transformService, getServiceCacheTTL]);

  // Créer un nouveau service
  const createService = useCallback(async (serviceData: CreateServiceParams): Promise<ServiceResult<Service>> => {
    if (!profile) {
      return { success: false, error: 'Vous devez être connecté pour créer un service' };
    }
    
    try {
      const { images, ...serviceFields } = serviceData;
      
      // Vérifier que l'utilisateur est bien le propriétaire du service ou un admin
      if (serviceFields.freelance_id !== profile.id && profile.role !== 'admin') {
        return { success: false, error: 'Vous n\'êtes pas autorisé à créer ce service' };
      }

      // Vérifier le nombre de services actifs pour les freelances sans badge de certification expert
      if (profile.role !== 'admin' && (!profile.is_certified || profile.certification_type !== 'expert')) {
        // Compter le nombre de services actifs du freelance
        const { data: activeServices, error: countError } = await supabase
          .from('services')
          .select('id')
          .eq('freelance_id', profile.id)
          .eq('active', true);

        if (countError) {
          console.error('Erreur lors du comptage des services actifs:', countError);
          return { success: false, error: 'Erreur lors de la vérification de vos services actifs' };
        }

        if (activeServices && activeServices.length >= 6) {
          return { 
            success: false, 
            error: 'Vous ne pouvez pas avoir plus de 6 services actifs sans certification expert. Veuillez désactiver ou supprimer un service existant. Pour supprimer cette limitation, obtenez une certification expert.'
          };
        }
      }
      
      // Ajouter les champs de métadonnées
      const serviceWithMeta = {
        ...serviceFields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Créer le service de base
      const { data, error } = await supabase
        .from('services')
        .insert([serviceWithMeta])
        .select()
        .single();
      
      if (error) throw error;
      
      // Si le service a été créé avec succès et qu'il y a des images
      if (data && images && images.length > 0) {
        try {
          const { error: updateError } = await supabase
            .from('services')
            .update({
              updated_at: new Date().toISOString(),
              images: images
            })
            .eq('id', data.id);
          
          if (updateError) {
            console.warn('Erreur lors de l\'ajout des images au service:', updateError);
            // On continue malgré l'erreur car le service a été créé
          }
        } catch (imageError) {
          console.warn('Exception lors de l\'ajout des images au service:', imageError);
          // On continue malgré l'erreur car le service a été créé
        }
      }
      
      // Déclencher une invalidation de cache
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
        detail: { 
          type: 'service', 
          action: 'create',
          id: data?.id,
          keys: ['services']
        }
      }));
      
      return { success: true, service: data };
    } catch (err: any) {
      console.error('Erreur lors de la création du service');
      return { 
        success: false, 
        error: err.message || 'Une erreur est survenue lors de la création du service' 
      };
    }
  }, [profile]);

  // Mettre à jour un service existant
  const updateService = useCallback(async (serviceId: string, updates: UpdateServiceParams): Promise<ServiceResult<Service>> => {
    if (!profile || !serviceId) {
      return { success: false, error: 'Paramètres manquants ou utilisateur non connecté' };
    }
    
    try {
      // Vérifier que l'utilisateur est autorisé à modifier ce service
      const { data: serviceToUpdate, error: checkError } = await supabase
        .from('services')
        .select('freelance_id, active, status')
        .eq('id', serviceId)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return { success: false, error: 'Service introuvable' };
        }
        throw checkError;
      }
      
      if (!serviceToUpdate) {
        return { success: false, error: 'Service introuvable' };
      }
      
      // Vérifier les permissions
      if (serviceToUpdate.freelance_id !== profile.id && profile.role !== 'admin') {
        return { success: false, error: 'Vous n\'êtes pas autorisé à modifier ce service' };
      }
      
      const { images, ...serviceFields } = updates;
      
      // Ajouter le timestamp de mise à jour et s'assurer que active est correct
      const fieldsWithTimestamp = {
        ...serviceFields,
        updated_at: new Date().toISOString(),
      };
      
      // Normaliser la valeur de active si elle est définie
      if (updates.active !== undefined) {
        fieldsWithTimestamp.active = typeof updates.active === 'string' 
          ? updates.active === 'true' 
          : Boolean(updates.active);
          
        // Log pour le débogage
        console.log(`Service ${serviceId} - active: ${fieldsWithTimestamp.active}, type: ${typeof fieldsWithTimestamp.active}`);
        
        // Vérifier la limite de services actifs si le service passe de inactif à actif
        if (fieldsWithTimestamp.active === true && serviceToUpdate.active === false) {
          if (profile.role !== 'admin' && (!profile.is_certified || profile.certification_type !== 'expert')) {
            // Compter le nombre de services actifs du freelance
            const { data: activeServices, error: countError } = await supabase
              .from('services')
              .select('id')
              .eq('freelance_id', profile.id)
              .eq('active', true);

            if (countError) {
              console.error('Erreur lors du comptage des services actifs:', countError);
              return { success: false, error: 'Erreur lors de la vérification de vos services actifs' };
            }

            if (activeServices && activeServices.length >= 6) {
              return { 
                success: false, 
                error: 'Vous ne pouvez pas avoir plus de 6 services actifs sans certification expert. Veuillez désactiver ou supprimer un service existant. Pour supprimer cette limitation, obtenez une certification expert.'
              };
            }
          }
        }
      }
      
      // Si l'utilisateur est un freelance (non-admin), mettre le statut à 'pending' pour revalidation
      if (profile.role !== 'admin') {
        fieldsWithTimestamp.status = 'pending';
      }
      
      // Mise à jour des champs du service
      const { data, error } = await supabase
        .from('services')
        .update(fieldsWithTimestamp)
        .eq('id', serviceId)
        .select()
        .single();
      
      if (error) {
        console.error("Erreur lors de la mise à jour des champs du service:");
        throw error;
      }
      
      // Mise à jour des images si nécessaire
      if (images !== undefined && data) {
        try {
          const updateObj: any = {
            images: images,
            updated_at: new Date().toISOString()
          };
          
          // Si l'utilisateur est un freelance (non-admin), ajouter le statut pending pour les images aussi
          if (profile.role !== 'admin') {
            updateObj.status = 'pending';
          }
          
          const { error: updateImagesError } = await supabase
            .from('services')
            .update(updateObj)
            .eq('id', serviceId);
          
          if (updateImagesError) {
            console.warn('Erreur lors de la mise à jour des images:', updateImagesError);
          }
        } catch (imageError) {
          console.warn('Exception lors de la mise à jour des images:', imageError);
        }
      }
      
      // Déclencher une invalidation de cache
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
        detail: { 
          type: 'service', 
          action: 'update',
          id: serviceId,
          keys: ['services']
        }
      }));
      
      // Supprimer explicitement le service du cache
      const cacheKey = `service_${serviceId}`;
      servicesCache.delete(cacheKey);
      
      return { success: true, service: data };
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du service');
      return { 
        success: false, 
        error: err.message || 'Une erreur est survenue lors de la mise à jour du service' 
      };
    }
  }, [profile]);

  // Supprimer un service avec vérifications de sécurité
  const deleteService = useCallback(async (id: string) => {
    if (!profile || !id) {
      return { success: false, error: 'Vous devez être connecté pour supprimer un service' };
    }
    
    try {
      // Vérifier que l'utilisateur est autorisé à supprimer ce service
      const { data: serviceToDelete, error: checkError } = await supabase
        .from('services')
        .select('freelance_id')
        .eq('id', id)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return { success: false, error: 'Service introuvable' };
        }
        throw checkError;
      }
      
      // Vérifier les permissions
      if (serviceToDelete.freelance_id !== profile.id && profile.role !== 'admin') {
        return { success: false, error: 'Vous n\'êtes pas autorisé à supprimer ce service' };
      }
      
      // Supprimer le service
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Déclencher une invalidation de cache
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
        detail: { 
          type: 'service', 
          action: 'delete',
          id,
          keys: ['services']
        }
      }));
      
      // Mettre à jour l'état local en supprimant le service
      setServices(prevServices => prevServices.filter(s => s.id !== id));
      
      return { success: true };
    } catch (err: any) {
      console.error('Erreur lors de la suppression du service');
      return { 
        success: false, 
        error: err.message || 'Une erreur est survenue lors de la suppression du service' 
      };
    }
  }, [profile]);

  // Effet pour charger les services et s'abonner aux changements
  useEffect(() => {
    // Nettoyage des resources précédentes
    cleanup();
    
    // Charger les services initialement (utiliser le cache si disponible)
    fetchServices(false);
    
    // S'abonner aux changements des services en temps réel - SEULEMENT si nécessaire
    // Réduire la portée de l'abonnement en se concentrant sur les paramètres actuels
    const channelFilter: any = { 
      event: '*',
      schema: 'public',
      table: 'services'
    };
    
    // Ajouter des filtres spécifiques pour réduire le volume de notifications
    if (freelanceId) {
      channelFilter.filter = `freelance_id=eq.${freelanceId}`;
    } else if (categoryId) {
      channelFilter.filter = `category_id=eq.${categoryId}`;
    }
    
    const servicesSubscription = supabase
      .channel(`services-changes-${paramsSignature}`)
      .on('postgres_changes', channelFilter, (payload) => {
        console.log('Services change detected:', payload);
        
        // Gestion spécifique pour chaque type d'événement
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          // S'assurer que les données sont valides avant de manipuler le cache
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            // Invalider spécifiquement le cache pour ce service
            const cacheKey = `service_${payload.new.id}`;
            console.log(`Invalidating cache for service ${payload.new.id}`);
            servicesCache.delete(cacheKey);
            
            // Si le payload contient le status ou active, afficher pour le débogage
            if ('status' in payload.new) {
              console.log(`Service ${payload.new.id} status mis à jour: ${payload.new.status}`);
            }
            if ('active' in payload.new) {
              console.log(`Service ${payload.new.id} active mis à jour: ${payload.new.active}`);
            }
          }
        } else if (payload.eventType === 'DELETE') {
          // Pour les suppressions, utiliser l'ancien ID si disponible
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            const cacheKey = `service_${payload.old.id}`;
            servicesCache.delete(cacheKey);
          }
        }
        
        // Invalider le cache pour cette signature de paramètres
        console.log(`Invalidation du cache pour les paramètres: ${paramsSignature}`);
        servicesCache.delete(paramsSignature);
        
        // Émettre un événement personnalisé que d'autres composants peuvent écouter
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vynal:service-updated', { 
            detail: { payload, paramsSignature }
          }));
        }
        
        // Recharger avec un certain délai pour éviter les rafraîchissements trop fréquents
        if (!loadingRef.current) {
          fetchServices(true);
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Abonné aux changements des services');
        } else if (err) {
          console.error('Erreur d\'abonnement aux changements des services:', err);
        }
      });
    
    // Stocker la référence de l'abonnement
    subscriptionRef.current = servicesSubscription;
    
    // S'abonner aux événements d'invalidation du cache avec une fonction mémorisée
    const handleCacheInvalidation = (event: CustomEvent) => {
      const { keys, type, action } = event.detail || {};
      
      // Vérifier si l'invalidation concerne les services
      if (keys && Array.isArray(keys) && keys.includes('services')) {
        // Invalider le cache pour cette requête
        servicesCache.delete(paramsSignature);
        
        // Utiliser un rechargement différé pour éviter trop de requêtes
        if (!loadingRef.current && (Date.now() - lastFetchTimeRef.current > DEFAULT_THROTTLE_MS)) {
          fetchServices(true);
        } else {
          setTimeout(() => {
            if (!loadingRef.current) {
              fetchServices(true);
            }
          }, DEFAULT_THROTTLE_MS);
        }
      }
    };
    
    cacheInvalidationListenerRef.current = handleCacheInvalidation as any;
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation as EventListener);
    
    // Nettoyage lors du démontage
    return cleanup;
  }, [paramsSignature, fetchServices, cleanup, freelanceId, categoryId]);

  // Retourner un objet mémoïsé pour éviter les recréations inutiles
  return useMemo(() => ({
    services,
    loading,
    error,
    getServiceById,
    getServiceBySlug,
    createService,
    updateService,
    deleteService,
    fetchServices,
    isRefreshing
  }), [
    services,
    loading,
    error,
    getServiceById,
    getServiceBySlug,
    createService,
    updateService,
    deleteService,
    fetchServices,
    isRefreshing
  ]);
}