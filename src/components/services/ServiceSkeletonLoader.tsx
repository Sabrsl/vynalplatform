import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ServiceSkeletonLoaderProps {
  count?: number;
  className?: string;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  showShimmer?: boolean;
  density?: 'compact' | 'normal' | 'relaxed';
  preserveAspectRatio?: boolean;
}

/**
 * Composant skeleton loader optimisé pour les services
 * - Support complet des thèmes clair/sombre
 * - Densité adaptative et paramétrable
 * - Animation de chargement optimisée pour la performance
 * - Responsive avec colonnes configurables
 * 
 * @param count - Nombre de squelettes à afficher
 * @param className - Classes CSS additionnelles pour le conteneur
 * @param columns - Configuration des colonnes par breakpoint
 * @param showShimmer - Active l'effet de scintillement (shimmer)
 * @param density - Densité d'affichage des éléments
 * @param preserveAspectRatio - Maintient le ratio d'aspect des cartes
 */
const ServiceSkeletonLoader: React.FC<ServiceSkeletonLoaderProps> = ({
  count = 8,
  className = '',
  columns = {
    sm: 2,
    md: 3,
    lg: 4
  },
  showShimmer = true,
  density = 'normal',
  preserveAspectRatio = true
}) => {
  // Optimisation des colonnes avec mémoïsation
  const gridCols = useMemo(() => {
    const sm = columns.sm || 2;
    const md = columns.md || 3;
    const lg = columns.lg || 4;
    
    return `grid-cols-1 sm:grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg}`;
  }, [columns]);
  
  // Optimisation des styles en fonction de la densité
  const densityStyles = useMemo(() => {
    switch (density) {
      case 'compact':
        return {
          gap: 'gap-2 sm:gap-2 lg:gap-3',
          padding: 'p-3',
          imageHeight: 'h-32',
          contentSpacing: 'space-y-1.5'
        };
      case 'relaxed':
        return {
          gap: 'gap-4 sm:gap-4 lg:gap-5',
          padding: 'p-5',
          imageHeight: 'h-48',
          contentSpacing: 'space-y-3'
        };
      case 'normal':
      default:
        return {
          gap: 'gap-3 sm:gap-3 lg:gap-4',
          padding: 'p-4',
          imageHeight: 'h-40',
          contentSpacing: 'space-y-2'
        };
    }
  }, [density]);
  
  // Optimiser la création des éléments skeleton
  const skeletonCards = useMemo(() => {
    return Array(count).fill(0).map((_, index) => (
      <div 
        key={index} 
        className={cn(
          "relative rounded-xl shadow-md border overflow-hidden",
          showShimmer ? "animate-pulse" : "",
          preserveAspectRatio ? "flex flex-col" : "",
          "bg-white dark:bg-vynal-purple-dark/90 border-vynal-purple-secondary/40 dark:border-vynal-purple-secondary/40"
        )}
        style={{
          // Optimisation des performances de rendu avec will-change
          willChange: 'transform, opacity',
          // Légère montée progressive des cartes pour un effet visuel subtil
          animation: `fadeUp ${300 + index * 50}ms ease-out forwards`
        }}
      >
        {/* Image placeholder avec dégradé adapté au thème */}
        <div className={cn(
          "w-full", 
          densityStyles.imageHeight,
          "bg-vynal-purple-secondary/30"
        )}></div>
        
        {/* Content placeholder */}
        <div className={cn(densityStyles.padding, densityStyles.contentSpacing, "flex-grow")}>
          {/* Catégorie */}
          <div className="h-4 w-1/3 rounded-md bg-vynal-purple-secondary/30"></div>
          
          {/* Titre */}
          <div className="h-6 w-5/6 rounded-md bg-vynal-purple-secondary/30"></div>
          
          {/* Description */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-md bg-vynal-purple-secondary/30"></div>
            <div className="h-3 w-4/5 rounded-md bg-vynal-purple-secondary/30"></div>
          </div>
          
          {/* Séparateur */}
          <div className="pt-2">
            <div className="h-px w-full bg-vynal-purple-secondary/30"></div>
          </div>
          
          {/* Auteur */}
          <div className="flex items-center space-x-2 pt-1">
            <div className="h-8 w-8 rounded-full bg-vynal-purple-secondary/30"></div>
            <div className="space-y-1">
              <div className="h-3 w-24 rounded-md bg-vynal-purple-secondary/30"></div>
              <div className="h-2 w-16 rounded-md bg-vynal-purple-secondary/30"></div>
            </div>
          </div>
          
          {/* Prix */}
          <div className="flex justify-between items-center pt-2">
            <div className="h-5 w-1/4 rounded-md bg-vynal-purple-secondary/30"></div>
            <div className="h-8 w-20 rounded-full bg-vynal-accent-primary/30"></div>
          </div>
        </div>
      </div>
    ));
  }, [count, densityStyles, showShimmer, preserveAspectRatio]);

  return (
    <>
      <div className={cn(
        "grid w-full", 
        gridCols,
        densityStyles.gap,
        className
      )}>
        {skeletonCards}
      </div>
      
      {/* Styles pour l'animation de fade-in */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0.6;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Optimisation de l'animation pour la performance */
        .animate-pulse {
          animation: pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  );
};

export default ServiceSkeletonLoader;