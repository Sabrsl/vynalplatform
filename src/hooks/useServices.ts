import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { useUser } from './useUser';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS, 
  CACHE_EXPIRY 
} from '@/lib/optimizations';

// Définition de clés de cache additionnelles pour les services
const SERVICE_CACHE_KEYS = {
  SERVICE_DETAIL: 'service_detail_',
  SERVICE_SLUG: 'service_slug_'
};

// Type pour les services
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
};

interface UseServicesParams {
  categoryId?: string;
  subcategoryId?: string;
  freelanceId?: string;
  active?: boolean;
  limit?: number;
}

interface UseServicesOptions {
  useCache?: boolean;
}

interface CreateServiceParams extends Omit<Partial<Service>, 'id' | 'created_at' | 'updated_at'> {
  freelance_id: string;
  images?: string[];
}

interface UpdateServiceParams extends Omit<Partial<Service>, 'id' | 'created_at' | 'updated_at' | 'freelance_id'> {
  images?: string[];
}

export function useServices(params: UseServicesParams = {}, options: UseServicesOptions = {}) {
  const { useCache = true } = options;
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchInProgressRef = useRef<boolean>(false);
  const { profile } = useUser({ useCache });
  
  const { categoryId, subcategoryId, freelanceId, active, limit } = params;
  
  // Générer une clé de cache unique basée sur les paramètres
  const getCacheKey = useCallback(() => {
    if (!useCache) return null;
    
    let key = CACHE_KEYS.SERVICES;
    
    if (categoryId) key += `cat_${categoryId}_`;
    if (subcategoryId) key += `subcat_${subcategoryId}_`;
    if (freelanceId) key += `freelance_${freelanceId}_`;
    if (active !== undefined) key += `active_${active}_`;
    if (limit) key += `limit_${limit}`;
    
    return key;
  }, [categoryId, subcategoryId, freelanceId, active, limit, useCache]);

  const fetchServices = useCallback(async (forceRefresh = false) => {
    // Éviter les requêtes simultanées
    if (fetchInProgressRef.current && !forceRefresh) {
      return;
    }
    
    fetchInProgressRef.current = true;
    
    try {
      // Si l'option de cache est activée et ce n'est pas un forceRefresh, vérifier d'abord le cache
      if (useCache && !forceRefresh) {
        const cacheKey = getCacheKey();
        if (cacheKey) {
          const cachedServices = getCachedData<ServiceWithFreelanceAndCategories[]>(cacheKey);
          
          if (cachedServices) {
            setServices(cachedServices);
            setLoading(false);
            
            // Rafraîchir en arrière-plan
            refreshInBackground();
            fetchInProgressRef.current = false;
            return;
          }
        }
      }
      
      setLoading(true);
      setError(null);
      
      // Construire la requête avec optimisation
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `);
      
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
      if (limit) {
        query = query.limit(limit);
      }
      
      // Ordonner par date de création (plus récent en premier)
      query = query.order('created_at', { ascending: false });
      
      // Utiliser une Promise avec timeout pour éviter les requêtes bloquées
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout lors de la récupération des services")), 8000);
      });
      
      const fetchPromise = query;
      
      // Utiliser Promise.race pour implémenter le timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error: fetchError } = result;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      if (!data || data.length === 0) {
        setServices([]);
        setLoading(false);
        fetchInProgressRef.current = false;
        return;
      }
      
      const transformedServices = data.map((service: any) => {
        // Construction d'un service complet avec valeurs par défaut si nécessaire
        const transformedService = {
          ...service,
          profiles: service.profiles || {
            id: service.freelance_id || '',
            username: 'utilisateur',
            full_name: 'Utilisateur',
            avatar_url: null,
            bio: null
          },
          categories: service.categories || {
            id: service.category_id || '',
            name: 'Catégorie',
            slug: 'categorie'
          },
          subcategories: service.subcategories || null
        };
        
        return transformedService;
      });
      
      // Mettre à jour l'état
      setServices(transformedServices);
      
      // Si l'option de cache est activée, stocker dans le cache
      if (useCache) {
        const cacheKey = getCacheKey();
        if (cacheKey) {
          setCachedData<ServiceWithFreelanceAndCategories[]>(
            cacheKey, 
            transformedServices,
            { expiry: CACHE_EXPIRY.SERVICES }
          );
        }
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des services:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement des services');
      setServices([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      fetchInProgressRef.current = false;
    }
  }, [categoryId, subcategoryId, freelanceId, active, limit, useCache, getCacheKey]);
  
  // Rafraîchir les données en arrière-plan
  const refreshInBackground = useCallback(async () => {
    if (isRefreshing || !useCache) return;
    setIsRefreshing(true);
    await fetchServices(true);
  }, [isRefreshing, useCache, fetchServices]);
  
  // Forcer un rafraîchissement des données
  const refreshData = useCallback(() => {
    setLoading(true);
    fetchServices(true);
  }, [fetchServices]);

  useEffect(() => {
    fetchServices();
    
    // Souscrire aux changements des services en temps réel seulement si l'option useCache n'est pas activée
    // sinon nous utiliserons l'invalidation de cache manuelle
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
      }, (payload: any) => {
        // Recharger les données quand il y a un changement
        fetchServices();
      })
      .subscribe();
    
    // Écouter les événements de navigation pour invalider le cache
    const handleCacheInvalidation = (event: CustomEvent) => {
      // Recharger les données quand il y a un changement de route
      fetchServices();
    };
    
    window.addEventListener('cache-invalidation', handleCacheInvalidation as EventListener);
    
    return () => {
      servicesSubscription.unsubscribe();
      window.removeEventListener('cache-invalidation', handleCacheInvalidation as EventListener);
    };
  }, [categoryId, subcategoryId, freelanceId, active, limit, fetchServices]);

  // Récupérer un service spécifique par son ID
  const getServiceById = async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Si l'option de cache est activée, vérifier d'abord le cache
    if (useCache) {
      const cacheKey = `${SERVICE_CACHE_KEYS.SERVICE_DETAIL}${id}`;
      const cachedService = getCachedData<ServiceWithFreelanceAndCategories>(cacheKey);
      
      if (cachedService) {
        setLoading(false);
        return cachedService;
      }
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      const transformedService = {
        ...data,
        profiles: data.profiles || {
          id: data.freelance_id || '',
          username: 'utilisateur',
          full_name: 'Utilisateur',
          avatar_url: null
        },
        categories: data.categories || {
          id: data.category_id || '',
          name: 'Catégorie',
          slug: 'categorie'
        },
        subcategories: data.subcategories || null
      };
      
      // Si l'option de cache est activée, stocker dans le cache
      if (useCache) {
        const cacheKey = `${SERVICE_CACHE_KEYS.SERVICE_DETAIL}${id}`;
        setCachedData<ServiceWithFreelanceAndCategories>(
          cacheKey, 
          transformedService,
          { expiry: CACHE_EXPIRY.SERVICES_DETAILS }
        );
      }
      
      return transformedService;
    } catch (error: any) {
      console.error('Erreur lors du chargement du service:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement du service');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un service spécifique par son slug
  const getServiceBySlug = async (slug: string) => {
    setLoading(true);
    setError(null);
    
    // Si l'option de cache est activée, vérifier d'abord le cache
    if (useCache) {
      const cacheKey = `${SERVICE_CACHE_KEYS.SERVICE_SLUG}${slug}`;
      const cachedService = getCachedData<ServiceWithFreelanceAndCategories>(cacheKey);
      
      if (cachedService) {
        setLoading(false);
        return cachedService;
      }
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('slug', slug)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      const transformedService = {
        ...data,
        profiles: data.profiles || {
          id: data.freelance_id || '',
          username: 'utilisateur',
          full_name: 'Utilisateur',
          avatar_url: null
        },
        categories: data.categories || {
          id: data.category_id || '',
          name: 'Catégorie',
          slug: 'categorie'
        },
        subcategories: data.subcategories || null
      };
      
      // Si l'option de cache est activée, stocker dans le cache
      if (useCache) {
        const cacheKey = `${SERVICE_CACHE_KEYS.SERVICE_SLUG}${slug}`;
        setCachedData<ServiceWithFreelanceAndCategories>(
          cacheKey, 
          transformedService,
          { expiry: CACHE_EXPIRY.SERVICES_DETAILS }
        );
      }
      
      return transformedService;
    } catch (error: any) {
      console.error('Erreur lors du chargement du service par slug:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement du service');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau service
  const createService = async (serviceData: CreateServiceParams) => {
    try {
      // Valider le slug et s'assurer qu'il est unique
      if (serviceData.slug) {
        const { data: existingSlug } = await supabase
          .from('services')
          .select('id')
          .eq('slug', serviceData.slug)
          .single();
        
        if (existingSlug) {
          // Si le slug existe déjà, en générer un nouveau
          serviceData.slug = `${serviceData.slug}-${Date.now().toString().slice(-4)}`;
        }
      }
      
      // Extraire les images pour une insertion séparée si nécessaire
      const { images, ...serviceWithoutImages } = serviceData;
      
      // Insérer le service dans la base de données
      const { data, error } = await supabase
        .from('services')
        .insert(serviceWithoutImages)
        .select()
        .single();
      
      if (error) throw error;
      
      // Si des images sont fournies, les associer au service
      if (images && images.length > 0 && data) {
        const serviceImages = images.map((image, index) => ({
          service_id: data.id,
          url: image,
          position: index,
        }));
        
        const { error: imageError } = await supabase
          .from('service_images')
          .insert(serviceImages);
        
        if (imageError) {
          console.error('Erreur lors de l\'ajout des images:', imageError);
        }
      }
      
      // Invalider le cache si l'option est activée
      if (useCache) {
        invalidateCache(CACHE_KEYS.SERVICES);
      }
      
      // Rafraîchir les données
      fetchServices(true);
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Erreur lors de la création du service:', error);
      return { success: false, error };
    }
  };

  // Mettre à jour un service existant
  const updateService = async (serviceId: string, updates: UpdateServiceParams) => {
    try {
      // Extraire les images pour une gestion séparée
      const { images, ...serviceUpdates } = updates;
      
      // Mettre à jour le service
      const { data, error } = await supabase
        .from('services')
        .update(serviceUpdates)
        .eq('id', serviceId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Si des images sont fournies, gérer les images
      if (images !== undefined && data) {
        // D'abord supprimer toutes les images existantes
        await supabase
          .from('service_images')
          .delete()
          .eq('service_id', serviceId);
        
        // Ensuite ajouter les nouvelles images
        if (images.length > 0) {
          const serviceImages = images.map((image, index) => ({
            service_id: data.id,
            url: image,
            position: index,
          }));
          
          await supabase
            .from('service_images')
            .insert(serviceImages);
        }
      }
      
      // Invalider le cache si l'option est activée
      if (useCache) {
        invalidateCache(CACHE_KEYS.SERVICES);
        invalidateCache(`${SERVICE_CACHE_KEYS.SERVICE_DETAIL}${serviceId}`);
        if (data.slug) {
          invalidateCache(`${SERVICE_CACHE_KEYS.SERVICE_SLUG}${data.slug}`);
        }
      }
      
      // Rafraîchir les données
      fetchServices(true);
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du service:', error);
      return { success: false, error };
    }
  };

  // Supprimer un service
  const deleteService = async (id: string) => {
    try {
      // Récupérer le service avant de le supprimer pour obtenir le slug
      const { data: serviceToDelete } = await supabase
        .from('services')
        .select('slug')
        .eq('id', id)
        .single();
      
      // Supprimer le service
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalider le cache si l'option est activée
      if (useCache) {
        invalidateCache(CACHE_KEYS.SERVICES);
        invalidateCache(`${SERVICE_CACHE_KEYS.SERVICE_DETAIL}${id}`);
        if (serviceToDelete && serviceToDelete.slug) {
          invalidateCache(`${SERVICE_CACHE_KEYS.SERVICE_SLUG}${serviceToDelete.slug}`);
        }
      }
      
      // Rafraîchir les données
      fetchServices(true);
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la suppression du service:', error);
      return { success: false, error };
    }
  };

  return {
    services,
    loading,
    error,
    isRefreshing,
    getServiceById,
    getServiceBySlug,
    createService,
    updateService,
    deleteService,
    refreshData
  };
}

/**
 * Re-export du hook useServices avec l'ancien nom pour compatibilité
 * @deprecated Utilisez useServices à la place avec l'option {useCache: true}
 */
export function useOptimizedServices(params: UseServicesParams = {}) {
  return useServices(params, { useCache: true });
} 