'use client';

import React, { Suspense, ReactNode } from 'react';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Composant réutilisable pour envelopper les composants qui utilisent useSearchParams
 * avec une barrière de suspension (Suspense boundary)
 */
export function SuspenseWrapper({ 
  children, 
  fallback = <div className="p-6 animate-pulse">Chargement...</div> 
}: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * HOC (Higher Order Component) pour faciliter l'enveloppement des composants pages
 * @param Component Le composant de page à envelopper
 * @param fallback Le contenu à afficher pendant le chargement
 */
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithSuspenseComponent(props: P) {
    return (
      <SuspenseWrapper fallback={fallback}>
        <Component {...props} />
      </SuspenseWrapper>
    );
  };
}

export default SuspenseWrapper; 