import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface TwoFactorVerificationProps {
  phoneNumber: string;
  userId: string;
  email: string;
  password: string;
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

interface VerificationFormData {
  code: string;
}

export default function TwoFactorVerification({
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
    defaultValues: {
      code: ''
    }
  });

  const onSubmit = async (data: VerificationFormData) => {
    try {
      setLoading(true);
      
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
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: 'Erreur',
          description: result.message,
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
      console.error('Erreur lors de la vérification:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la vérification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: 'Erreur',
          description: result.message,
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Code envoyé',
        description: 'Un nouveau code de vérification a été envoyé'
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'envoi du code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-vynal-purple-dark/90 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-vynal-text-primary">Vérification en deux étapes</h1>
        <p className="text-vynal-text-secondary">
          Un code de vérification a été envoyé au numéro {phoneNumber}
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-vynal-text-primary">Code de vérification</Label>
          <Input
            id="code"
            placeholder="Entrez le code à 6 chiffres"
            className="bg-vynal-purple-secondary/30 border-vynal-purple-secondary/50 text-vynal-text-primary placeholder:text-vynal-text-secondary/70 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary"
            {...register('code', { 
              required: 'Le code est requis',
              pattern: {
                value: /^\d{6}$/,
                message: 'Le code doit contenir 6 chiffres'
              }
            })}
          />
          {errors.code && (
            <p className="text-sm text-vynal-status-error">{errors.code.message}</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all" 
          disabled={loading}
        >
          {loading ? 'Vérification...' : 'Vérifier le code'}
        </Button>
      </form>
      
      <div className="flex flex-col space-y-2">
        <Button
          variant="outline"
          onClick={handleResendCode}
          disabled={loading}
          className="w-full border-vynal-accent-primary text-vynal-accent-primary hover:bg-vynal-accent-primary/10 transition-all"
        >
          Renvoyer le code
        </Button>
        
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="w-full text-vynal-text-secondary hover:text-vynal-text-primary hover:bg-vynal-purple-secondary/20"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
} 