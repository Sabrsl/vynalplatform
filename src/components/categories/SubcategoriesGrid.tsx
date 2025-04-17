import React from 'react';
import Link from 'next/link';
import { Category, Subcategory } from '@/hooks/useCategories';
import { motion } from 'framer-motion';

interface SubcategoriesGridProps {
  category: Category;
  subcategories: Subcategory[];
  selectedSubcategory: string | null;
  className?: string;
}

/**
 * Composant réutilisable pour afficher une grille de sous-catégories
 */
const SubcategoriesGrid: React.FC<SubcategoriesGridProps> = ({
  category,
  subcategories,
  selectedSubcategory,
  className = '',
}) => {
  // Vérifie s'il y a des sous-catégories disponibles
  const hasSubcategories = subcategories.length > 0;

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

  // Trie les sous-catégories par ordre alphabétique
  const sortedSubcategories = [...subcategories].sort((a, b) => 
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  );

  return (
    <motion.div
      className={`mb-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {hasSubcategories ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
          {sortedSubcategories.map((subcategory) => {
            const isSelected = selectedSubcategory === subcategory.slug;
            return (
              <motion.div key={subcategory.id} variants={itemVariants} className="flex-shrink-0">
                <Link href={`/services?category=${category.slug}&subcategory=${subcategory.slug}`}>
                  <div
                    className={`flex items-center justify-start rounded-md backdrop-blur-sm transition-all px-2 py-1 ${
                      isSelected
                        ? 'bg-white/15 ring-1 ring-indigo-500/30 text-indigo-600'
                        : 'bg-white/10 hover:bg-white/15 text-gray-800 hover:text-indigo-600'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-medium truncate max-w-full">{subcategory.name}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">Aucune sous-catégorie disponible</p>
        </div>
      )}
    </motion.div>
  );
};

export default SubcategoriesGrid; 