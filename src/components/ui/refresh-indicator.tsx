"use client";

import React, { memo, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RefreshIndicatorProps {
  isRefreshing: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: boolean;
  variant?: "primary" | "secondary" | "accent" | "muted";
}

// Précompiler les tailles d'icônes pour éviter les recalculs
const ICON_SIZES = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

// Précompiler les styles de variantes pour éviter les recalculs
const VARIANT_STYLES = {
  primary: "text-vynal-purple-600 dark:text-vynal-accent-primary",
  secondary: "text-vynal-purple-400 dark:text-vynal-text-secondary",
  accent: "text-vynal-accent-secondary dark:text-vynal-accent-primary",
  muted: "text-slate-400 dark:text-vynal-text-secondary/70",
};

/**
 * Indicateur de rafraîchissement optimisé qui peut être utilisé pour montrer qu'une action 
 * de rafraîchissement des données est en cours
 */
export const RefreshIndicator = memo<RefreshIndicatorProps>(({
  isRefreshing,
  size = "md",
  className,
  text = false,
  variant = "primary",
}) => {
  // Utiliser useMemo pour les classes complexes
  const iconClasses = useMemo(() => 
    cn(
      ICON_SIZES[size],
      VARIANT_STYLES[variant],
      isRefreshing && "animate-spin",
      "transition-all duration-300"
    ), 
    [size, variant, isRefreshing]
  );
  
  const containerClasses = useMemo(() => 
    cn(
      "inline-flex items-center gap-1.5",
      isRefreshing ? "opacity-100" : "opacity-60",
      className
    ),
    [isRefreshing, className]
  );
  
  const textClasses = useMemo(() => 
    cn(
      "text-xs font-medium",
      VARIANT_STYLES[variant],
      size === "lg" && "text-sm"
    ),
    [variant, size]
  );
  
  const statusText = isRefreshing ? "Actualisation..." : "Actualisé";

  return (
    <div className={containerClasses}>
      <RefreshCw className={iconClasses} />
      
      {text && (
        <span className={textClasses}>
          {statusText}
        </span>
      )}
    </div>
  );
});

// Définir le nom d'affichage pour les outils de développement
RefreshIndicator.displayName = "RefreshIndicator"; 