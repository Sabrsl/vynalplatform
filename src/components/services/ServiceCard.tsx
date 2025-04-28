import React, { useState, useCallback, memo, useEffect } from 'react';
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
import Image from 'next/image';

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  short_description?: string;
  admin_notes?: string | null;
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
  const [localService, setLocalService] = useState(service);
  
  // Récupération des données de notation
  const { averageRating, reviewCount } = useFreelancerRating(service.profiles?.id);

  // Mettre à jour localService lorsque le service prop change
  useEffect(() => {
    setLocalService(service);
  }, [service]);
  
  // Écouter les mises à jour de statut pour ce service spécifique
  useEffect(() => {
    if (!service.id || typeof window === 'undefined') return;
    
    const handleStatusChange = (event: CustomEvent) => {
      if (!event.detail) return;
      
      const { serviceId, status, active } = event.detail;
      
      // Vérifier si l'événement concerne ce service
      if (serviceId === service.id) {
        console.log(`ServiceCard: mise à jour reçue pour ${serviceId}`, status, active);
        
        // Mettre à jour l'état local
        setLocalService(prev => ({
          ...prev,
          status,
          active: typeof active === 'string' ? active === 'true' : Boolean(active)
        }));
      }
    };
    
    // Ajouter l'écouteur d'événements
    window.addEventListener('vynal:service-status-change', handleStatusChange as EventListener);
    
    // Nettoyer
    return () => {
      window.removeEventListener('vynal:service-status-change', handleStatusChange as EventListener);
    };
  }, [service.id]);
  
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
                      localService.images && 
                      Array.isArray(localService.images) && 
                      localService.images.length > 0 && 
                      !!localService.images[0];

  // Formatter le prix pour l'affichage
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(localService.price);
  
  // Limiter la longueur du titre
  const limitedTitle = localService.title 
    ? (localService.title.length > 83 ? localService.title.substring(0, 83) + '...' : localService.title)
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
  }, [service, router]);
  
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
      className={`group overflow-hidden transition-all duration-300 hover:shadow-md border border-vynal-purple-secondary/30 bg-vynal-purple-dark/90 shadow-md shadow-vynal-accent-secondary/10 rounded-lg relative flex flex-col h-full backdrop-blur-sm ${
        !localService.active ? "opacity-85" : ""
      } ${className}`}
      onClick={handleCardClick}
    >
      {/* Section image - hauteur réduite */}
      <div className="aspect-[16/10] bg-vynal-purple-secondary/30 relative overflow-hidden w-full flex-shrink-0 rounded-t-lg">
        {hasValidImage ? (
          <div className="relative w-full h-full">
            <Image 
              src={localService.images?.[0] || ''} 
              alt={localService.title || "Service"} 
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={true}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest">
            <ImageIcon className="h-6 w-6 mb-1 text-vynal-text-secondary" />
            <span className="text-xs text-vynal-text-secondary font-medium">Image non disponible</span>
          </div>
        )}
        
        {/* Badge de statut - plus compacts */}
        {showStatusBadge && (
          <div className="absolute top-0 left-0 p-1">
            <Badge 
              variant="outline" 
              className={`shadow-sm text-[9px] py-0.5 px-1.5 ${
                localService.active 
                  ? "bg-vynal-status-success/80 text-white hover:bg-vynal-status-success font-medium border-vynal-status-success/50" 
                  : "bg-vynal-status-warning/80 text-white hover:bg-vynal-status-warning font-medium border-vynal-status-warning/50"
              }`}
            >
              {localService.active ? "Actif" : "Inactif"}
            </Badge>
            
            {localService.status === 'pending' && (
              <Badge
                variant="outline"
                className="shadow-sm text-[9px] py-0.5 px-1.5 mt-0.5 bg-amber-500/80 text-white hover:bg-amber-500 border-amber-500/50 font-medium"
              >
                En attente
              </Badge>
            )}
            
            {localService.status === 'rejected' && (
              <Badge
                variant="outline"
                className="shadow-sm text-[9px] py-0.5 px-1.5 mt-0.5 bg-red-500/80 text-white hover:bg-red-500 border-red-500/50 font-medium"
              >
                Rejeté
              </Badge>
            )}
        </div>
      )}
      
      {/* Prix - plus compact */}
      <div className="absolute bottom-0 right-0 p-1">
        <Badge 
          variant="outline" 
          className="shadow-sm text-[10px] bg-vynal-accent-primary/90 text-white hover:bg-vynal-accent-primary font-semibold border-vynal-accent-primary/30"
        >
          {formattedPrice} {CURRENCY.symbol}
        </Badge>
      </div>
      
    </div>
    
    {/* Contenu principal - marges réduites */}
    <div className="pt-1.5 px-2 flex flex-col flex-grow">
      {/* Ligne avec avatar et notation - plus compact */}
      <div className="flex justify-between items-center h-8">
        {/* Avatar et nom du vendeur */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar 
            className="h-6 w-6 border border-vynal-purple-secondary/30 transition-shadow hover:shadow-md cursor-pointer flex-shrink-0"
            onClick={goToFreelanceProfile}
          >
            <AvatarImage
              src={!avatarError ? (service.profiles?.avatar_url || '') : ''}
              alt={service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
              onError={() => setAvatarError(true)}
            />
            <AvatarFallback className="text-[9px] bg-vynal-accent-primary text-vynal-purple-dark">
              {service.profiles?.full_name?.[0] || service.profiles?.username?.[0] || 'V'}
            </AvatarFallback>
          </Avatar>
          <span 
            className="text-[10px] text-vynal-text-primary font-medium truncate max-w-[80px] cursor-pointer hover:underline"
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
                    className={`h-2.5 w-2.5 ${
                      s <= Math.round(averageRating) 
                        ? "text-vynal-accent-primary fill-vynal-accent-primary" 
                        : "text-vynal-purple-secondary/50"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] ml-1 text-vynal-text-secondary">
                ({reviewCount})
              </span>
            </>
          ) : isNewService() ? (
            <span className="text-[9px] text-vynal-text-secondary">
              Nouveau
            </span>
          ) : (
            <>
              <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s}
                    className="h-2.5 w-2.5 text-vynal-purple-secondary/50"
                  />
                ))}
              </div>
              <span className="text-[9px] ml-1 text-vynal-text-secondary">
                (0)
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Titre et description - marges réduites */}
      <div className="mb-1.5 mt-1">
        <h3 className="text-xs font-medium leading-tight text-vynal-text-primary line-clamp-2">
          {highlightedTitle}
        </h3>
        
        {service.short_description && (
          <p className="mt-0.5 text-[10px] text-vynal-text-secondary line-clamp-2">
            {service.short_description}
          </p>
        )}
      </div>
    </div>
    
    {/* Pied de carte - plus compact */}
    <div className="mt-auto px-2 pb-2 flex items-center justify-between">
      {/* Prix */}
      <div className="flex flex-col">
        <span className="text-[9px] text-vynal-text-secondary">À partir de</span>
        <span className="text-sm font-semibold text-vynal-accent-primary">
          {formattedPrice} {CURRENCY.symbol}
        </span>
      </div>
      
      {/* Boutons d'action (mode gestion) */}
      {isManageable && (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleView}
            className="h-6 w-6 p-0 rounded-full bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/20 hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary text-vynal-text-secondary"
            title="Voir les détails"
          >
            <Eye className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 rounded-full bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/20 hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary text-vynal-text-secondary"
            title="Modifier"
          >
            <PenSquare className="h-3 w-3" />
          </Button>
          
          {isDeletable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-6 w-6 p-0 rounded-full bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/20 hover:bg-red-500/80 hover:text-white hover:border-red-500/30 text-vynal-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              title="Supprimer"
            >
              {isDeleting ? (
                <span className="flex items-center text-[9px] text-red-500">
                  <Loader size="xs" variant="primary" className="mr-0.5" />
                </span>
              ) : (
                <Trash2 className="h-3 w-3" />
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
          className="rounded-full px-2 py-0.5 h-auto text-[10px] font-medium bg-vynal-purple-secondary/40 text-vynal-text-primary hover:bg-vynal-accent-primary hover:text-vynal-purple-dark border border-vynal-purple-secondary/30 hover:border-vynal-accent-primary"
        >
          Voir détails
        </Button>
      )}
    </div>
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;