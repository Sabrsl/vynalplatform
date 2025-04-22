"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RefreshIndicatorProps {
  isRefreshing: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: boolean;
  variant?: "primary" | "secondary" | "accent" | "muted";
}

/**
 * Indicateur de rafraîchissement qui peut être utilisé pour montrer qu'une action 
 * de rafraîchissement des données est en cours
 */
export function RefreshIndicator({
  isRefreshing,
  size = "md",
  className,
  text = false,
  variant = "primary",
}: RefreshIndicatorProps) {
  // Déterminer la taille de l'icône
  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  // Déterminer les couleurs en fonction du variant
  const variantStyles = {
    primary: "text-vynal-purple-600 dark:text-vynal-accent-primary",
    secondary: "text-vynal-purple-400 dark:text-vynal-text-secondary",
    accent: "text-vynal-accent-secondary dark:text-vynal-accent-primary",
    muted: "text-slate-400 dark:text-vynal-text-secondary/70",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5",
        isRefreshing ? "opacity-100" : "opacity-60",
        className
      )}
    >
      <RefreshCw
        className={cn(
          iconSize,
          variantStyles,
          isRefreshing && "animate-spin",
          "transition-all duration-300"
        )}
      />
      
      {text && (
        <span className={cn(
          "text-xs font-medium",
          variantStyles,
          size === "lg" && "text-sm"
        )}>
          {isRefreshing ? "Actualisation..." : "Actualisé"}
        </span>
      )}
    </div>
  );
} 