import React from 'react';
import { Circle } from 'lucide-react';
import { formatDate, formatDistanceToNow, timeAgo } from '@/lib/utils';

interface UserStatusIndicatorProps {
  isOnline: boolean;
  lastSeen?: string | Date | null;
  className?: string;
}

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  isOnline,
  lastSeen,
  className = ""
}) => {
  // Fonction pour formater la date de dernière connexion
  const formatLastSeen = () => {
    // Si utilisateur en ligne
    if (isOnline) return "En ligne";
    
    // Si pas de date de dernière connexion
    if (!lastSeen) return "Hors ligne";
    
    // Utiliser la fonction timeAgo pour afficher la dernière activité
    return `Vu ${timeAgo(lastSeen)}`;
  };
  
  // Déterminer la couleur en fonction du statut
  const getStatusColor = () => {
    if (isOnline) return "text-green-500"; // En ligne - vert
    
    if (lastSeen) {
      const now = new Date();
      const lastSeenDate = new Date(lastSeen);
      const hoursSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSeen < 6) return "text-yellow-500"; // Moins de 6h - jaune
    }
    
    return "text-gray-400"; // Hors ligne - gris
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Circle className={`h-2 w-2 fill-current ${getStatusColor()}`} />
      <span className="text-xs">{formatLastSeen()}</span>
    </div>
  );
};

export default UserStatusIndicator; 