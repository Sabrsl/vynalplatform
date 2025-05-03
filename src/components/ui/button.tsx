"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import usePageTransition from "@/hooks/usePageTransition"
import { useTheme } from "next-themes"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-vynal-accent-primary text-white dark:text-vynal-purple-dark hover:bg-vynal-accent-secondary",
        destructive:
          "bg-vynal-status-error text-white dark:text-vynal-text-primary hover:bg-vynal-status-error/90",
        outline:
          "border bg-white dark:bg-vynal-purple-dark/30 text-vynal-title border-gray-200 dark:border-vynal-purple-secondary/50 hover:bg-gray-100 dark:hover:bg-vynal-purple-secondary/30",
        secondary:
          "bg-vynal-purple-secondary/70 text-vynal-text-primary hover:bg-vynal-purple-secondary",
        ghost: "text-vynal-title hover:bg-gray-100 dark:hover:bg-vynal-purple-dark hover:text-vynal-title",
        link: "text-vynal-title underline-offset-4 hover:underline hover:text-vynal-accent-primary",
        success: "bg-vynal-status-success text-white dark:text-vynal-text-primary hover:bg-vynal-status-success/90",
        warning: "bg-vynal-status-warning text-vynal-purple-dark hover:bg-vynal-status-warning/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** 
   * Chemin vers lequel naviguer lors du clic, affichera un loader squelette pendant la navigation
   * Path to navigate to when clicked, will show skeleton loader during navigation 
   */
  navigate?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, navigate, onClick, ...props }, ref) => {
    const { navigateTo } = usePageTransition();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    
    // Gère la navigation avec chargement squelette
    // Handle navigation with skeleton loading
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Appelle le onClick original s'il est fourni
      // Call the original onClick if provided
      if (onClick) {
        onClick(e);
      }
      
      // Si la prop navigate est fournie, gère la navigation
      // If navigate prop is provided, handle navigation
      if (navigate && !e.defaultPrevented) {
        navigateTo(navigate);
      }
    }, [onClick, navigate, navigateTo]);
    
    // Ajouter des classes spécifiques pour les boutons customisés
    const customClasses = className?.includes('btn-vynal-primary') || className?.includes('btn-vynal-outline')
      ? className
      : cn(buttonVariants({ variant, size, className }));
    
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={customClasses}
        ref={ref}
        onClick={navigate ? handleClick : onClick}
        data-nav={navigate ? "true" : undefined}
        data-theme={isDarkMode ? "dark" : "light"}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 