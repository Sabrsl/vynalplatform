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
        <h1 className="text-9xl font-bold text-indigo-600 dark:text-vynal-accent-primary">404</h1>
        <h2 className="text-3xl font-semibold mt-6 mb-4 dark:text-vynal-text-primary">
          Oups ! Page introuvable
        </h2>
        <p className="text-gray-600 dark:text-vynal-text-secondary mb-4">
          Nous ne trouvons pas la page que vous recherchez. 
          Elle a peut-être été déplacée ou supprimée.
        </p>
        
        {isDashboardError && user && (
          <div className="mt-2 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Redirection automatique vers le tableau de bord dans {countdown} secondes...
            </p>
            <div className="flex justify-center mt-2">
              <RefreshCw className="h-5 w-5 text-amber-500 dark:text-amber-400 animate-spin" />
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={user ? '/dashboard' : '/'}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 dark:bg-vynal-accent-primary text-white dark:text-vynal-text-primary py-3 px-6 rounded-md font-medium hover:bg-indigo-700 dark:hover:bg-vynal-accent-secondary transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            {user ? 'Tableau de bord' : 'Accueil'}
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-vynal-text-secondary py-3 px-6 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Page précédente
          </button>
          
          {getSuggestedURL() && (
            <Link
              href={getSuggestedURL() || '/dashboard'}
              className="inline-flex items-center justify-center gap-2 border border-indigo-300 dark:border-vynal-accent-primary/50 text-indigo-600 dark:text-vynal-accent-primary py-3 px-6 rounded-md font-medium hover:bg-indigo-50 dark:hover:bg-vynal-purple-dark/30 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Section suggérée
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 