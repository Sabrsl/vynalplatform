import { useState, useEffect } from 'react';
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

interface CreateServiceParams extends Omit<Partial<Service>, 'id' | 'created_at' | 'updated_at'> {
  freelance_id: string;
  images?: string[];
}

interface UpdateServiceParams extends Omit<Partial<Service>, 'id' | 'created_at' | 'updated_at' | 'freelance_id'> {
  images?: string[];
}

export function useOptimizedServices(params: UseServicesParams = {}) {
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { profile } = useUser();
  
  const { categoryId, subcategoryId, freelanceId, active, limit } = params;
  
  // Générer une clé de cache unique basée sur les paramètres
  const getCacheKey = () => {
    let key = CACHE_KEYS.SERVICES;
    
    if (categoryId) key += `cat_${categoryId}_`;
    if (subcategoryId) key += `subcat_${subcategoryId}_`;
    if (freelanceId) key += `freelance_${freelanceId}_`;
    if (active !== undefined) key += `active_${active}_`;
    if (limit) key += `limit_${limit}`;
    
    return key;
  };

  // Fonction pour charger les données depuis l'API ou le cache
  const fetchServices = async (forceRefresh = false) => {
    try {
      const cacheKey = getCacheKey();
      
      // Si ce n'est pas un forceRefresh, vérifier d'abord le cache
      if (!forceRefresh) {
        const cachedServices = getCachedData<ServiceWithFreelanceAndCategories[]>(cacheKey);
        
        if (cachedServices) {
          setServices(cachedServices);
          setLoading(false);
          
          // Rafraîchir en arrière-plan si les données sont disponibles
          refreshInBackground();
          return;
        }
      }
      
      // Construire la requête
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
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      if (!data || data.length === 0) {
        setServices([]);
        setLoading(false);
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
      
      // Mettre à jour l'état et le cache
      setServices(transformedServices);
      
      // Stocker dans le cache
      setCachedData<ServiceWithFreelanceAndCategories[]>(
        cacheKey, 
        transformedServices,
        { expiry: CACHE_EXPIRY.SERVICES }
      );
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors du chargement des services');
      setServices([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Rafraîchir les données en arrière-plan
  const refreshInBackground = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchServices(true);
  };
  
  // Forcer un rafraîchissement des données
  const refreshData = () => {
    setLoading(true);
    fetchServices(true);
  };

  // Effet pour charger les données au montage ou au changement des paramètres
  useEffect(() => {
    setLoading(true);
    fetchServices();
    
    // Souscrire aux changements des services en temps réel
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
      }, () => {
        // Rafraîchir en arrière-plan quand il y a un changement
        refreshInBackground();
      })
      .subscribe();
    
    return () => {
      servicesSubscription.unsubscribe();
    };
  }, [categoryId, subcategoryId, freelanceId, active, limit]);

  // Récupérer un service spécifique par son ID avec cache
  const getServiceById = async (id: string) => {
    try {
      // Vérifier d'abord le cache
      const cacheKey = `${CACHE_KEYS.SERVICES}id_${id}`;
      const cachedService = getCachedData<ServiceWithFreelanceAndCategories>(cacheKey);
      
      if (cachedService) {
        return { service: cachedService, error: null };
      }
      
      // Si pas dans le cache, récupérer depuis l'API
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
      
      // Transformer les données
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
      
      // Mettre en cache
      setCachedData(cacheKey, transformedService, { expiry: CACHE_EXPIRY.SERVICES });
      
      return { service: transformedService, error: null };
    } catch (error: any) {
      return { service: null, error: error.message || 'Une erreur est survenue lors du chargement du service' };
    }
  };

  // Récupérer un service par son slug avec cache
  const getServiceBySlug = async (slug: string) => {
    if (!slug) {
      return { service: null, error: 'Slug non fourni' };
    }
    
    try {
      // Vérifier d'abord le cache
      const cacheKey = `${CACHE_KEYS.SERVICES}slug_${slug}`;
      const cachedService = getCachedData<ServiceWithFreelanceAndCategories>(cacheKey);
      
      if (cachedService) {
        return { service: cachedService, error: null };
      }
      
      // Si pas dans le cache, récupérer depuis l'API
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('slug', slug)
        .eq('active', true)
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
      
      // Transformer les données
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
      
      // Mettre en cache
      setCachedData(cacheKey, transformedService, { expiry: CACHE_EXPIRY.SERVICES });
      
      return { service: transformedService, error: null };
    } catch (error: any) {
      return { service: null, error: error.message || 'Une erreur est survenue lors du chargement du service' };
    }
  };

  // Créer un nouveau service
  const createService = async (serviceData: CreateServiceParams) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalider le cache des services pour forcer un rechargement
      invalidateCache(CACHE_KEYS.SERVICES);
      
      return { service: data, error: null };
    } catch (error: any) {
      return { service: null, error: error.message || 'Une erreur est survenue lors de la création du service' };
    }
  };

  // Mettre à jour un service
  const updateService = async (serviceId: string, updates: UpdateServiceParams) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalider toutes les entrées de cache liées à ce service
      invalidateCache(`${CACHE_KEYS.SERVICES}id_${serviceId}`);
      invalidateCache(`${CACHE_KEYS.SERVICES}slug_${data.slug}`);
      invalidateCache(CACHE_KEYS.SERVICES); // Invalider aussi les listes
      
      return { service: data, error: null };
    } catch (error: any) {
      return { service: null, error: error.message || 'Une erreur est survenue lors de la mise à jour du service' };
    }
  };

  // Supprimer un service
  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalider le cache
      invalidateCache(`${CACHE_KEYS.SERVICES}id_${id}`);
      invalidateCache(CACHE_KEYS.SERVICES);
      
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Une erreur est survenue lors de la suppression du service' };
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
    refresh: refreshData
  };
} 