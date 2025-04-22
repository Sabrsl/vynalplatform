import { useState } from 'react';
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
}

export function useCreateReview(): UseCreateReviewReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const submitReview = async (data: CreateReviewParams): Promise<boolean> => {
    if (!data.service_id || !data.freelance_id || !data.client_id || !data.order_id) {
      const error = new Error('Informations manquantes pour soumettre l\'avis');
      setError(error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data: reviewData, error: insertError } = await supabase
        .from('reviews')
        .insert({
          service_id: data.service_id,
          freelance_id: data.freelance_id,
          client_id: data.client_id,
          order_id: data.order_id,
          rating: data.rating,
          comment: data.comment
        })
        .select('*')
        .single();
        
      if (insertError) {
        console.error('Erreur lors de la soumission de l\'avis:', insertError);
        throw new Error('Impossible de soumettre votre avis');
      }
      
      toast({
        title: 'Avis publié',
        description: 'Votre avis a été publié avec succès',
        variant: 'success'
      });
      
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la soumission de l\'avis:', err);
      setError(err);
      toast({
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue lors de l\'envoi de votre avis',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitReview,
    isLoading,
    error
  };
} 