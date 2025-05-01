import React, { memo, useMemo, useCallback } from 'react';
import { ServiceWithFreelanceAndCategories } from '@/hooks/useServices';
import ServiceCard from '@/components/services/ServiceCard';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Package2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Animation constantes définies en dehors du composant pour éviter les recreations
const CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1
    }
  }
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2
    }
  }
};

// Types pour les sous-composants
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

interface StateProps {
  className?: string;
}

// Composants memoïsés pour les différents états
const ErrorState = memo(({ error, onRetry, className = '' }: ErrorStateProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-red-50 p-6 rounded-xl text-center ${className}`}
    data-testid="service-results-error"
    role="alert"
  >
    <div className="inline-flex items-center justify-center p-2.5 bg-red-100 rounded-full mb-3">
      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
    </div>
    <p className="text-sm font-medium mb-1.5 text-red-700">{error}</p>
    <p className="text-xs text-red-500 mb-4">Une erreur est survenue lors du chargement des services.</p>
    
    {onRetry && (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        className="bg-white text-red-600 border-red-200 hover:bg-red-50"
      >
        <RefreshCw className="h-3.5 w-3.5 mr-2" aria-hidden="true" /> Réessayer
      </Button>
    )}
  </motion.div>
));

// Ajout du displayName
ErrorState.displayName = 'ErrorState';

const LoadingState = memo(({ className = '' }: StateProps) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`flex flex-col items-center justify-center py-10 ${className}`}
    data-testid="service-results-loading"
    aria-live="polite"
    aria-busy="true"
  >
    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" aria-hidden="true" />
    <p className="text-sm text-gray-500">Chargement des services...</p>
  </motion.div>
));

// Ajout du displayName
LoadingState.displayName = 'LoadingState';

const EmptyState = memo(({ className = '' }: StateProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-gray-50 p-6 rounded-xl text-center ${className}`}
    data-testid="service-results-empty"
    role="status"
  >
    <div className="inline-flex items-center justify-center p-2.5 bg-gray-100 rounded-full mb-3">
      <Package2 className="h-5 w-5 text-gray-500" aria-hidden="true" />
    </div>
    <p className="text-sm font-medium mb-1.5 text-gray-700">Aucun service trouvé pour ces critères.</p>
    <p className="text-xs text-gray-500">Essayez de modifier vos filtres ou de revenir à la liste complète.</p>
  </motion.div>
));

// Ajout du displayName
EmptyState.displayName = 'EmptyState';

interface ServiceResultsProps {
  services: ServiceWithFreelanceAndCategories[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Composant réutilisable pour afficher les résultats de la recherche de services
 * - Optimisé pour les performances avec des sous-composants memoïsés
 * - Structure JSX simplifiée pour faciliter le rendu
 * - Animations fluides avec framer-motion
 */
const ServiceResults = ({
  services,
  loading,
  error = null,
  onRetry,
  className = '',
}: ServiceResultsProps) => {
  // Gestionnaire d'erreur mémorisé
  const handleRetry = useCallback(() => {
    if (onRetry) onRetry();
  }, [onRetry]);

  // Rendus conditionnels optimisés
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} className={className} />;
  }

  if (loading) {
    return <LoadingState className={className} />;
  }

  if (!services.length) {
    return <EmptyState className={className} />;
  }

  // Affichage des services avec la grille optimisée
  return (
    <div className={`${className} w-full`} data-testid="service-results-grid">
      <AnimatePresence mode="wait">
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="show"
          exit="exit"
          key={`services-${services.length}`}
          aria-live="polite"
        >
          {services.map((service) => {
            if (!service?.id) return null;
            
            return (
              <motion.div 
                key={service.id} 
                variants={ITEM_VARIANTS} 
                className="relative"
                layout
              >
                <ServiceCard
                  service={service}
                  showStatusBadge={false}
                  useDemo={false}
                  className="h-full transition-transform hover:scale-[1.01]"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(ServiceResults);

// Ajout du displayName
ServiceResults.displayName = 'ServiceResults';