'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

export default function ClientHookExample() {
  // Ce hook ne fonctionnera que sur le client
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-2">Exemple avec useSearchParams</h2>
      <p className="mb-4">
        {query ? (
          <>Paramètre de recherche &apos;q&apos;: <span className="font-medium">{query}</span></>
        ) : (
          <>Aucun paramètre de recherche &apos;q&apos; trouvé. Essayez d&apos;ajouter <code>?q=test</code> à l&apos;URL.</>
        )}
      </p>
      <div className="text-sm text-gray-500">
        Ce composant utilise <code>useSearchParams()</code> qui nécessite d&apos;être encapsulé dans un ClientWrapper.
      </div>
    </div>
  );
} 