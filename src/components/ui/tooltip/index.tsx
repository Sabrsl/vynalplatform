"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils"

/**
 * Composant Tooltip optimisé avec:
 * - Support des thèmes clair/sombre
 * - Accessibilité améliorée
 * - Performance optimisée
 * - Animations fluides et légères
 * - Mémorisation des styles pour éviter les recalculs
 */

interface TooltipProps extends TooltipPrimitive.TooltipProps {
  /**
   * Délai avant affichage en ms
   * @default 0
   */
  delayDuration?: number;
  
  /**
   * Durée d'affichage en ms (0 = infini)
   * @default 0
   */
  skipDelayDuration?: number;
}

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /**
   * Classes CSS supplémentaires
   */
  className?: string;
  
  /**
   * Décalage par rapport au déclencheur
   * @default 4
   */
  sideOffset?: number;
  
  /**
   * Largeur maximale du tooltip (px ou autre unité CSS)
   * @default auto
   */
  maxWidth?: string;
  
  /**
   * Variante d'apparence
   * @default "default"
   */
  variant?: "default" | "info" | "success" | "warning" | "error";
}

// Provider avec configuration globale optimisée
const TooltipProvider = React.memo(
  ({ children, delayDuration = 300, skipDelayDuration = 300 }: React.PropsWithChildren<{ 
    delayDuration?: number;
    skipDelayDuration?: number; 
  }>) => (
    <TooltipPrimitive.Provider 
      delayDuration={delayDuration} 
      skipDelayDuration={skipDelayDuration}
    >
      {children}
    </TooltipPrimitive.Provider>
  )
);
TooltipProvider.displayName = "TooltipProvider";

// Composant racine avec optimisation des props
const Tooltip = React.memo<TooltipProps>(({ children, ...props }) => (
  <TooltipPrimitive.Root {...props}>
    {children}
  </TooltipPrimitive.Root>
));
Tooltip.displayName = "Tooltip";

// Trigger optimisé
const TooltipTrigger = React.memo(React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    className={cn("outline-none focus:ring-2 focus:ring-vynal-accent-primary/50 rounded-sm", className)}
    {...props}
  />
)));
TooltipTrigger.displayName = "TooltipTrigger";

// Content avec thèmes et variantes
const TooltipContent = React.memo(React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ 
  className, 
  sideOffset = 4, 
  maxWidth = "auto",
  variant = "default",
  ...props 
}, ref) => {
  // Support des thèmes
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Mémoïsation des styles par variante et thème
  const variantStyles = React.useMemo(() => {
    switch (variant) {
      case "info":
        return isDarkMode 
          ? "bg-blue-900/90 border-blue-800/30 text-blue-100" 
          : "bg-blue-50/90 border-blue-200 text-blue-800";
      case "success":
        return isDarkMode 
          ? "bg-green-900/90 border-green-800/30 text-green-100" 
          : "bg-green-50/90 border-green-200 text-green-800";
      case "warning":
        return isDarkMode 
          ? "bg-amber-900/90 border-amber-800/30 text-amber-100" 
          : "bg-amber-50/90 border-amber-200 text-amber-800";
      case "error":
        return isDarkMode 
          ? "bg-red-900/90 border-red-800/30 text-red-100" 
          : "bg-red-50/90 border-red-200 text-red-800";
      case "default":
      default:
        return isDarkMode 
          ? "bg-vynal-purple-secondary/90 border-vynal-purple-secondary/30 text-vynal-text-primary" 
          : "bg-gray-800/90 border-gray-700/30 text-gray-100";
    }
  }, [variant, isDarkMode]);
  
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Base styles
        "z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs border shadow-md backdrop-blur-sm",
        "will-change-transform will-change-opacity",
        // Animation styles - optimisées pour les performances
        "animate-in fade-in-50 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Variant styles
        variantStyles,
        className
      )}
      style={{ 
        maxWidth: maxWidth,
        // Optimisations pour la performance de rendu
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
      collisionPadding={8} // Prevent tooltips from sticking to viewport edges
      {...props}
    />
  );
}));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

// Composant d'utilité pour usage rapide
export const QuickTooltip = React.memo(({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
  variant = "default",
  maxWidth = "14rem",
  className,
  ...props
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  variant?: "default" | "info" | "success" | "warning" | "error";
  maxWidth?: string;
  className?: string;
}) => (
  <TooltipProvider delayDuration={delayDuration}>
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        align={align}
        maxWidth={maxWidth}
        variant={variant}
        className={className}
        {...props}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

// Ajout du displayName pour se conformer aux règles ESLint
QuickTooltip.displayName = "QuickTooltip";