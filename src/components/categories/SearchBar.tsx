import React from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  className?: string;
  placeholder?: string;
  showFiltersButton?: boolean;
}

/**
 * Composant réutilisable pour la barre de recherche
 * 
 * @param searchQuery - Termes de recherche actuels
 * @param onSearchChange - Fonction appelée lorsque les termes de recherche changent
 * @param onSearch - Fonction appelée lorsque le formulaire est soumis
 * @param className - Classes CSS additionnelles
 * @param placeholder - Texte d'exemple dans le champ de recherche
 * @param showFiltersButton - Indique si le bouton Filtres doit être affiché
 */
const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  className = '',
  placeholder = 'Rechercher un service...',
  showFiltersButton = true,
}) => {
  return (
    <motion.form 
      onSubmit={onSearch} 
      className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-2 flex items-center ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <div className="flex items-center flex-1 px-2.5 py-1.5">
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 outline-none border-none bg-transparent ml-2.5 text-sm text-gray-700 placeholder-gray-400"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {showFiltersButton && (
        <Button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs rounded-lg transition-colors duration-200 flex items-center gap-1.5 shadow-sm"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtres</span>
        </Button>
      )}
    </motion.form>
  );
};

export default SearchBar; 