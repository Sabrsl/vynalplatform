"use client";

import React, { ReactNode, useMemo, memo } from "react";
import ThemeWrapper from "@/components/ThemeWrapper";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  /**
   * Titre de la page (utilisé pour le SEO et l'accessibilité)
   */
  title?: string;
  /**
   * Si true, ajoute un conteneur avec padding standard
   * @default true
   */
  container?: boolean;
  /**
   * Si true, applique le fond dégradé complet
   * @default true
   */
  fullGradient?: boolean;
  /**
   * Classes CSS supplémentaires pour le wrapper principal
   */
  wrapperClassName?: string;
  /**
   * Classes CSS supplémentaires pour le conteneur
   */
  containerClassName?: string;
  /**
   * Si true, ajoute du padding en haut et en bas
   * @default true
   */
  withPadding?: boolean;
}

/**
 * PageLayout - Un composant pour structurer les pages avec le thème Vynal
 * Intègre automatiquement le ThemeWrapper et la structure de conteneur
 */
const PageLayout = memo(function PageLayout({
  children,
  title,
  container = true,
  fullGradient = true,
  wrapperClassName = "",
  containerClassName = "",
  withPadding = true,
}: PageLayoutProps) {
  // Mémoriser les classes CSS pour éviter des recréations inutiles
  const containerClasses = useMemo(() => 
    cn(
      "container mx-auto",
      withPadding && "py-8 px-4",
      containerClassName
    ),
  [withPadding, containerClassName]);

  return (
    <ThemeWrapper 
      fullGradient={fullGradient}
      className={wrapperClassName}
    >
      {title && (
        <h1 className="sr-only">{title}</h1>
      )}
      
      {container ? (
        <div className={containerClasses}>
          {children}
        </div>
      ) : (
        children
      )}
    </ThemeWrapper>
  );
});

PageLayout.displayName = "PageLayout";

export default PageLayout; 