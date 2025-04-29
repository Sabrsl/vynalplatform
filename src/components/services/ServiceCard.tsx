import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, PenSquare, Trash2, Star, ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import { Loader } from "@/components/ui/loader";
import { highlightSearchTerms } from '@/lib/search/smartSearch';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes"; // Assurez-vous d'avoir installé next-themes

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
 * Carte de service optimisée pour l'affichage dans les listes, grilles et recherche
 * - Optimisé pour les mobiles avec un design responsive
 * - Support complet des thèmes clair/sombre
 * - Réduction des re-rendus avec memoization
 * - Performance améliorée avec chargement d'images optimisé
 */
const ServiceCard = memo<ServiceCardProps>(({
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
  const { theme } = useTheme();
  
  // État local regroupé pour réduire le nombre de mises à jour
  const [state, setState] = useState(() => ({
    imageError: false,
    avatarError: false,
    service: service,
    imagePriority: true, // Charge prioritairement l'image si elle est visible
  }));
  
  // Récupération des données de notation
  const { averageRating, reviewCount } = useFreelancerRating(service.profiles?.id);

  // Mise à jour de l'état du service quand les props changent
  useEffect(() => {
    setState(prev => ({ ...prev, service }));
  }, [service]);
  
  // Effet pour gérer les événements de statut avec debounce pour éviter les mises à jour trop fréquentes
  useEffect(() => {
    if (!service.id || typeof window === 'undefined') return;
    
    let timeoutId: NodeJS.Timeout;
    
    const handleStatusChange = (event: CustomEvent) => {
      if (!event.detail) return;
      
      const { serviceId, status, active } = event.detail;
      
      if (serviceId === service.id) {
        // Debounce pour éviter les mises à jour trop fréquentes
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setState(prev => ({
            ...prev,
            service: {
              ...prev.service,
              status,
              active: typeof active === 'string' ? active === 'true' : Boolean(active)
            }
          }));
        }, 50);
      }
    };
    
    window.addEventListener('vynal:service-status-change', handleStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('vynal:service-status-change', handleStatusChange as EventListener);
      clearTimeout(timeoutId);
    };
  }, [service.id]);
  
  // Observer pour charger l'image en priorité si elle est visible
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    
    const cardElement = document.getElementById(`service-card-${service.id}`);
    if (!cardElement) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, imagePriority: true }));
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(cardElement);
    
    return () => observer.disconnect();
  }, [service.id]);
  
  // Fonction memoïsée pour vérifier si un service est nouveau
  const isNewService = useCallback(() => {
    if (!service.created_at) return false;
    
    try {
      const serviceDate = new Date(service.created_at);
      const currentDate = new Date();
      const diffTime = currentDate.getTime() - serviceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 30;
    } catch {
      return false;
    }
  }, [service.created_at]);
  
  // Gestionnaires d'erreur d'image optimisés
  const handleImageError = useCallback(() => {
    setState(prev => ({ ...prev, imageError: true }));
  }, []);
  
  const handleAvatarError = useCallback(() => {
    setState(prev => ({ ...prev, avatarError: true }));
  }, []);

  // Vérification optimisée de la validité de l'image avec fallback
  const hasValidImage = !state.imageError && 
                      state.service.images && 
                      Array.isArray(state.service.images) && 
                      state.service.images.length > 0 && 
                      Boolean(state.service.images[0]);

  // Formattage du prix avec mémoïsation
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(state.service.price);
  }, [state.service.price]);
  
  // Limitation optimisée de la longueur du titre
  const limitedTitle = useMemo(() => {
    const title = state.service.title;
    if (!title) return "Service sans titre";
    
    // Adapter la longueur du titre en fonction de la taille de l'écran
    const maxLength = window.innerWidth < 640 ? 60 : 83;
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  }, [state.service.title]);

  // Mise en évidence des termes de recherche
  const highlightedTitle = useMemo(() => {
    if (!searchQuery) return limitedTitle;
    return (
      <span dangerouslySetInnerHTML={{ __html: highlightSearchTerms(limitedTitle, searchQuery) }} />
    );
  }, [limitedTitle, searchQuery]);

  // Navigation vers la page de détails du service
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!service.id) return;
    
    if (isManageable && onView) {
      onView(service.id);
      return;
    }
    
    const targetPath = useDemo 
      ? `/services/demo/${service.id}`
      : service.slug ? `/services/${service.slug}` : `/services/${service.id}`;
    
    router.push(targetPath);
  }, [service.id, service.slug, isManageable, onView, useDemo, router]);

  // Navigation vers le profil du freelance
  const goToFreelanceProfile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (service.profiles?.id) {
      router.push(`/freelance/${service.profiles.id}`);
    }
  }, [service.profiles, router]);
  
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

  // Déterminer les classes CSS en fonction du thème et de l'état actif
  const cardClasses = useMemo(() => {
    return cn(
      "group overflow-hidden transition-all duration-300 hover:shadow-md",
      "border border-vynal-purple-secondary/30 shadow-md shadow-vynal-accent-secondary/10 rounded-lg relative flex flex-col h-full",
      // Support des thèmes clair/sombre
      theme === 'dark' 
        ? "bg-vynal-purple-dark/90 backdrop-blur-sm" 
        : "bg-white/95 backdrop-blur-sm",
      // État actif/inactif
      !state.service.active ? "opacity-85" : "",
      // Classes additionnelles
      className
    );
  }, [theme, state.service.active, className]);

  // Préparation des badges de statut
  const statusBadge = useMemo(() => {
    if (!showStatusBadge) return null;
    
    return (
      <div className="absolute top-0 left-0 p-1 z-10">
        <Badge 
          variant="outline" 
          className={cn(
            "shadow-sm text-[9px] py-0.5 px-1.5",
            state.service.active 
              ? "bg-vynal-status-success/80 text-white hover:bg-vynal-status-success font-medium border-vynal-status-success/50" 
              : "bg-vynal-status-warning/80 text-white hover:bg-vynal-status-warning font-medium border-vynal-status-warning/50"
          )}
        >
          {state.service.active ? "Actif" : "Inactif"}
        </Badge>
        
        {state.service.status === 'pending' && (
          <Badge
            variant="outline"
            className="shadow-sm text-[9px] py-0.5 px-1.5 mt-0.5 bg-amber-500/80 text-white hover:bg-amber-500 border-amber-500/50 font-medium"
          >
            En attente
          </Badge>
        )}
        
        {state.service.status === 'rejected' && (
          <Badge
            variant="outline"
            className="shadow-sm text-[9px] py-0.5 px-1.5 mt-0.5 bg-red-500/80 text-white hover:bg-red-500 border-red-500/50 font-medium"
          >
            Rejeté
          </Badge>
        )}
      </div>
    );
  }, [showStatusBadge, state.service.active, state.service.status]);

  // Badge de prix
  const priceBadge = useMemo(() => (
    <div className="absolute bottom-0 right-0 p-1">
      <Badge 
        variant="outline" 
        className="shadow-sm text-[10px] bg-vynal-accent-primary/90 text-white hover:bg-vynal-accent-primary font-semibold border-vynal-accent-primary/30"
      >
        {formattedPrice} {CURRENCY.symbol}
      </Badge>
    </div>
  ), [formattedPrice]);

  // Composant de notation optimisé
  const ratingComponent = useMemo(() => {
    if (averageRating > 0) {
      return (
        <>
          <div className="flex space-x-0.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star 
                key={idx}
                className={cn(
                  "h-2.5 w-2.5",
                  idx < Math.round(averageRating) 
                    ? "text-vynal-accent-primary fill-vynal-accent-primary" 
                    : "text-vynal-purple-secondary/50"
                )}
              />
            ))}
          </div>
          <span className="text-[9px] ml-1 text-vynal-text-secondary">
            ({reviewCount})
          </span>
        </>
      );
    }
    
    if (isNewService()) {
      return (
        <span className="text-[9px] text-vynal-text-secondary">
          Nouveau
        </span>
      );
    }
    
    return (
      <>
        <div className="flex space-x-0.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star 
              key={idx}
              className="h-2.5 w-2.5 text-vynal-purple-secondary/50"
            />
          ))}
        </div>
        <span className="text-[9px] ml-1 text-vynal-text-secondary">
          (0)
        </span>
      </>
    );
  }, [averageRating, reviewCount, isNewService]);

  // Composant des boutons d'action
  const actionButtons = useMemo(() => {
    if (!isManageable) {
      return (
        <Button
          size="sm" 
          variant="secondary"
          className="rounded-full px-2 py-0.5 h-auto text-[10px] font-medium bg-vynal-purple-secondary/40 text-vynal-text-primary hover:bg-vynal-accent-primary hover:text-vynal-purple-dark border border-vynal-purple-secondary/30 hover:border-vynal-accent-primary"
        >
          Voir détails
        </Button>
      );
    }
    
    return (
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
    );
  }, [isManageable, isDeletable, isDeleting, handleView, handleEdit, handleDelete]);

  // Section d'image optimisée
  const imageSection = useMemo(() => (
    <div className="aspect-[16/10] bg-vynal-purple-secondary/30 dark:bg-vynal-purple-darkest/50 relative overflow-hidden w-full flex-shrink-0 rounded-t-lg">
      {hasValidImage ? (
        <div className="relative w-full h-full">
          <Image 
            src={state.service.images?.[0] || ''} 
            alt={state.service.title || "Service"} 
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={handleImageError}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={state.imagePriority}
            quality={70} // Qualité optimisée pour le web
            loading={state.imagePriority ? "eager" : "lazy"}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest dark:from-vynal-purple-darkest dark:to-black">
          <ImageIcon className="h-6 w-6 mb-1 text-vynal-text-secondary" />
          <span className="text-xs text-vynal-text-secondary font-medium">Image non disponible</span>
        </div>
      )}
      
      {statusBadge}
      {priceBadge}
    </div>
  ), [hasValidImage, state.service.images, state.service.title, state.imagePriority, handleImageError, statusBadge, priceBadge]);

  // Rendre le composant
  return (
    <Card 
      id={`service-card-${service.id}`}
      className={cardClasses}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={`Voir les détails de ${state.service.title || "Service"}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      {imageSection}
      
      <div className="pt-1.5 px-2 flex flex-col flex-grow">
        {/* Ligne avec avatar et notation - optimisée pour mobile */}
        <div className="flex justify-between items-center h-8">
          {/* Avatar et nom du vendeur */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar 
              className="h-6 w-6 border border-vynal-purple-secondary/30 transition-shadow hover:shadow-md cursor-pointer flex-shrink-0"
              onClick={goToFreelanceProfile}
              tabIndex={-1}
            >
              <AvatarImage
                src={!state.avatarError ? (service.profiles?.avatar_url || '') : ''}
                alt={service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
                onError={handleAvatarError}
              />
              <AvatarFallback className="text-[9px] bg-vynal-accent-primary text-vynal-purple-dark">
                {service.profiles?.full_name?.[0] || service.profiles?.username?.[0] || 'V'}
              </AvatarFallback>
            </Avatar>
            <button 
              className="text-[10px] text-vynal-text-primary font-medium truncate max-w-[80px] cursor-pointer hover:underline focus:outline-none focus:underline"
              onClick={goToFreelanceProfile}
              title={service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
              tabIndex={-1}
            >
              {service.profiles?.full_name || service.profiles?.username || 'Vendeur'}
            </button>
          </div>
          
          {/* Étoiles de notation */}
          <div className="flex items-center flex-shrink-0">
            {ratingComponent}
          </div>
        </div>
        
        {/* Titre et description - optimisés pour mobile */}
        <div className="mb-1.5 mt-1">
          <h3 className="text-xs font-medium leading-tight text-vynal-text-primary dark:text-white line-clamp-2">
            {highlightedTitle}
          </h3>
          
          {state.service.short_description && (
            <p className="mt-0.5 text-[10px] text-vynal-text-secondary dark:text-vynal-text-secondary/80 line-clamp-2">
              {state.service.short_description}
            </p>
          )}
        </div>
      </div>
      
      {/* Pied de carte - optimisé pour mobile */}
      <div className="mt-auto px-2 pb-2 flex items-center justify-between">
        {/* Prix */}
        <div className="flex flex-col">
          <span className="text-[9px] text-vynal-text-secondary dark:text-vynal-text-secondary/80">À partir de</span>
          <span className="text-sm font-semibold text-vynal-accent-primary">
            {formattedPrice} {CURRENCY.symbol}
          </span>
        </div>
        
        {/* Boutons d'action */}
        {actionButtons}
      </div>
    </Card>
  );
});

// Optimisation pour le profiling React
ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;