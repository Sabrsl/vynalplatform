"use client";

import { useState } from "react";

type Category = "all" | "account" | "payment" | "order" | "freelance" | "technical";

export default function FAQCategories() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);
    // Logique de filtrage pourrait être ajoutée ici
  };

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button 
        className={`px-6 py-2 ${activeCategory === "all" ? "bg-vynal-accent-primary text-vynal-purple-dark" : "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30"} font-medium rounded-full text-sm transition-colors`}
        onClick={() => handleCategoryChange("all")}
      >
        Toutes les questions
      </button>
      <button 
        className={`px-6 py-2 ${activeCategory === "account" ? "bg-vynal-accent-primary text-vynal-purple-dark" : "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30"} font-medium rounded-full text-sm transition-colors`}
        onClick={() => handleCategoryChange("account")}
      >
        Inscription et compte
      </button>
      <button 
        className={`px-6 py-2 ${activeCategory === "payment" ? "bg-vynal-accent-primary text-vynal-purple-dark" : "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30"} font-medium rounded-full text-sm transition-colors`}
        onClick={() => handleCategoryChange("payment")}
      >
        Paiements
      </button>
      <button 
        className={`px-6 py-2 ${activeCategory === "order" ? "bg-vynal-accent-primary text-vynal-purple-dark" : "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30"} font-medium rounded-full text-sm transition-colors`}
        onClick={() => handleCategoryChange("order")}
      >
        Commandes
      </button>
      <button 
        className={`px-6 py-2 ${activeCategory === "freelance" ? "bg-vynal-accent-primary text-vynal-purple-dark" : "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30"} font-medium rounded-full text-sm transition-colors`}
        onClick={() => handleCategoryChange("freelance")}
      >
        Freelances
      </button>
      <button 
        className={`px-6 py-2 ${activeCategory === "technical" ? "bg-vynal-accent-primary text-vynal-purple-dark" : "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30"} font-medium rounded-full text-sm transition-colors`}
        onClick={() => handleCategoryChange("technical")}
      >
        Problèmes techniques
      </button>
    </div>
  );
} 