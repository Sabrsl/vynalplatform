"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from '@/hooks/useCreateReview';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';

interface CreateReviewFormProps {
  serviceId: string;
  freelanceId: string;
  clientId: string;
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateReviewForm({
  serviceId,
  freelanceId,
  clientId,
  orderId,
  onSuccess,
  onCancel
}: CreateReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const { submitReview, isLoading, error } = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return; // Empêcher la soumission si aucune note n'est sélectionnée
    }
    
    const success = await submitReview({
      service_id: serviceId,
      freelance_id: freelanceId,
      client_id: clientId,
      order_id: orderId,
      rating,
      comment
    });
    
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl p-4 shadow-lg shadow-vynal-accent-secondary/20">
      <h3 className="text-lg font-semibold text-vynal-text-primary mb-4">Évaluez votre expérience</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating stars */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-vynal-text-primary">
            Note <span className="text-red-500">*</span>
          </label>
          
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
                aria-label={`Note ${star} sur 5`}
              >
                <Star 
                  className={cn(
                    'h-8 w-8 transition-colors',
                    (hoverRating ? star <= hoverRating : star <= rating)
                      ? 'text-vynal-accent-primary fill-vynal-accent-primary' 
                      : 'text-vynal-purple-secondary/50 fill-transparent'
                  )} 
                />
              </button>
            ))}
          </div>
          
          {rating === 0 && (
            <p className="text-xs text-vynal-status-error">Veuillez sélectionner une note</p>
          )}
        </div>
        
        {/* Comment */}
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium text-vynal-text-primary">
            Commentaire
          </label>
          
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience avec ce service et ce freelance..."
            className="min-h-[120px] resize-none bg-transparent border-vynal-purple-secondary/30 text-vynal-text-primary focus-visible:ring-vynal-accent-primary"
          />
        </div>
        
        {error && (
          <div className="text-vynal-status-error text-sm p-3 bg-vynal-status-error/10 rounded-md border border-vynal-status-error/20">
            {error.message}
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onCancel}
              disabled={isLoading}
              className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
            >
              Annuler
            </Button>
          )}
          
          <Button 
            type="submit"
            disabled={isLoading || rating === 0}
            className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
          >
            {isLoading ? (
              <>
                <Loader size="xs" variant="white" className="mr-2" />
                Envoi en cours...
              </>
            ) : (
              'Publier mon avis'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 