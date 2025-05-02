"use client";

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook personnalisé pour la navigation programmatique avec chargement squelette
 * Custom hook for programmatic navigation with skeleton loading
 * 
 * @returns Méthodes de navigation avec déclencheurs de chargement squelette intégrés
 * @returns Navigation methods with built-in skeleton loading triggers
 */
export function usePageTransition() {
  const router = useRouter();

  /**
   * Navigue vers le chemin donné avec chargement squelette
   * Navigate to the given path with skeleton loading
   */
  const navigateTo = useCallback((path: string) => {
    // Déclenche un événement personnalisé pour activer le chargement squelette
    // Dispatch custom event to trigger skeleton loading
    window.dispatchEvent(new CustomEvent('vynal:navigation-start'));
    
    // Effectue la navigation
    // Perform navigation
    router.push(path);
  }, [router]);

  /**
   * Navigue en arrière avec chargement squelette
   * Navigate back with skeleton loading
   */
  const navigateBack = useCallback(() => {
    // Déclenche un événement personnalisé pour activer le chargement squelette
    // Dispatch custom event to trigger skeleton loading
    window.dispatchEvent(new CustomEvent('vynal:navigation-start'));
    
    // Retourne à la page précédente
    // Go back
    window.history.back();
  }, []);

  /**
   * Remplace l'URL actuelle avec chargement squelette
   * Replace current URL with skeleton loading
   */
  const replaceTo = useCallback((path: string) => {
    // Déclenche un événement personnalisé pour activer le chargement squelette
    // Dispatch custom event to trigger skeleton loading
    window.dispatchEvent(new CustomEvent('vynal:navigation-start'));
    
    // Remplace l'URL actuelle
    // Replace current URL
    router.replace(path);
  }, [router]);

  return {
    navigateTo,
    navigateBack,
    replaceTo
  };
}

export default usePageTransition; 