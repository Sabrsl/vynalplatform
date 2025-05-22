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
    const bgClass = isDark 
      ? "bg-vynal-purple-dark"
      : "bg-white";
    
    return cn(
      "fixed inset-0 min-h-screen w-full h-full",
      bgClass,
      className,
      "transition-colors duration-300"
    );
  }, [isDark, className]);
  
  // Optimisation : rendu conditionnel des éléments décoratifs pour réduire le coût
  const renderDecorativeElements = fullGradient && (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className={cn(
        "absolute -top-64 -right-64 w-[600px] h-[600px]",
        isDark ? "bg-vynal-accent-primary opacity-5" : "bg-indigo-100 opacity-40",
        "rounded-full blur-3xl"
      )}></div>
      <div className={cn(
        "absolute -bottom-64 -left-64 w-[600px] h-[600px]",
        isDark ? "bg-vynal-accent-secondary opacity-5" : "bg-indigo-50 opacity-50",
        "rounded-full blur-3xl"
      )}></div>
      <div className={cn(
        "absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center",
        isDark ? "opacity-5" : "opacity-0"
      )}></div>
    </div>
  );
  
  return (
    <>
      <div className={wrapperClasses} />
      <div className="relative min-h-screen">
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </>
  );
});

ThemeWrapper.displayName = "ThemeWrapper";

export default ThemeWrapper; 