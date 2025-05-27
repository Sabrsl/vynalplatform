import React, {
  useCallback,
  useMemo,
  memo,
  useRef,
  useState,
  useEffect,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Category } from "@/hooks/useCategories";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalCategoriesScrollProps {
  categories: Category[];
  selectedCategory: string | null;
  getSubcategoriesCount: (categoryId: string) => number;
  baseUrl?: string;
  className?: string;
}

// Mapping des catégories aux icônes avec meilleure organisation
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "developpement-web-mobile": Code,
  "design-graphique": Palette,
  "marketing-digital": Megaphone,
  "redaction-traduction": FileText,
  "video-audio": Film,
  "formation-education": GraduationCap,
  "conseil-business": Briefcase,
  "artisanat-creation": Scissors,
  "agriculture-elevage": Leaf,
  "informatique-reseaux": Cpu,
  "services-administratifs": FileSpreadsheet,
  "mode-beaute": ShoppingBag,
  "religion-spiritualite": Heart,
  "sante-bien-etre": Heart,
  "intelligence-artificielle": Sparkles,
};

/**
 * Composant simplifié pour l'affichage des catégories avec défilement horizontal
 */
const HorizontalCategoriesScroll: React.FC<HorizontalCategoriesScrollProps> = ({
  categories,
  selectedCategory,
  getSubcategoriesCount,
  baseUrl = "/services",
  className = "",
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  // Vérifier l'état du scroll de manière simplifiée
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10); // Marge pour éviter les problèmes d'arrondi
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // Marge pour éviter les problèmes d'arrondi
  }, []);

  // Nouvelle fonction pour centrer la catégorie sélectionnée
  const scrollToSelectedCategory = useCallback(
    (categorySlug: string | null) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // Si c'est "Toutes", scroll vers le début
      if (!categorySlug) {
        container.scrollTo({
          left: 0,
          behavior: "smooth",
        });
        return;
      }

      // Trouver l'élément de la catégorie sélectionnée
      const categoryElement = container.querySelector(
        `[data-category-slug="${categorySlug}"]`,
      ) as HTMLElement;
      if (!categoryElement) return;

      // Calculer la position pour centrer l'élément
      const containerRect = container.getBoundingClientRect();
      const elementRect = categoryElement.getBoundingClientRect();

      const elementRelativeLeft =
        elementRect.left - containerRect.left + container.scrollLeft;
      const elementWidth = elementRect.width;
      const containerWidth = containerRect.width;

      // Position de scroll pour centrer l'élément
      const targetScrollLeft =
        elementRelativeLeft - containerWidth / 2 + elementWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });

      // Vérifier l'état après le défilement
      setTimeout(checkScrollState, 500);
    },
    [checkScrollState],
  );

  // Effet pour centrer la catégorie sélectionnée au chargement et lors des changements
  useEffect(() => {
    if (selectedCategory) {
      // Utiliser un délai pour s'assurer que le DOM est rendu
      setTimeout(() => {
        scrollToSelectedCategory(selectedCategory);
      }, 100);
    }
  }, [selectedCategory, scrollToSelectedCategory]);

  // Effet de base pour vérifier l'état de défilement
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkScrollState, 100); // Délai pour s'assurer que le DOM est stabilisé
    });
    resizeObserver.observe(container);

    // Fonction pour vérifier l'état lors du défilement
    const handleScroll = () => {
      requestAnimationFrame(checkScrollState); // Utiliser requestAnimationFrame pour les performances
    };

    // Vérifier l'état initial après le rendu
    setTimeout(checkScrollState, 100);

    // Ajouter un écouteur de défilement
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container?.removeEventListener("scroll", handleScroll);
    };
  }, [checkScrollState]);

  // Animation simplifiée
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  };

  // Défilement simple
  const smoothScroll = useCallback(
    (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // Calculer un défilement basé sur la taille du conteneur
      // Mais adapté pour avoir un comportement plus intuitif (environ 75% de la largeur visible)
      const scrollAmount = Math.min(container.clientWidth * 0.75, 400);

      // Ajouter une petite marge pour améliorer la visibilité des éléments partiellement visibles
      const actualScroll = direction === "left" ? -scrollAmount : scrollAmount;

      // Appliquer le défilement avec animation
      container.scrollBy({
        left: actualScroll,
        behavior: "smooth",
      });

      // Mise à jour de l'état après l'animation
      setTimeout(checkScrollState, 500);
    },
    [checkScrollState],
  );

  // Gérer le clic sur une catégorie sans défiler la page
  const handleCategoryClick = useCallback(
    (e: React.MouseEvent, categorySlug: string | null) => {
      e.preventDefault(); // Empêcher la navigation par défaut
      e.stopPropagation(); // Empêcher la propagation de l'événement

      // Construire les nouveaux paramètres d'URL
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (categorySlug) {
        params.set("category", categorySlug);
        // Supprimer le paramètre subcategory s'il existe
        if (params.has("subcategory")) {
          params.delete("subcategory");
        }
      } else {
        // Si on clique sur "Toutes", supprimer les paramètres category et subcategory
        if (params.has("category")) {
          params.delete("category");
        }
        if (params.has("subcategory")) {
          params.delete("subcategory");
        }
      }

      // Réinitialiser la page à 1
      params.set("page", "1");

      // Mettre à jour l'URL sans naviguer ni défiler - méthode améliorée
      const newUrl = `${pathname}?${params.toString()}`;

      // Utiliser router.replace avec scroll: false pour une meilleure compatibilité
      router.replace(newUrl, { scroll: false });

      // Centrer la catégorie sélectionnée après un court délai
      setTimeout(() => {
        scrollToSelectedCategory(categorySlug);
      }, 100);
    },
    [router, pathname, searchParams, scrollToSelectedCategory],
  );

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="relative px-1 sm:px-2 lg:px-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Boutons de navigation toujours visibles */}
        <Button
          variant="ghost"
          size="sm"
          className={`absolute -left-3 sm:left-0 top-1/2 -translate-y-1/2 z-20
            bg-white/90 dark:bg-gray-900/90 backdrop-blur-md
            shadow-md hover:shadow-lg border border-slate-300 dark:border-gray-700/30
            rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 
            transition-all duration-200
            hover:bg-white dark:hover:bg-gray-800/90
            hover:-translate-x-0.5
            ${canScrollLeft ? "opacity-100" : "opacity-40 cursor-not-allowed"}`}
          onClick={() => smoothScroll("left")}
          disabled={!canScrollLeft}
          aria-label="Défiler vers la gauche"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`absolute -right-3 sm:right-0 top-1/2 -translate-y-1/2 z-20
            bg-white/90 dark:bg-gray-900/90 backdrop-blur-md
            shadow-md hover:shadow-lg border border-slate-300 dark:border-gray-700/30
            rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 
            transition-all duration-200
            hover:bg-white dark:hover:bg-gray-800/90
            hover:translate-x-0.5
            ${canScrollRight ? "opacity-100" : "opacity-40 cursor-not-allowed"}`}
          onClick={() => smoothScroll("right")}
          disabled={!canScrollRight}
          aria-label="Défiler vers la droite"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* Gradients de fade sur les bords */}
        <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-slate-50 dark:from-vynal-purple-dark via-slate-50/80 dark:via-vynal-purple-dark/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-slate-50 dark:from-vynal-purple-dark via-slate-50/80 dark:via-vynal-purple-dark/80 to-transparent z-10 pointer-events-none" />

        {/* Conteneur de défilement simplifié */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide
            py-3 px-3 sm:px-8 scroll-smooth overscroll-x-contain"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            // Améliorer le comportement de scroll sur mobile
            WebkitOverflowScrolling: "touch",
            // Empêcher le scroll vertical accidentel
            overscrollBehaviorY: "contain",
          }}
          role="tablist"
        >
          {/* Option "Toutes les catégories" */}
          <div
            data-category-slug=""
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-xl"
            role="tab"
            aria-selected={!selectedCategory}
            aria-label="Toutes les catégories"
            onClick={(e) => handleCategoryClick(e, null)}
            style={{ cursor: "pointer" }}
          >
            <div
              className={`
              group relative flex flex-col items-center justify-center 
              rounded-lg transition-all duration-200 ease-out
              py-0.5 px-1.5 sm:py-1 sm:px-2 md:py-1.5 md:px-2.5
              min-w-[65px] sm:min-w-[75px] md:min-w-[85px] lg:min-w-[95px]
              max-w-[75px] sm:max-w-[85px] md:max-w-[95px] lg:max-w-[105px]
              min-h-[70px] sm:min-h-[65px] md:min-h-[70px] lg:min-h-[75px]
              flex-shrink-0 cursor-pointer select-none
              border backdrop-blur-sm shadow-sm
              focus-visible:outline-none
              ${
                !selectedCategory
                  ? "bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10 border-vynal-accent-primary/40 dark:border-vynal-accent-primary/20 text-vynal-accent-primary dark:text-vynal-accent-primary"
                  : "bg-white/95 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-primary hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-700/40 shadow-md hover:shadow-lg"
              }
            `}
            >
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 mb-1 sm:mb-1.5">
                <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-vynal-accent-primary group-hover:text-vynal-accent-primary/80 transition-colors" />
              </div>
              <span
                className="text-[8px] xs:text-[9px] sm:text-[10px] font-medium
                text-slate-700 dark:text-vynal-text-primary
                group-hover:text-slate-800 dark:group-hover:text-vynal-text-primary
                text-center leading-tight tracking-wide"
              >
                Toutes
              </span>
              {!selectedCategory && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 dark:bg-rose-400 rounded-full" />
              )}
            </div>
          </div>

          {/* Catégories simplifiées */}
          {categories.map((category) => {
            const isSelected = selectedCategory === category.slug;
            const IconComponent = CATEGORY_ICONS[category.slug] || Briefcase;

            return (
              <div
                key={category.id}
                data-category-slug={category.slug}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-xl"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Catégorie: ${category.name}`}
                onClick={(e) => handleCategoryClick(e, category.slug)}
                style={{ cursor: "pointer" }}
              >
                <div
                  className={`
                  group relative flex flex-col items-center justify-center 
                  rounded-lg transition-all duration-200 ease-out
                  py-0.5 px-1.5 sm:py-1 sm:px-2 md:py-1.5 md:px-2.5
                  min-w-[65px] sm:min-w-[75px] md:min-w-[85px] lg:min-w-[95px]
                  max-w-[75px] sm:max-w-[85px] md:max-w-[95px] lg:max-w-[105px]
                  min-h-[70px] sm:min-h-[65px] md:min-h-[70px] lg:min-h-[75px]
                  flex-shrink-0 cursor-pointer select-none
                  border backdrop-blur-sm
                  focus-visible:outline-none
                  ${
                    isSelected
                      ? "bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10 border-vynal-accent-primary/40 dark:border-vynal-accent-primary/20 text-vynal-accent-primary dark:text-vynal-accent-primary shadow-md"
                      : "bg-white/95 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-primary hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-700/40 shadow-sm hover:shadow-md"
                  }
                `}
                >
                  <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 mb-1 sm:mb-1.5">
                    <IconComponent className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-vynal-accent-primary group-hover:text-vynal-accent-primary/80 transition-colors" />
                  </div>
                  <span
                    className="text-[8px] xs:text-[9px] sm:text-[10px] font-medium
                    text-slate-700 dark:text-vynal-text-primary
                    group-hover:text-slate-800 dark:group-hover:text-vynal-text-primary
                    text-center leading-tight tracking-wide w-full px-1
                    line-clamp-2 min-h-[1.6em]"
                  >
                    {category.name}
                  </span>
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 dark:bg-rose-400 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default memo(HorizontalCategoriesScroll);
