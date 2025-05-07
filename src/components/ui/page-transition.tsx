"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Skeleton } from './skeleton';
import { ArrowLeft } from 'lucide-react';

// Composant de transition de page amélioré pour un retour immédiat pendant la navigation
// Enhanced PageTransition component for immediate feedback during navigation
export default function PageTransition() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  // Réinitialise l'état de chargement lorsque la navigation se termine (changement de chemin)
  // Reset loading state when navigation completes (path changes)
  useEffect(() => {
    if (loading) {
      // Gérer différemment les pages de service pour éviter les superpositions
      if (pathname?.includes('/services/') && pathname !== '/services') {
        // Désactiver le skeleton après un délai pour les pages de service
        const timer = setTimeout(() => {
          setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
      }
      
      // Attend un peu avant de masquer pour éviter un flash
      // Wait a bit before hiding to prevent flash
      const timer = setTimeout(() => {
        // Si le contenu est chargé, on peut masquer le skeleton
        if (contentLoaded) {
          setLoading(false);
        } else {
          // Sinon on attend encore un peu et on vérifie à nouveau
          setTimeout(() => setLoading(false), 400);
        }
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [pathname, loading, contentLoaded]);

  // Détecte lorsque le contenu est chargé
  useEffect(() => {
    if (!loading) return;

    const checkContent = () => {
      const mainContent = document.querySelector('main');
      if (mainContent && mainContent.children.length > 0) {
        setContentLoaded(true);
      }
    };

    // Vérifier immédiatement puis à intervalles courts
    checkContent();
    const interval = setInterval(checkContent, 100);

    return () => {
      clearInterval(interval);
      setContentLoaded(false);
    };
  }, [loading]);

  // Gère les clics sur les liens avec une détection optimisée
  // Handle link clicks with optimized detection
  const handleLinkClick = useCallback((e: MouseEvent) => {
    // Chemin rapide : vérifie si c'est un lien ou contient un lien
    // Fast path: check if it's a link or contains a link
    const target = e.target as HTMLElement;
    
    // Ne continue que si nous avons potentiellement un lien (optimisation)
    // Only proceed if we might have a link (optimization)
    if (!target) return;
    
    // Trouve l'élément de lien le plus proche
    // Find the nearest link element
    const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a');
    
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    // Déclenche uniquement pour les liens de navigation internes
    // Only trigger for internal navigation links
    if (!href || 
        !href.startsWith('/') || 
        href.startsWith('//') || 
        href.includes('#') || 
        link.target === '_blank' ||
        link.getAttribute('download') ||
        link.getAttribute('rel')?.includes('external')
    ) return;
    
    // Affiche l'état de chargement immédiatement au clic, avant que la navigation ne se produise
    // Show loading state immediately on click, before the actual navigation happens
    setContentLoaded(false);
    setLoading(true);
  }, []);

  // Gère les clics sur les boutons avec l'attribut data-nav
  // Handle button clicks with data-nav attribute
  const handleButtonClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button[data-nav="true"]');
    
    if (!button) return;
    
    // Affiche le chargement immédiatement pour les boutons de navigation
    // Show loading immediately for navigation buttons
    setContentLoaded(false);
    setLoading(true);
  }, []);

  // Gère les événements de navigation programmatique
  // Handle programmatic navigation events
  const handleManualNavigation = useCallback(() => {
    setContentLoaded(false);
    setLoading(true);
  }, []);

  // Configure les écouteurs d'événements
  // Set up event listeners
  useEffect(() => {
    // Utilise des écouteurs passifs pour de meilleures performances
    // Use passive listeners for better performance
    document.addEventListener('click', handleLinkClick, { passive: true });
    document.addEventListener('click', handleButtonClick, { passive: true });
    window.addEventListener('vynal:navigation-start', handleManualNavigation);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('click', handleButtonClick);
      window.removeEventListener('vynal:navigation-start', handleManualNavigation);
    };
  }, [handleLinkClick, handleButtonClick, handleManualNavigation]);

  // Ne rend rien si pas en chargement ou si on est sur des pages avec leurs propres skeletons
  // Ne pas afficher sur les pages qui ont des skeletons dédiés
  if (!loading || 
      pathname?.includes('/services/') || 
      pathname?.includes('/profile') || 
      pathname?.includes('/wallet') || 
      pathname?.includes('/payments') || 
      pathname?.includes('/disputes') ||
      pathname?.includes('/dashboard/services') ||
      pathname?.includes('/dashboard') ||
      pathname?.includes('/orders') ||
      pathname?.includes('/finances') ||
      pathname?.includes('/settings') ||
      pathname?.includes('/client-dashboard') ||
      pathname?.includes('/messages')) return null;

  // Rend le squelette approprié en fonction du chemin actuel
  // Render appropriate skeleton based on the current path
  const renderSkeleton = () => {
    // Squelette style détails de service (utilisé comme référence pour tous les autres skeletons)
    // Service detail-style skeleton (used as reference for all other skeletons)
    if (pathname?.includes('/services/') && !pathname?.includes('/services/new')) {
      return (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-[400px] w-full mb-4 bg-vynal-purple-secondary/30" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-vynal-purple-secondary/30" />
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <Skeleton className="h-8 w-3/4 mb-4 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-6 w-1/2 mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-32 w-full mb-6 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30" />
          </div>
        </div>
      );
    }
    
    // Squelette style tableau de bord (plus large avec plusieurs colonnes et cartes)
    // Dashboard-style skeleton (wider with multiple columns and cards)
    if (pathname?.includes('/dashboard') || pathname?.includes('/admin')) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 bg-vynal-purple-secondary/30" />
            <div className="flex space-x-3">
              <Skeleton className="h-8 w-24 bg-vynal-purple-secondary/30" />
              <Skeleton className="h-8 w-24 bg-vynal-purple-secondary/30" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-lg bg-vynal-purple-secondary/30" />
            <Skeleton className="h-32 rounded-lg bg-vynal-purple-secondary/30" />
            <Skeleton className="h-32 rounded-lg bg-vynal-purple-secondary/30" />
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 bg-vynal-purple-secondary/30" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 rounded-lg bg-vynal-purple-secondary/30" />
              <Skeleton className="h-40 rounded-lg bg-vynal-purple-secondary/30" />
            </div>
          </div>
        </div>
      );
    }
    
    // Squelette style profil
    // Profile-style skeleton
    if (pathname?.includes('/profile')) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full bg-vynal-purple-secondary/30" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-vynal-purple-secondary/30" />
              <Skeleton className="h-4 w-32 bg-vynal-purple-secondary/30" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <Skeleton className="h-40 rounded-lg bg-vynal-purple-secondary/30" />
              <Skeleton className="h-40 rounded-lg bg-vynal-purple-secondary/30" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-1/3 bg-vynal-purple-secondary/30" />
              <Skeleton className="h-32 rounded-lg bg-vynal-purple-secondary/30" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-lg bg-vynal-purple-secondary/30" />
                <Skeleton className="h-24 rounded-lg bg-vynal-purple-secondary/30" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Squelette de liste de services ou de produits
    // Services or product listing skeleton
    if (pathname?.includes('/services')) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-8 w-32 bg-vynal-purple-secondary/30" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-4">
              <Skeleton className="h-8 w-full bg-vynal-purple-secondary/30" />
              <Skeleton className="h-32 rounded-lg bg-vynal-purple-secondary/30" />
              <Skeleton className="h-24 rounded-lg bg-vynal-purple-secondary/30" />
            </div>
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg bg-vynal-purple-secondary/30" />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Squelette par défaut pour les autres pages
    // Default skeleton for other pages
    return (
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <Skeleton className="h-[400px] w-full mb-4 bg-vynal-purple-secondary/30" />
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full bg-vynal-purple-secondary/30" />
            ))}
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <Skeleton className="h-8 w-3/4 mb-4 bg-vynal-purple-secondary/30" />
          <Skeleton className="h-6 w-1/2 mb-2 bg-vynal-purple-secondary/30" />
          <Skeleton className="h-32 w-full mb-6 bg-vynal-purple-secondary/30" />
          <Skeleton className="h-10 w-full mb-2 bg-vynal-purple-secondary/30" />
          <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30" />
        </div>
      </div>
    );
  };

  // Utilisons un fond complètement opaque pour éviter tout problème de transparence
  return (
    <div className="absolute inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-20 animate-in fade-in duration-500" data-testid="page-transition">
      <div className="container mx-auto px-4 max-w-5xl">
        {renderSkeleton()}
      </div>
    </div>
  );
} 