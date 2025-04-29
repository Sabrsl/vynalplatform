import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2, AlertTriangle, Send, InfoIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createDispute } from '@/lib/supabase/disputes';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from 'framer-motion';

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

  // Calculer la longueur du texte pour l'indicateur de progression
  const charCount = reason.length;
  const minRecommendedLength = 20;
  const idealLength = 100;
  
  // Calculer le pourcentage pour l'indicateur de progrès
  const progressPercentage = useMemo(() => {
    if (charCount < minRecommendedLength) return (charCount / minRecommendedLength) * 50;
    if (charCount < idealLength) return 50 + ((charCount - minRecommendedLength) / (idealLength - minRecommendedLength)) * 50;
    return 100;
  }, [charCount]);
  
  // Déterminer la couleur de l'indicateur de progrès
  const progressColor = useMemo(() => {
    if (charCount < minRecommendedLength) return 'bg-red-400';
    if (charCount < idealLength) return 'bg-amber-400';
    return 'bg-emerald-400';
  }, [charCount]);

  // Mémoriser le gestionnaire de soumission pour éviter les re-rendus inutiles
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedReason = reason.trim();
    
    if (!trimmedReason) {
      setError("Veuillez saisir une raison pour ce litige.");
      return;
    }
    
    if (trimmedReason.length < minRecommendedLength) {
      setError(`Veuillez fournir une description plus détaillée (minimum ${minRecommendedLength} caractères recommandés).`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const dispute = await createDispute({
        client_id: clientId,
        freelance_id: freelanceId,
        order_id: orderId,
        reason: trimmedReason,
        status: 'open'
      });
      
      if (dispute) {
        toast({
          title: "Litige créé",
          description: "Votre litige a été ouvert avec succès. Notre équipe va l'examiner.",
          variant: "default"
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
  }, [reason, clientId, freelanceId, orderId, onSuccess, router, toast, minRecommendedLength]);
  
  // Gestionnaire de changement pour le champ de texte
  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    if (error) setError(null); // Effacer l'erreur lorsque l'utilisateur commence à taper
  }, [error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Alert variant="destructive" className="shadow-sm bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800/20 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
                <AlertTitle className="text-xs font-bold">Erreur</AlertTitle>
                <AlertDescription className="text-[10px]">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="reason" className="text-xs font-medium mb-1 dark:text-vynal-text-primary">Raison du litige</Label>
            <span className={`text-[10px] ${
              charCount < minRecommendedLength ? 'text-red-500 dark:text-red-400' : 
              charCount < idealLength ? 'text-amber-500 dark:text-amber-400' : 
              'text-emerald-500 dark:text-emerald-400'
            }`}>
              {charCount} caractère{charCount > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="relative">
            <Textarea
              id="reason"
              value={reason}
              onChange={handleReasonChange}
              placeholder="Décrivez en détail la raison de votre litige..."
              className="mt-1 resize-none bg-white/50 backdrop-blur-sm border-slate-200 shadow-sm transition-all focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-xs dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-primary dark:placeholder:text-vynal-text-secondary/50"
              rows={5}
              disabled={isSubmitting}
              required
            />
          </div>
          
          {/* Indicateur de progression */}
          <div className="mt-1">
            <div className="w-full h-1 bg-slate-100 dark:bg-vynal-purple-secondary/20 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${progressColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          <div className="flex items-start mt-2">
            <InfoIcon className="h-3.5 w-3.5 text-slate-400 dark:text-vynal-text-secondary/70 mr-2 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
            <p className="text-[10px] text-slate-500 dark:text-vynal-text-secondary/80">
              Soyez précis et factuel. Décrivez le problème rencontré et ce que vous attendez comme résolution. Un litige bien documenté sera traité plus rapidement.
            </p>
          </div>
        </div>
        
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !reason.trim() || reason.trim().length < minRecommendedLength}
            className="w-full transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-xs dark:text-vynal-purple-dark"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Ouvrir un litige</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}