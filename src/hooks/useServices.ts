import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { useUser } from './useUser';

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
}

interface UpdateServiceParams extends Omit<Partial<Service>, 'id' | 'created_at' | 'updated_at' | 'freelance_id'> {
  images?: string[];
  active?: boolean | string;
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
  profiles (id, username, full_name, avatar_url, bio),
  categories (id, name, slug),
  subcategories (id, name, slug)
`;

// Cache en mémoire pour stocker les services transformés
const servicesCache = new Map<string, {
  timestamp: number;
  data: ServiceWithFreelanceAndCategories[];
}>();

// Durée de validité du cache en ms (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

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
        bio: null
      },
      categories: data.categories || {
        id: data.category_id || '',
        name: 'Catégorie',
        slug: 'categorie'
      },
      subcategories: data.subcategories || null
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
    
    // Supprimer l'écouteur d'événements du cache
    if (cacheInvalidationListenerRef.current && typeof window !== 'undefined') {
      window.removeEventListener('cache-invalidation', cacheInvalidationListenerRef.current as EventListener);
      cacheInvalidationListenerRef.current = null;
    }
  }, []);

  // Fonction pour charger les services avec gestion des erreurs améliorée
  const fetchServices = useCallback(async (forceFetch: boolean = false): Promise<void> => {
    // Vérifier d'abord le cache avant de faire une requête réseau
    if (!forceFetch) {
      const cachedData = servicesCache.get(paramsSignature);
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
      
      // Limiter le nombre de résultats si spécifié
      if (limit && limit > 0) {
        query = query.limit(limit);
      }
      
      // Ordonner par date de création (plus récent en premier)
      query = query.order('created_at', { ascending: false });
      
      // Exécuter la requête avec un délai minimal entre les requêtes (throttling)
      const executionStart = Date.now();
      const { data, error: fetchError } = await query;
      
      // Vérifier si la requête a été annulée
      if (signal.aborted) {
        throw new Error('Requête annulée');
      }
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Traiter les données vides
      if (!data || data.length === 0) {
        setServices([]);
        // Mettre en cache le résultat vide
        servicesCache.set(paramsSignature, { timestamp: Date.now(), data: [] });
        return;
      }
      
      // Performance: Transformer les données en lot (batch) pour réduire les calculs
      const transformedServices = data.map(transformService);
      
      // Mettre à jour le cache
      servicesCache.set(paramsSignature, {
        timestamp: Date.now(),
        data: transformedServices
      });
      
      // Mettre à jour l'état avec les nouveaux services
      setServices(transformedServices);
      
      // Attendre au moins 100ms pour éviter les flashs d'interface
      const executionTime = Date.now() - executionStart;
      if (executionTime < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - executionTime));
      }
    } catch (err: any) {
      // Ne pas signaler d'erreur si la requête a été délibérément annulée
      if (err.name === 'AbortError') {
        console.debug('Requête de services annulée');
        return;
      }
      
      console.error('Erreur lors du chargement des services:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des services');
      
      // Conserver les données existantes en cas d'erreur
      if (services.length === 0) {
        setServices([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      loadingRef.current = false;
    }
  }, [services.length, categoryId, subcategoryId, freelanceId, active, limit, transformService, paramsSignature]);

  // Récupérer un service par son ID (avec cache en mémoire)
  const getServiceById = useCallback(async (id: string) => {
    if (!id) {
      return { service: null, error: 'ID non fourni' };
    }
    
    try {
      // Vérifier si le service est dans le cache
      const cachedServices = Array.from(servicesCache.values()).flatMap(cache => cache.data);
      const cachedService = cachedServices.find(s => s.id === id);
      
      if (cachedService) {
        return { service: cachedService, error: null };
      }
      
      // Créer un nouveau contrôleur d'annulation pour cette requête spécifique
      const abortController = new AbortController();
      const signal = abortController.signal;
      
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
            bio
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
        console.error('Erreur Supabase lors du chargement du service:', fetchError);
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
          bio: null
        },
        categories: data.categories || {
          id: data.category_id || '',
          name: 'Catégorie',
          slug: 'categorie'
        },
        subcategories: data.subcategories || null,
        active: data.active === true || data.active === 'true',
      };
      
      // Mettre à jour le cache pour ce service individuel
      const cacheKey = `service_${id}`;
      servicesCache.set(cacheKey, {
        timestamp: Date.now(),
        data: [transformedService]
      });
      
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
  }, [profile, transformService]);

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
        return { service: cachedService, error: null };
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
  }, [transformService]);

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
      window.dispatchEvent(new CustomEvent('cache-invalidation', {
        detail: { 
          type: 'service', 
          action: 'create',
          id: data?.id,
          keys: ['services']
        }
      }));
      
      return { success: true, service: data };
    } catch (err: any) {
      console.error('Erreur lors de la création du service:', err);
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
        .select('freelance_id, active')
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
      }
      
      // Mise à jour des champs du service
      const { data, error } = await supabase
        .from('services')
        .update(fieldsWithTimestamp)
        .eq('id', serviceId)
        .select()
        .single();
      
      if (error) {
        console.error("Erreur lors de la mise à jour des champs du service:", error);
        throw error;
      }
      
      // Mise à jour des images si nécessaire
      if (images !== undefined && data) {
        try {
          const { error: updateImagesError } = await supabase
            .from('services')
            .update({
              images: images,
              updated_at: new Date().toISOString()
            })
            .eq('id', serviceId);
          
          if (updateImagesError) {
            console.warn('Erreur lors de la mise à jour des images:', updateImagesError);
          }
        } catch (imageError) {
          console.warn('Exception lors de la mise à jour des images:', imageError);
        }
      }
      
      // S'assurer que les notifications pour le service sont correctement configurées
      try {
        await supabase
          .from('service_notifications')
          .upsert({
            service_id: serviceId,
            type: 'service_updated',
            content: `Le service a été mis à jour le ${new Date().toLocaleDateString('fr-FR')}`,
            created_at: new Date().toISOString()
          }, { onConflict: 'service_id' });
      } catch (notifError) {
        // Ignorer les erreurs de notification, elles ne doivent pas bloquer la mise à jour
        console.warn('Erreur lors de la création de la notification:', notifError);
      }
      
      // Déclencher une invalidation de cache
      window.dispatchEvent(new CustomEvent('cache-invalidation', {
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
      console.error('Erreur lors de la mise à jour du service:', err);
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
      window.dispatchEvent(new CustomEvent('cache-invalidation', {
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
      console.error('Erreur lors de la suppression du service:', err);
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
      .on('postgres_changes', channelFilter, () => {
        // Vérifier si les paramètres correspondent au changement
        // Invalider le cache et recharger seulement si nécessaire
        if (!loadingRef.current) {
          // Invalider le cache pour cette signature
          servicesCache.delete(paramsSignature);
          
          // Recharger avec un certain délai pour éviter les rafraîchissements trop fréquents
          if (Date.now() - lastFetchTimeRef.current > DEFAULT_THROTTLE_MS) {
            fetchServices(true);
          } else {
            // Planifier un rechargement différé
            setTimeout(() => {
              if (!loadingRef.current) {
                fetchServices(true);
              }
            }, DEFAULT_THROTTLE_MS);
          }
        }
      })
      .subscribe();
    
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
    window.addEventListener('cache-invalidation', handleCacheInvalidation as EventListener);
    
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