import React, { memo } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, Tag } from 'lucide-react';
import { Category, Subcategory } from '@/hooks/useCategories';
import { motion } from 'framer-motion';

interface BreadcrumbTrailProps {
  activeCategory?: Category | null;
  activeSubcategory?: Subcategory | null;
  baseUrl?: string;
  className?: string;
}

/**
 * Composant ultra-moderne pour le fil d'Ariane (breadcrumb)
 */
const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = ({
  activeCategory,
  activeSubcategory,
  baseUrl = '/services',
  className = '',
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -3, y: 2 },
    show: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Construction de l'URL de catégorie une seule fois
  const categoryUrl = activeCategory ? `${baseUrl}?category=${activeCategory.slug}` : baseUrl;

  return (
    <motion.nav 
      className={`flex items-center flex-wrap text-[10px] xs:text-xs backdrop-blur-sm
        px-2 py-1 rounded-full bg-white/5
        border border-gray-100/10 shadow-sm
        ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      aria-label="Breadcrumb"
      data-testid="breadcrumb-trail"
    >
      <motion.div variants={itemVariants}>
        <Link 
          href="/" 
          className="text-gray-300 hover:text-indigo-400 
            transition-all duration-200 flex items-center
            hover:scale-105"
          aria-label="Page d'accueil"
        >
          <span className="p-0.5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <Home className="h-2.5 w-2.5 xs:h-3 xs:w-3" aria-hidden="true" 
              strokeWidth={2.5} />
          </span>
          <span className="ml-1 hidden xxs:inline font-medium">Accueil</span>
        </Link>
      </motion.div>
      
      <ChevronRight className="h-2 w-2 xs:h-2.5 xs:w-2.5 mx-1 xxs:mx-1.5 
        text-gray-600 flex-shrink-0" 
        aria-hidden="true" strokeWidth={2.5} />
      
      <motion.div variants={itemVariants}>
        <Link 
          href={baseUrl} 
          className={`hover:text-indigo-400 
            transition-all duration-200 flex items-center
            hover:scale-105
            ${!activeCategory 
              ? 'text-indigo-400 font-semibold' 
              : 'text-gray-300'}`}
          aria-label="Liste des services"
          aria-current={!activeCategory ? 'page' : undefined}
        >
          <span className="p-0.5 rounded-full bg-gradient-to-br from-indigo-900 to-indigo-800 flex items-center justify-center">
            <Tag className="h-2.5 w-2.5 xs:h-3 xs:w-3" aria-hidden="true" 
              strokeWidth={2.5} />
          </span>
          <span className="ml-1 font-medium">Services</span>
        </Link>
      </motion.div>
      
      {activeCategory && (
        <>
          <ChevronRight className="h-2 w-2 xs:h-2.5 xs:w-2.5 mx-1 xxs:mx-1.5 
            text-gray-600 flex-shrink-0" 
            aria-hidden="true" strokeWidth={2.5} />
          <motion.div variants={itemVariants}>
            <Link 
              href={categoryUrl}
              className={`transition-all duration-200
                hover:scale-105
                ${!activeSubcategory 
                  ? 'text-indigo-400 font-semibold' 
                  : 'text-gray-300 hover:text-indigo-400'}`}
              aria-label={`Catégorie: ${activeCategory.name}`}
              aria-current={!activeSubcategory ? 'page' : undefined}
            >
              <span className="font-medium">
                {activeCategory.name}
              </span>
            </Link>
          </motion.div>
          
          {activeSubcategory && (
            <>
              <ChevronRight className="h-2 w-2 xs:h-2.5 xs:w-2.5 mx-1 xxs:mx-1.5 
                text-gray-600 flex-shrink-0" 
                aria-hidden="true" strokeWidth={2.5} />
              <motion.div variants={itemVariants}>
                <span 
                  className="text-indigo-400 font-semibold"
                  aria-current="page"
                >
                  {activeSubcategory.name}
                </span>
              </motion.div>
            </>
          )}
        </>
      )}
    </motion.nav>
  );
};

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(BreadcrumbTrail);