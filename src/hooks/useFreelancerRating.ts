import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UseFreelancerRatingReturn {
  averageRating: number;
  reviewCount: number;
  loading: boolean;
  error: string | null;
}

// Cache global pour les notes des freelances
const ratingsCache = new Map<string, {
  averageRating: number;
  reviewCount: number;
  timestamp: number;
}>();

// Durée de validité du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Hook optimisé pour récupérer la note moyenne d'un freelance
 * Version améliorée avec cache et meilleure gestion des requêtes
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
  
  // Fonction de récupération des notes, mémorisée pour stabilité des références
  const fetchRating = useCallback(async (id: string, useCache = true): Promise<void> => {
    // Vérifier le cache d'abord
    if (useCache) {
      const cachedData = ratingsCache.get(id);
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
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
    
    // Annuler toute requête en cours
    if (refs.current.abortController) {
      refs.current.abortController.abort();
    }
    
    // Créer un nouveau contrôleur d'annulation
    refs.current.abortController = new AbortController();
    const signal = refs.current.abortController.signal;
    
    // Mettre à jour l'état pour indiquer le chargement
    if (refs.current.isMounted) {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));
    }
    
    try {
      // Vérifier si la requête a été annulée
      if (signal.aborted) return;
      
      // Récupérer tous les avis pour ce freelance
      const { data, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('freelance_id', id)
        .abortSignal(signal);
        
      if (signal.aborted) return;
        
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
        
        // Mettre à jour le cache
        ratingsCache.set(id, {
          averageRating: avgRating,
          reviewCount: count,
          timestamp: Date.now()
        });
      }
      
      // Mettre à jour l'état seulement si le composant est toujours monté
      if (refs.current.isMounted) {
        setState({
          averageRating: avgRating,
          reviewCount: count,
          loading: false,
          error: null
        });
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des avis:', err);
      
      // Vérifier si l'erreur est due à une annulation
      if (signal.aborted) return;
      
      // Mettre à jour l'état d'erreur seulement si le composant est toujours monté
      if (refs.current.isMounted) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Une erreur est survenue'
        }));
      }
    } finally {
      // Nettoyer la référence du contrôleur
      if (refs.current.abortController && refs.current.abortController.signal === signal) {
        refs.current.abortController = null;
      }
    }
  }, []);
  
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
    
    // Nettoyage
    return () => {
      refs.current.isMounted = false;
      
      // Annuler toute requête en cours
      if (refs.current.abortController) {
        refs.current.abortController.abort();
        refs.current.abortController = null;
      }
    };
  }, [freelanceId, fetchRating]);
  
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