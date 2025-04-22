import { useState, useEffect, useCallback } from 'react';
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
  isRefreshing: boolean;
}

/**
 * Hook pour gérer la pagination des services avec meilleure gestion du cache
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calcul du nombre total de pages
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Fonction pour charger les services avec gestion de sessions
  const fetchServices = useCallback(async (page: number, append: boolean = false) => {
    // Si on ajoute les services à la liste existante, ne pas montrer le loader complet
    if (!append) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);
    
    try {
      // Calculer l'offset pour la pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Générer un timestamp unique pour éviter les problèmes de cache du navigateur
      const cacheBuster = new Date().getTime();
      
      // Construire la requête
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
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
        .range(from, to);
      
      const { data, error: fetchError, count } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Traiter les services reçus
      const formattedServices = data.map((service: any) => ({
        ...service,
        freelance: service.profiles,
        category: service.categories,
        subcategory: service.subcategories
      }));
      
      // Mise à jour du state en fonction du mode d'ajout
      if (append && loadMoreMode) {
        setServices(prevServices => {
          // Créer un Set des IDs existants pour éviter les doublons
          const existingIds = new Set(prevServices.map(service => service.id));
          
          // Filtrer les nouveaux services pour éviter les doublons
          const newServices = formattedServices.filter(service => !existingIds.has(service.id));
          
          return [...prevServices, ...newServices];
        });
      } else {
        setServices(formattedServices);
      }
      
      // Mettre à jour le nombre total d'éléments
      if (count !== null) {
        setTotalCount(count);
        setHasMore(from + (data?.length || 0) < count);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des services:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement des services');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [categoryId, subcategoryId, freelanceId, active, pageSize, loadMoreMode, searchTerm]);
  
  // Changer de page
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchServices(page, false);
  }, [fetchServices]);
  
  // Charger plus de services (mode "Load More")
  const loadMore = useCallback(() => {
    if (!hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchServices(nextPage, true);
  }, [currentPage, fetchServices, hasMore]);
  
  // Rafraîchir les données
  const refresh = useCallback(() => {
    fetchServices(currentPage, false);
  }, [currentPage, fetchServices]);
  
  // Effet pour charger les services au changement des filtres
  useEffect(() => {
    // Réinitialiser la page en cas de changement de filtres
    setCurrentPage(1);
    
    // En mode "Load More", vider la liste de services si les filtres changent
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
  }, [categoryId, subcategoryId, freelanceId, active, pageSize, searchTerm, fetchServices, loadMoreMode, refresh]);
  
  // Écouter les événements d'invalidation du cache (changements de route)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCacheInvalidation = (event: Event) => {
      // Forcer un rafraîchissement des données après navigation
      if (!isRefreshing && !loading) {
        console.log('Rafraîchissement des services après navigation');
        
        // Petite attente pour éviter les conflits avec d'autres processus de rendu
        setTimeout(() => {
          refresh();
        }, 300);
      }
    };
    
    // Écouter l'événement personnalisé d'invalidation du cache
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    };
  }, [isRefreshing, loading, refresh]);
  
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
    refresh,
    isRefreshing
  };
} 