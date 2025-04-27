/**
 * Layout spécifique pour la section Finances
 * Applique les configurations de rendu dynamique pour cette section
 */

import React from 'react';

// Configuration de la route comme dynamique
export const dynamic = 'force-dynamic';

export default function FinancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="finances-container">
      {children}
    </div>
  );
} 