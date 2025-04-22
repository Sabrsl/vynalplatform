'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import NotificationListener from '@/components/notifications/NotificationListener';
import { OptimizationsLoader } from '@/components/OptimizationsLoader';
import { usePathname, useSearchParams } from 'next/navigation';

// Composant amélioré pour détecter les changements de route
function NavigationEventHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Pour éviter une double invalidation au premier rendu
    if (previousPathRef.current === null) {
      previousPathRef.current = pathname;
      return;
    }

    // Nettoyer tout timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Déclencher l'événement d'invalidation du cache avec un léger délai
    // pour s'assurer que le navigateur a eu le temps de compléter la navigation
    timeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && previousPathRef.current !== pathname) {
        console.log('Changement de route détecté:', 
          { previous: previousPathRef.current, current: pathname });
        
        // Déclenchement de l'événement personnalisé
        window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
          detail: { 
            fromPath: previousPathRef.current,
            toPath: pathname
          }
        }));
        
        // Mettre à jour la référence
        previousPathRef.current = pathname;
      }
    }, 100); // Délai court pour laisser le temps à la navigation de se terminer

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Ajout d'un state pour vérifier si le composant est monté (côté client)
  const [mounted, setMounted] = useState(false);

  // Mettre à jour le state après le premier rendu
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <OptimizationsLoader>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        {/* N'afficher le contenu dépendant du thème que côté client */}
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
        <Toaster />
        <NotificationListener />
        <NavigationEventHandler />
      </ThemeProvider>
    </OptimizationsLoader>
  );
} 