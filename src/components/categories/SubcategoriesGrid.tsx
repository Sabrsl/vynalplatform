import React, { useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category, Subcategory, UISubcategoryType } from '@/hooks/useCategories';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

interface SubcategoriesGridProps {
  category?: Category;
  subcategories: Subcategory[] | UISubcategoryType[];
  selectedSubcategory: string | null;
  onSelectSubcategory?: (subcategory: Subcategory | UISubcategoryType) => void;
  className?: string;
}

/**
 * Composant optimisé pour l'affichage des sous-catégories
 * - Gestion sécurisée des propriétés optionnelles
 * - Performance améliorée avec réduction des animations
 */
const SubcategoriesGrid: React.FC<SubcategoriesGridProps> = ({
  category,
  subcategories,
  selectedSubcategory,
  onSelectSubcategory,
  className = '',
}) => {
  const router = useRouter();
  
  // Vérifie s'il y a des sous-catégories disponibles
  const hasSubcategories = subcategories.length > 0;

  // Animation variants simplifiés
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.01, // Réduit pour performance
        delayChildren: 0.02
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 2 }, // Simplifié
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "tween", // Plus léger que "spring"
        duration: 0.2
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
  const handleSubcategoryClick = useCallback((e: React.MouseEvent, subcategory: Subcategory | UISubcategoryType) => {
    e.preventDefault();
    
    // Si un gestionnaire de clic personnalisé est fourni, l'utiliser
    if (onSelectSubcategory) {
      onSelectSubcategory(subcategory);
      return;
    }
    
    // Sinon, construire l'URL en gérant le cas où category est undefined
    const categorySlug = category?.slug || '';
    const subcategorySlug = subcategory.slug || '';
    router.push(`/services?category=${categorySlug}&subcategory=${subcategorySlug}`);
  }, [router, category?.slug, onSelectSubcategory]);

  // Fonction mémorisée pour générer les classes d'élément
  const getItemClassName = useCallback((isSelected: boolean) => {
    return `flex items-center justify-center rounded-lg transition-all duration-200
      px-3 py-1.5 h-full border ${isSelected
        ? 'bg-[#FF66B2]/30 border-[#FF66B2]/50 text-[#FF66B2] dark:bg-[#FF66B2]/10 dark:border-[#FF66B2]/30 dark:text-[#FF66B2]/90 shadow-sm' 
        : 'bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 hover:bg-white/40 dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700/40 text-slate-700 dark:text-vynal-text-primary'
      }`;
  }, []);

  // Déterminer si on doit activer les animations basées sur les préférences utilisateur
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Génération de groupes pour une meilleure organisation (optimisé)
  const subcategoriesGroups = useMemo(() => {
    if (!hasSubcategories) return [];
    
    const groups: (Subcategory | UISubcategoryType)[][] = [];
    const groupSize = 8; // Taille optimale pour le mobile et desktop
    
    for (let i = 0; i < sortedSubcategories.length; i += groupSize) {
      groups.push(sortedSubcategories.slice(i, i + groupSize));
    }
    
    return groups;
  }, [sortedSubcategories, hasSubcategories]);

  // Message si aucune sous-catégorie n'est disponible
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
          Aucune sous-catégorie disponible {category ? `pour ${category.name}` : ''}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`mb-6 ${className}`}
      variants={!prefersReducedMotion ? containerVariants : undefined}
      initial={!prefersReducedMotion ? "hidden" : "show"}
      animate="show"
      data-testid="subcategories-grid"
    >
      <div className="space-y-2">
        {subcategoriesGroups.map((group, groupIndex) => (
          <div 
            key={`group-${groupIndex}`} 
            className="flex flex-wrap gap-2 justify-center xs:justify-start"
          >
            {group.map((subcategory) => {
              const isSelected = selectedSubcategory === subcategory.slug;
              const categorySlug = category?.slug || '';
              const url = `/services?category=${categorySlug}&subcategory=${subcategory.slug}`;
              
              return (
                <motion.div 
                  key={subcategory.id} 
                  variants={!prefersReducedMotion ? itemVariants : undefined}
                  className="flex-shrink-0"
                  whileHover={!prefersReducedMotion ? { scale: 1.02 } : undefined}
                  whileTap={!prefersReducedMotion ? { scale: 0.98 } : undefined}
                >
                  <Link 
                    href={url}
                    onClick={(e) => handleSubcategoryClick(e, subcategory)}
                    aria-label={`Sous-catégorie: ${subcategory.name}`}
                    aria-current={isSelected ? 'page' : undefined}
                    className="block"
                  >
                    <div className={getItemClassName(isSelected)}>
                      <span className={`text-[9px] xs:text-[10px] sm:text-[11px] truncate max-w-full
                        transition-colors duration-200 ${isSelected ? 'font-medium' : 'font-normal'}`}>
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