import { Suspense } from 'react';
import { Metadata } from 'next';
import WalletContent from '@/components/wallet/WalletContent';
import { WalletPageSkeleton } from '@/components/skeletons/WalletPageSkeleton';

export const metadata: Metadata = {
  title: 'Wallet | Vynal',
  description: 'Consultez votre portefeuille et vos transactions sur Vynal',
};

// Forcer le rendu dynamique pour éviter les erreurs liées à la génération statique
// Cette page utilise des hooks côté client qui ne sont pas compatibles avec la génération statique
export const dynamic = 'force-dynamic';

// Désactiver le cache pour garantir des données toujours à jour
export const revalidate = 0;

export default function WalletPage() {
  return (
    <div className="lg:px-12">
      <Suspense fallback={<WalletPageSkeleton />}>
        <WalletContent />
      </Suspense>
    </div>
  );
} 