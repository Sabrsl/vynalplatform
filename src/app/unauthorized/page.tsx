"use client";

import Link from "next/link";
import { Lock, ArrowLeft, LogIn } from "lucide-react";
import { AUTH_ROUTES } from "@/config/routes";

export default function Unauthorized() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4 max-w-xl">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-24 sm:w-24 bg-amber-500/10 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 sm:h-12 sm:w-12 text-amber-500 dark:text-amber-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-vynal-text-primary mb-3 sm:mb-4">
          Accès non autorisé
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-vynal-text-secondary mb-6 sm:mb-8">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          Veuillez vous connecter ou contacter l'administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="inline-flex items-center justify-center gap-2 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-md transition-colors text-sm sm:text-base"
          >
            <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Se connecter
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-vynal-purple-secondary/30 text-slate-700 dark:text-vynal-text-secondary py-2.5 sm:py-3 px-4 sm:px-6 rounded-md font-medium hover:bg-slate-50 dark:hover:bg-vynal-purple-dark/30 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  );
} 