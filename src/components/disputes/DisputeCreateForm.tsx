import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createDispute } from '@/lib/supabase/disputes';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DisputeCreateFormProps {
  clientId: string;
  freelanceId: string;
  orderId: string;
  onSuccess?: () => void;
}

export function DisputeCreateForm({ 
  clientId, 
  freelanceId, 
  orderId,
  onSuccess
}: DisputeCreateFormProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError("Veuillez saisir une raison pour ce litige.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const dispute = await createDispute({
        client_id: clientId,
        freelance_id: freelanceId,
        order_id: orderId,
        reason: reason.trim(),
        status: 'open'
      });
      
      if (dispute) {
        toast({
          title: "Litige créé",
          description: "Votre litige a été ouvert avec succès. Notre équipe va l'examiner.",
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/dashboard/disputes/${dispute.id}`);
        }
      } else {
        setError("Une erreur est survenue lors de la création du litige.");
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      setError("Une erreur est survenue lors de la création du litige.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <Label htmlFor="reason">Raison du litige</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Décrivez en détail la raison de votre litige..."
          className="mt-1 resize-none"
          rows={5}
          disabled={isSubmitting}
          required
        />
        <p className="text-xs text-slate-500 mt-1 dark:text-vynal-text-secondary">
          Soyez précis et factuel. Décrivez le problème rencontré et ce que vous attendez comme résolution.
        </p>
      </div>
      
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !reason.trim()}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Ouvrir un litige"
          )}
        </Button>
      </div>
    </form>
  );
} 