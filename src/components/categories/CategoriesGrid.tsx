import React from 'react';
import Link from 'next/link';
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
 * Composant réutilisable pour afficher une grille de catégories
 * 
 * @param categories - Liste des catégories à afficher
 * @param selectedCategory - Slug de la catégorie actuellement sélectionnée
 * @param getSubcategoriesCount - Fonction pour obtenir le nombre de sous-catégories d'une catégorie
 * @param baseUrl - URL de base pour les liens de catégories (défaut: '/services')
 * @param className - Classes CSS additionnelles
 */
const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  categories,
  selectedCategory,
  getSubcategoriesCount,
  baseUrl = '/services',
  className = '',
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className={`mb-3 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1">
        <motion.div variants={itemVariants} className="flex-shrink-0">
          <Link href={baseUrl}>
            <div 
              className={`flex flex-col items-center justify-center rounded-md backdrop-blur-sm transition-all py-1.5 px-1 h-full ${
                !selectedCategory 
                  ? 'bg-white/15 ring-1 ring-indigo-500/30 text-white' 
                  : 'bg-white/10 hover:bg-white/15 text-white/90 hover:text-white'
              }`}
            >
              <div className="text-md sm:text-lg">🔍</div>
              <span className="text-[9px] sm:text-[10px] text-center font-medium mt-0.5">Toutes</span>
            </div>
          </Link>
        </motion.div>
        
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          const emoji = getCategoryEmoji(category.name);
          
          return (
            <motion.div key={category.id} variants={itemVariants} className="flex-shrink-0">
              <Link href={`${baseUrl}?category=${category.slug}`}>
                <div 
                  className={`flex flex-col items-center justify-center rounded-md backdrop-blur-sm transition-all py-1.5 px-1 h-full ${
                    isSelected 
                      ? 'bg-white/15 ring-1 ring-indigo-500/30 text-white' 
                      : 'bg-white/10 hover:bg-white/15 text-white/90 hover:text-white'
                  }`}
                >
                  <div className="text-md sm:text-lg">{emoji}</div>
                  <span className="text-[9px] sm:text-[10px] text-center font-medium truncate w-full mt-0.5">{category.name}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CategoriesGrid; 