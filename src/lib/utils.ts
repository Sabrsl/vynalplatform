import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCY } from "./constants"
import { CURRENCY as CURRENCY_CONSTANTS } from "./constants/currency"

/**
 * Combine et fusionne les classes CSS (avec Tailwind)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un prix en FCFA ou dans la devise actuelle
 * Note: Cette fonction est utilisée pour le formatage côté serveur.
 * Pour le formatage côté client avec conversion, utilisez le composant CurrencyDisplay
 */
export function formatPrice(price: number): string {
  // Pour les applications côté client, vérifier si on peut utiliser la devise du localStorage
  if (typeof window !== 'undefined') {
    try {
      // Récupérer la devise actuelle depuis le localStorage
      const currencyCode = localStorage.getItem('vynal_current_currency') || CURRENCY_CONSTANTS.primary;
      
      // Récupérer le taux de conversion si disponible
      let rate = 1; // Taux par défaut (XOF)
      let decimals = 0; // Décimales par défaut pour XOF
      
      // Si c'est une devise autre que XOF, chercher le taux dans les CURRENCY_CONSTANTS.rates
      if (currencyCode !== 'XOF' && CURRENCY_CONSTANTS.rates[currencyCode as keyof typeof CURRENCY_CONSTANTS.rates]) {
        rate = CURRENCY_CONSTANTS.rates[currencyCode as keyof typeof CURRENCY_CONSTANTS.rates];
        
        // Récupérer le nombre de décimales pour cette devise
        if (CURRENCY_CONSTANTS.info[currencyCode as keyof typeof CURRENCY_CONSTANTS.info]) {
          decimals = CURRENCY_CONSTANTS.info[currencyCode as keyof typeof CURRENCY_CONSTANTS.info].decimals;
        }
      }
      
      // Convertir le prix
      const convertedPrice = price * rate;
      
      // Si c'est XOF, formater avec le symbole après le montant
      if (currencyCode === 'XOF') {
        const symbol = CURRENCY_CONSTANTS.info?.XOF?.symbol || 'FCFA';
        const formatted = new Intl.NumberFormat(CURRENCY_CONSTANTS.locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(convertedPrice);
        return `${formatted} ${symbol}`;
      }
      
      // Pour les autres devises, utiliser le formatage standard
      return new Intl.NumberFormat(CURRENCY_CONSTANTS.locale, {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(convertedPrice);
    } catch (error) {
      console.error("Erreur lors du formatage du prix avec devise locale");
      // En cas d'erreur, utiliser le formatage par défaut
    }
  }
  
  // Formatage par défaut (XOF) pour le rendu côté serveur ou en cas d'erreur
  // Pour XOF, afficher le symbole après le montant
  const formatted = new Intl.NumberFormat(CURRENCY.locale, {
    maximumFractionDigits: CURRENCY.decimalPlaces,
    minimumFractionDigits: CURRENCY.decimalPlaces,
  }).format(price);
  return `${formatted} ${CURRENCY.symbol}`;
}

/**
 * Renvoie le symbole de la devise
 */
export function getCurrencySymbol(): string {
  return CURRENCY.symbol
}

/**
 * Génère un slug à partir d'une chaîne
 */
export function slugify(str: string): string {
  // Créer le slug de base
  const baseSlug = str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  // Ajouter un timestamp à la fin pour garantir l'unicité
  const timestamp = Date.now().toString().slice(-6)
  return `${baseSlug}-${timestamp}`
}

/**
 * Tronque une chaîne si elle dépasse la longueur maximale
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

/**
 * Récupère l'initial d'un nom pour les avatars
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Génère une couleur de fond aléatoire basée sur une chaîne
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  
  return color;
}

/**
 * Calcule la durée écoulée depuis une date
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  
  if (years > 0) return `il y a ${years} an${years > 1 ? 's' : ''}`;
  if (months > 0) return `il y a ${months} mois`;
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  return 'à l\'instant';
}

/**
 * Formate une date en format lisible (jj/mm/aaaa)
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formate la distance entre maintenant et une date passée
 */
export function formatDistanceToNow(date: Date | string): string {
  return timeAgo(date);
}

/**
 * Génère un ID unique pour une commande
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${randomStr}`;
}

/**
 * Formate la taille d'un fichier en unités lisibles (B, KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formater une heure à partir d'une date
 * @param dateString Chaîne de date ISO à formater
 * @returns L'heure formatée (ex: 14:30)
 */
export function formatTime(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) return '';
  
  // Formater l'heure (HH:MM)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
} 