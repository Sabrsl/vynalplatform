"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logique pour envoyer l'erreur à un service de suivi des erreurs
    console.error("Erreur globale de l'application:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-vynal-purple-dark">
          <div className="bg-white dark:bg-vynal-purple-dark/90 p-6 sm:p-8 rounded-lg shadow-md max-w-md w-full text-center border border-slate-200 dark:border-vynal-purple-secondary/30">
            <h1 className="text-3xl sm:text-4xl font-bold text-vynal-status-error mb-3 sm:mb-4">Erreur Critique</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-vynal-text-secondary mb-4 sm:mb-6">
              Une erreur critique s'est produite dans l'application.
              Nous sommes désolés pour ce désagrément.
            </p>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-vynal-text-secondary/70 mb-4 sm:mb-6 p-2 bg-slate-50 dark:bg-vynal-purple-secondary/30 rounded">
              {error.digest && <p>Code d'erreur: {error.digest}</p>}
            </div>
            <button
              onClick={() => reset()}
              className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-2.5 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base"
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 