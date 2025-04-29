import React, { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ServiceWithFreelanceAndCategories } from '@/hooks/useServices';
import ServiceCard from '@/components/services/ServiceCard';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Package2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceResultsProps {
  services: ServiceWithFreelanceAndCategories[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Composant réutilisable pour afficher les résultats de la recherche de services
 * 
 * @param services - Liste des services à afficher
 * @param loading - Indique si les services sont en cours de chargement
 * @param error - Indique si une erreur est survenue lors du chargement des services
 * @param onRetry - Fonction à appeler pour réessayer le chargement des services
 * @param className - Classes CSS additionnelles
 */
const ServiceResults: React.FC<ServiceResultsProps> = ({
  services,
  loading,
  error = null,
  onRetry,
  className = '',
}) => {
  // Mémoisation des variants d'animation pour éviter leur recréation à chaque rendu
  const containerVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  }), []);

  const itemVariants: Variants = useMemo(() => ({
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
  }), []);

  // Gestionnaire d'erreur mémorisé
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  // En cas d'erreur
  if (error) {
    return (
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
            onClick={handleRetry}
            className="bg-white text-red-600 border-red-200 hover:bg-red-50"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" aria-hidden="true" /> Réessayer
          </Button>
        )}
      </motion.div>
    );
  }

  // Affichage du chargement
  if (loading) {
    return (
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
    );
  }

  // Aucun service trouvé
  if (services.length === 0) {
    return (
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
    );
  }

  // Affichage des services avec virtualization pour grandes listes
  return (
    <div className={`${className} w-full`} data-testid="service-results-grid">
      <AnimatePresence mode="wait">
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-5 w-full"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          key={`services-${services.length}`}
          aria-live="polite"
        >
          {services.map((service) => {
            if (!service.id || !service.slug) {
              // Protection contre les données invalides
              console.warn("Service invalide détecté:", service);
              return null;
            }
            
            return (
              <motion.div 
                key={service.id} 
                variants={itemVariants} 
                className="relative z-10"
                layout
              >
                <ServiceCard
                  service={service}
                  showStatusBadge={false}
                  useDemo={false}
                  className="transition-all duration-300 hover:scale-[1.02] shadow-md border border-gray-200"
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