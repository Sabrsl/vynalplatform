import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  getCachedData, 
  setCachedData, 
  CACHE_EXPIRY 
} from '@/lib/optimizations/cache';
import { CACHE_KEYS, makeCacheKey } from '@/lib/optimizations/invalidation';

interface UseFreelancerRatingReturn {
  averageRating: number;
  reviewCount: number;
  loading: boolean;
  error: string | null;
}

// Cache global pour éviter des requêtes multiples simultanées vers la même ressource
const pendingRequests = new Map<string, Promise<{averageRating: number, reviewCount: number}>>();

/**
 * Hook optimisé pour récupérer la note moyenne d'un freelance
 * Version améliorée avec le système de cache avancé et invalidation
 */
export function useFreelancerRating(freelanceId: string | null | undefined): UseFreelancerRatingReturn {
  // État consolidé
  const [state, setState] = useState<{
    averageRating: number;
    reviewCount: number;
    loading: boolean;
    error: string | null;
  }>({
    averageRating: 0,
    reviewCount: 0,
    loading: false,
    error: null
  });
  
  // Référence pour suivre la requête en cours et le montage du composant
  const refs = useRef({
    isMounted: true,
    abortController: null as AbortController | null,
    freelanceId: freelanceId // Stocker l'ID actuel pour les comparaisons
  });
  
  // Génération de la clé de cache standardisée
  const cacheKey = useMemo(() => 
    freelanceId ? makeCacheKey(CACHE_KEYS.REVIEWS_RATING, { freelanceId }) : null, 
  [freelanceId]);
  
  // Fonction de récupération des notes, mémorisée pour stabilité des références
  const fetchRating = useCallback(async (id: string, useCache = true): Promise<void> => {
    if (!id || !cacheKey) return;
    
    // Vérifier le cache avancé d'abord
    if (useCache) {
      const cachedData = getCachedData<{
        averageRating: number;
        reviewCount: number;
      }>(cacheKey);
      
      if (cachedData) {
        if (refs.current.isMounted) {
          setState(prev => ({
            ...prev,
            averageRating: cachedData.averageRating,
            reviewCount: cachedData.reviewCount,
            loading: false
          }));
        }
        return;
      }
    }
    
    // Mettre à jour l'état pour indiquer le chargement
    if (refs.current.isMounted) {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));
    }
    
    try {
      // Vérifier si une requête est déjà en cours pour cet ID
      let requestPromise = pendingRequests.get(id);
      
      if (!requestPromise) {
        // Créer un nouveau contrôleur d'annulation uniquement pour cette nouvelle requête
        if (refs.current.abortController) {
          refs.current.abortController.abort();
        }
        refs.current.abortController = new AbortController();
        const signal = refs.current.abortController.signal;
        
        // Créer une nouvelle promesse pour cette requête
        requestPromise = (async () => {
          try {
            // Récupérer tous les avis pour ce freelance
            const { data, error: reviewsError } = await supabase
              .from('reviews')
              .select('rating')
              .eq('freelance_id', id)
              .abortSignal(signal);
              
            if (signal.aborted) {
              throw new Error("Requête annulée");
            }
              
            if (reviewsError) {
              throw new Error('Impossible de charger les avis pour ce freelance.');
            }
            
            // Calculer la note moyenne
            let avgRating = 0;
            let count = 0;
            
            if (data && data.length > 0) {
              const totalRating = data.reduce((sum: number, review: { rating: number }) => 
                sum + (review.rating || 0), 0);
              avgRating = parseFloat((totalRating / data.length).toFixed(1));
              count = data.length;
              
              // Mettre à jour le cache avec le système avancé
              setCachedData(cacheKey, {
                averageRating: avgRating,
                reviewCount: count,
              }, {
                expiry: CACHE_EXPIRY.REVIEWS || 7 * 24 * 60 * 60 * 1000, // 7 jours pour les avis
              });
            }
            
            return { averageRating: avgRating, reviewCount: count };
          } finally {
            // Supprimer cette requête de la Map dès qu'elle est terminée
            pendingRequests.delete(id);
            
            // Nettoyer la référence du contrôleur
            if (refs.current.abortController && refs.current.abortController.signal === signal) {
              refs.current.abortController = null;
            }
          }
        })();
        
        // Ajouter cette promesse au Map des requêtes en cours
        pendingRequests.set(id, requestPromise);
      }
      
      // Attendre le résultat
      const result = await requestPromise;
      
      // Mettre à jour l'état seulement si le composant est toujours monté
      if (refs.current.isMounted) {
        setState({
          averageRating: result.averageRating,
          reviewCount: result.reviewCount,
          loading: false,
          error: null
        });
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des avis');
      
      // Mettre à jour l'état d'erreur seulement si le composant est toujours monté
      if (refs.current.isMounted && err.message !== "Requête annulée") {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Une erreur est survenue'
        }));
      }
    }
  }, [cacheKey]);
  
  // Effet pour charger les données
  useEffect(() => {
    refs.current.isMounted = true;
    refs.current.freelanceId = freelanceId;
    
    if (freelanceId) {
      fetchRating(freelanceId);
    } else {
      // Réinitialiser l'état si pas d'ID
      setState({
        averageRating: 0,
        reviewCount: 0,
        loading: false,
        error: null
      });
    }
    
    // Effet pour écouter les événements d'invalidation de cache
    const handleCacheInvalidation = (event: CustomEvent) => {
      // Vérifier si cette clé est concernée par l'invalidation
      const invalidatedKey = event.detail?.key;
      const type = event.detail?.type;
      
      // Invalider sur des événements spécifiques aux avis
      if (freelanceId && (
        (invalidatedKey && (invalidatedKey === cacheKey || invalidatedKey.includes('reviews'))) ||
        (type && type.includes('review'))
      )) {
        fetchRating(freelanceId, false);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation as EventListener);
    }
    
    // Nettoyage
    return () => {
      refs.current.isMounted = false;
      
      // Annuler toute requête en cours
      if (refs.current.abortController) {
        refs.current.abortController.abort();
        refs.current.abortController = null;
      }
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation as EventListener);
      }
    };
  }, [freelanceId, fetchRating, cacheKey]);
  
  // Retourner un objet memoïsé
  return useMemo(() => ({
    averageRating: state.averageRating,
    reviewCount: state.reviewCount,
    loading: state.loading,
    error: state.error
  }), [
    state.averageRating,
    state.reviewCount,
    state.loading,
    state.error
  ]);
} 