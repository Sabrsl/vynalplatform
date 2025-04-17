import React from 'react';
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
 * Composant réutilisable pour le fil d'Ariane (breadcrumb)
 * 
 * @param activeCategory - Catégorie actuellement sélectionnée (optionnel)
 * @param activeSubcategory - Sous-catégorie actuellement sélectionnée (optionnel)
 * @param baseUrl - URL de base pour les liens du fil d'Ariane (défaut: '/services')
 * @param className - Classes CSS additionnelles
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -5 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.nav 
      className={`flex items-center flex-wrap text-xs ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      aria-label="Breadcrumb"
    >
      <motion.div variants={itemVariants}>
        <Link 
          href="/" 
          className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center"
        >
          <Home className="h-3 w-3 mr-1" />
          <span>Accueil</span>
        </Link>
      </motion.div>
      
      <ChevronRight className="h-2.5 w-2.5 mx-1.5 text-gray-400 flex-shrink-0" />
      
      <motion.div variants={itemVariants}>
        <Link 
          href={baseUrl} 
          className={`hover:text-indigo-600 transition-colors flex items-center ${
            !activeCategory ? 'text-indigo-600 font-medium' : 'text-gray-500'
          }`}
        >
          <Tag className="h-3 w-3 mr-0.5" />
          <span>Services</span>
        </Link>
      </motion.div>
      
      {activeCategory && (
        <>
          <ChevronRight className="h-2.5 w-2.5 mx-1.5 text-gray-400 flex-shrink-0" />
          <motion.div variants={itemVariants}>
            <Link 
              href={`${baseUrl}?category=${activeCategory.slug}`}
              className={`transition-colors ${
                !activeSubcategory ? 'text-indigo-600 font-medium' : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              {activeCategory.name}
            </Link>
          </motion.div>
          
          {activeSubcategory && (
            <>
              <ChevronRight className="h-2.5 w-2.5 mx-1.5 text-gray-400 flex-shrink-0" />
              <motion.div variants={itemVariants}>
                <span className="text-indigo-600 font-medium">
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

export default BreadcrumbTrail; 