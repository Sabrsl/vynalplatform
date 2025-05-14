import { CURRENCY } from '@/lib/constants';

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Fonction de formatage de devise de base - n'utilise pas la conversion
 * Utilisée par les composants serveur et les appels qui ne peuvent pas utiliser le hook useCurrency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format a number with thousands separator
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
} 