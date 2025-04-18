import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCY } from "./constants"

/**
 * Combine et fusionne les classes CSS (avec Tailwind)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un prix en FCFA
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    maximumFractionDigits: CURRENCY.decimalPlaces,
  }).format(price)
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