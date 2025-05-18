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

// Gestionnaire de cache global pour éviter de refaire les mêmes requêtes pour les mêmes IDs
interface CacheEntry {
  reviews: FreelancerReview[];
  timestamp: number;
}

// Durée de validité du cache en millisecondes (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache partagé entre tous les hooks
const serviceReviewsCache = new Map<string, CacheEntry>();

// Map pour stocker les requêtes en cours
const pendingRequests = new Map<string, Promise<FreelancerReview[]>>();

// Désactivation temporaire des appels à la base de données pour les reviews
const DISABLE_REVIEWS_DB_CALLS = true;

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
  
  // Calculer la note moyenne
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }, [reviews]);
  
  // Nombre total d'avis
  const reviewCount = useMemo(() => reviews.length, [reviews]);
  
  // Fonction pour récupérer les avis
  const fetchReviews = useCallback(async (id: string, useCache = true): Promise<void> => {
    if (!id) return;

    // DÉSACTIVATION TEMPORAIRE DES APPELS AUX REVIEWS
    // Retourner un tableau vide immédiatement
    setReviews([]);
    setLoading(false);
    return;
    
    /* COMMENTÉ TEMPORAIREMENT
    // Vérifier si les données sont dans le cache et si elles sont encore valides
    if (useCache) {
      const cachedData = serviceReviewsCache.get(id);
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        // Utiliser les données du cache
        setReviews(cachedData.reviews);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
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
        
        // Ajouter cette requête à la Map des requêtes en cours
        pendingRequests.set(id, requestPromise);
      }
      
      // Attendre le résultat de la requête
      const reviewsData = await requestPromise;
      
      // Mettre à jour l'état avec les données récupérées
      setReviews(reviewsData);
    } catch (err: any) {
      // Ne pas définir d'erreur si la requête a été annulée volontairement
      if (err.message !== "Requête annulée") {
        console.error('Erreur lors de la récupération des avis:', err);
        setError(err.message || 'Une erreur est survenue lors de la récupération des avis');
      }
    } finally {
      setLoading(false);
    }
    */
  }, []);
  
  // Fonction pour rafraîchir les avis (sans utiliser le cache)
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