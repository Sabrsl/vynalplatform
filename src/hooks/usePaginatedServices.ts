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
  // États avec des valeurs par défaut appropriées
  const [state, setState] = useState<{
    services: ServiceWithFreelanceAndCategories[];
    loading: boolean;
    initialLoading: boolean;
    error: Error | PostgrestError | null;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
    isRefreshing: boolean;
  }>({
    services: [],
    loading: false,
    initialLoading: true,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasMore: false,
    isRefreshing: false
  });
  
  // Références groupées pour éviter les re-rendus inutiles
  const refs = useRef({
    debounceTimer: null as ReturnType<typeof setTimeout> | null,
    lastParams: '',
    requestInProgress: false,
    abortController: null as AbortController | null,
    lastFetchTime: 0,
    currentRequestId: '',
    isMounted: true,
    paramsSignature: '' // Cache de la signature des paramètres
  });
  
  // Hooks externes
  const { toast } = useToast();
  const toastRef = useRef(toast);
  
  // Mettre à jour la référence du toast quand elle change
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Fonction pour obtenir la signature unique des paramètres actuels (mise en cache)
  const getParamsSignature = useCallback((): string => {
    // Vérifier si nous avons déjà calculé cette signature
    if (!refs.current.paramsSignature) {
      refs.current.paramsSignature = JSON.stringify({
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
    }
    return refs.current.paramsSignature;
  }, [categoryId, subcategoryId, freelanceId, pageSize, active, featured, searchTerm, sortBy, sortOrder]);

  // Réinitialiser la signature en cache quand les dépendances changent
  useEffect(() => {
    refs.current.paramsSignature = '';
  }, [categoryId, subcategoryId, freelanceId, pageSize, active, featured, searchTerm, sortBy, sortOrder]);

  // Fonction de nettoyage du contrôleur d'annulation améliorée
  const cleanupController = useCallback(() => {
    if (refs.current.abortController) {
      try {
        if (!refs.current.abortController.signal.aborted) {
          refs.current.abortController.abort();
        }
      } catch (e) {
        // Ignorer silencieusement les erreurs d'annulation
      } finally {
        refs.current.abortController = null;
      }
    }
  }, []);

  // Fonction principale de chargement des services
  const fetchServices = useCallback(async (page: number, append: boolean = false): Promise<void> => {
    if (typeof window === 'undefined' || !refs.current.isMounted) return;
    
    if (refs.current.requestInProgress) {
      console.debug('Requête déjà en cours, ignorée');
      return;
    }
    
    // Configuration de l'état pour cette requête
    refs.current.requestInProgress = true;
    const fetchStartTime = Date.now();
    refs.current.lastFetchTime = fetchStartTime;
    refs.current.currentRequestId = `fetch-${fetchStartTime}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Nettoyer toute requête précédente
    cleanupController();
    
    // État de chargement optimisé
    setState(prev => ({
      ...prev,
      loading: !append,
      isRefreshing: append,
      error: null
    }));
    
    // Créer un nouveau contrôleur d'annulation
    try {
      refs.current.abortController = new AbortController();
      const signal = refs.current.abortController.signal;
      const requestId = refs.current.currentRequestId;

      try {
        // Vérifier si la requête a déjà été annulée
        if (signal.aborted) {
          console.debug('Requête déjà annulée avant le début de l\'exécution');
          refs.current.requestInProgress = false;
          return;
        }
        
        // Calcul des limites de pagination
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
          .abortSignal(signal);

        // Appliquer les filtres
        if (active !== undefined) query = query.eq('active', active);
        if (featured !== undefined) query = query.eq('is_featured', featured);
        if (freelanceId) query = query.eq('freelance_id', freelanceId);
        if (categoryId) query = query.eq('category_id', categoryId);
        if (subcategoryId) query = query.eq('subcategory_id', subcategoryId);

        // Recherche textuelle optimisée
        if (searchTerm && searchTerm.trim() !== '') {
          const term = searchTerm.trim();
          
          if (term.length > 2) {
            console.log('Début de la recherche avec le terme:', term);
            
            // Diviser le terme de recherche en mots-clés
            const keywords = term.toLowerCase().split(/\s+/);
            console.log('Mots-clés extraits:', keywords);
            
            // Requête de base
            query = query.eq('active', true);
            
            // Ajouter les conditions de recherche pour chaque mot-clé
            keywords.forEach(keyword => {
              query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
            });

            // Log de la requête
            console.log('Requête de recherche:', {
              active: true,
              searchTerm: term,
              keywords: keywords
            });
          }
        }

        // Tri et pagination
        const orderColumn = sortBy === 'popular' ? 'created_at' : sortBy;
        query = query
          .order(orderColumn, { ascending: sortOrder === 'asc' })
          .range(start, end);

        // Timeout de sécurité avec abort signal pour éviter les fuites
        const timeoutId = setTimeout(() => {
          if (refs.current.abortController && !signal.aborted) {
            refs.current.abortController.abort('Request timeout after 15s');
          }
        }, 15000);

        // Exécuter la requête
        const { data, count, error: supabaseError } = await query;

        // Nettoyer le timeout
        clearTimeout(timeoutId);

        // Vérifier si cette requête est toujours pertinente
        if (!refs.current.isMounted || refs.current.currentRequestId !== requestId) {
          console.debug('Résultats ignorés - requête obsolète');
          return;
        }

        // Gérer les erreurs
        if (supabaseError) {
          console.error('Erreur Supabase:', supabaseError);
          throw new Error(`Erreur de recherche: ${supabaseError.message}`);
        }
        if (signal.aborted || refs.current.currentRequestId !== requestId) {
          console.debug('Requête annulée pendant l\'exécution ou devenue obsolète');
          return;
        }
        if (!data) throw new Error('Aucune donnée reçue');

        // Formater les services
        const formattedServices = data.map((service: any): ServiceWithFreelanceAndCategories => ({
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

        // Mettre à jour l'état de manière optimisée
        setState(prev => {
          // Éviter les doublons lors de l'ajout de nouveaux services
          if (append && loadMoreMode) {
            const existingIds = new Set(prev.services.map(s => s.id));
            const uniqueNewServices = formattedServices.filter(s => !existingIds.has(s.id));
            
            return {
              ...prev,
              services: [...prev.services, ...uniqueNewServices],
              loading: false,
              initialLoading: false,
              error: null,
              currentPage: page,
              totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
              totalCount: count || 0,
              hasMore: page < Math.ceil((count || 0) / pageSize),
              isRefreshing: false
            };
          } else {
            return {
              ...prev,
              services: formattedServices,
              loading: false,
              initialLoading: false,
              error: null,
              currentPage: page,
              totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
              totalCount: count || 0,
              hasMore: page < Math.ceil((count || 0) / pageSize),
              isRefreshing: false
            };
          }
        });
        
      } catch (err) {
        // Ignorer les erreurs pour les requêtes obsolètes
        if (!refs.current.isMounted || refs.current.currentRequestId !== requestId) {
          console.debug('Erreur ignorée - requête obsolète');
          return;
        }
        
        // Vérifier si c'est une erreur d'annulation
        const isAbortError = 
          (err instanceof Error && (
            err.name === 'AbortError' || 
            err.message.includes('abort') || 
            err.message.includes('signal is aborted')
          )) || 
          (err && typeof err === 'object' && 'message' in err && 
            typeof (err as any).message === 'string' && 
            ((err as any).message.includes('abort') || (err as any).message.includes('signal is aborted'))
          );
        
        if (isAbortError) {
          console.debug('Requête annulée délibérément');
          return;
        }
        
        // Gérer l'erreur
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Erreur inconnue lors du chargement des services'),
          loading: false,
          initialLoading: false,
          isRefreshing: false
        }));
        
        // Notification utilisateur
        if (!append && !isAbortError && refs.current.isMounted) {
          toastRef.current({
            title: 'Erreur de chargement',
            description: 'Impossible de charger les services. Veuillez réessayer.',
            variant: 'destructive'
          });
        }
      } finally {
        refs.current.requestInProgress = false;
      }
    } catch (e) {
      console.error('Erreur lors de la gestion des contrôleurs d\'annulation:', e);
      refs.current.requestInProgress = false;
      setState(prev => ({
        ...prev,
        loading: false,
        initialLoading: false,
        isRefreshing: false
      }));
    }
  }, [categoryId, subcategoryId, freelanceId, pageSize, active, featured, searchTerm, sortBy, sortOrder, loadMoreMode, cleanupController]);

  // Fonctions publiques exposées par le hook
  const goToPage = useCallback((page: number): void => {
    if (page < 1 || (state.totalPages > 0 && page > state.totalPages)) {
      console.warn(`Page ${page} hors limites (1-${state.totalPages})`);
      return;
    }
    
    setState(prev => ({ ...prev, currentPage: page }));
    fetchServices(page, false);
  }, [state.totalPages, fetchServices]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (state.currentPage < state.totalPages && !state.isRefreshing && !state.loading) {
      const nextPage = state.currentPage + 1;
      setState(prev => ({ ...prev, currentPage: nextPage }));
      await fetchServices(nextPage, true);
    }
  }, [state.currentPage, state.totalPages, state.isRefreshing, state.loading, fetchServices]);

  const refresh = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, currentPage: 1 }));
    await fetchServices(1, false);
  }, [fetchServices]);

  // Effet principal combiné pour gérer les changements de paramètres
  useEffect(() => {
    if (!refs.current.isMounted) return;
    
    const currentSignature = getParamsSignature();
    const paramsChanged = currentSignature !== refs.current.lastParams || forceRefresh;
    
    // Ne rien faire si les paramètres n'ont pas changé et ce n'est pas un chargement initial
    if (!paramsChanged && !state.initialLoading) return;
    
    // Nettoyer le timer de debounce existant
    if (refs.current.debounceTimer) {
      clearTimeout(refs.current.debounceTimer);
      refs.current.debounceTimer = null;
    }
    
    // Debounce optimisé
    const debounceTime = searchTerm ? 350 : 100;
    
    // Nettoyer les requêtes précédentes
    cleanupController();
    
    // Debounce pour la recherche
    refs.current.debounceTimer = setTimeout(() => {
      refs.current.lastParams = currentSignature;
      
      // Logique de pagination adaptée selon le mode et les changements
      if (paramsChanged && state.currentPage !== 1 && !loadMoreMode) {
        setState(prev => ({ ...prev, currentPage: 1 }));
        fetchServices(1, false);
      } else if (loadMoreMode && state.currentPage > 1 && !paramsChanged) {
        fetchServices(state.currentPage, true);
      } else {
        fetchServices(1, false);
      }
    }, debounceTime);
    
    // Nettoyage
    return () => {
      if (refs.current.debounceTimer) {
        clearTimeout(refs.current.debounceTimer);
        refs.current.debounceTimer = null;
      }
      cleanupController();
    };
  }, [getParamsSignature, fetchServices, loadMoreMode, forceRefresh, state.initialLoading, state.currentPage, cleanupController]);

  // Effet de nettoyage global
  useEffect(() => {
    refs.current.isMounted = true;
    
    return () => {
      refs.current.isMounted = false;
      
      if (refs.current.debounceTimer) {
        clearTimeout(refs.current.debounceTimer);
        refs.current.debounceTimer = null;
      }
      
      cleanupController();
    };
  }, [cleanupController]);

  // Valeur dérivée
  const isLastPage = state.currentPage >= state.totalPages;

  // Retourner l'interface publique
  return {
    services: state.services,
    loading: state.loading,
    initialLoading: state.initialLoading,
    error: state.error,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalCount: state.totalCount,
    goToPage,
    loadMore,
    hasMore: state.hasMore,
    refresh,
    isRefreshing: state.isRefreshing,
    isLastPage
  };
} 