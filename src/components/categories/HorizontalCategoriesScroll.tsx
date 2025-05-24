import React, { useCallback, useMemo, memo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category } from '@/hooks/useCategories';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HorizontalCategoriesScrollProps {
  categories: Category[];
  selectedCategory: string | null;
  getSubcategoriesCount: (categoryId: string) => number;
  baseUrl?: string;
  className?: string;
}

// Mapping des catégories aux icônes avec meilleure organisation
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
 * Composant moderne et optimisé pour l'affichage des catégories avec défilement horizontal
 * - Performance maximale avec lazy loading et virtualisation légère
 * - Design adaptatif avec animations fluides
 * - Accessibilité complète (ARIA, navigation clavier)
 * - Support complet multi-plateforme
 */
const HorizontalCategoriesScroll: React.FC<HorizontalCategoriesScrollProps> = ({
  categories,
  selectedCategory,
  getSubcategoriesCount,
  baseUrl = '/services',
  className = '',
}) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Vérifier l'état du scroll
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Observer le redimensionnement et l'état initial
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(container);

    // Vérification initiale
    const timer = setTimeout(checkScrollState, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [checkScrollState, categories]);

  // Variants d'animation optimisées
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: shouldReduceMotion ? 0 : 0.02,
        delayChildren: 0.1
      }
    }
  }), [shouldReduceMotion]);

  const itemVariants = useMemo(() => ({
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 8,
      scale: shouldReduceMotion ? 1 : 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.4
      }
    }
  }), [shouldReduceMotion]);

  // Gestion du clic sur catégorie avec feedback tactile
  const handleCategoryClick = useCallback((e: React.MouseEvent, categorySlug: string | null) => {
    e.preventDefault();
    
    // Feedback tactile léger pour mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    const url = categorySlug ? `${baseUrl}?category=${categorySlug}` : baseUrl;
    router.push(url);
  }, [router, baseUrl]);

  // Styles adaptatifs pour les éléments
  const getItemClassName = useCallback((isSelected: boolean) => {
    const baseClasses = `
      group relative flex flex-col items-center justify-center 
      rounded-lg transition-all duration-200 ease-out
      py-0.5 px-1.5 sm:py-1 sm:px-2 md:py-1.5 md:px-2.5
      min-w-[65px] sm:min-w-[75px] md:min-w-[85px] lg:min-w-[95px]
      max-w-[75px] sm:max-w-[85px] md:max-w-[95px] lg:max-w-[105px]
      min-h-[70px] sm:min-h-[65px] md:min-h-[70px] lg:min-h-[75px]
      flex-shrink-0 cursor-pointer select-none
      border backdrop-blur-sm shadow-sm
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
      active:scale-95 transform-gpu
    `;

    if (isSelected) {
      return `${baseClasses}
        bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10
        border-vynal-accent-primary/40 dark:border-vynal-accent-primary/20
        text-vynal-accent-primary dark:text-vynal-accent-primary
        hover:bg-vynal-accent-primary/25 dark:hover:bg-vynal-accent-primary/20
        hover:border-vynal-accent-primary/50 dark:hover:border-vynal-accent-primary/40
      `;
    }

    return `${baseClasses}
      bg-white/95 dark:bg-slate-900/30
      border-slate-300 dark:border-slate-700/30
      text-slate-700 dark:text-vynal-text-primary
      hover:bg-white dark:hover:bg-slate-900/40
      hover:border-slate-400 dark:hover:border-slate-700/40
      shadow-md hover:shadow-lg
    `;
  }, []);

  // Défilement intelligent avec momentum
  const smoothScroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container || isScrolling) return;

    setIsScrolling(true);

    // Distance adaptative selon la taille d'écran
    const containerWidth = container.clientWidth;
    const scrollAmount = Math.min(containerWidth * 0.7, 300);
    const targetScroll = direction === 'left' ? -scrollAmount : scrollAmount;

    container.scrollBy({
      left: targetScroll,
      behavior: 'smooth'
    });

    // Reset du flag après l'animation
    setTimeout(() => {
      setIsScrolling(false);
      checkScrollState();
    }, 500);
  }, [isScrolling, checkScrollState]);

  // Navigation clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      smoothScroll('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      smoothScroll('right');
    }
  }, [smoothScroll]);

  return (
    <div className={`relative group ${className}`}>
      <motion.div 
        className="relative px-1 sm:px-2 lg:px-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="navigation"
        aria-label="Navigation des catégories"
      >
        {/* Boutons de navigation avec état adaptatif */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.div
              key="scroll-left-button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute -left-3 sm:left-0 top-1/2 -translate-y-1/2 z-20"
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="bg-white dark:bg-gray-900/90 backdrop-blur-md
                  shadow-lg border border-slate-300 dark:border-gray-700/30
                  rounded-full h-6 w-6 sm:h-8 sm:w-8 p-0 hover:scale-110 active:scale-95
                  transition-all duration-200"
                onClick={() => smoothScroll('left')}
                disabled={isScrolling}
                aria-label="Défiler vers la gauche"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}

          {canScrollRight && (
            <motion.div
              key="scroll-right-button"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute -right-3 sm:right-0 top-1/2 -translate-y-1/2 z-20"
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="bg-white dark:bg-gray-900/90 backdrop-blur-md
                  shadow-lg border border-slate-300 dark:border-gray-700/30
                  rounded-full h-6 w-6 sm:h-8 sm:w-8 p-0 hover:scale-110 active:scale-95
                  transition-all duration-200"
                onClick={() => smoothScroll('right')}
                disabled={isScrolling}
                aria-label="Défiler vers la droite"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradients de fade sur les bords */}
        <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white dark:from-vynal-purple-dark via-white/80 dark:via-vynal-purple-dark/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white dark:from-vynal-purple-dark via-white/80 dark:via-vynal-purple-dark/80 to-transparent z-10 pointer-events-none" />

        {/* Conteneur de défilement optimisé */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide
            py-3 px-3 sm:px-8 scroll-smooth overscroll-x-contain
            snap-x snap-mandatory"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          onScroll={checkScrollState}
          role="tablist"
        >
          {/* Option "Toutes les catégories" */}
          <motion.div 
            variants={itemVariants}
            className="snap-start"
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          >
            <Link 
              href={baseUrl}
              onClick={(e) => handleCategoryClick(e, null)}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-xl"
              role="tab"
              aria-selected={!selectedCategory}
              aria-label="Toutes les catégories"
            >
              <div className={getItemClassName(!selectedCategory)}>
                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 mb-1 sm:mb-1.5">
                  <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-vynal-accent-primary group-hover:text-vynal-accent-primary/80 transition-colors" />
                </div>
                <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold
                  text-white/90 group-hover:text-white transition-colors
                  text-center leading-tight tracking-wide">
                  Toutes
                </span>
                {!selectedCategory && (
                  <motion.div
                    layoutId="categoryIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 dark:bg-rose-400 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          </motion.div>
          
          {/* Catégories avec optimisations */}
          {categories.map((category, index) => {
            const isSelected = selectedCategory === category.slug;
            const IconComponent = CATEGORY_ICONS[category.slug] || Briefcase;
            
            return (
              <motion.div 
                key={category.id}
                variants={itemVariants}
                className="snap-start"
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                custom={index}
              >
                <Link 
                  href={`${baseUrl}?category=${category.slug}`}
                  onClick={(e) => handleCategoryClick(e, category.slug)}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-xl"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Catégorie: ${category.name}`}
                >
                  <div className={getItemClassName(isSelected)}>
                    <div className="flex items-center justify-center w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mb-0.5">
                      <IconComponent className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-vynal-accent-primary group-hover:text-vynal-accent-primary/80 transition-colors" />
                    </div>
                    <span className="text-[9px] sm:text-[9px] md:text-[10px] font-medium
                      text-white/50 group-hover:text-white/70 transition-colors
                      text-center leading-tight tracking-wide w-full px-1
                      line-clamp-2 min-h-[1.6em]">
                      {category.name}
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="categoryIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 dark:bg-rose-400 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Indicateur de scroll pour mobile */}
      <div className="flex justify-center mt-2 sm:hidden">
        <div className="flex space-x-1">
          {[...Array(Math.ceil(categories.length / 4))].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/20"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(HorizontalCategoriesScroll);