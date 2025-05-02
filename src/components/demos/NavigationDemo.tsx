"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePageTransition } from '@/hooks/usePageTransition';

/**
 * Composant de démonstration montrant différentes façons d'utiliser le système de transition de page
 * Demo component showing different ways to use the page transition system
 */
export default function NavigationDemo() {
  const { navigateTo, navigateBack } = usePageTransition();

  // Navigation programmatique avec logique personnalisée
  // Programmatic navigation with custom logic
  const handleCustomNavigation = () => {
    console.log('Préparation pour la navigation...');
    // Vous pouvez effectuer n'importe quelle préparation ici avant la navigation
    // You can do any preparation here before navigation
    
    // Puis déclencher la navigation avec chargement squelette
    // Then trigger navigation with skeleton loading
    navigateTo('/dashboard');
  };

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Démo du Système de Transition de Page</h2>
        <p className="mb-4 text-sm">
          Cette démo montre les différentes façons d'utiliser le système de chargement squelette pendant la navigation :
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Méthode 1 : Liens Standard (automatique)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Les liens Next.js réguliers déclencheront automatiquement le chargement squelette
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/profile" className="text-blue-600 hover:underline px-3 py-1 border rounded-md text-sm">
                Page Profil
              </Link>
              <Link href="/services" className="text-blue-600 hover:underline px-3 py-1 border rounded-md text-sm">
                Page Services
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Méthode 2 : Bouton avec prop navigate</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Le composant Button prend en charge une prop navigate pour des transitions squelette faciles
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button navigate="/dashboard" size="sm" variant="default">
                Tableau de Bord
              </Button>
              <Button navigate="/admin" size="sm" variant="secondary">
                Page Admin
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Méthode 3 : Hook usePageTransition</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pour une navigation programmatique avec un contrôle total
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigateTo('/orders')} size="sm" variant="outline">
                Page Commandes
              </Button>
              <Button onClick={handleCustomNavigation} size="sm" variant="outline">
                Logique Personnalisée
              </Button>
              <Button onClick={() => navigateBack()} size="sm" variant="ghost">
                Retour
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium">Notes d'Implémentation :</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Pas de fournisseurs de contexte complexes ou de gestion d'état nécessaires</li>
          <li>Différentes dispositions de squelette pour différents types de pages</li>
          <li>Fonctionne avec les clics sur les liens et la navigation programmatique</li>
          <li>Respecte les paramètres de thème (mode clair/sombre)</li>
          <li>Affiche le squelette immédiatement au clic pour un retour instantané</li>
        </ul>
      </div>
    </div>
  );
} 