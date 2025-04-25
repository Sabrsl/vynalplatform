import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ServiceWithFreelanceAndCategories } from './useServices';
import { useToast } from '@/components/ui/use-toast';
import { addCommonFilters } from '@/lib/search/queryBuilder';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS, 
  CACHE_EXPIRY 
} from '@/lib/optimizations';

export interface UsePaginatedServicesParams {
  categoryId?: string;
  subcategoryId?: string;
  freelanceId?: string;
  pageSize?: number;
  active?: boolean;
  featured?: boolean;
  loadMoreMode?: boolean;
  searchTerm?: string;
  forceRefresh?: boolean;
}

export interface UsePaginatedServicesOptions {
  useCache?: boolean;
}

export function usePaginatedServices({
  categoryId,
  subcategoryId,
  freelanceId,
  pageSize = 12,
  active = true,
  featured,
  loadMoreMode = false,
  searchTerm = '',
  forceRefresh = false,
}: UsePaginatedServicesParams, options: UsePaginatedServicesOptions = {}) {
  const { useCache = false } = options;
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastParamsRef = useRef<string>('');
  const requestInProgressRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Fonction pour construire une chaîne représentant les paramètres actuels pour la comparaison
  const getParamsString = useCallback(() => {
    return JSON.stringify({
      categoryId,
      subcategoryId,
      freelanceId,
      pageSize,
      active,
      featured,
      currentPage,
      searchTerm
    });
  }, [categoryId, subcategoryId, freelanceId, pageSize, active, featured, currentPage, searchTerm]);

  // Génération d'une clé de cache unique basée sur les paramètres
  const getCacheKey = useCallback((page: number) => {
    if (!useCache) return null;
    
    let key = CACHE_KEYS.SERVICES;
    key += 'paginated_';
    
    if (categoryId) key += `cat_${categoryId}_`;
    if (subcategoryId) key += `subcat_${subcategoryId}_`;
    if (freelanceId) key += `freelance_${freelanceId}_`;
    if (featured !== undefined) key += `featured_${featured}_`;
    key += `active_${active}_`;
    key += `size_${pageSize}_`;
    key += `page_${page}_`;
    
    if (searchTerm) key += `search_${searchTerm.trim()}_`;
    
    return key;
  }, [categoryId, subcategoryId, freelanceId, featured, active, pageSize, searchTerm, useCache]);

  // Clé de cache pour le nombre total d'éléments
  const getTotalCountCacheKey = useCallback(() => {
    if (!useCache) return null;
    
    let key = CACHE_KEYS.SERVICES;
    key += 'count_';
    
    if (categoryId) key += `cat_${categoryId}_`;
    if (subcategoryId) key += `subcat_${subcategoryId}_`;
    if (freelanceId) key += `freelance_${freelanceId}_`;
    if (featured !== undefined) key += `featured_${featured}_`;
    key += `active_${active}_`;
    
    if (searchTerm) key += `search_${searchTerm.trim()}_`;
    
    return key;
  }, [categoryId, subcategoryId, freelanceId, featured, active, searchTerm, useCache]);

  // Rafraîchir en arrière-plan pour maintenir les données à jour
  const refreshInBackground = useCallback(async (page: number, append: boolean = false) => {
    if (isRefreshing || !useCache) return;
    
    setIsRefreshing(true);
    await fetchServices(page, append, true);
  }, [isRefreshing, useCache]);

  // Fonction pour récupérer les services
  const fetchServices = useCallback(async (page: number, append: boolean = false, forceReFetch: boolean = false) => {
    // Éviter les requêtes simultanées
    if (requestInProgressRef.current) {
      console.log('Request already in progress, skipping...');
      return;
    }
    
    requestInProgressRef.current = true;
    
    // Si c'est un append et pas un chargement initial, ne pas montrer le loader principal
    if (!append) {
      setLoading(true);
    } else if (!isRefreshing) {
      setIsRefreshing(true);
    }
    
    setError(null);

    try {
      // Vérifier le cache si l'option est activée et ce n'est pas un rafraîchissement forcé
      if (useCache && !forceReFetch && !forceRefresh) {
        const cacheKey = getCacheKey(page);
        const countCacheKey = getTotalCountCacheKey();
        
        if (cacheKey && countCacheKey) {
          const cachedServices = getCachedData<ServiceWithFreelanceAndCategories[]>(cacheKey);
          const cachedCount = getCachedData<number>(countCacheKey);
          
          if (cachedServices && cachedCount !== null) {
            // Mettre à jour l'état avec les données en cache
            if (append) {
              setServices(prev => [...prev, ...cachedServices]);
            } else {
              setServices(cachedServices);
            }
            
            const totalPages = Math.ceil(cachedCount / pageSize);
            setTotalCount(cachedCount);
            setTotalPages(totalPages);
            setHasMore(page < totalPages);
            setLoading(false);
            setInitialLoading(false);
            
            // Rafraîchir en arrière-plan pour maintenir les données à jour
            refreshInBackground(page, append);
            requestInProgressRef.current = false;
            return;
          }
        }
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      // Construire la requête de base avec un joint explicite pour une meilleure recherche
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          categories!inner (id, name, slug),
          subcategories (id, name, slug)
        `, { count: 'exact' });

      // Appliquer les filtres de base directement (sans recherche)
      if (active !== undefined) {
        query = query.eq('active', active);
      }

      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }

      if (freelanceId) {
        query = query.eq('freelance_id', freelanceId);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
      }

      // Appliquer une recherche textuelle simple et sûre
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();
        // Rechercher uniquement dans les champs directs (pas de relation)
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }

      // Pagination
      query = query
        .order('created_at', { ascending: false })
        .range(start, end);

      console.log('Fetching services with query:', query);
      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }

      // Calculer le nombre total de pages
      const total = count || 0;
      const pages = Math.ceil(total / pageSize);

      // Transformer les données pour correspondre au type
      const formattedServices = data.map((service: any) => ({
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
      }));

      if (append) {
        // Ajouter les nouveaux services à la liste existante
        setServices(prev => [...prev, ...formattedServices]);
      } else {
        // Remplacer complètement les services
        setServices(formattedServices);
      }

      setTotalCount(total);
      setTotalPages(pages);
      setHasMore(page < pages);
      
      // Mettre en cache les résultats si l'option est activée
      if (useCache) {
        const cacheKey = getCacheKey(page);
        const countCacheKey = getTotalCountCacheKey();
        
        if (cacheKey) {
          setCachedData<ServiceWithFreelanceAndCategories[]>(
            cacheKey, 
            formattedServices,
            { expiry: CACHE_EXPIRY.SERVICES }
          );
        }
        
        if (countCacheKey) {
          setCachedData(countCacheKey, total, { 
            expiry: CACHE_EXPIRY.SERVICES 
          });
        }
      }
      
    } catch (err: any) {
      console.error('Error in fetchServices:', err);
      setError(err.message || 'Une erreur est survenue');
      
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les services. Veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setIsRefreshing(false);
      requestInProgressRef.current = false;
    }
  }, [
    categoryId, 
    subcategoryId, 
    freelanceId, 
    pageSize, 
    active, 
    featured, 
    searchTerm, 
    toast, 
    useCache, 
    getCacheKey,
    getTotalCountCacheKey,
    forceRefresh,
    refreshInBackground
  ]);

  // Changement de page
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchServices(page, false);
  }, [totalPages, fetchServices]);

  // Charger plus de services (pour le mode "load more")
  const loadMore = useCallback(() => {
    if (currentPage < totalPages && !isRefreshing) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchServices(nextPage, true);
    }
  }, [currentPage, totalPages, isRefreshing, fetchServices]);

  // Rafraîchir les données
  const refresh = useCallback(() => {
    setCurrentPage(1);
    fetchServices(1, false, true);
  }, [fetchServices]);

  // Hook principal pour charger les services lors des changements de paramètres
  useEffect(() => {
    const currentParamsString = getParamsString();
    const paramsChanged = currentParamsString !== lastParamsRef.current || forceRefresh;
    
    // Si les paramètres n'ont pas changé et ce n'est pas un rafraîchissement forcé, ne rien faire
    if (!paramsChanged && !initialLoading) {
      return;
    }
    
    // Si une recherche est en cours, debouncer pour éviter trop de requêtes
    if (searchTerm && searchTerm.trim() !== '') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        setCurrentPage(1);
        fetchServices(1, false);
        lastParamsRef.current = currentParamsString;
      }, 300);
      
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
    
    // Sinon, charger immédiatement
    setCurrentPage(1);
    fetchServices(1, false);
    lastParamsRef.current = currentParamsString;
    
  }, [
    categoryId, 
    subcategoryId, 
    freelanceId, 
    active, 
    featured, 
    pageSize, 
    searchTerm, 
    forceRefresh, 
    getParamsString, 
    fetchServices, 
    initialLoading
  ]);

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

/**
 * Re-export du hook usePaginatedServices avec l'ancien nom pour compatibilité
 * @deprecated Utilisez usePaginatedServices avec l'option {useCache: true}
 */
export function useOptimizedPaginatedServices(params: UsePaginatedServicesParams = {}) {
  return usePaginatedServices(params, { useCache: true });
} 