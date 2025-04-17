"use client";

import React, { ReactNode } from "react";
import { useTheme } from 'next-themes';

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
export default function ThemeWrapper({
  children,
  fullGradient = true,
  className = "",
}: ThemeWrapperProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div 
      className={`min-h-screen ${
        fullGradient 
          ? isDark 
            ? "bg-gradient-vynal" 
            : "bg-gradient-to-b from-vynal-purple-100 to-white"
          : isDark 
            ? "bg-vynal-purple-dark"
            : "bg-vynal-purple-50/80"
      } ${className} transition-colors duration-300`}
    >
      {/* Element décoratif optionnel (cercles flous) */}
      {fullGradient && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-64 -right-64 w-[600px] h-[600px] ${
            isDark ? "bg-vynal-accent-primary opacity-5" : "bg-vynal-purple-300 opacity-20"
          } rounded-full blur-3xl`}></div>
          <div className={`absolute -bottom-64 -left-64 w-[600px] h-[600px] ${
            isDark ? "bg-vynal-accent-secondary opacity-5" : "bg-vynal-purple-400 opacity-15"
          } rounded-full blur-3xl`}></div>
          
          {/* Grille décorative en arrière-plan */}
          <div className={`absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center ${
            isDark ? "opacity-5" : "opacity-10"
          }`}></div>
        </div>
      )}
      
      {/* Contenu de la page */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 