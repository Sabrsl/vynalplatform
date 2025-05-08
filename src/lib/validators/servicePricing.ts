/**
 * Validators pour le prix et la durée de livraison des services
 */

// Limites pour le prix
export const PRICE_LIMITS = {
  min: 2000,
  max: 800000,
  currency: 'FCFA'
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
 * Valider le prix du service
 */
export function validatePrice(price: string | number): ValidationResult {
  // Convertir en nombre si c'est une chaîne
  const numericPrice = typeof price === 'string' 
    ? Number(price.replace(",", "."))
    : price;

  // Vérifier si c'est un nombre valide
  if (isNaN(numericPrice)) {
    return {
      isValid: false,
      error: "Le prix doit être un nombre valide"
    };
  }

  // Vérifier les limites
  if (numericPrice < PRICE_LIMITS.min) {
    return {
      isValid: false,
      error: `Le prix minimum est de ${PRICE_LIMITS.min} ${PRICE_LIMITS.currency}`
    };
  }

  if (numericPrice > PRICE_LIMITS.max) {
    return {
      isValid: false,
      error: `Le prix maximum est de ${PRICE_LIMITS.max} ${PRICE_LIMITS.currency}`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Valider la durée de livraison
 */
export function validateDeliveryTime(deliveryTime: string | number): ValidationResult {
  // Convertir en nombre si c'est une chaîne
  const numericTime = typeof deliveryTime === 'string' 
    ? Number(deliveryTime)
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
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' ' + PRICE_LIMITS.currency;
}

/**
 * Formater la durée de livraison pour l'affichage
 */
export function formatDeliveryTime(time: number): string {
  return `${time} ${DELIVERY_TIME_LIMITS.unit}`;
} 