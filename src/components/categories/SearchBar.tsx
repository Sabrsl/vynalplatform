import React, { memo, useRef } from "react";
import { Search, SlidersHorizontal, Command, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  className = "",
  placeholder = "Rechercher un service...",
  showFiltersButton = false,
  autoFocus = false,
  isMobile = false,
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Fonction simple pour gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(e);
  };

  // Fonction simple pour changer la valeur de recherche
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Fonction simple pour effacer la recherche
  const handleClear = () => {
    onSearchChange("");

    // Créer et soumettre un événement de formulaire
    if (inputRef.current) {
      inputRef.current.focus();
      const form = inputRef.current.closest("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center bg-white/90 dark:bg-vynal-purple-dark/40 rounded-md border border-vynal-purple-200/60 dark:border-vynal-accent-primary/30 shadow-sm hover:border-vynal-purple-300/70 dark:hover:border-vynal-accent-primary/50 transition-colors duration-200 focus-within:ring-1 focus-within:ring-vynal-purple-400/30 dark:focus-within:ring-vynal-accent-primary/30 ${className}`}
    >
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
          className={`p-1.5 rounded-full hover:bg-vynal-purple-100/50 dark:hover:bg-vynal-accent-primary/20 active:bg-vynal-purple-200/80 dark:active:bg-vynal-accent-primary/30 ${isMobile ? "mr-16" : "mx-1"}`}
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4 text-vynal-purple-400 dark:text-vynal-accent-primary" />
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
          type="submit"
          className="ml-1 mr-1.5 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white px-1.5 py-0.5 text-xs rounded flex items-center h-6"
        >
          <SlidersHorizontal className="h-2.5 w-2.5 mr-1" />
          <span className="hidden sm:inline text-[10px]">Filtres</span>
        </Button>
      )}
    </form>
  );
};

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(SearchBar);
