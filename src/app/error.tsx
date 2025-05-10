"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw, HomeIcon } from "lucide-react";
import { PUBLIC_ROUTES } from "@/config/routes";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vous pouvez ajouter ici une logique pour envoyer l'erreur à un service de suivi des erreurs
    console.error("Erreur côté client:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4 max-w-xl">
        <h1 className="text-7xl sm:text-9xl font-bold text-vynal-status-error">500</h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mt-4 sm:mt-6 mb-3 sm:mb-4 text-slate-800 dark:text-vynal-text-primary">
          Oups ! Quelque chose s'est mal passé
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-vynal-text-secondary mb-6 sm:mb-8">
          Nous sommes désolés, mais une erreur s'est produite lors du traitement de votre demande.
          Notre équipe technique a été informée et travaille à résoudre le problème.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            href={PUBLIC_ROUTES.HOME}
            className="inline-flex items-center justify-center gap-2 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-md transition-colors text-sm sm:text-base"
          >
            <HomeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Retour à l'accueil
          </Link>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-vynal-purple-secondary/30 text-slate-700 dark:text-vynal-text-secondary py-2.5 sm:py-3 px-4 sm:px-6 rounded-md font-medium hover:bg-slate-50 dark:hover:bg-vynal-purple-dark/30 transition-colors text-sm sm:text-base"
          >
            <RefreshCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
} 