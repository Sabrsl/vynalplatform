import { ServiceWithFreelanceAndCategories } from '@/hooks/useServices';

/**
 * Filtre les services pour ne garder que ceux qui correspondent aux termes de recherche
 * en incluant les catégories et les descriptions
 * 
 * @param services - Liste des services à filtrer
 * @param searchTerm - Terme(s) de recherche
 * @returns Liste filtrée de services
 */
export function filterServicesBySearchTerm(
  services: ServiceWithFreelanceAndCategories[],
  searchTerm: string
): ServiceWithFreelanceAndCategories[] {
  if (!searchTerm?.trim()) {
    return services;
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 2);

  if (searchWords.length === 0) {
    return services;
  }

  console.log(`Recherche intelligente pour: "${normalizedSearchTerm}" (${searchWords.length} mots-clés)`);

  return services.filter(service => {
    // Texte à rechercher pour ce service (concaténation de plusieurs champs)
    const searchableText = [
      service.title || '',
      service.description || '',
      service.categories?.name || '',
      service.subcategories?.name || '',
      service.profiles?.full_name || service.profiles?.username || ''
    ].join(' ').toLowerCase();

    // Calcul d'un score de correspondance
    const score = calculateRelevanceScore(normalizedSearchTerm, searchWords, searchableText);
    
    // On garde le service si son score est supérieur à un seuil
    return score > 10;
  });
}

/**
 * Calcule un score de pertinence entre des termes de recherche et un texte
 * Plus le score est élevé, plus la correspondance est bonne
 */
function calculateRelevanceScore(
  fullSearchTerm: string, 
  searchWords: string[], 
  text: string
): number {
  // Correspondance exacte
  if (text.includes(fullSearchTerm)) {
    return 100;
  }

  let score = 0;
  
  // Pour chaque mot de la recherche, vérifier s'il est présent dans le texte
  for (const word of searchWords) {
    if (text.includes(word)) {
      score += 30 / searchWords.length;
      
      // Bonus si le mot est au début du texte ou d'un mot
      if (text.startsWith(word) || text.includes(' ' + word)) {
        score += 20 / searchWords.length;
      }
    }
  }
  
  // Correspondance partielle pour des mots plus longs
  if (fullSearchTerm.length > 3) {
    for (const word of searchWords) {
      if (word.length > 3) {
        // Rechercher des correspondances partielles (au moins 3 caractères)
        const matches = text.match(new RegExp(word.substring(0, Math.max(3, word.length - 1)), 'g'));
        if (matches && matches.length > 0) {
          score += (10 * matches.length) / searchWords.length;
        }
      }
    }
  }
  
  return score;
}

/**
 * Surligne les termes de recherche dans un texte
 * 
 * @param text - Texte à traiter
 * @param searchTerm - Terme de recherche
 * @param options - Options de mise en évidence
 * @returns Texte avec les termes de recherche surlignés
 */
export function highlightSearchTerms(
  text: string, 
  searchTerm: string, 
  options?: { 
    highlightClass?: string; 
    minLength?: number;
  }
): string {
  if (!text || !searchTerm?.trim()) {
    return text;
  }
  
  const { highlightClass = 'mark', minLength = 2 } = options || {};
  
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > minLength);
  
  if (searchWords.length === 0) {
    return text;
  }
  
  let result = text;
  
  // Échapper les caractères spéciaux de RegExp
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Créer une expression régulière pour chaque mot (insensible à la casse)
  for (const word of searchWords) {
    const regex = new RegExp(escapeRegExp(word), 'gi');
    result = result.replace(regex, match => `<span class="${highlightClass}">${match}</span>`);
  }
  
  return result;
} 