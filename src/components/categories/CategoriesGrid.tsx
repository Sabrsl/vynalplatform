import React, { useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category } from '@/hooks/useCategories';
import { motion } from 'framer-motion';
import { 
  Search, 
  Code, 
  Palette, 
  Megaphone, 
  FileText,
  Film, 
  GraduationCap, 
  Briefcase,
  Scissors,
  Cpu,
  FileSpreadsheet,
  ShoppingBag,
  Heart,
  Leaf,
  Sparkles
} from 'lucide-react';

interface CategoriesGridProps {
  categories: Category[];
  selectedCategory: string | null;
  getSubcategoriesCount: (categoryId: string) => number;
  baseUrl?: string;
  className?: string;
}

// Mapping des catégories aux icônes Lucide (natives)
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'developpement-web-mobile': Code,
  'design-graphique': Palette,
  'marketing-digital': Megaphone,
  'redaction-traduction': FileText,
  'video-audio': Film,
  'formation-education': GraduationCap,
  'conseil-business': Briefcase,
  'artisanat-creation': Scissors,
  'agriculture-elevage': Leaf,
  'informatique-reseaux': Cpu,
  'services-administratifs': FileSpreadsheet,
  'mode-beaute': ShoppingBag,
  'religion-spiritualite': Heart,
  'sante-bien-etre': Heart,
  'intelligence-artificielle': Sparkles
};

/**
 * Composant optimisé pour l'affichage d'une grille de catégories
 * - Performance améliorée avec icônes natives
 * - Animations réduites pour les appareils à faible performance
 */
const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  categories,
  selectedCategory,
  getSubcategoriesCount,
  baseUrl = '/services',
  className = '',
}) => {
  const router = useRouter();

  // Animation variants simplifiés
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.01 // Réduit pour plus de performance
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

  // Fonction mémorisée pour gérer le clic sur une catégorie
  const handleCategoryClick = useCallback((e: React.MouseEvent, categorySlug: string | null) => {
    e.preventDefault();
    const url = categorySlug ? `${baseUrl}?category=${categorySlug}` : baseUrl;
    router.push(url);
  }, [router, baseUrl]);

  // Classe CSS pour les éléments sélectionnés/non-sélectionnés
  const getItemClassName = useCallback((isSelected: boolean) => {
    return `flex flex-col items-center justify-center 
      rounded-xl transition-colors duration-200
      py-1.5 px-1 h-full border
      ${isSelected 
        ? 'bg-indigo-500/10 border-indigo-400/30' 
        : 'bg-white/5 border-gray-200/10 hover:bg-indigo-500/5 hover:border-indigo-300/20'
      }`;
  }, []);

  // Déterminer si on doit activer les animations basées sur les préférences utilisateur
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div 
      className={`mb-3 ${className}`}
      variants={!prefersReducedMotion ? containerVariants : undefined}
      initial={!prefersReducedMotion ? "hidden" : "show"}
      animate="show"
      data-testid="categories-grid"
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1 lg:gap-1.5">
        <motion.div 
          variants={!prefersReducedMotion ? itemVariants : undefined} 
          className="flex-shrink-0"
        >
          <Link 
            href={baseUrl}
            onClick={(e) => handleCategoryClick(e, null)}
            aria-label="Toutes les catégories"
            aria-current={!selectedCategory ? 'page' : undefined}
            className="block h-full"
          >
            <div className={getItemClassName(!selectedCategory)}>
              <div className="flex items-center justify-center w-6 h-6" aria-hidden="true">
                <Search className="h-4 w-4 text-indigo-500" />
              </div>
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-center font-medium mt-1 
                text-white transition-colors">
                Toutes
              </span>
            </div>
          </Link>
        </motion.div>
        
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          const IconComponent = CATEGORY_ICONS[category.slug] || Briefcase;
          
          return (
            <motion.div 
              key={category.id} 
              variants={!prefersReducedMotion ? itemVariants : undefined}
              className="flex-shrink-0"
              whileHover={!prefersReducedMotion ? { scale: 1.01 } : undefined}
            >
              <Link 
                href={`${baseUrl}?category=${category.slug}`}
                onClick={(e) => handleCategoryClick(e, category.slug)}
                aria-label={`Catégorie: ${category.name}`}
                aria-current={isSelected ? 'page' : undefined}
                className="block h-full"
              >
                <div className={getItemClassName(isSelected)}>
                  <div className="flex items-center justify-center w-6 h-6">
                    <IconComponent className="h-4 w-4 text-indigo-500" />
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