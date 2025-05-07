"use client";

import Link from "next/link";
import { Lock, ArrowLeft, LogIn } from "lucide-react";
import { AUTH_ROUTES } from "@/config/routes";

export default function Unauthorized() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4 max-w-xl">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 bg-yellow-50 rounded-full flex items-center justify-center">
            <Lock className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Accès non autorisé
        </h1>
        <p className="text-gray-600 mb-8">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          Veuillez vous connecter ou contacter l'administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  );
} 