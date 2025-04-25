"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Bouton pour débloquer le dashboard principal en redirigeant vers la version simplifiée
 */
export function SimplifyDashboardButton() {
  const router = useRouter();
  
  const redirectToSimpleDashboard = () => {
    router.push('/dashboard/simple');
  };
  
  return (
    <Button 
      onClick={redirectToSimpleDashboard}
      variant="outline"
      className="text-xs bg-white/90 dark:bg-vynal-purple-dark/30 text-vynal-purple-dark dark:text-vynal-text-secondary border-vynal-accent-primary/30"
    >
      Version Simplifiée
    </Button>
  );
}

/**
 * Page de redirection vers la version simplifiée
 */
export default function RedirectToSimpleDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    // Rediriger automatiquement vers le dashboard simplifié après un court délai
    const timeout = setTimeout(() => {
      router.push('/dashboard/simple');
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-vynal-accent-primary rounded-full mb-4"></div>
      <p>Redirection vers la version simplifiée...</p>
      <Button 
        className="mt-4"
        onClick={() => router.push('/dashboard/simple')}
      >
        Continuer immédiatement
      </Button>
    </div>
  );
} 