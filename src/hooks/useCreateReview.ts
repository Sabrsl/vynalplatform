import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CreateReviewParams {
  service_id: string;
  freelance_id: string;
  client_id: string;
  order_id: string;
  rating: number;
  comment: string;
}

interface UseCreateReviewReturn {
  submitReview: (data: CreateReviewParams) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetState: () => void;
}

/**
 * Hook optimisé pour la création et soumission des avis
 * - Utilise useCallback pour stabiliser les références des fonctions
 * - Gère correctement les opérations asynchrones avec un isMounted ref
 * - Fournit une fonction de réinitialisation d'état
 */
export function useCreateReview(): UseCreateReviewReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Référence pour savoir si le composant est monté
  const isMountedRef = useRef(true);

  // Fonction optimisée pour soumettre un avis
  const submitReview = useCallback(async (data: CreateReviewParams): Promise<boolean> => {
    // Validation initiale des données
    if (!data.service_id || !data.freelance_id || !data.client_id || !data.order_id) {
      const validationError = new Error('Informations manquantes pour soumettre l\'avis');
      
      if (isMountedRef.current) {
        setError(validationError);
        toast({
          title: 'Erreur',
          description: validationError.message,
          variant: 'destructive'
        });
      }
      
      return false;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      // Préparer l'objet de données pour l'insertion
      const reviewObject = {
        service_id: data.service_id,
        freelance_id: data.freelance_id,
        client_id: data.client_id,
        order_id: data.order_id,
        rating: data.rating,
        comment: data.comment,
        created_at: new Date().toISOString() // Ajouter un timestamp
      };
      
      const { data: reviewData, error: insertError } = await supabase
        .from('reviews')
        .insert(reviewObject)
        .select('*')
        .single();
        
      if (insertError) {
        console.error('Erreur lors de la soumission de l\'avis:', insertError);
        throw new Error('Impossible de soumettre votre avis');
      }
      
      if (isMountedRef.current) {
        toast({
          title: 'Avis publié',
          description: 'Votre avis a été publié avec succès',
          variant: 'success'
        });
      }
      
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la soumission de l\'avis:', err);
      
      if (isMountedRef.current) {
        setError(err);
        toast({
          title: 'Erreur',
          description: err.message || 'Une erreur est survenue lors de l\'envoi de votre avis',
          variant: 'destructive'
        });
      }
      
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast]);
  
  // Fonction pour réinitialiser l'état
  const resetState = useCallback(() => {
    if (isMountedRef.current) {
      setIsLoading(false);
      setError(null);
    }
  }, []);
  
  // Effet pour gérer le cycle de vie du composant
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Retourne un objet mémorisé pour éviter les re-rendus inutiles
  return useMemo(() => ({
    submitReview,
    isLoading,
    error,
    resetState
  }), [submitReview, isLoading, error, resetState]);
} 