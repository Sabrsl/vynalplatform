import React, { useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category } from '@/hooks/useCategories';
import { motion } from 'framer-motion';
import { getCategoryEmoji } from '@/lib/categoryIcons';

interface CategoriesGridProps {
  categories: Category[];
  selectedCategory: string | null;
  getSubcategoriesCount: (categoryId: string) => number;
  baseUrl?: string;
  className?: string;
}

/**
 * Composant ultra-moderne pour l'affichage d'une grille de catégories
 * Support des thèmes clair/sombre et adaptation mobile optimisée
 */
const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  categories,
  selectedCategory,
  getSubcategoriesCount,
  baseUrl = '/services',
  className = '',
}) => {
  const router = useRouter();

  // Animation variants mémorisés
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
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
        stiffness: 300,
        damping: 15
      }
    }
  }), []);

  // Fonction mémorisée pour gérer le clic sur une catégorie
  const handleCategoryClick = useCallback((e: React.MouseEvent, categorySlug: string | null) => {
    e.preventDefault();
    const url = categorySlug ? `${baseUrl}?category=${categorySlug}` : baseUrl;
    router.push(url);
  }, [router, baseUrl]);

  // Classe CSS pour les éléments sélectionnés/non-sélectionnés
  const getItemClassName = useCallback((isSelected: boolean) => {
    return `flex flex-col items-center justify-center 
      rounded-xl backdrop-blur-sm transition-all duration-300
      py-1.5 px-1 h-full border
      ${isSelected 
        ? 'bg-indigo-500/10 border-indigo-400/30 shadow-md shadow-indigo-500/5' 
        : 'bg-white/5 border-gray-200/10 hover:bg-indigo-500/5 hover:border-indigo-300/20'
      }`;
  }, []);

  return (
    <motion.div 
      className={`mb-3 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      data-testid="categories-grid"
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5">
        <motion.div variants={itemVariants} className="flex-shrink-0">
          <Link 
            href={baseUrl}
            onClick={(e) => handleCategoryClick(e, null)}
            aria-label="Toutes les catégories"
            aria-current={!selectedCategory ? 'page' : undefined}
            className="block h-full"
          >
            <div className={getItemClassName(!selectedCategory)}>
              <div className="text-base xs:text-lg sm:text-xl" aria-hidden="true">🔍</div>
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-center font-medium mt-1 
                text-white transition-colors">
                Toutes
              </span>
            </div>
          </Link>
        </motion.div>
        
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          const emoji = getCategoryEmoji(category.name);
          
          return (
            <motion.div 
              key={category.id} 
              variants={itemVariants} 
              className="flex-shrink-0"
              whileHover={{ scale: 1.02 }}
            >
              <Link 
                href={`${baseUrl}?category=${category.slug}`}
                onClick={(e) => handleCategoryClick(e, category.slug)}
                aria-label={`Catégorie: ${category.name}`}
                aria-current={isSelected ? 'page' : undefined}
                className="block h-full"
              >
                <div className={getItemClassName(isSelected)}>
                  <div className="text-base xs:text-lg sm:text-xl relative">
                    <span aria-hidden="true">{emoji}</span>
                  </div>
                  <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-center font-medium 
                    truncate w-full mt-1 text-white transition-colors">
                    {category.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(CategoriesGrid);