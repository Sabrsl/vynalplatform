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

export function useServices(params: UseServicesParams = {}) {
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();
  
  const { categoryId, subcategoryId, freelanceId, active, limit } = params;

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      
      try {
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
        
        setServices(transformedServices);
      } catch (error: any) {
        setError(error.message || 'Une erreur est survenue lors du chargement des services');
        setServices([]);
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
      }, (payload: any) => {
        // Recharger les données quand il y a un changement
        fetchServices();
      })
      .subscribe();
    
    return () => {
      servicesSubscription.unsubscribe();
    };
  }, [categoryId, subcategoryId, freelanceId, active, limit]);

  // Récupérer un service spécifique par son ID
  const getServiceById = async (id: string) => {
    setLoading(true);
    setError(null);
    
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
      
      return { service: transformedService, error: null };
    } catch (error: any) {
      return { service: null, error: error.message || 'Une erreur est survenue lors du chargement du service' };
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un service par son slug
  const getServiceBySlug = async (slug: string) => {
    if (!slug) {
      return { service: null, error: 'Slug non fourni' };
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
      
      // Transformer les données pour correspondre au type
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
      
      return { service: transformedService, error: null };
    } catch (error: any) {
      return { 
        service: null, 
        error: 'Erreur de chargement du service' 
      };
    }
  };

  // Créer un nouveau service
  const createService = async (serviceData: CreateServiceParams) => {
    try {
      const { images, ...serviceFields } = serviceData;
      
      // Créer le service de base
      const { data, error } = await supabase
        .from('services')
        .insert([
          {
            ...serviceFields,
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Si des images sont fournies, les associer au service en mettant à jour le service
      if (images && images.length > 0 && data) {
        const { error: updateError } = await supabase
          .from('services')
          .update({
            updated_at: new Date().toISOString(),
            images: images
          })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
      }
      
      return { success: true, service: data };
    } catch (error: any) {
      console.error("Erreur lors de la création du service:", error);
      return { 
        success: false, 
        error: error.message || "Une erreur est survenue lors de la création du service" 
      };
    }
  };

  // Mettre à jour un service existant
  const updateService = async (serviceId: string, updates: UpdateServiceParams) => {
    try {
      const { images, ...serviceFields } = updates;
      
      // Mise à jour des champs de base du service
      const { data, error } = await supabase
        .from('services')
        .update({
          ...serviceFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Si des images sont fournies, les associer au service
      if (images !== undefined && data) {
        const { error: updateImagesError } = await supabase
          .from('services')
          .update({
            updated_at: new Date().toISOString(),
            images: images
          })
          .eq('id', serviceId);
        
        if (updateImagesError) throw updateImagesError;
      }
      
      return { success: true, service: data };
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du service:", error);
      return { 
        success: false, 
        error: error.message || "Une erreur est survenue lors de la mise à jour du service" 
      };
    }
  };

  // Supprimer un service
  const deleteService = async (id: string) => {
    if (!profile) {
      return { success: false, error: 'Vous devez être connecté pour supprimer un service' };
    }
    
    try {
      // Vérifier que l'utilisateur est bien le propriétaire du service
      const { data: existingServices, error: fetchError } = await supabase
        .from('services')
        .select('freelance_id')
        .eq('id', id)
        .single(); // Use single() to expect exactly one row
      
      if (fetchError) {
        // Handle specific case of no rows or multiple rows found
        if (fetchError.code === 'PGRST116') {
          return { success: false, error: 'Service introuvable ou problème d\'identification' };
        }
        throw fetchError;
      }
      
      // Vérifier que l'utilisateur est le propriétaire ou un admin
      if (existingServices.freelance_id !== profile.id && profile.role !== 'admin') {
        return { success: false, error: 'Vous n\'êtes pas autorisé à supprimer ce service' };
      }
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
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