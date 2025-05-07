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
        <h1 className="text-9xl font-bold text-red-600">500</h1>
        <h2 className="text-3xl font-semibold mt-6 mb-4">
          Oups ! Quelque chose s'est mal passé
        </h2>
        <p className="text-gray-600 mb-8">
          Nous sommes désolés, mais une erreur s'est produite lors du traitement de votre demande.
          Notre équipe technique a été informée et travaille à résoudre le problème.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={PUBLIC_ROUTES.HOME}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
} 