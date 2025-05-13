import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface FreelancerReview {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  client_id: string;
  freelance_id: string;
  service_id: string;
  client?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  services?: {
    title: string | null;
    slug: string | null;
  };
}

interface UseFreelancerReviewsReturn {
  reviews: FreelancerReview[];
  positiveReviews: FreelancerReview[];
  negativeReviews: FreelancerReview[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Cache pour les avis
const reviewsCache = new Map<string, {
  reviews: FreelancerReview[];
  timestamp: number;
}>();

// Durée de validité du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Hook pour récupérer les avis d'un freelance
 */
export function useFreelancerReviews(freelanceId: string | null | undefined): UseFreelancerReviewsReturn {
  const [reviews, setReviews] = useState<FreelancerReview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Référence pour suivre la requête en cours et le montage du composant
  const refs = useRef({
    isMounted: true,
    abortController: null as AbortController | null,
    freelanceId: freelanceId
  });
  
  // Fonction de récupération des avis
  const fetchReviews = useCallback(async (id: string, useCache = true): Promise<void> => {
    if (!id) return;
    
    // Vérifier le cache d'abord
    if (useCache) {
      const cachedData = reviewsCache.get(id);
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        if (refs.current.isMounted) {
          setReviews(cachedData.reviews);
          setLoading(false);
          setError(null);
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
      setLoading(true);
      setError(null);
    }
    
    try {
      // Récupérer tous les avis
      const { data, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          *,
          client:client_id (username, full_name, avatar_url),
          services:service_id (title, slug)
        `)
        .eq("freelance_id", id)
        .order("created_at", { ascending: false })
        .abortSignal(signal);
      
      if (signal.aborted) return;
      
      if (reviewsError) {
        throw new Error(reviewsError.message || 'Erreur lors de la récupération des avis');
      }
      
      if (data) {
        // Mettre à jour le cache
        reviewsCache.set(id, {
          reviews: data,
          timestamp: Date.now()
        });
        
        // Mettre à jour l'état
        if (refs.current.isMounted) {
          setReviews(data);
          setLoading(false);
          setError(null);
        }
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des avis:', err);
      
      // Vérifier si l'erreur est due à une annulation
      if (signal.aborted) return;
      
      // Mettre à jour l'état d'erreur
      if (refs.current.isMounted) {
        setLoading(false);
        setError(err.message || 'Une erreur est survenue');
      }
    }
  }, []);
  
  // Fonction de rafraîchissement exposée
  const refresh = useCallback(async (): Promise<void> => {
    if (refs.current.freelanceId) {
      await fetchReviews(refs.current.freelanceId, false);
    }
  }, [fetchReviews]);
  
  // Effet pour charger les données
  useEffect(() => {
    refs.current.isMounted = true;
    refs.current.freelanceId = freelanceId;
    
    if (freelanceId) {
      fetchReviews(freelanceId);
    } else {
      // Réinitialiser l'état si pas d'ID
      setReviews([]);
      setLoading(false);
      setError(null);
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
  }, [freelanceId, fetchReviews]);
  
  // Calculer les avis positifs et négatifs
  const positiveReviews = useMemo(() => 
    reviews.filter(review => review.rating >= 4), 
  [reviews]);
  
  const negativeReviews = useMemo(() => 
    reviews.filter(review => review.rating < 4), 
  [reviews]);
  
  // Retourner un objet memoïsé
  return useMemo(() => ({
    reviews,
    positiveReviews,
    negativeReviews,
    loading,
    error,
    refresh
  }), [reviews, positiveReviews, negativeReviews, loading, error, refresh]);
} 