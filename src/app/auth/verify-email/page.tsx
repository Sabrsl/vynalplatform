"use client";

import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = useMemo(() =>
    searchParams?.get('email') || '',
    [searchParams]
  );
  
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  
  // Fonction pour renvoyer l'email de confirmation
  const resendVerificationEmail = useCallback(async () => {
    if (!email || isResending) return;
    
    try {
      setIsResending(true);
      setResendError(null);
      
      // Construire l'URL de redirection complète et absolue
      const origin = window.location.origin;
      const redirectUrl = `${origin}/auth/callback`;
      
      // Utiliser l'API Supabase pour renvoyer l'email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      
      if (error) {
        // Messages d'erreur plus spécifiques
        if (error.message.includes('already confirmed')) {
          setResendError('Cet email a déjà été confirmé. Vous pouvez vous connecter directement.');
        } else if (error.message.includes('not found') || error.message.includes('no user found')) {
          setResendError('Adresse email non trouvée. Veuillez vérifier l\'email ou créer un nouveau compte.');
        } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          setResendError('Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.');
        } else {
          setResendError(error.message || 'Erreur lors du renvoi de l\'email');
        }
        
        setResendSuccess(false);
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setResendError('Une erreur technique est survenue. Veuillez réessayer plus tard.');
      setResendSuccess(false);
    } finally {
      setIsResending(false);
    }
  }, [email, isResending]);
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-4">
          <Link href="/auth/login" className="inline-flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Retour à la connexion
          </Link>
        </div>
        <div className="bg-white dark:bg-slate-800 py-6 px-4 sm:px-6 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg">
          <h2 className="text-center text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
            Vérifiez votre email
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-3">
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                Un email de confirmation a été envoyé à <strong>{email}</strong>.
                <br />
                Veuillez cliquer sur le lien dans l'email pour activer votre compte.
              </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 dark:border-yellow-500 p-3">
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                Conseils :
              </p>
              <ul className="list-disc pl-5 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 space-y-0.5">
                <li>Vérifiez votre dossier notifications</li>
                <li>L'email peut prendre quelques secondes</li>
                <li>Utilisez le bouton ci-dessous si nécessaire</li>
                <li>Vérifiez l'adresse email saisie</li>
              </ul>
            </div>
            
            {resendSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 p-3">
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                  Un nouvel email de confirmation a été envoyé.
                </p>
              </div>
            )}
            
            {resendError && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-3">
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                  {resendError}
                </p>
              </div>
            )}
            
            <div className="space-y-3 pt-2">
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full h-9 text-xs sm:text-sm flex items-center justify-center"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Renvoyer l'email
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => window.location.href = '/auth/login'}
                className="w-full h-9 text-xs sm:text-sm"
              >
                Retour à la connexion
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Link 
            href="/contact" 
            className="inline-flex items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <HelpCircle className="mr-1 h-3 w-3" />
            Besoin d'aide supplémentaire ? Contactez-nous
          </Link>
        </div>
      </div>
    </div>
  );
} 