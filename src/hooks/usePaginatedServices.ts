import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { ServiceWithFreelanceAndCategories } from './useServices';

interface UsePaginatedServicesParams {
  categoryId?: string;
  subcategoryId?: string;
  freelanceId?: string;
  active?: boolean;
  pageSize?: number;
  loadMoreMode?: boolean;
  searchTerm?: string;
}

interface UsePaginatedServicesResult {
  services: ServiceWithFreelanceAndCategories[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  goToPage: (page: number) => void;
  loadMore: () => void;
  hasMore: boolean;
  refresh: () => void;
}

/**
 * Hook pour gérer la pagination des services
 * 
 * @param params - Paramètres de filtrage et pagination
 * @returns Résultat contenant les services, l'état de chargement, et les fonctions de pagination
 */
export function usePaginatedServices({
  categoryId,
  subcategoryId,
  freelanceId,
  active = true,
  pageSize = 12,
  loadMoreMode = false,
  searchTerm = ''
}: UsePaginatedServicesParams = {}): UsePaginatedServicesResult {
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Calcul du nombre total de pages
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Fonction pour charger les services
  const fetchServices = async (page: number, append: boolean = false) => {
    // Si on ajoute les services à la liste existante, ne pas montrer le loader complet
    if (!append) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      // Calculer l'offset pour la pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Construire la requête
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `, { count: 'exact' });
      
      // Appliquer les filtres
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
      }
      
      if (freelanceId) {
        query = query.eq('freelance_id', freelanceId);
      }
      
      // Par défaut, ne montrer que les services actifs
      query = query.eq('active', active);
      
      // Appliquer la recherche textuelle si un terme est fourni
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim();
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      
      // Pagination avec range
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      const { data, error: fetchError, count } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Mettre à jour le nombre total d'éléments
      if (count !== null) {
        setTotalCount(count);
        setHasMore(from + data.length < count);
      }
      
      // Transformer les données
      const transformedServices = data.map((service: any) => {
        // Vérifier que les champs essentiels sont présents
        const hasValidSlug = service.slug && typeof service.slug === 'string' && service.slug.trim() !== '';
        
        if (!service.id || !hasValidSlug) {
          console.warn(`Service potentiellement incomplet: ID=${service.id}, Slug=${service.slug || 'MANQUANT'}`);
          
          // Si le slug est manquant ou invalide, créer un slug à partir de l'ID
          if (!hasValidSlug && service.id) {
            console.log(`Création d'un slug de substitution pour le service ${service.id}`);
            service.slug = `service-${service.id}`;
          }
        }
        
        return {
          ...service, // Préserver tous les champs du service original
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
      });
      
      // Mettre à jour les services (ajouter ou remplacer)
      if (append) {
        setServices(prev => [...prev, ...transformedServices]);
      } else {
        setServices(transformedServices);
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };
  
  // Changer de page
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchServices(page, false);
  };
  
  // Charger plus de services (mode "Load More")
  const loadMore = () => {
    if (!hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchServices(nextPage, true);
  };
  
  // Rafraîchir les données
  const refresh = () => {
    fetchServices(currentPage, false);
  };
  
  // Effet pour charger les services au changement des filtres
  useEffect(() => {
    // Réinitialiser la page en cas de changement de filtres
    setCurrentPage(1);
    
    // En mode "Load More", vider la liste de services
    if (!loadMoreMode) {
      setServices([]);
    }
    
    fetchServices(1, false);
    
    // Souscrire aux changements des services en temps réel
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
      }, () => {
        // Recharger les données quand il y a un changement
        refresh();
      })
      .subscribe();
    
    return () => {
      servicesSubscription.unsubscribe();
    };
  }, [categoryId, subcategoryId, freelanceId, active, pageSize, searchTerm]);
  
  return {
    services,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    loadMore,
    hasMore,
    refresh
  };
} 