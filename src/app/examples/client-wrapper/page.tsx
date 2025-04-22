import React from 'react';
import ClientWrapper from '@/components/layouts/ClientWrapper';
import ClientHookExample from '@/components/examples/ClientHookExample';

export default function ClientWrapperExamplePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Exemple d&apos;utilisation du ClientWrapper</h1>
      
      <div className="space-y-6">
        {/* Exemple avec fallback par défaut */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Avec fallback par défaut</h2>
          <ClientWrapper>
            <ClientHookExample />
          </ClientWrapper>
        </div>
        
        {/* Exemple avec fallback personnalisé */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Avec fallback personnalisé</h2>
          <ClientWrapper 
            fallback={
              <div className="p-4 bg-gray-100 rounded animate-pulse">
                Chargement personnalisé...
              </div>
            }
          >
            <ClientHookExample />
          </ClientWrapper>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">À propos de ce composant</h2>
        <p>
          Le <code>ClientWrapper</code> encapsule automatiquement les composants utilisant des hooks 
          client-side dans des balises <code>Suspense</code> et <code>ErrorBoundary</code>, 
          simplifiant ainsi leur utilisation dans des pages React Server Components.
        </p>
      </div>
    </div>
  );
} 