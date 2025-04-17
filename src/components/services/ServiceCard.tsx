import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, CardContent, CardFooter, CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, PenSquare, Trash2, Loader2, Star, Image as ImageIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";

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
export const ServiceCard: React.FC<ServiceCardProps> = ({
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
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Récupération des données de notation
  const { averageRating, reviewCount } = useFreelancerRating(service.profiles?.id);
  
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

  // Navigation vers la page de détails du service
  const handleCardClick = (e: React.MouseEvent) => {
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
  };

  // Navigation vers le profil du freelance
  const goToFreelanceProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (service.profiles?.id) {
      router.push(`/freelance/${service.profiles.id}`);
    }
  };
  
  // Gestionnaires d'action
  const handleView = (e: React.MouseEvent) => { 
    e.stopPropagation();
    onView?.(service.id);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(service.id); 
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(service.id);
  };

  return (
    <Card 
      className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 bg-white shadow-sm relative flex flex-col h-full ${
        !service.active ? "opacity-85" : ""
      } ${className}`}
      onClick={handleCardClick}
    >
      {/* Section image */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden w-full flex-shrink-0">
        {hasValidImage ? (
          <img 
            src={service.images?.[0] || ''} 
            alt={service.title || "Service"} 
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-r from-gray-50 to-gray-100">
            <ImageIcon className="h-8 w-8 mb-1 text-indigo-300" />
            <span className="text-xs text-indigo-400 font-medium">Image non disponible</span>
          </div>
        )}
        
        {/* Badge de statut */}
        {showStatusBadge && (
          <div className="absolute top-0 left-0 p-2">
            <Badge 
              variant={service.active ? "default" : "secondary"} 
              className={`shadow-md text-[10px] py-0.5 px-1.5 ${
                service.active 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white font-medium" 
                  : "bg-amber-500 text-white hover:bg-amber-600 font-medium"
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
              className="h-8 w-8 border border-gray-100 transition-shadow hover:shadow-md cursor-pointer flex-shrink-0"
              onClick={goToFreelanceProfile}
            >
              <AvatarImage
                src={!avatarError ? (service.profiles?.avatar_url || '') : ''}
                alt={service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
                onError={() => setAvatarError(true)}
              />
              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-600">
                {service.profiles?.full_name?.[0] || service.profiles?.username?.[0] || 'V'}
              </AvatarFallback>
            </Avatar>
            <span 
              className="text-[11px] text-gray-600 font-medium truncate max-w-[80px] cursor-pointer hover:underline"
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
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(averageRating) 
                          ? "text-amber-500 fill-amber-500" 
                          : "text-gray-200 fill-gray-200"
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gray-500 ml-1">
                  ({reviewCount || 0})
                </span>
              </>
            ) : (
              <span className="text-[10px] text-gray-400">Nouveau</span>
            )}
          </div>
        </div>
        
        {/* Titre du service */}
        <div className="h-[44px] my-2">
          <CardTitle className="text-[16px] md:text-base font-semibold group-hover:text-indigo-600 transition-colors overflow-hidden line-clamp-2 break-words">
            {limitedTitle}
          </CardTitle>
        </div>
        
        {/* Badge de catégorie */}
        <div className="h-6 mb-2">
          {service.categories && (
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none text-[11px] md:text-xs px-1.5 py-0 truncate max-w-[90%]">
              {service.categories.name || "Catégorie"}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Affichage du prix */}
      <div className="mt-auto h-[40px] px-3 md:px-6 flex items-center justify-end border-t border-gray-100">
        <div className="text-[15px] md:text-lg font-bold text-indigo-600">
          {formattedPrice} {CURRENCY.symbol}
        </div>
      </div>
      
      {/* Boutons d'action (mode administration) */}
      {isManageable && (
        <CardFooter className="flex justify-between pt-2 pb-3 border-t border-slate-100 px-3 md:px-6 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            className="flex-grow mr-2 text-xs hover:bg-indigo-50 hover:text-indigo-600 h-8"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Voir
          </Button>
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="mr-2 hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
            >
              <PenSquare className="h-3.5 w-3.5" />
            </Button>
          )}
          
          {isDeletable && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ServiceCard;