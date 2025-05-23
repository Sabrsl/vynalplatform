import React, { memo } from 'react';
import { CreditCard, User, Users } from 'lucide-react';

// Type pour les statistiques
interface StatsData {
  freelancersCount: string;
  clientsCount: string;
  totalPayments: string;
}

interface StatsSectionProps {
  statsData: StatsData;
}

/**
 * Section de statistiques optimisée avec une mise en page simplifiée
 * Pour améliorer les performances sur la page des services
 */
const StatsSection = memo(({ statsData }: StatsSectionProps) => (
  <section className="py-8 bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-dark/80 dark:to-vynal-purple-dark/95 border-t border-gray-100 dark:border-vynal-purple-secondary/30">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Freelances */}
          <div className="flex flex-col items-center px-3 py-3">
            <div className="flex items-center justify-center w-10 h-10 mb-2 rounded-full bg-white dark:bg-vynal-purple-secondary/10">
              <Users className="h-4 w-4 text-vynal-accent-primary" />
            </div>
            
            <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-purple-600">
              {statsData.freelancersCount}
            </h3>
            
            <p className="text-xs text-vynal-body mt-1 text-center">
              Freelances
            </p>
          </div>
          
          {/* Clients */}
          <div className="flex flex-col items-center px-3 py-3">
            <div className="flex items-center justify-center w-10 h-10 mb-2 rounded-full bg-white dark:bg-vynal-purple-secondary/10">
              <User className="h-4 w-4 text-vynal-accent-primary" />
            </div>
            
            <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-purple-600">
              {statsData.clientsCount}
            </h3>
            
            <p className="text-xs text-vynal-body mt-1 text-center">
              Clients satisfaits
            </p>
          </div>
          
          {/* Paiements */}
          <div className="flex flex-col items-center px-3 py-3">
            <div className="flex items-center justify-center w-10 h-10 mb-2 rounded-full bg-white dark:bg-vynal-purple-secondary/10">
              <CreditCard className="h-4 w-4 text-vynal-accent-primary" />
            </div>
            
            <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-purple-600">
              {statsData.totalPayments}
            </h3>
            
            <p className="text-xs text-vynal-body mt-1 text-center">
              Total des transactions
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
));

StatsSection.displayName = 'StatsSection';

export default StatsSection; 