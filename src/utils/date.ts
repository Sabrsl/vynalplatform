/**
 * Formate une date ISO en format lisible
 * @param dateString Date ISO à formater
 * @returns Date formatée
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  
  // Vérifiez si la date est valide
  if (isNaN(date.getTime())) return 'Date invalide';
  
  // Options pour le formatage
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

/**
 * Formate une date en indiquant le temps écoulé
 * @param dateString Date ISO à formater
 * @returns Temps écoulé (ex: "il y a 2 jours")
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  
  // Vérifiez si la date est valide
  if (isNaN(date.getTime())) return 'Date invalide';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
} 