import React, { useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category, Subcategory } from '@/hooks/useCategories';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

interface SubcategoriesGridProps {
  category: Category;
  subcategories: Subcategory[];
  selectedSubcategory: string | null;
  className?: string;
}

/**
 * Composant ultra-moderne pour l'affichage des sous-catégories
 * Support des thèmes clair/sombre et adaptation mobile optimisée
 */
const SubcategoriesGrid: React.FC<SubcategoriesGridProps> = ({
  category,
  subcategories,
  selectedSubcategory,
  className = '',
}) => {
  const router = useRouter();
  
  // Vérifie s'il y a des sous-catégories disponibles
  const hasSubcategories = subcategories.length > 0;

  // Animation variants mémorisés
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        delayChildren: 0.05
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 5, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 15
      }
    }
  }), []);

  // Trie les sous-catégories par ordre alphabétique (mémorisé)
  const sortedSubcategories = useMemo(() => 
    [...subcategories].sort((a, b) => 
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    ),
    [subcategories]
  );

  // Gestion du clic sur une sous-catégorie (mémorisé)
  const handleSubcategoryClick = useCallback((e: React.MouseEvent, subcategorySlug: string) => {
    e.preventDefault();
    router.push(`/services?category=${category.slug}&subcategory=${subcategorySlug}`);
  }, [router, category.slug]);

  // Fonction mémorisée pour générer les classes d'élément
  const getItemClassName = useCallback((isSelected: boolean) => {
    return `flex items-center justify-center rounded-full backdrop-blur-md 
      transition-all duration-300 px-3 py-1.5 h-full
      border ${isSelected
        ? 'bg-indigo-500/10 dark:bg-indigo-900/30 border-indigo-400/50 dark:border-indigo-600/40 shadow-md shadow-indigo-500/5 dark:shadow-indigo-800/5' 
        : 'bg-white hover:bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 hover:border-indigo-300/40 dark:hover:border-indigo-700/30'
      }`;
  }, []);

  // Génération de groupes pour une meilleure organisation
  const subcategoriesGroups = useMemo(() => {
    if (!hasSubcategories) return [];
    
    const groups: Subcategory[][] = [];
    const groupSize = 8; // Taille optimale pour le mobile et desktop
    
    for (let i = 0; i < sortedSubcategories.length; i += groupSize) {
      groups.push(sortedSubcategories.slice(i, i + groupSize));
    }
    
    return groups;
  }, [sortedSubcategories, hasSubcategories]);

  if (!hasSubcategories) {
    return (
      <motion.div 
        className={`text-center py-6 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="status"
      >
        <div className="inline-flex items-center justify-center p-2.5 
          bg-gray-100 dark:bg-gray-800/50 rounded-full mb-3
          border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" 
            strokeWidth={2.5} />
        </div>
        <p className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
          Aucune sous-catégorie disponible pour {category.name}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`mb-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      data-testid="subcategories-grid"
      aria-label={`Sous-catégories de ${category.name}`}
    >
      <div className="space-y-2">
        {subcategoriesGroups.map((group, groupIndex) => (
          <div 
            key={`group-${groupIndex}`} 
            className="flex flex-wrap gap-2 justify-center xs:justify-start"
          >
            {group.map((subcategory) => {
              const isSelected = selectedSubcategory === subcategory.slug;
              const url = `/services?category=${category.slug}&subcategory=${subcategory.slug}`;
              
              return (
                <motion.div 
                  key={subcategory.id} 
                  variants={itemVariants} 
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    href={url}
                    onClick={(e) => handleSubcategoryClick(e, subcategory.slug)}
                    aria-label={`Sous-catégorie: ${subcategory.name}`}
                    aria-current={isSelected ? 'page' : undefined}
                    className="block"
                  >
                    <div className={getItemClassName(isSelected)}>
                      <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium truncate max-w-full
                        text-gray-700 dark:text-gray-300
                        transition-colors duration-200">
                        {subcategory.name}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Légende montrant le nombre total de sous-catégories */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center justify-center 
          text-[8px] xs:text-[9px] text-gray-500 dark:text-gray-500 
          bg-gray-100/50 dark:bg-gray-800/30 
          px-2 py-0.5 rounded-full
          border border-gray-200/50 dark:border-gray-700/30">
          {subcategories.length} sous-catégorie{subcategories.length > 1 ? 's' : ''} disponible{subcategories.length > 1 ? 's' : ''}
        </span>
      </div>
    </motion.div>
  );
};

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(SubcategoriesGrid);