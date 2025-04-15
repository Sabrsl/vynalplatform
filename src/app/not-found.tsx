"use client";

import Link from "next/link";
import { ArrowLeft, HomeIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4 max-w-xl">
        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        <h2 className="text-3xl font-semibold mt-6 mb-4">
          Oups ! Page introuvable
        </h2>
        <p className="text-gray-600 mb-8">
          Nous ne trouvons pas la page que vous recherchez. 
          Elle a peut-être été déplacée ou supprimée.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            Retour à l'accueil
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