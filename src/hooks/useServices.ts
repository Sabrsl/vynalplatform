import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { useUser } from './useUser';

// Type pour les services
export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceWithFreelanceAndCategories = Service & {
  profiles: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
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

export function useServices(params: UseServicesParams = {}) {
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('services')
          .select(`
            *,
            profiles (id, username, full_name, avatar_url),
            categories (id, name, slug),
            subcategories (id, name, slug)
          `);
        
        // Appliquer les filtres en fonction des paramètres
        if (params.categoryId) {
          query = query.eq('category_id', params.categoryId);
        }
        
        if (params.subcategoryId) {
          query = query.eq('subcategory_id', params.subcategoryId);
        }
        
        if (params.freelanceId) {
          query = query.eq('freelance_id', params.freelanceId);
        }
        
        // Par défaut, ne montrer que les services actifs sauf indication contraire
        if (params.active !== undefined) {
          query = query.eq('active', params.active);
        } else {
          query = query.eq('active', true);
        }
        
        // Limiter le nombre de résultats si spécifié
        if (params.limit) {
          query = query.limit(params.limit);
        }
        
        // Ordonner par date de création (plus récent en premier)
        query = query.order('created_at', { ascending: false });
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
        const transformedServices = data.map((service: any) => ({
          ...service,
          profiles: service.profiles,
          categories: service.categories,
          subcategories: service.subcategories,
        }));
        
        setServices(transformedServices);
      } catch (error: any) {
        console.error('Erreur lors du chargement des services:', error);
        setError(error.message || 'Une erreur est survenue lors du chargement des services');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
    
    // Souscrire aux changements des services en temps réel
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
      }, () => {
        // Recharger les données quand il y a un changement
        fetchServices();
      })
      .subscribe();
    
    return () => {
      servicesSubscription.unsubscribe();
    };
  }, [params]);

  // Récupérer un service spécifique par son ID
  const getServiceById = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      const transformedService = {
        ...data,
        profiles: data.profiles,
        categories: data.categories,
        subcategories: data.subcategories,
      };
      
      return { service: transformedService, error: null };
    } catch (error: any) {
      console.error('Erreur lors du chargement du service:', error);
      return { service: null, error: error.message || 'Une erreur est survenue lors du chargement du service' };
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un service par son slug
  const getServiceBySlug = async (slug: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('slug', slug)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      const transformedService = {
        ...data,
        profiles: data.profiles,
        categories: data.categories,
        subcategories: data.subcategories,
      };
      
      return { service: transformedService, error: null };
    } catch (error: any) {
      console.error('Erreur lors du chargement du service:', error);
      return { service: null, error: error.message || 'Une erreur est survenue lors du chargement du service' };
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau service
  const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    if (!profile) {
      return { success: false, error: 'Vous devez être connecté pour créer un service' };
    }
    
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          freelance_id: profile.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, service: data };
    } catch (error: any) {
      console.error('Erreur lors de la création du service:', error);
      return { success: false, error: error.message || 'Une erreur est survenue lors de la création du service' };
    }
  };

  // Mettre à jour un service existant
  const updateService = async (id: string, serviceData: Partial<Service>) => {
    if (!profile) {
      return { success: false, error: 'Vous devez être connecté pour mettre à jour un service' };
    }
    
    try {
      // Vérifier que l'utilisateur est bien le propriétaire du service
      const { data: existingService, error: fetchError } = await supabase
        .from('services')
        .select('freelance_id')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (existingService.freelance_id !== profile.id && profile.role !== 'admin') {
        return { success: false, error: 'Vous n\'êtes pas autorisé à modifier ce service' };
      }
      
      const { data, error } = await supabase
        .from('services')
        .update({
          ...serviceData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, service: data };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du service:', error);
      return { success: false, error: error.message || 'Une erreur est survenue lors de la mise à jour du service' };
    }
  };

  // Supprimer un service
  const deleteService = async (id: string) => {
    if (!profile) {
      return { success: false, error: 'Vous devez être connecté pour supprimer un service' };
    }
    
    try {
      // Vérifier que l'utilisateur est bien le propriétaire du service
      const { data: existingService, error: fetchError } = await supabase
        .from('services')
        .select('freelance_id')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (existingService.freelance_id !== profile.id && profile.role !== 'admin') {
        return { success: false, error: 'Vous n\'êtes pas autorisé à supprimer ce service' };
      }
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la suppression du service:', error);
      return { success: false, error: error.message || 'Une erreur est survenue lors de la suppression du service' };
    }
  };

  return {
    services,
    loading,
    error,
    getServiceById,
    getServiceBySlug,
    createService,
    updateService,
    deleteService,
  };
} 