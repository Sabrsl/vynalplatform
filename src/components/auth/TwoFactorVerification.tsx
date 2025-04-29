import { useState, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';

// Schéma de validation avec Zod
const verificationSchema = z.object({
  code: z.string()
    .min(6, 'Le code doit contenir 6 chiffres')
    .max(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres')
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface TwoFactorVerificationProps {
  phoneNumber: string;
  userId: string;
  email: string;
  password: string;
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

function TwoFactorVerification({
  phoneNumber,
  userId,
  email,
  password,
  onSuccess,
  onCancel
}: TwoFactorVerificationProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: ''
    },
    mode: 'onChange' // Validation en temps réel
  });

  // Gestion des erreurs de réseau
  const handleApiError = useCallback((error: unknown) => {
    console.error('Erreur lors de la vérification:', error);
    toast({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la vérification',
      variant: 'destructive'
    });
    setLoading(false);
  }, [toast]);

  // Mémorisation de la fonction onSubmit pour éviter des re-rendus inutiles
  const onSubmit = useCallback(async (data: VerificationFormData) => {
    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout après 10s
      
      const response = await fetch('/api/auth/two-factor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          phoneNumber,
          code: data.code,
          email,
          password
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: 'Erreur',
          description: result.message || 'Code invalide',
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté'
      });
      
      onSuccess(result.user);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [userId, phoneNumber, email, password, onSuccess, toast, handleApiError]);

  const handleResendCode = useCallback(async () => {
    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout après 10s
      
      const response = await fetch('/api/auth/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: 'Erreur',
          description: result.message || 'Erreur lors de l\'envoi du code',
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Code envoyé',
        description: 'Un nouveau code de vérification a été envoyé'
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [email, password, toast, handleApiError]);

  // Format du numéro de téléphone masqué pour l'affichage
  const displayPhone = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '***-***-$3');

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-vynal-purple-dark/90 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-vynal-text-primary">Vérification en deux étapes</h1>
        <p className="text-vynal-text-secondary">
          Un code de vérification a été envoyé au numéro {displayPhone}
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-vynal-text-primary">Code de vérification</Label>
          <Input
            id="code"
            placeholder="Entrez le code à 6 chiffres"
            className="bg-vynal-purple-secondary/30 border-vynal-purple-secondary/50 text-vynal-text-primary placeholder:text-vynal-text-secondary/70 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary"
            aria-invalid={errors.code ? "true" : "false"}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...register('code')}
          />
          {errors.code && (
            <p className="text-sm text-vynal-status-error" role="alert">{errors.code.message}</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all" 
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <RefreshIndicator 
                isRefreshing={true} 
                size="sm" 
                text={true}
                variant="accent"
              />
            </div>
          ) : (
            'Vérifier le code'
          )}
        </Button>
      </form>
      
      <div className="flex flex-col space-y-2">
        <Button
          variant="outline"
          onClick={handleResendCode}
          disabled={loading}
          className="w-full border-vynal-accent-primary text-vynal-accent-primary hover:bg-vynal-accent-primary/10 transition-all"
          type="button"
        >
          Renvoyer le code
        </Button>
        
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="w-full text-vynal-text-secondary hover:text-vynal-text-primary hover:bg-vynal-purple-secondary/20"
          type="button"
        >
          Annuler
        </Button>
      </div>

      <div className="text-xs text-vynal-text-secondary text-center mt-4">
        <p>Problème avec la réception du code ? Vérifiez votre numéro de téléphone ou contactez le support.</p>
      </div>
    </div>
  );
}

// Mémoisation du composant pour éviter des re-rendus inutiles
export default memo(TwoFactorVerification);