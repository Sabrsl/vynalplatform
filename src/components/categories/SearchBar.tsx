import React, { memo, useCallback, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, Command, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';
import { usePathname, useSearchParams } from 'next/navigation';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  className?: string;
  placeholder?: string;
  showFiltersButton?: boolean;
  autoFocus?: boolean;
  isMobile?: boolean;
}

/**
 * Composant ultra-moderne pour la barre de recherche
 * Support des thèmes clair/sombre et adaptation mobile optimisée
 */
const SearchBar = ({
  searchQuery,
  onSearchChange,
  onSearch,
  className = '',
  placeholder = 'Rechercher un service...',
  showFiltersButton = false,
  autoFocus = false,
  isMobile = false,
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchRef = useRef<ReturnType<typeof debounce>>();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Récupération de la recherche initiale depuis l'URL
  useEffect(() => {
    if (pathname?.includes('/services')) {
      const searchParam = searchParams?.get('search');
      if (searchParam) {
        onSearchChange(decodeURIComponent(searchParam));
      }
    }
  }, [pathname, searchParams, onSearchChange]);

  // Initialisation du debounce
  useEffect(() => {
    debouncedSearchRef.current = debounce((value: string) => {
      if (value.trim()) {
        const formEvent = new Event('submit') as unknown as React.FormEvent;
        onSearch(formEvent);
      }
    }, 300);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, [onSearch]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onSearchChange(value);
      
      // Si la valeur est vide, traiter immédiatement sans debounce
      if (!value.trim()) {
        const formEvent = new Event('submit') as unknown as React.FormEvent;
        onSearch(formEvent);
        if (window.location.pathname.includes('/services')) {
          window.history.replaceState({}, '', '/services');
        }
        return;
      }
      
      // Pour les autres cas, utiliser le debounce
      debouncedSearchRef.current?.(value);
    }, 
    [onSearchChange, onSearch]
  );

  // Vérifier l'URL pour conserver la recherche
  useEffect(() => {
    const searchParamsLocal = new URLSearchParams(window.location.search);
    const searchParam = searchParamsLocal?.get('search');
    if (searchParam && searchQuery !== decodeURIComponent(searchParam)) {
      onSearchChange(decodeURIComponent(searchParam));
    }
  }, [searchQuery, onSearchChange]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(e);
    }, 
    [onSearch]
  );

  const handleClear = useCallback(() => {
    // Annuler la recherche en cours
    debouncedSearchRef.current?.cancel();
    // Effacer la recherche
    onSearchChange('');
    // Déclencher immédiatement une recherche vide
    const formEvent = new Event('submit') as unknown as React.FormEvent;
    onSearch(formEvent);
    // Focus sur l'input
    inputRef.current?.focus();
    // Forcer la mise à jour de l'URL
    if (window.location.pathname.includes('/services')) {
      window.history.pushState({}, '', '/services');
    }
  }, [onSearchChange, onSearch]);

  // Focus automatique
  useEffect(() => {
    if (autoFocus) {
      const timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [autoFocus]);

  // Raccourci clavier Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Gestionnaire pour la touche Effacer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && !searchQuery) {
        // Si la recherche est vide et que l'utilisateur appuie sur Backspace
        const formEvent = new Event('submit') as unknown as React.FormEvent;
        onSearch(formEvent);
        if (window.location.pathname.includes('/services')) {
          window.history.pushState({}, '', '/services');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, onSearch]);

  return (
    <div className={`relative flex items-center bg-white/90 dark:bg-vynal-purple-dark/40 rounded-md border border-vynal-purple-200/60 dark:border-vynal-accent-primary/30 shadow-sm hover:border-vynal-purple-300/70 dark:hover:border-vynal-accent-primary/50 transition-colors duration-200 focus-within:ring-1 focus-within:ring-vynal-purple-400/70 dark:focus-within:ring-vynal-accent-primary/60 ${className}`}>
      {/* Icône de recherche */}
      <Search className="ml-2 h-3 w-3 text-vynal-purple-400 dark:text-vynal-accent-primary" />
      
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full py-1.5 px-1.5 text-xs bg-transparent text-vynal-purple-dark dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
      />
      
      {/* Bouton effacer - position adaptée sur mobile */}
      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          className={`p-0.5 rounded-full hover:bg-vynal-purple-100/50 dark:hover:bg-vynal-accent-primary/20 ${isMobile ? 'mr-16' : 'mx-1'}`}
        >
          <X className="h-3 w-3 text-vynal-purple-400 dark:text-vynal-accent-primary" />
        </button>
      )}
      
      {/* Raccourci clavier - uniquement sur desktop */}
      {!isMobile && (
        <div className="hidden md:flex items-center mr-2 px-1 py-0.5 text-[9px] text-gray-500 dark:text-gray-400 bg-vynal-purple-100/40 dark:bg-vynal-purple-secondary/20 rounded-sm border border-vynal-purple-200/60 dark:border-vynal-purple-secondary/30">
          <Command className="h-2.5 w-2.5 mr-0.5" />
          <span>K</span>
        </div>
      )}
      
      {/* Bouton filtres */}
      {showFiltersButton && (
        <Button 
          type="button"
          onClick={handleSubmit}
          className="ml-1 mr-1.5 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white px-1.5 py-0.5 text-xs rounded flex items-center h-6"
        >
          <SlidersHorizontal className="h-2.5 w-2.5 mr-1" />
          <span className="hidden sm:inline text-[10px]">Filtres</span>
        </Button>
      )}
    </div>
  );
};

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(SearchBar);