"use client";

import React, { useState, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarSimpleProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

/**
 * Version simplifiée de la barre de recherche qui accepte une fonction onSearch qui prend une chaîne
 */
export default function SearchBarSimple({
  onSearch,
  placeholder = "Rechercher un service...",
  initialValue = "",
  className = "",
}: SearchBarSimpleProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClear = () => {
    // Effacer la recherche
    setSearchQuery("");

    // Déclencher la recherche avec une chaîne vide
    onSearch("");

    // Focus sur l'input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center bg-white/90 dark:bg-vynal-purple-dark/40 rounded-md border border-slate-400/95 dark:border-vynal-accent-primary/30 shadow-sm hover:border-slate-500/95 dark:hover:border-vynal-accent-primary/50 transition-colors duration-200 focus-within:ring-1 focus-within:ring-slate-500/30 dark:focus-within:ring-vynal-accent-primary/30 ${className}`}
      role="search"
      aria-label="Rechercher des services"
    >
      {/* Icône de recherche */}
      <Search
        className="ml-2 h-3 w-3 text-vynal-purple-400 dark:text-vynal-accent-primary"
        aria-hidden="true"
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full py-1.5 px-1.5 text-xs bg-transparent text-vynal-purple-dark dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
        aria-label={placeholder}
        tabIndex={0}
      />

      {/* Bouton effacer */}
      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1.5 rounded-full hover:bg-vynal-purple-100/50 dark:hover:bg-vynal-accent-primary/20 active:bg-vynal-purple-200/80 dark:active:bg-vynal-accent-primary/30 mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-vynal-accent-primary/70 focus-visible:ring-offset-1"
          aria-label="Effacer la recherche"
        >
          <X
            className="h-4 w-4 text-vynal-purple-400 dark:text-vynal-accent-primary"
            aria-hidden="true"
          />
        </button>
      )}

      {/* Bouton de recherche (caché visuellement) */}
      <button type="submit" className="sr-only" aria-label="Rechercher">
        Rechercher
      </button>
    </form>
  );
}
