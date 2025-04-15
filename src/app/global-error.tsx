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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Erreur Critique</h1>
            <p className="text-gray-700 mb-6">
              Une erreur critique s'est produite dans l'application.
              Nous sommes désolés pour ce désagrément.
            </p>
            <div className="text-sm text-gray-500 mb-6 p-2 bg-gray-50 rounded">
              {error.digest && <p>Code d'erreur: {error.digest}</p>}
            </div>
            <button
              onClick={() => reset()}
              className="w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 