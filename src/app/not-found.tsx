"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, HomeIcon, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavigationLoadingState } from "@/app/providers";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const isDashboardError = pathname?.startsWith('/dashboard');

  // Gérer la redirection automatique pour les erreurs du dashboard
  useEffect(() => {
    // Enregistrer l'erreur de navigation
    if (typeof window !== 'undefined' && pathname) {
      NavigationLoadingState.recordNavigationError();
    }

    // Redirection automatique pour les erreurs dans le dashboard
    if (isDashboardError && user) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isDashboardError, user, router, pathname]);

  // Fonction pour analyser et corriger l'URL d'un dashboard qui aurait causé l'erreur 404
  const getSuggestedURL = () => {
    if (!pathname?.startsWith('/dashboard/')) return null;

    // Extraire la partie après /dashboard/
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return '/dashboard';

    // Les sections principales connues du dashboard
    const knownSections = [
      'orders', 'messages', 'disputes', 'wallet', 'payments', 
      'services', 'profile', 'stats', 'settings'
    ];

    // Vérifier si la section principale est connue
    const mainSection = segments[1];
    if (knownSections.includes(mainSection)) {
      // Si c'est une section connue, suggérer au moins la section principale
      return `/dashboard/${mainSection}`;
    }

    // Par défaut, retourner au dashboard principal
    return '/dashboard';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4 max-w-xl">
        <h1 className="text-7xl sm:text-9xl font-bold text-vynal-accent-primary">404</h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mt-4 sm:mt-6 mb-3 sm:mb-4 text-slate-800 dark:text-vynal-text-primary">
          Oups ! Page introuvable
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-vynal-text-secondary mb-3 sm:mb-4">
          Nous ne trouvons pas la page que vous recherchez. 
          Elle a peut-être été déplacée ou supprimée.
        </p>
        
        {isDashboardError && user && (
          <div className="mt-2 mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
              Redirection automatique vers le tableau de bord dans {countdown} secondes...
            </p>
            <div className="flex justify-center mt-2">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 animate-spin" />
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            href={user ? '/dashboard' : '/'}
            className="inline-flex items-center justify-center gap-2 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-md transition-colors text-sm sm:text-base"
          >
            <HomeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {user ? 'Tableau de bord' : 'Accueil'}
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-vynal-purple-secondary/30 text-slate-700 dark:text-vynal-text-secondary py-2.5 sm:py-3 px-4 sm:px-6 rounded-md font-medium hover:bg-slate-50 dark:hover:bg-vynal-purple-dark/30 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Page précédente
          </button>
          
          {getSuggestedURL() && (
            <Link
              href={getSuggestedURL() || '/dashboard'}
              className="inline-flex items-center justify-center gap-2 border border-vynal-accent-primary/50 text-vynal-accent-primary py-2.5 sm:py-3 px-4 sm:px-6 rounded-md font-medium hover:bg-vynal-purple-dark/30 transition-colors text-sm sm:text-base"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Section suggérée
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 