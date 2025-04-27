import { Suspense } from 'react';
import { DisputesContent } from '@/components/disputes/DisputesContent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DisputesPageSkeleton } from '@/components/skeletons/DisputesPageSkeleton';

export const metadata = {
  title: 'Mes litiges | Vynal',
  description: 'Gérez les litiges concernant vos commandes sur la plateforme Vynal.',
};

export default function DisputesPage() {
  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide">
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        <PageHeader 
          title="Mes litiges" 
          description="Consultez et gérez les litiges concernant vos commandes"
        />
        
        <Suspense fallback={<DisputesPageSkeleton />}>
          <DisputesContent />
        </Suspense>
      </div>
    </div>
  );
} 