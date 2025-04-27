import { Suspense } from 'react';
import { Metadata } from 'next';
import WalletContent from '@/components/wallet/WalletContent';
import { WalletPageSkeleton } from '@/components/skeletons/WalletPageSkeleton';

export const metadata: Metadata = {
  title: 'Wallet | Vynal',
  description: 'Consultez votre portefeuille et vos transactions sur Vynal',
};

export default function WalletPage() {
  return (
    <Suspense fallback={<WalletPageSkeleton />}>
      <WalletContent />
    </Suspense>
  );
} 