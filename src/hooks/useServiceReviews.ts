import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FreelancerReview } from './useFreelancerReviews';

interface UseServiceReviewsReturn {
  reviews: FreelancerReview[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  averageRating: number;
  reviewCount: number;
}

// Cache pour les avis
const serviceReviewsCache = new Map<string, {
  reviews: FreelancerReview[];
  timestamp: number;
}>();

// Cache global pour éviter des requêtes multiples simultanées vers la même ressource
const pendingRequests = new Map<string, Promise<FreelancerReview[]>>();

// Durée de validité du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Hook pour récupérer les avis d'un service
 */
export function useServiceReviews(serviceId: string | null | undefined): UseServiceReviewsReturn {
  const [reviews, setReviews] = useState<FreelancerReview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Référence pour suivre la requête en cours et le montage du composant
  const refs = useRef({
    isMounted: true,
    abortController: null as AbortController | null,
    serviceId: serviceId
  });
  
  // Fonction de récupération des avis
  const fetchReviews = useCallback(async (id: string, useCache = true): Promise<void> => {
    if (!id) return;
    
    // Vérifier le cache d'abord
    if (useCache) {
      const cachedData = serviceReviewsCache.get(id);
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        if (refs.current.isMounted) {
          setReviews(cachedData.reviews);
          setLoading(false);
          setError(null);
        }
        return;
      }
    }
    
    // Mettre à jour l'état pour indiquer le chargement
    if (refs.current.isMounted) {
      setLoading(true);
      setError(null);
    }
    
    try {
      // Vérifier si une requête est déjà en cours pour cet ID
      let requestPromise = pendingRequests.get(id);
      
      if (!requestPromise) {
        // Annuler toute requête en cours uniquement si on crée une nouvelle requête
        if (refs.current.abortController) {
          refs.current.abortController.abort();
        }
        
        // Créer un nouveau contrôleur d'annulation
        refs.current.abortController = new AbortController();
        const signal = refs.current.abortController.signal;
        
        // Créer une nouvelle promesse pour cette requête
        requestPromise = (async () => {
          try {
            // Récupérer tous les avis
            const { data, error: reviewsError } = await supabase
              .from("reviews")
              .select(`
                *,
                client:client_id (username, full_name, avatar_url)
              `)
              .eq("service_id", id)
              .order("created_at", { ascending: false })
              .abortSignal(signal);
            
            if (signal.aborted) {
              throw new Error("Requête annulée");
            }
            
            if (reviewsError) {
              throw new Error(reviewsError.message || 'Erreur lors de la récupération des avis');
            }
            
            if (data) {
              // Mettre à jour le cache
              serviceReviewsCache.set(id, {
                reviews: data,
                timestamp: Date.now()
              });
              
              return data;
            }
            
            return [];
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
      const data = await requestPromise;
      
      // Mettre à jour l'état seulement si le composant est toujours monté
      if (refs.current.isMounted) {
        setReviews(data);
        setLoading(false);
        setError(null);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des avis:', err);
      
      // Mettre à jour l'état d'erreur seulement si le composant est toujours monté et que ce n'est pas une annulation
      if (refs.current.isMounted && err.message !== "Requête annulée") {
        setLoading(false);
        setError(err.message || 'Une erreur est survenue');
      }
    }
  }, []);
  
  // Fonction de rafraîchissement exposée
  const refresh = useCallback(async (): Promise<void> => {
    if (refs.current.serviceId) {
      await fetchReviews(refs.current.serviceId, false);
    }
  }, [fetchReviews]);
  
  // Effet pour charger les données
  useEffect(() => {
    refs.current.isMounted = true;
    refs.current.serviceId = serviceId;
    
    if (serviceId) {
      fetchReviews(serviceId);
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
  }, [serviceId, fetchReviews]);
  
  // Calculer la note moyenne et le nombre d'avis
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return parseFloat((totalRating / reviews.length).toFixed(1));
  }, [reviews]);
  
  const reviewCount = useMemo(() => reviews.length, [reviews]);
  
  // Retourner un objet memoïsé
  return useMemo(() => ({
    reviews,
    loading,
    error,
    refresh,
    averageRating,
    reviewCount
  }), [reviews, loading, error, refresh, averageRating, reviewCount]);
} 