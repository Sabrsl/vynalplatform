import React from 'react';
import { cn } from '@/lib/utils';

interface ServiceSkeletonLoaderProps {
  count?: number;
  className?: string;
}

/**
 * Composant skeleton loader pour les services
 * Affiche une version squelette des cartes de service pendant le chargement
 * 
 * @param count - Nombre de squelettes à afficher
 * @param className - Classes CSS additionnelles pour le conteneur
 */
const ServiceSkeletonLoader: React.FC<ServiceSkeletonLoaderProps> = ({
  count = 8,
  className = ''
}) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3 lg:gap-4 w-full", className)}>
      {Array(count).fill(0).map((_, index) => (
        <div 
          key={index} 
          className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden animate-pulse transition-all"
        >
          {/* Image placeholder */}
          <div className="w-full h-40 bg-gradient-to-r from-gray-200 to-gray-300"></div>
          
          {/* Content placeholder */}
          <div className="p-4 space-y-2">
            {/* Catégorie */}
            <div className="h-4 w-1/3 bg-gray-200 rounded-md"></div>
            
            {/* Titre */}
            <div className="h-6 w-5/6 bg-gray-300 rounded-md"></div>
            
            {/* Description */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-gray-200 rounded-md"></div>
              <div className="h-3 w-4/5 bg-gray-200 rounded-md"></div>
            </div>
            
            {/* Séparateur */}
            <div className="pt-2">
              <div className="h-px w-full bg-gray-200"></div>
            </div>
            
            {/* Auteur */}
            <div className="flex items-center space-x-2 pt-1">
              <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
              <div className="space-y-1">
                <div className="h-3 w-24 bg-gray-200 rounded-md"></div>
                <div className="h-2 w-16 bg-gray-200 rounded-md"></div>
              </div>
            </div>
            
            {/* Prix */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 w-1/4 bg-gray-300 rounded-md"></div>
              <div className="h-8 w-20 bg-indigo-200 rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceSkeletonLoader; 