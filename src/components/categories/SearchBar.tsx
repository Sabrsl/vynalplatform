import React, { memo, useCallback, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  className?: string;
  placeholder?: string;
  showFiltersButton?: boolean;
  autoFocus?: boolean;
}

/**
 * Composant ultra-moderne pour la barre de recherche
 * Support des thèmes clair/sombre et adaptation mobile optimisée
 */
const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  className = '',
  placeholder = 'Rechercher un service...',
  showFiltersButton = false,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(e);
  }, [onSearch]);

  // Focus automatique sur l'input au montage si demandé
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [autoFocus]);

  // Raccourci clavier pour focus sur la recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className={`bg-white/80 dark:bg-gray-800/70 backdrop-blur-md 
        rounded-2xl shadow-lg border border-gray-100/50 dark:border-gray-700/30 
        p-1.5 flex items-center gap-1.5
        transform-gpu transition-all duration-300
        hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-600/50
        ${className}`}
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      role="search"
      aria-label="Recherche de services"
      data-testid="search-bar"
    >
      <div className="flex items-center flex-1 px-2.5 py-2 
        bg-white/60 dark:bg-gray-900/30 rounded-xl
        border border-gray-100/50 dark:border-gray-800/50">
        <Search className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" strokeWidth={2.5} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="flex-1 outline-none border-none bg-transparent ml-2.5 
            text-[11px] xs:text-xs sm:text-sm text-gray-700 dark:text-gray-300 
            placeholder-gray-400 dark:placeholder-gray-600"
          value={searchQuery}
          onChange={handleChange}
          aria-label={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
        <div className="hidden md:flex items-center justify-center
          px-1.5 py-0.5 text-[10px] text-gray-400 dark:text-gray-600 
          bg-gray-100 dark:bg-gray-800 rounded-md ml-1
          border border-gray-200/50 dark:border-gray-700/50">
          <Command className="h-3 w-3 mr-0.5" aria-hidden="true" />
          <span>K</span>
        </div>
      </div>
      
      {showFiltersButton && (
        <Button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 
            text-white px-3 py-1.5 text-[10px] xs:text-xs rounded-lg transition-all duration-200 
            flex items-center gap-1.5 shadow-sm
            hover:shadow-md hover:scale-105"
          aria-label="Ouvrir les filtres"
        >
          <SlidersHorizontal className="h-3 w-3 xs:h-3.5 xs:w-3.5" aria-hidden="true" strokeWidth={2.5} />
          <span className="hidden sm:inline">Filtres</span>
        </Button>
      )}
    </motion.form>
  );
};

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(SearchBar);