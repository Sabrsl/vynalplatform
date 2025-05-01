"use client";

import React, { ReactNode, useMemo, memo } from "react";
import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";

interface ThemeWrapperProps {
  children: ReactNode;
  /**
   * Indique si le fond dégradé doit être pleinement affiché
   * @default true
   */
  fullGradient?: boolean;
  /**
   * Classes CSS supplémentaires pour personnaliser le wrapper
   */
  className?: string;
}

/**
 * ThemeWrapper - Un composant qui encapsule le contenu des pages
 * avec le thème Vynal (fond dégradé violet, typographie, etc.)
 * 
 * Utiliser ce composant au lieu de div/section directement pour
 * maintenir une cohérence visuelle et faciliter les changements globaux.
 */
const ThemeWrapper = memo(function ThemeWrapper({
  children,
  fullGradient = true,
  className = "",
}: ThemeWrapperProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Mémoriser les classes CSS pour éviter les recalculs à chaque rendu
  const wrapperClasses = useMemo(() => {
    const bgClass = fullGradient 
      ? isDark 
        ? "bg-gradient-vynal" 
        : "bg-gradient-to-b from-vynal-purple-100 to-white"
      : isDark 
        ? "bg-vynal-purple-dark"
        : "bg-vynal-purple-50/80";
    
    return cn(
      "min-h-screen",
      bgClass,
      className,
      "transition-colors duration-300"
    );
  }, [fullGradient, isDark, className]);
  
  // Mémoriser les classes pour les éléments décoratifs
  const topCircleClasses = useMemo(() => cn(
    "absolute -top-64 -right-64 w-[600px] h-[600px]",
    isDark ? "bg-vynal-accent-primary opacity-5" : "bg-vynal-purple-300 opacity-20",
    "rounded-full blur-3xl"
  ), [isDark]);
  
  const bottomCircleClasses = useMemo(() => cn(
    "absolute -bottom-64 -left-64 w-[600px] h-[600px]",
    isDark ? "bg-vynal-accent-secondary opacity-5" : "bg-vynal-purple-400 opacity-15",
    "rounded-full blur-3xl"
  ), [isDark]);
  
  const gridClasses = useMemo(() => cn(
    "absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center",
    isDark ? "opacity-5" : "opacity-10"
  ), [isDark]);
  
  // Optimisation : ne pas rendre les éléments décoratifs si fullGradient est false
  const decorativeElements = useMemo(() => {
    if (!fullGradient) return null;
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={topCircleClasses}></div>
        <div className={bottomCircleClasses}></div>
        <div className={gridClasses}></div>
      </div>
    );
  }, [fullGradient, topCircleClasses, bottomCircleClasses, gridClasses]);
  
  return (
    <div className={wrapperClasses}>
      {decorativeElements}
      
      {/* Contenu de la page */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

ThemeWrapper.displayName = "ThemeWrapper";

export default ThemeWrapper; 