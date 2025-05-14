/**
 * Validators pour le prix et la durée de livraison des services
 */

// Limites pour le prix
export const PRICE_LIMITS = {
  min: 1000, // Valeur minimale en FCFA
  max: 1000000, // Valeur maximale en FCFA
  currency: 'XOF' // Valeur par défaut, sera remplacée par la devise détectée
};

// Limites adaptées pour différentes devises
export const CURRENCY_PRICE_LIMITS: Record<string, { min: number, max: number }> = {
  'XOF': { min: 1000, max: 1000000 }, // FCFA
  'EUR': { min: 5, max: 2000 }, // Euro
  'USD': { min: 5, max: 2000 }, // Dollar américain
  'MAD': { min: 50, max: 20000 }, // Dirham marocain
  'GBP': { min: 5, max: 1500 }, // Livre sterling
  'CAD': { min: 7, max: 2500 }, // Dollar canadien
};

// Limites pour la durée de livraison
export const DELIVERY_TIME_LIMITS = {
  min: 1,
  max: 60,
  unit: 'jours'
};

// Types pour la validation
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Récupère les limites de prix adaptées à la devise
 * @param currencyCode Code de la devise (ex: XOF, EUR, USD)
 * @returns Limites de prix pour cette devise
 */
export function getPriceLimitsForCurrency(currencyCode: string): { min: number, max: number } {
  // Si la devise est dans nos limites prédéfinies, l'utiliser
  if (CURRENCY_PRICE_LIMITS[currencyCode]) {
    return CURRENCY_PRICE_LIMITS[currencyCode];
  }
  
  // Sinon, utiliser les limites XOF par défaut
  return CURRENCY_PRICE_LIMITS.XOF;
}

/**
 * Valider le prix du service
 * @param price Le prix à valider
 * @param currencyCode Code de la devise détectée par géolocalisation
 * @returns Résultat de validation avec message d'erreur si nécessaire
 */
export function validatePrice(price: string | number, currencyCode?: string): ValidationResult {
  // Utiliser la devise fournie ou la devise par défaut
  const displayCurrency = currencyCode || PRICE_LIMITS.currency;
  
  // Récupérer les limites pour cette devise
  const limits = getPriceLimitsForCurrency(displayCurrency);
  
  // Convertir en nombre si c'est une chaîne
  const numericPrice = typeof price === 'string' 
    ? Number(price.replace(",", ".").replace(/\s/g, ""))
    : price;

  // Vérifier si c'est un nombre valide
  if (isNaN(numericPrice)) {
    return {
      isValid: false,
      error: `Le prix doit être un nombre valide en ${displayCurrency}`
    };
  }

  // Vérifier les limites
  if (numericPrice < limits.min) {
    return {
      isValid: false,
      error: `Le prix minimum est de ${limits.min} ${displayCurrency}`
    };
  }

  if (numericPrice > limits.max) {
    return {
      isValid: false,
      error: `Le prix maximum est de ${limits.max} ${displayCurrency}`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Valider la durée de livraison
 * @param deliveryTime La durée à valider
 * @returns Résultat de validation avec message d'erreur si nécessaire
 */
export function validateDeliveryTime(deliveryTime: string | number): ValidationResult {
  // Convertir en nombre si c'est une chaîne
  const numericTime = typeof deliveryTime === 'string' 
    ? Number(deliveryTime.replace(/\s/g, ""))
    : deliveryTime;

  // Vérifier si c'est un nombre valide
  if (isNaN(numericTime)) {
    return {
      isValid: false,
      error: "La durée de livraison doit être un nombre valide"
    };
  }

  // Vérifier si c'est un nombre entier
  if (!Number.isInteger(numericTime)) {
    return {
      isValid: false,
      error: "La durée de livraison doit être un nombre entier"
    };
  }

  // Vérifier les limites
  if (numericTime < DELIVERY_TIME_LIMITS.min) {
    return {
      isValid: false,
      error: `La durée de livraison minimum est de ${DELIVERY_TIME_LIMITS.min} ${DELIVERY_TIME_LIMITS.unit}`
    };
  }

  if (numericTime > DELIVERY_TIME_LIMITS.max) {
    return {
      isValid: false,
      error: `La durée de livraison maximum est de ${DELIVERY_TIME_LIMITS.max} ${DELIVERY_TIME_LIMITS.unit}`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Formater le prix pour l'affichage
 * @param price Le prix à formater
 * @param currencyCode Code de la devise à utiliser
 * @returns Prix formaté avec symbole de devise
 */
export function formatPrice(price: number, currencyCode?: string): string {
  const displayCurrency = currencyCode || PRICE_LIMITS.currency;
  return new Intl.NumberFormat('fr-FR').format(price) + ' ' + displayCurrency;
}

/**
 * Formater la durée de livraison pour l'affichage
 * @param time Durée à formater
 * @returns Durée formatée avec unité
 */
export function formatDeliveryTime(time: number): string {
  return `${time} ${DELIVERY_TIME_LIMITS.unit}`;
} 