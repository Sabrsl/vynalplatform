"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export default function FAQSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Logique de recherche pourrait être ajoutée ici
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-vynal-text-secondary" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        className="block w-full pl-12 pr-4 py-3 bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/30 rounded-xl text-vynal-text-primary placeholder-vynal-text-secondary/50 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary"
        placeholder="Rechercher une question..."
      />
    </div>
  );
} 