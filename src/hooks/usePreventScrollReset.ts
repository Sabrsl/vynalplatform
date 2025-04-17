"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Hook pour empêcher le défilement automatique vers le bas lors des navigations
 */
export function usePreventScrollReset() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Fonction qui gère les clics sur les liens
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      // Ignore si ce n'est pas un lien ou s'il n'a pas d'attribut href
      if (!link || !link.href) return;
      
      // Ignore les liens externes
      if (!(link.href.startsWith(window.location.origin) || link.href.startsWith('/'))) return;
      
      // Ignore les liens qui s'ouvrent dans un nouvel onglet
      if (link.hasAttribute('target') && link.getAttribute('target') === '_blank') return;
      
      // Ignorer les pages de messagerie où ce comportement n'est pas souhaité
      if (pathname?.includes('/messages') || pathname?.includes('/chat')) return;
      
      // Prévenir le comportement par défaut
      e.preventDefault();
      
      // Extraire l'URL relative
      let href = link.getAttribute('href') || '';
      if (href.startsWith(window.location.origin)) {
        href = href.substring(window.location.origin.length);
      }
      
      // Utiliser le router Next.js pour la navigation
      router.push(href);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, [pathname, router]);
}

export default usePreventScrollReset; 