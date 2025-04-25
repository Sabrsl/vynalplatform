import React, { useState, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Card, CardContent, CardFooter, CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Eye, PenSquare, Trash2, Star, Image as ImageIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import { Loader } from "@/components/ui/loader";
import { highlightSearchTerms } from '@/lib/search/smartSearch';

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  short_description?: string;
}

interface ServiceCardProps {
  service: ExtendedService;
  isManageable?: boolean;
  isDeletable?: boolean;
  isDeleting?: boolean;
  showStatusBadge?: boolean;
  useDemo?: boolean;
  onView?: (serviceId: string) => void;
  onEdit?: (serviceId: string) => void;
  onDelete?: (serviceId: string) => void;
  className?: string;
}

/**
 * Carte de service réutilisable pour l'affichage dans les listes, grilles et pages de recherche
 */
const ServiceCard: React.FC<ServiceCardProps> = memo(({
  service,
  isManageable = false,
  isDeletable = false,
  isDeleting = false,
  showStatusBadge = true,
  useDemo = false,
  onView,
  onEdit,
  onDelete,
  className = "",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Récupération des données de notation
  const { averageRating, reviewCount } = useFreelancerRating(service.profiles?.id);
  
  // Fonction pour vérifier si un service est nouveau (moins de 30 jours)
  const isNewService = useCallback(() => {
    if (!service.created_at) return false;
    
    const serviceDate = new Date(service.created_at);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - serviceDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30;
  }, [service.created_at]);
  
  // Vérifier la validité de l'image
  const hasValidImage = !imageError && 
                      service.images && 
                      Array.isArray(service.images) && 
                      service.images.length > 0 && 
                      !!service.images[0];

  // Formatter le prix pour l'affichage
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(service.price);
  
  // Limiter la longueur du titre
  const limitedTitle = service.title 
    ? (service.title.length > 83 ? service.title.substring(0, 83) + '...' : service.title)
    : "Service sans titre";

  // Mettre en évidence les termes de recherche dans le titre et la description si une recherche est active
  const highlightedTitle = searchQuery 
    ? <span dangerouslySetInnerHTML={{ __html: highlightSearchTerms(limitedTitle, searchQuery) }} />
    : limitedTitle;

  // Navigation vers la page de détails du service
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!service?.id) {
      console.error("Service invalide:", service);
      return;
    }
    
    // En mode gestion, utiliser le gestionnaire personnalisé
    if (isManageable && onView) {
      onView(service.id);
      return;
    }
    
    // Déterminer la destination
    const targetPath = useDemo 
      ? `/services/demo/${service.id}`
      : service.slug ? `/services/${service.slug}` : `/services/${service.id}`;
    
    console.log("Navigation vers:", targetPath);
    router.push(targetPath);
  }, [service?.id, service?.slug, isManageable, onView, useDemo, router]);

  // Navigation vers le profil du freelance
  const goToFreelanceProfile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (service.profiles?.id) {
      router.push(`/freelance/${service.profiles.id}`);
    }
  }, [service.profiles?.id, router]);
  
  // Gestionnaires d'action
  const handleView = useCallback((e: React.MouseEvent) => { 
    e.stopPropagation();
    if (onView && service.id) {
      onView(service.id);
    }
  }, [onView, service.id]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit && service.id) {
      onEdit(service.id);
    }
  }, [onEdit, service.id]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && service.id) {
      onDelete(service.id);
    }
  }, [onDelete, service.id]);

  return (
    <Card 
      className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-vynal-purple-secondary/30 bg-vynal-purple-dark/90 shadow-lg shadow-vynal-accent-secondary/20 rounded-xl relative flex flex-col h-full backdrop-blur-sm ${
        !service.active ? "opacity-85" : ""
      } ${className}`}
      onClick={handleCardClick}
    >
      {/* Section image */}
      <div className="aspect-[16/9] bg-vynal-purple-secondary/30 relative overflow-hidden w-full flex-shrink-0 rounded-t-xl">
        {hasValidImage ? (
          <img 
            src={service.images?.[0] || ''} 
            alt={service.title || "Service"} 
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest">
            <ImageIcon className="h-8 w-8 mb-1 text-vynal-text-secondary" />
            <span className="text-xs text-vynal-text-secondary font-medium">Image non disponible</span>
          </div>
        )}
        
        {/* Badge de statut */}
        {showStatusBadge && (
          <div className="absolute top-0 left-0 p-2">
            <Badge 
              variant={service.active ? "default" : "secondary"} 
              className={`shadow-md text-[10px] py-0.5 px-1.5 ${
                service.active 
                  ? "bg-vynal-status-success hover:bg-vynal-status-success/80 text-white font-medium" 
                  : "bg-vynal-status-warning text-white hover:bg-vynal-status-warning/80 font-medium"
              }`}
            >
              {service.active ? "Actif" : "Inactif"}
            </Badge>
          </div>
        )}
      </div>
      
      {/* Contenu principal */}
      <div className="pt-2 px-3 md:pt-3 md:px-6 flex flex-col flex-grow">
        {/* Ligne avec avatar et notation */}
        <div className="flex justify-between items-center h-10">
          {/* Avatar et nom du vendeur */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar 
              className="h-8 w-8 border border-vynal-purple-secondary/30 transition-shadow hover:shadow-md cursor-pointer flex-shrink-0"
              onClick={goToFreelanceProfile}
            >
              <AvatarImage
                src={!avatarError ? (service.profiles?.avatar_url || '') : ''}
                alt={service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
                onError={() => setAvatarError(true)}
              />
              <AvatarFallback className="text-xs bg-vynal-accent-primary text-vynal-purple-dark">
                {service.profiles?.full_name?.[0] || service.profiles?.username?.[0] || 'V'}
              </AvatarFallback>
            </Avatar>
            <span 
              className="text-[11px] text-vynal-text-primary font-medium truncate max-w-[80px] cursor-pointer hover:underline"
              onClick={goToFreelanceProfile}
              title={service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
            >
              {service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
            </span>
          </div>
          
          {/* Étoiles de notation */}
          <div className="flex items-center flex-shrink-0">
            {averageRating > 0 ? (
              <>
                <div className="flex space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s}
                      className={`h-3 w-3 ${
                        s <= Math.round(averageRating) 
                          ? "text-vynal-accent-primary fill-vynal-accent-primary" 
                          : "text-vynal-purple-secondary/50"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] ml-1 text-vynal-text-secondary">
                  ({reviewCount})
                </span>
              </>
            ) : isNewService() ? (
              <span className="text-[10px] text-vynal-text-secondary">
                Nouveau
              </span>
            ) : (
              <>
                <div className="flex space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s}
                      className="h-3 w-3 text-vynal-purple-secondary/50"
                    />
                  ))}
                </div>
                <span className="text-[10px] ml-1 text-vynal-text-secondary">
                  (0)
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Titre et description */}
        <div className="mb-2 mt-1.5">
          <h3 className="text-sm font-medium leading-tight text-vynal-text-primary">
            {highlightedTitle}
          </h3>
          
          {service.short_description && (
            <p className="mt-1 text-[11px] text-vynal-text-secondary line-clamp-2">
              {service.short_description}
            </p>
          )}
        </div>
      </div>
      
      {/* Pied de carte avec prix et boutons d'action */}
      <div className="mt-auto px-3 pb-3 md:px-6 md:pb-6 flex items-center justify-between">
        {/* Prix */}
        <div className="flex flex-col">
          <span className="text-xs text-vynal-text-secondary">À partir de</span>
          <span className="text-lg font-semibold text-vynal-accent-primary">
            {formattedPrice} {CURRENCY.symbol}
          </span>
        </div>
        
        {/* Boutons d'action (mode gestion) */}
        {isManageable && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleView}
              className="h-8 w-8 p-0 rounded-full bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/20 hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary text-vynal-text-secondary"
              title="Voir les détails"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="h-8 w-8 p-0 rounded-full bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/20 hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary text-vynal-text-secondary"
              title="Modifier"
            >
              <PenSquare className="h-3.5 w-3.5" />
            </Button>
            
            {isDeletable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 rounded-full bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/20 hover:bg-red-500/80 hover:text-white hover:border-red-500/30 text-vynal-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Supprimer"
              >
                {isDeleting ? (
                  <span className="flex items-center text-xs text-red-500">
                    <Loader size="xs" variant="primary" className="mr-1" />
                    Suppression...
                  </span>
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        )}
        
        {/* Bouton de détails (mode public) */}
        {!isManageable && (
          <Button
            size="sm" 
            variant="secondary"
            className="rounded-full px-3 text-xs font-medium bg-vynal-purple-secondary/40 text-vynal-text-primary hover:bg-vynal-accent-primary hover:text-vynal-purple-dark border border-vynal-purple-secondary/30 hover:border-vynal-accent-primary"
          >
            Voir les détails
          </Button>
        )}
      </div>
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;