import { useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSWRCache } from './useSWRCache';
import { 
  CACHE_KEYS, 
  invalidateCacheGroup, 
  makeCacheKey 
} from '@/lib/optimizations/invalidation';
import { PostgrestError } from '@supabase/supabase-js';
import { ServiceWithFreelanceAndCategories } from './useServices';

export interface PublicServicesParams {
  categoryId?: string;
  subcategoryId?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'price' | 'popular'; 
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
}

export interface PublicServicesResult {
  services: ServiceWithFreelanceAndCategories[];
  isLoading: boolean;
  isValidating: boolean;
  isStale: boolean;
  error: Error | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  refresh: () => Promise<void>;
  goToPage: (page: number) => void;
}

/**
 * Hook optimisé pour l'explorateur de services publics
 * Utilise notre nouveau système de cache SWR avec gestion des race conditions
 */
export function usePublicServices({
  categoryId,
  subcategoryId,
  searchTerm = '',
  page = 1,
  pageSize = 12,
  sortBy = 'created_at',
  sortOrder = 'desc',
  featured
}: PublicServicesParams): PublicServicesResult {

  // Construire une clé de cache unique basée sur les paramètres
  const cacheKey = useMemo(() => {
    // Déterminer le type de base de clé de cache selon les filtres appliqués
    let baseKey = CACHE_KEYS.SERVICES_LIST;
    
    if (categoryId) {
      baseKey = CACHE_KEYS.SERVICES_CATEGORY;
    }
    
    if (searchTerm && searchTerm.trim()) {
      baseKey = CACHE_KEYS.SERVICES_SEARCH;
    }
    
    if (featured) {
      baseKey = CACHE_KEYS.SERVICES_FEATURED;
    }
    
    // Utiliser la fonction utilitaire pour générer une clé standardisée
    return makeCacheKey(baseKey, {
      categoryId,
      subcategoryId,
      searchTerm,
      page,
      pageSize,
      sortBy,
      sortOrder,
      featured
    });
  }, [categoryId, subcategoryId, searchTerm, page, pageSize, sortBy, sortOrder, featured]);
  
  // Fonction de chargement des services avec toutes les optimisations
  const fetchServices = useCallback(async () => {
    try {
      // Calculer les limites de pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      // Construire la requête de base
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio, is_certified, certification_type),
          categories!inner (id, name, slug),
          subcategories (id, name, slug)
        `, { count: 'exact' })
        .eq('active', true);
      
      // Appliquer les filtres
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
      }
      
      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }
      
      // Recherche textuelle optimisée
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim();
        
        if (term.length > 2) {
          // Diviser le terme de recherche en mots-clés
          const keywords = term.toLowerCase().split(/\s+/);
          
          // Ajouter les conditions de recherche pour chaque mot-clé
          keywords.forEach(keyword => {
            query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
          });
        }
      }
      
      // Tri et pagination
      const orderColumn = sortBy === 'popular' ? 'created_at' : sortBy;
      query = query
        .order(orderColumn, { ascending: sortOrder === 'asc' })
        .range(start, end);
      
      // Exécuter la requête
      const { data, count, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Formater les services
      const formattedServices = data.map((service: any) => ({
        ...service,
        profiles: service.profiles || {
          id: service.freelance_id || '',
          username: 'utilisateur',
          full_name: 'Utilisateur',
          avatar_url: null,
          bio: null,
          is_certified: false,
          certification_type: null
        },
        categories: service.categories || {
          id: service.category_id || '',
          name: 'Catégorie',
          slug: 'categorie'
        },
        subcategories: service.subcategories || null
      }));
      
      return {
        services: formattedServices,
        totalCount: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
        currentPage: page
      };
    } catch (err) {
      console.error('Erreur lors du chargement des services publics:', err);
      throw err;
    }
  }, [categoryId, subcategoryId, searchTerm, page, pageSize, sortBy, sortOrder, featured]);
  
  // Utiliser le hook SWR pour gérer le cache avec les données obsolètes
  const { 
    data,
    isLoading,
    isValidating,
    isStale,
    error,
    refresh
  } = useSWRCache(
    cacheKey,
    fetchServices,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateInterval: 0,
      priority: 'high',
      expiry: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Écouter les événements de création/mise à jour de services
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleServiceChange = () => {
      // Invalider les groupes de cache pertinents selon le type d'affichage
      if (featured) {
        invalidateCacheGroup('featured_services');
      } else if (categoryId) {
        invalidateCacheGroup('services');
      } else if (searchTerm) {
        invalidateCacheGroup('services');
      } else {
        invalidateCacheGroup('services');
      }
    };
    
    // S'abonner aux événements de Supabase Realtime
    const subscription = supabase
      .channel('public-services-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
        filter: 'active=eq.true'
      }, handleServiceChange)
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [categoryId, featured, searchTerm]);
  
  // Fonction pour changer de page
  const goToPage = useCallback((newPage: number) => {
    // Cette fonction est uniquement pour l'interface - le changement réel de page
    // se fait en modifiant le paramètre 'page' dans les props du hook
    
    // Pour le moment, nous ne pouvons pas implémenter cette fonctionnalité ici
    // car cela nécessiterait de modifier l'état du composant parent
    console.warn('goToPage appelée, mais cette fonction doit être implémentée dans le composant parent');
  }, []);
  
  // Valeurs par défaut si les données ne sont pas encore chargées
  const services = data?.services || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || page;
  
  return {
    services,
    isLoading,
    isValidating,
    isStale,
    error,
    totalCount,
    currentPage,
    totalPages,
    refresh,
    goToPage
  };
} 