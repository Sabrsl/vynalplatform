"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/auth-layout';
import { CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = useMemo(() => 
    searchParams.get('email') || '', 
    [searchParams]
  );
  
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes
  
  // Compte à rebours pour redirection automatique
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining]);
  
  // Format du temps restant (mm:ss)
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);
  
  return (
    <AuthLayout title="Vérification d'email">
      <div className="w-full max-w-md p-8 space-y-6 bg-vynal-purple-dark/90 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center">
            <Mail className="h-8 w-8 text-vynal-accent-primary" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold">Vérifiez votre email</h2>
        
        <p className="text-sm text-vynal-text-secondary">
          {email ? (
            <>
              Nous avons envoyé un lien de confirmation à <span className="font-medium text-vynal-text-primary">{email}</span>.
            </>
          ) : (
            <>Nous avons envoyé un lien de confirmation à votre adresse email.</>
          )}
        </p>
        
        <div className="text-sm text-vynal-text-secondary space-y-4">
          <p>Veuillez consulter votre boîte de réception et cliquer sur le lien pour activer votre compte.</p>
          
          <div className="flex items-center justify-center space-x-2 text-xs">
            <CheckCircle className="h-4 w-4 text-vynal-status-success" />
            <span>Le lien est valide pendant 24 heures</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-vynal-purple-secondary/20">
          <p className="text-sm mb-4">
            Vous serez redirigé vers la page de connexion dans {formattedTime}
          </p>
          
          <Link href="/auth/login">
            <Button 
              variant="default" 
              className="w-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90"
            >
              Aller à la page de connexion
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
} 