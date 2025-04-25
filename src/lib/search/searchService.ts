import { Category, Subcategory } from "@/hooks/useCategories";

interface SearchResult {
  type: 'category' | 'subcategory';
  slug: string;
  score: number;
  name: string;
  parentCategorySlug?: string;
}

/**
 * Recherche la catégorie ou sous-catégorie qui correspond le mieux aux termes de recherche
 * 
 * @param searchTerm - Le terme recherché par l'utilisateur
 * @param categories - Liste des catégories disponibles
 * @param subcategories - Liste des sous-catégories disponibles
 * @returns L'URL vers laquelle rediriger l'utilisateur
 */
export function findBestCategoryMatch(
  searchTerm: string,
  categories: Category[],
  subcategories: Subcategory[]
): string {
  if (!searchTerm?.trim()) {
    return '/services'; // Page des services par défaut
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const results: SearchResult[] = [];

  // Rechercher parmi les catégories
  categories.forEach(category => {
    const score = calculateRelevanceScore(normalizedSearchTerm, category.name.toLowerCase());
    if (score > 0) {
      results.push({
        type: 'category',
        slug: category.slug,
        score,
        name: category.name
      });
    }
  });

  // Rechercher parmi les sous-catégories
  subcategories.forEach(subcategory => {
    // Trouver la catégorie parente pour cette sous-catégorie
    const parentCategory = categories.find(cat => cat.id === subcategory.category_id);
    if (!parentCategory) return;
    
    // Calculer le score mais l'ajouter à la catégorie parente au lieu d'utiliser directement la sous-catégorie
    const score = calculateRelevanceScore(normalizedSearchTerm, subcategory.name.toLowerCase());
    
    if (score > 0) {
      // Chercher si cette catégorie parente existe déjà dans les résultats
      const existingParentCategory = results.find(
        r => r.type === 'category' && r.slug === parentCategory.slug
      );
      
      if (existingParentCategory) {
        // Ajouter un bonus au score de la catégorie parente existante
        existingParentCategory.score += score * 0.5;
      } else {
        // Créer une entrée pour la catégorie parente avec un score basé sur la sous-catégorie
        results.push({
          type: 'category',
          slug: parentCategory.slug,
          score: score * 0.7, // Score réduit car c'est une correspondance indirecte
          name: parentCategory.name
        });
      }
    }
  });

  // Trier les résultats par score (du plus élevé au plus bas)
  results.sort((a, b) => b.score - a.score);

  // Si nous avons trouvé des correspondances
  if (results.length > 0) {
    const bestMatch = results[0];

    // Rediriger vers la catégorie (toujours)
    return `/services?category=${bestMatch.slug}`;
  }

  // Si aucune correspondance trouvée, rediriger vers la page services avec le terme de recherche
  return `/services?search=${encodeURIComponent(searchTerm)}`;
}

/**
 * Calcule un score de pertinence entre un terme de recherche et un texte
 * Plus le score est élevé, plus la correspondance est bonne
 */
function calculateRelevanceScore(searchTerm: string, text: string): number {
  // Correspondance exacte
  if (text === searchTerm) {
    return 100;
  }

  // Le texte contient exactement le terme de recherche
  if (text.includes(searchTerm)) {
    return 75;
  }

  // Le terme de recherche contient des mots qui sont dans le texte
  const searchWords = searchTerm.split(/\s+/);
  const textWords = text.split(/\s+/);
  
  let score = 0;
  
  // Pour chaque mot de la recherche, voir s'il correspond à un mot du texte
  searchWords.forEach(searchWord => {
    if (searchWord.length < 3) return; // Ignorer les mots trop courts
    
    // Si un mot du texte commence par le mot de recherche
    const wordMatch = textWords.some(textWord => 
      textWord.startsWith(searchWord) || textWord.includes(searchWord)
    );
    
    if (wordMatch) {
      score += 50 / searchWords.length;
    }
  });
  
  // Vérifier les correspondances partielles
  const minLength = Math.min(searchTerm.length, text.length);
  let partialMatchScore = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (searchTerm[i] === text[i]) {
      partialMatchScore += 1;
    } else {
      break;
    }
  }
  
  // Normaliser le score de correspondance partielle
  if (partialMatchScore > 2) {
    score += (partialMatchScore / searchTerm.length) * 25;
  }
  
  return score;
} 