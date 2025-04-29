import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { ServiceWithFreelanceAndCategories } from './useServices';
import { useToast } from '@/components/ui/use-toast';
import { usePathname, useSearchParams } from 'next/navigation';

// Vérifier si nous sommes côté client
const isClient = typeof window !== 'undefined';

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
  sortBy?: 'created_at' | 'price' | 'popular'; 
  sortOrder?: 'asc' | 'desc';
  updateUrlOnPageChange?: boolean;
}

export interface UsePaginatedServicesResult {
  services: ServiceWithFreelanceAndCategories[];
  loading: boolean;
  initialLoading: boolean;
  error: Error | PostgrestError | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  isRefreshing: boolean;
  goToPage: (page: number) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isLastPage: boolean;
}

/**
 * Hook optimisé pour charger les services avec pagination et filtrage
 */
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
  sortBy = 'created_at',
  sortOrder = 'desc',
  updateUrlOnPageChange = false
}: UsePaginatedServicesParams): UsePaginatedServicesResult {
  // États
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<Error | PostgrestError | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Références
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastParamsRef = useRef<string>('');
  const requestInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Hooks externes - toujours appelés au niveau supérieur
  const { toast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fonction pour construire une signature unique des paramètres actuels
  const getParamsSignature = useCallback((): string => {
    return JSON.stringify({
      categoryId,
      subcategoryId,
      freelanceId,
      pageSize,
      active,
      featured,
      searchTerm,
      sortBy,
      sortOrder
    });
  }, [categoryId, subcategoryId, freelanceId, pageSize, active, featured, searchTerm, sortBy, sortOrder]);

  // Fonction optimisée pour récupérer les services avec gestion améliorée des erreurs
  const fetchServices = useCallback(async (page: number, append: boolean = false): Promise<void> => {
    // Éviter les requêtes redondantes ou simultanées
    if (requestInProgressRef.current) {
      console.debug('Requête déjà en cours, ignorée');
      return;
    }
    
    // Configurer l'état pour cette requête
    requestInProgressRef.current = true;
    const fetchStartTime = Date.now();
    lastFetchTimeRef.current = fetchStartTime;
    
    // Annuler toute requête précédente
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.debug('Erreur lors de l\'annulation de la requête précédente:', e);
      }
      abortControllerRef.current = null;
    }
    
    // Créer un nouveau contrôleur d'annulation
    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      if (!append) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      setError(null);

      try {
        // Vérifier si le composant est encore monté ou si la requête a été annulée
        if (signal.aborted) {
          console.debug('Requête déjà annulée avant le début de l\'exécution');
          requestInProgressRef.current = false;
          return;
        }
        
        // Calcul des limites de pagination
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        // Construire la requête de base avec les relations
        let query = supabase
          .from('services')
          .select(`
            *,
            profiles (id, username, full_name, avatar_url, bio),
            categories!inner (id, name, slug),
            subcategories (id, name, slug)
          `, { count: 'exact' })
          .abortSignal(signal);

        // Appliquer les filtres
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

        // Optimisation de la recherche textuelle avec FTS si disponible
        if (searchTerm && searchTerm.trim() !== '') {
          const term = searchTerm.trim();
          
          // Tenter d'utiliser la recherche en texte intégral si disponible
          // Sinon utiliser une recherche ILIKE standard mais optimisée
          if (term.length > 2) {
            const searchCondition = `
              title.ilike.%${term}%,
              description.ilike.%${term}%,
              categories.name.ilike.%${term}%
            `;
            query = query.or(searchCondition);
          }
        }

        // Tri dynamique
        let orderColumn = sortBy;
        if (sortBy === 'popular') {
          // Le tri par popularité nécessiterait une implémentation spécifique
          // Pour cet exemple, on utilise created_at par défaut
          orderColumn = 'created_at';
        }
        
        // Appliquer le tri et la pagination
        query = query
          .order(orderColumn, { ascending: sortOrder === 'asc' })
          .range(start, end);

        // Exécuter la requête avec un timeout de sécurité
        const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
          setTimeout(() => {
            reject(new Error('La requête a expiré après 15 secondes'));
          }, 15000);
        });

        // Utiliser Promise.race mais avec un traitement sécurisé du résultat
        const result = await Promise.race([
          query,
          timeoutPromise
        ]);

        // Vérifier si cette requête est toujours pertinente
        if (lastFetchTimeRef.current !== fetchStartTime) {
          console.debug('Résultats ignorés - une requête plus récente a été initiée');
          return;
        }

        // Type casting sécurisé
        const queryResult = result as any;
        const { data, count, error: supabaseError } = queryResult;

        if (supabaseError) {
          throw supabaseError;
        }

        // Vérifier à nouveau si le signal a été annulé pendant la requête
        if (signal.aborted) {
          console.debug('Requête annulée pendant l\'exécution');
          requestInProgressRef.current = false;
          return;
        }

        if (!data) {
          throw new Error('Aucune donnée reçue');
        }

        // Transformer les données pour correspondre au type attendu
        const formattedServices = data.map((service: any): ServiceWithFreelanceAndCategories => ({
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

        // Mettre à jour l'état en fonction du mode (append ou replace)
        if (append && loadMoreMode) {
          // Éviter les doublons lors de l'ajout de nouveaux services
          const existingIds = new Set(services.map((s: ServiceWithFreelanceAndCategories) => s.id));
          const uniqueNewServices = formattedServices.filter((s: ServiceWithFreelanceAndCategories) => !existingIds.has(s.id));
          
          setServices(prev => [...prev, ...uniqueNewServices]);
        } else {
          setServices(formattedServices);
        }

        // Calculer les métriques de pagination
        const total = count || 0;
        const pages = Math.max(1, Math.ceil(total / pageSize));

        setTotalCount(total);
        setTotalPages(pages);
        setHasMore(page < pages);
        
      } catch (err) {
        console.error('Erreur lors du chargement des services:', err);
        
        // Vérifier si c'est une erreur d'annulation (plusieurs formes possibles)
        const isAbortError = 
          (err instanceof Error && (
            err.name === 'AbortError' || 
            err.message === 'The user aborted a request.' || 
            err.message.includes('abort') || 
            err.message.includes('signal is aborted')
          )) || 
          (err && typeof err === 'object' && 'message' in err && 
            (typeof err.message === 'string' && (
              err.message.includes('abort') ||
              err.message.includes('signal is aborted')
            ))
          );
        
        if (isAbortError) {
          console.debug('Requête annulée délibérément - pas d\'erreur à afficher');
          // Ne pas mettre à jour l'état d'erreur pour les requêtes annulées
          requestInProgressRef.current = false;
          return;
        }
        
        // Gestion améliorée des erreurs
        setError(err instanceof Error ? err : new Error('Erreur inconnue lors du chargement des services'));
        
        // Notification utilisateur uniquement pour les erreurs non-techniques
        if (!append && !isAbortError) {
          toast({
            title: 'Erreur de chargement',
            description: 'Impossible de charger les services. Veuillez réessayer.',
            variant: 'destructive'
          });
        }
      } finally {
        // Réinitialiser les états de chargement
        setLoading(false);
        setInitialLoading(false);
        setIsRefreshing(false);
        requestInProgressRef.current = false;
        
        // Ne pas réinitialiser abortControllerRef ici pour permettre l'annulation 
        // pendant le nettoyage du composant
      }
    } catch (e) {
      console.error('Erreur lors de la gestion des contrôleurs d\'annulation:', e);
    }
  }, [
    categoryId, 
    subcategoryId, 
    freelanceId, 
    pageSize, 
    active, 
    featured, 
    searchTerm,
    sortBy,
    sortOrder,
    services,
    loadMoreMode,
    toast
  ]);

  // Navigation de page simplifiée - sans manipulation d'URL
  const goToPage = useCallback((page: number): void => {
    // Validation de la plage
    if (page < 1 || (totalPages > 0 && page > totalPages)) {
      console.warn(`Page ${page} hors limites (1-${totalPages})`);
      return;
    }
    
    // Nous ne modifions plus l'URL car cette fonction est complexe avec App Router
    // et n'est pas essentielle à la fonctionnalité principale
    
    setCurrentPage(page);
    fetchServices(page, false);
  }, [totalPages, fetchServices]);

  // Fonction optimisée pour charger plus de services
  const loadMore = useCallback(async (): Promise<void> => {
    if (currentPage < totalPages && !isRefreshing && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchServices(nextPage, true);
    }
  }, [currentPage, totalPages, isRefreshing, loading, fetchServices]);

  // Fonction de rafraîchissement avec retour à la première page
  const refresh = useCallback(async (): Promise<void> => {
    setCurrentPage(1);
    await fetchServices(1, false);
  }, [fetchServices]);

  // Effet principal pour la gestion des changements de paramètres
  useEffect(() => {
    const currentSignature = getParamsSignature();
    const paramsChanged = currentSignature !== lastParamsRef.current || forceRefresh;
    
    // Si les paramètres n'ont pas changé et ce n'est pas un chargement initial, ne rien faire
    if (!paramsChanged && !initialLoading) {
      return;
    }
    
    // Nettoyer le timer de debounce existant
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Appliquer un debounce intelligent en fonction du type de changement
    const debounceTime = searchTerm ? 350 : 100;
    
    // Assurer que nous n'avons pas de contrôleur d'annulation actif avant d'en créer un nouveau
    const safeCleanupController = () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          console.debug('Erreur lors de l\'annulation de la requête:', e);
        }
        abortControllerRef.current = null;
      }
    };
    
    // Nettoyer immédiatement si nous allons commencer une nouvelle requête
    safeCleanupController();
    
    debounceTimerRef.current = setTimeout(() => {
      lastParamsRef.current = currentSignature;
      
      // En cas de changement de paramètres, toujours revenir à la page 1
      if (paramsChanged && currentPage !== 1 && !loadMoreMode) {
        setCurrentPage(1);
        fetchServices(1, false);
      } else if (loadMoreMode && currentPage > 1 && !paramsChanged) {
        // En mode "load more", préserver les résultats existants
        fetchServices(currentPage, true);
      } else {
        // Cas standard: chargement de la première page
        fetchServices(1, false);
      }
    }, debounceTime);
    
    // Nettoyage lors du démontage ou changement de dépendances
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      safeCleanupController();
    };
  }, [
    getParamsSignature, 
    fetchServices, 
    loadMoreMode, 
    currentPage, 
    forceRefresh, 
    initialLoading
  ]);

  // Effet pour le nettoyage global lors du démontage
  useEffect(() => {
    return () => {
      // S'assurer que tout est proprement nettoyé lors du démontage
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          console.debug('Erreur lors de l\'annulation finale des requêtes:', e);
        }
        abortControllerRef.current = null;
      }
      
      // Indiquer qu'aucune requête n'est en cours
      requestInProgressRef.current = false;
    };
  }, []);

  // Compléter les paramètres de retour avec des valeurs dérivées
  const isLastPage = currentPage >= totalPages;

  return {
    services,
    loading,
    initialLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    loadMore,
    hasMore,
    refresh,
    isRefreshing,
    isLastPage
  };
} 