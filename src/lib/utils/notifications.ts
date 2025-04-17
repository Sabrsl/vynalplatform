/**
 * Utilitaire pour afficher des notifications
 * Ce fichier sert d'abstraction pour les notifications système
 * et permet de changer l'implémentation sans affecter le reste du code
 */

import { useToast } from '@/components/ui/use-toast';

// Définir notre propre type de notification basé sur ce que le toast accepte
type NotificationProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

/**
 * Hook pour obtenir une fonction de toast dans les composants React
 */
export const useNotifications = () => {
  const { toast } = useToast();
  
  return {
    /**
     * Affiche une notification toast
     */
    showNotification: (props: NotificationProps) => {
      toast(props);
    },
    
    /**
     * Affiche une notification toast de succès
     */
    showSuccess: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default"
      });
    },
    
    /**
     * Affiche une notification toast d'erreur
     */
    showError: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive"
      });
    }
  };
};

// Note: cette fonction ne fonctionne que dans des composants React
// Pour une utilisation en dehors des composants, il faudrait
// implémenter un système d'événements ou utiliser un store global 