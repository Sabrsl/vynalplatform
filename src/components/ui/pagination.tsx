import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

/**
 * Composant de pagination réutilisable
 * 
 * @param currentPage - La page actuelle (1-indexed)
 * @param totalPages - Le nombre total de pages
 * @param onPageChange - Fonction appelée lors du changement de page
 * @param siblingCount - Nombre de pages à afficher avant et après la page courante
 * @param className - Classes CSS additionnelles
 * @param showLoadMore - Afficher un bouton "Charger plus" au lieu de la pagination
 * @param onLoadMore - Fonction appelée lors du clic sur "Charger plus"
 * @param isLoading - Indique si le chargement est en cours
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = '',
  showLoadMore = false,
  onLoadMore,
  isLoading = false
}: PaginationProps) {
  // Si aucune page, ne rien afficher
  if (totalPages <= 0) return null;
  
  // Si le bouton "Charger plus" est activé
  if (showLoadMore) {
    const hasMorePages = currentPage < totalPages;
    
    if (!hasMorePages) return null;
    
    return (
      <div className={cn("flex justify-center my-6", className)}>
        <Button
          variant="outline"
          size="lg"
          className="bg-white hover:bg-gray-50 border-gray-200"
          onClick={onLoadMore}
          disabled={isLoading || !hasMorePages}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Chargement...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Charger plus de services
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    );
  }
  
  // Créer un tableau de pages à afficher
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };
  
  const createPaginationRange = () => {
    // Nombre minimum de boutons à afficher
    const totalPageNumbers = siblingCount * 2 + 5;
    
    // Si le nombre total de pages est inférieur au nombre de boutons à afficher
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }
    
    // Calcul des index de début et de fin des pages siblings
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    
    // Ne pas afficher les points si les pages sont adjacentes aux extrémités
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    // Première et dernière page toujours affichées
    const firstPageIndex = 1;
    const lastPageIndex = totalPages;
    
    // Cas 1: Pas de points à gauche, seulement à droite
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      
      return [...leftRange, -1, totalPages];
    }
    
    // Cas 2: Pas de points à droite, seulement à gauche
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      
      return [firstPageIndex, -1, ...rightRange];
    }
    
    // Cas 3: Points à gauche et à droite
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      
      return [firstPageIndex, -1, ...middleRange, -2, lastPageIndex];
    }
  };
  
  const pages = createPaginationRange();
  
  // Rendu des boutons de pagination
  return (
    <nav className={cn("flex justify-center items-center space-x-1 my-6", className)} aria-label="Pagination">
      {/* Bouton "Première page" */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-8 w-8 bg-white",
          currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
        )}
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        aria-label="Première page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      
      {/* Bouton "Page précédente" */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-8 w-8 bg-white",
          currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
        )}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Numéros de page */}
      {pages?.map((pageNumber, index) => {
        // Afficher les points
        if (pageNumber === -1 || pageNumber === -2) {
          return (
            <span
              key={index}
              className="flex items-center justify-center h-8 w-8 text-gray-400"
            >
              <MoreHorizontal className="h-5 w-5" />
            </span>
          );
        }
        
        // Afficher le numéro de page
        return (
          <Button
            key={index}
            variant={pageNumber === currentPage ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-8 w-8",
              pageNumber === currentPage 
                ? "bg-indigo-600 hover:bg-indigo-700" 
                : "bg-white hover:bg-gray-50"
            )}
            onClick={() => onPageChange(pageNumber)}
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === currentPage ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}
      
      {/* Bouton "Page suivante" */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-8 w-8 bg-white",
          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
        )}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {/* Bouton "Dernière page" */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-8 w-8 bg-white",
          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
        )}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        aria-label="Dernière page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
} 