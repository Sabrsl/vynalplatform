import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Subcategory } from '@/hooks/useCategories';
import { PUBLIC_ROUTES } from '@/config/routes';

interface SubcategoriesCloudProps {
  subcategories: Subcategory[];
  showCount?: number; // Nombre de sous-catégories à afficher (toutes par défaut)
  popularOnly?: boolean; // Afficher uniquement les sous-catégories populaires
  className?: string;
}

// Slugs des sous-catégories populaires (ordre d'importance)
const popularSlugs = [
  'developpement-react', 
  'design-ui-ux', 
  'wordpress', 
  'seo', 
  'copywriting', 
  'motion-design', 
  'social-media',
  'developpement-web',
  'design-graphique',
  'marketing-digital',
  'redaction-web',
  'montage-video',
  'formation-en-ligne',
  'creation-logo',
  'administration-systeme'
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
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
};

export const SubcategoriesCloud: React.FC<SubcategoriesCloudProps> = ({
  subcategories,
  showCount = 20,
  popularOnly = true,
  className = ''
}) => {
  const displayedSubcategories = useMemo(() => {
    // Filtrer d'abord par popularité si demandé
    let filteredSubcats = [...subcategories];
    
    if (popularOnly) {
      // Trier d'abord par les slugs populaires connus
      filteredSubcats.sort((a, b) => {
        const aIndex = popularSlugs.findIndex(slug => a.slug.includes(slug));
        const bIndex = popularSlugs.findIndex(slug => b.slug.includes(slug));
        
        // Si les deux sont dans la liste des populaires, comparer leur position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // Si l'un des deux n'est pas dans la liste, prioriser celui qui l'est
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // Sinon, ordre alphabétique
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      });
    } else {
      // Sinon, trier par ordre alphabétique
      filteredSubcats.sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
    }
    
    // Limiter le nombre d'éléments affichés si nécessaire
    return showCount > 0 ? filteredSubcats.slice(0, showCount) : filteredSubcats;
  }, [subcategories, showCount, popularOnly]);
  
  if (!displayedSubcategories.length) {
    return null;
  }

  return (
    <motion.div 
      className={`flex flex-wrap gap-2 md:gap-3 justify-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {displayedSubcategories.map((subcategory) => (
        <motion.div
          key={subcategory.id}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href={`${PUBLIC_ROUTES.SERVICES}?subcategory=${subcategory.slug}`}
            className="inline-flex items-center rounded-full px-3 py-1.5 
              text-xs md:text-sm font-medium transition-all duration-200
              bg-white/30 dark:bg-slate-900/30 
              backdrop-blur-sm border border-slate-200 dark:border-slate-700/30 
              shadow-sm hover:shadow-md 
              hover:border-vynal-accent-primary/30 dark:hover:border-vynal-accent-primary/40
              text-slate-800 dark:text-vynal-text-primary
              hover:-translate-y-0.5"
          >
            {subcategory.name}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};