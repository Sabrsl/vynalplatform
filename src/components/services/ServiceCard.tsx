import React, { useState, useCallback, memo, useEffect, useMemo, useRef, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, PenSquare, Trash2, Star, ImageIcon, Shield, Medal, Sparkles, ChevronRight } from "lucide-react";
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
import { CertificationBadge } from '@/components/ui/certification-badge';
import { PriceDisplay } from './PriceDisplay';
import Link from 'next/link';

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  short_description?: string;
  admin_notes?: string | null;
  slug?: string;
}

interface ServiceCardProps {
  service: ExtendedService;
  isManageable?: boolean;
  isDeletable?: boolean;
  isDeleting?: boolean;
  showStatusBadge?: boolean;
  useDemo?: boolean;
  isPriority?: boolean;
  onClick?: (serviceId: string) => void;
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

// Memoize subcomponents to reduce re-renders
const ServiceImage = memo(({ 
  image, 
  title, 
  onError, 
  isPriority,
  children 
}: { 
  image: string | undefined; 
  title: string; 
  onError: () => void; 
  isPriority: boolean;
  children: React.ReactNode;
}) => (
  <div className="aspect-[16/9] bg-gray-100 dark:bg-vynal-purple-darkest/50 relative overflow-hidden w-full flex-shrink-0 rounded-t-lg">
    {image ? (
      <div className="relative w-full h-full">
        <Image 
          src={image} 
          alt={title || "Service"} 
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          onError={onError}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={isPriority}
          quality={60}
          loading={isPriority ? "eager" : "lazy"}
        />
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-200 to-gray-100 dark:from-vynal-purple-darkest dark:to-black">
        <ImageIcon className="h-6 w-6 mb-1 text-vynal-body" />
        <span className="text-xs text-vynal-body font-medium">Image non disponible</span>
      </div>
    )}
    {children}
  </div>
));

ServiceImage.displayName = 'ServiceImage';

const StatusBadges = memo(({ active, status }: { active?: boolean; status?: string }) => {
  const isActive = Boolean(active);
  const statusValue = status || '';
  
  if (!isActive && statusValue !== 'pending' && statusValue !== 'rejected') {
    return (
      <div className="absolute top-0 left-0 p-1 z-10">
        <Badge 
          variant="outline" 
          className="shadow-sm text-[9px] py-0.5 px-1.5 bg-vynal-status-warning/80 text-white hover:bg-vynal-status-warning font-medium border-vynal-status-warning/50"
        >
          Inactif
        </Badge>
      </div>
    );
  }
  
  return (
    <div className="absolute top-0 left-0 p-1 z-10">
      {isActive && (
        <Badge 
          variant="outline" 
          className="shadow-sm text-[9px] py-0.5 px-1.5 bg-vynal-status-success/80 text-white hover:bg-vynal-status-success font-medium border-vynal-status-success/50"
        >
          Actif
        </Badge>
      )}
      
      {statusValue === 'pending' && (
        <Badge
          variant="outline"
          className="shadow-sm text-[9px] py-0.5 px-1.5 mt-0.5 bg-amber-500/80 text-white hover:bg-amber-500 border-amber-500/50 font-medium"
        >
          En attente
        </Badge>
      )}
      
      {statusValue === 'rejected' && (
        <Badge
          variant="outline"
          className="shadow-sm text-[9px] py-0.5 px-1.5 mt-0.5 bg-red-500/80 text-white hover:bg-red-500 border-red-500/50 font-medium"
        >
          Rejeté
        </Badge>
      )}
    </div>
  );
});

StatusBadges.displayName = 'StatusBadges';

const PriceBadge = memo(({ price }: { price?: number }) => {
  return <PriceDisplay price={price || 0} variant="badge" showFixedIndicator={false} />;
});

PriceBadge.displayName = 'PriceBadge';

const FreelanceAvatar = memo(({ 
  profile, 
  onError, 
  onClick 
}: { 
  profile: any; 
  onError: () => void; 
  onClick: (e: React.MouseEvent) => void;
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (profile?.id) {
      router.push(`/profile/id/${profile.id}`);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar 
        className="h-6 w-6 border border-gray-200 dark:border-vynal-purple-secondary/30 transition-shadow hover:shadow-md cursor-pointer flex-shrink-0"
        onClick={handleClick}
        tabIndex={-1}
      >
        <AvatarImage
          src={profile?.avatar_url || ''}
          alt={profile?.full_name || profile?.username || 'Vendeur'}
          onError={onError}
        />
        <AvatarFallback className="text-[9px] bg-vynal-accent-primary text-vynal-purple-dark">
          {profile?.full_name?.[0] || profile?.username?.[0] || 'V'}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 min-w-0">
        <button 
          className="text-[10px] text-vynal-purple-dark dark:text-vynal-title truncate max-w-[80px] cursor-pointer hover:underline focus:outline-none focus:underline font-medium"
          onClick={handleClick}
          title={profile?.full_name || profile?.username || 'Vendeur'}
          tabIndex={-1}
        >
          {profile?.full_name || profile?.username || 'Vendeur'}
        </button>
        
        {/* Badge de certification - uniquement si l'utilisateur est certifié */}
        {profile?.is_certified && profile?.certification_type && (
          <CertificationBadge 
            type={profile.certification_type as 'standard' | 'premium' | 'expert'} 
            size="xs"
          />
        )}
      </div>
    </div>
  );
});

FreelanceAvatar.displayName = 'FreelanceAvatar';

const Rating = memo(({ 
  averageRating, 
  reviewCount, 
  isNew 
}: { 
  averageRating: number; 
  reviewCount: number; 
  isNew: boolean 
}) => {
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
                  : "text-gray-300 dark:text-vynal-purple-secondary/50"
              )}
            />
          ))}
        </div>
        <span className="text-[9px] ml-1 text-vynal-purple-dark/90 dark:text-vynal-body">
          ({reviewCount})
        </span>
      </>
    );
  }
  
  if (isNew) {
    return (
      <span className="text-[9px] text-black dark:text-vynal-body">
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
            className="h-2.5 w-2.5 text-gray-300 dark:text-vynal-purple-secondary/50"
          />
        ))}
      </div>
      <span className="text-[9px] ml-1 text-vynal-purple-dark/90 dark:text-vynal-body">
        (0)
      </span>
    </>
  );
});

Rating.displayName = 'Rating';

const ActionButtons = memo(({ 
  isManageable, 
  isDeletable, 
  isDeleting, 
  onView, 
  onEdit, 
  onDelete 
}: { 
  isManageable: boolean; 
  isDeletable: boolean; 
  isDeleting: boolean; 
  onView: (e: React.MouseEvent) => void; 
  onEdit: (e: React.MouseEvent) => void; 
  onDelete: (e: React.MouseEvent) => void;
}) => {
  if (!isManageable) {
    return null;
  }
  
  return (
    <div className="flex gap-1">
      {isDeletable && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-6 w-6 p-0 rounded-full bg-slate-100 dark:bg-vynal-purple-secondary/10 border border-slate-200 dark:border-vynal-purple-secondary/20 hover:bg-red-500/80 hover:text-white hover:border-red-500/30 text-slate-800 dark:text-vynal-body disabled:opacity-50 disabled:cursor-not-allowed"
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

      <Button
        size="sm"
        variant="ghost"
        onClick={onView}
        className="h-6 w-6 p-0 rounded-full bg-slate-100 dark:bg-vynal-purple-secondary/10 border border-slate-200 dark:border-vynal-purple-secondary/20 hover:bg-slate-200 dark:hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary text-slate-800 dark:text-vynal-body"
        title="Voir les détails"
      >
        <Eye className="h-3 w-3" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        className="h-6 w-6 p-0 rounded-full bg-slate-100 dark:bg-vynal-purple-secondary/10 border border-slate-200 dark:border-vynal-purple-secondary/20 hover:bg-slate-200 dark:hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary text-slate-800 dark:text-vynal-body"
        title="Modifier"
      >
        <PenSquare className="h-3 w-3" />
      </Button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

// Optimized comparison function for memoization
function arePropsEqual(prevProps: ServiceCardProps, nextProps: ServiceCardProps) {
  // Check simple props first
  if (prevProps.isManageable !== nextProps.isManageable ||
      prevProps.isDeletable !== nextProps.isDeletable ||
      prevProps.isDeleting !== nextProps.isDeleting ||
      prevProps.showStatusBadge !== nextProps.showStatusBadge ||
      prevProps.useDemo !== nextProps.useDemo ||
      prevProps.isPriority !== nextProps.isPriority ||
      prevProps.className !== nextProps.className) {
    return false;
  }
  
  // Check service fields that would affect rendering
  const prevService = prevProps.service;
  const nextService = nextProps.service;
  
  // ID changes always cause re-render
  if (prevService.id !== nextService.id) return false;
  
  // Check critical fields that affect display
  return (
    prevService.title === nextService.title &&
    prevService.price === nextService.price &&
    prevService.status === nextService.status &&
    prevService.active === nextService.active &&
    prevService.short_description === nextService.short_description &&
    // Deep comparison only when necessary and only check references for complex objects
    areImagesEqual(prevService.images, nextService.images) &&
    prevService.profiles?.id === nextService.profiles?.id &&
    prevService.profiles?.avatar_url === nextService.profiles?.avatar_url &&
    prevService.profiles?.username === nextService.profiles?.username &&
    prevService.profiles?.full_name === nextService.profiles?.full_name
  );
}

// Helper to compare images arrays
function areImagesEqual(prevImages?: string[], nextImages?: string[]) {
  // Both undefined or null
  if (!prevImages && !nextImages) return true;
  
  // One is defined, other is not
  if (!prevImages || !nextImages) return false;
  
  // Different array lengths
  if (prevImages.length !== nextImages.length) return false;
  
  // For service cards, we only care about the first image
  return prevImages[0] === nextImages[0];
}

// Simplified main component with better dependency management
const ServiceCard = memo<ServiceCardProps>(
  function ServiceCard({
    service,
    isManageable = false,
    isDeletable = false,
    isDeleting = false,
    showStatusBadge = true,
    useDemo = false,
    isPriority = false,
    onClick,
    onView,
    onEdit,
    onDelete,
    className = "",
  }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams?.get('search') || '';
    const { theme } = useTheme();
    
    // Check if we're on the client side to prevent hydration mismatches
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);
    
    // Store local state in a reducer for better management
    const [state, dispatch] = useReducer(
      (state: any, action: { type: string; payload?: any }) => {
        switch (action.type) {
          case 'SET_IMAGE_ERROR':
            return { ...state, imageError: true };
          case 'SET_AVATAR_ERROR':
            return { ...state, avatarError: true };
          case 'SET_IMAGE_PRIORITY':
            return { ...state, imagePriority: true };
          case 'FORCE_UPDATE':
            return { ...state, forceUpdate: true };
          default:
            return state;
        }
      },
      { imageError: false, avatarError: false, imagePriority: false, forceUpdate: false }
    );
    
    // Store service data in ref to avoid re-renders when only references needed
    const serviceRef = useRef(service);
    
    // Update ref only when service props actually change (shallow compare)
    useEffect(() => {
      if (
        serviceRef.current.id !== service.id ||
        serviceRef.current.title !== service.title ||
        serviceRef.current.status !== service.status ||
        serviceRef.current.active !== service.active ||
        // Only check reference equality for complex objects
        serviceRef.current.profiles !== service.profiles ||
        serviceRef.current.images !== service.images
      ) {
        serviceRef.current = service;
      }
    }, [service]);
    
    // Cleanup and optimization for intersection observer
    useEffect(() => {
      if (typeof IntersectionObserver === 'undefined' || !service.id) return;
      
      const cardId = `service-card-${service.id}`;
      let observer: IntersectionObserver | null = null;
      let timeout: NodeJS.Timeout | null = null;
      
      // Defer observer setup to not block rendering
      timeout = setTimeout(() => {
        const cardElement = document.getElementById(cardId);
        if (!cardElement) return;
        
        observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              dispatch({ type: 'SET_IMAGE_PRIORITY' });
              observer?.disconnect();
            }
          },
          { threshold: 0.1, rootMargin: '200px' }
        );
        
        observer.observe(cardElement);
      }, 100);
      
      return () => {
        if (timeout) clearTimeout(timeout);
        if (observer) observer.disconnect();
      };
    }, [service.id]);
    
    // Consolidate event handling for status changes with proper cleanup
    useEffect(() => {
      if (!service.id || typeof window === 'undefined') return;
      
      const handleStatusChange = (event: CustomEvent) => {
        if (!event.detail || event.detail.serviceId !== service.id) return;
        
        const { status, active } = event.detail;
        serviceRef.current = {
          ...serviceRef.current,
          status,
          active: typeof active === 'string' ? active === 'true' : Boolean(active)
        };
      };
      
      // Gestionnaire pour les changements de devise
      const handleCurrencyChange = (event: Event) => {
        // Forcer un rafraîchissement du composant pour mettre à jour les prix
        dispatch({ type: 'FORCE_UPDATE' });
      };
      
      // Use type assertion for older browsers compatibility
      window.addEventListener('vynal:service-status-change', handleStatusChange as EventListener);
      window.addEventListener('vynal_currency_changed', handleCurrencyChange as EventListener);
      
      return () => {
        window.removeEventListener('vynal:service-status-change', handleStatusChange as EventListener);
        window.removeEventListener('vynal_currency_changed', handleCurrencyChange as EventListener);
      };
    }, [service.id]);
    
    // Event handlers with proper dependency tracking
    const handleCardClick = useCallback((e: React.MouseEvent) => {
      // Empêcher la navigation si on est en mode admin
      if (isManageable) {
        e.preventDefault();
        // Si onView existe, appeler onView pour le service
        if (onView && service.id) {
          onView(service.id);
        }
        return;
      }
      
      // Pour les utilisateurs, rediriger vers la page du service
      if (onClick) {
        e.preventDefault();
        onClick(service.id);
      }
      // Dans tous les autres cas, laisser le comportement par défaut du lien (navigation native)
    }, [isManageable, onClick, onView, service.id]);
    
    const handleView = useCallback((e: React.MouseEvent) => { 
      e.stopPropagation();
      if (onView && service.id) onView(service.id);
    }, [onView, service.id]);
    
    const handleEdit = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (onEdit && service.id) onEdit(service.id);
    }, [onEdit, service.id]);
    
    const handleDelete = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete && service.id) onDelete(service.id);
    }, [onDelete, service.id]);
    
    const handleAvatarError = useCallback(() => {
      dispatch({ type: 'SET_AVATAR_ERROR' });
    }, []);
    
    const handleImageError = useCallback(() => {
      dispatch({ type: 'SET_IMAGE_ERROR' });
    }, []);
  
    const goToFreelanceProfile = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (service.profiles?.id) {
        router.push(`/freelance/${service.profiles.id}`);
      }
    }, [service.profiles?.id, router]);
    
    // Memoized computed values with proper dependencies
    const isNew = useMemo(() => {
      if (!service.created_at) return false;
      
      try {
        const serviceDate = new Date(service.created_at);
        const currentDate = new Date();
        const diffDays = Math.ceil((currentDate.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return diffDays <= 30;
      } catch {
        return false;
      }
    }, [service.created_at]);
    
    const hasValidImage = useMemo(() => {
      return !state.imageError && 
        service.images && 
        Array.isArray(service.images) && 
        service.images.length > 0 && 
        Boolean(service.images[0]);
    }, [state.imageError, service.images]);
    
    // Cache formatted price to avoid recalculation
    const formattedPrice = useMemo(() => {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(service.price || 0);
    }, [service.price]);
    
    // Calculate title with a single pass
    const limitedTitle = useMemo(() => {
      const title = service.title;
      if (!title) return "Service sans titre";
      
      // Get screen width only once during calculation
      const maxLength = typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 83;
      return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
    }, [service.title]);
  
    // Optimize search term highlighting - only run when search terms change
    const highlightedTitle = useMemo(() => {
      if (!searchQuery || searchQuery.length < 3) return limitedTitle;
      
      // Create a stable HTML content with highlighted search terms
      const highlightedHtml = highlightSearchTerms(limitedTitle, searchQuery, {
        highlightClass: 'bg-yellow-200 dark:bg-yellow-700',
        minLength: 3
      });
      
      return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
    }, [limitedTitle, searchQuery]);
  
    // Compute card classes based on actual dependencies
    const cardClasses = useMemo(() => {
      return cn(
        "group overflow-hidden transition-all duration-300",
        "border border-gray-200 dark:border-vynal-purple-secondary/40 rounded-lg relative flex flex-col h-full",
        theme === 'dark' 
          ? "bg-vynal-purple-dark/90 backdrop-blur-sm" 
          : "bg-white/95 backdrop-blur-sm",
        !service.active ? "opacity-85" : "",
        className
      );
    }, [theme, service.active, className]);
  
    // Get freelancer rating with proper error handling
    const { averageRating = 0, reviewCount = 0 } = useFreelancerRating(service.profiles?.id) || {};
  
    // Keyboard event handler with proper type handling
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick(e as unknown as React.MouseEvent);
      }
    }, [handleCardClick]);
  
    // Apply theme detection only on client side
    const { resolvedTheme } = useTheme();
    const isDarkMode = isClient ? resolvedTheme === 'dark' : false;
  
    // Détection si l'utilisateur est sur PC (non-mobile)
    const isPC = useMemo(() => {
      if (typeof window === 'undefined') return false;
      
      // Vérifier si c'est un appareil mobile en utilisant le user agent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return !isMobile;
    }, []);
  
    // Simplified JSX structure - grouped by logical sections
    return (
      <Link
        href={isManageable 
          ? "#" // Utiliser # pour les cards du dashboard car on utilise les callbacks onView/onEdit
          : (service.slug ? `/services/${service.slug}` : `/services/details/${service.id}`)}
        onClick={handleCardClick}
        target={!isManageable && isPC ? "_blank" : undefined}
        rel={!isManageable && isPC ? "noopener noreferrer" : undefined}
        className={cn(
          "group flex flex-col overflow-hidden rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary/50 h-full",
          isManageable ? "cursor-default" : "cursor-pointer hover:shadow-sm",
          className
        )}
      >
        <div className="flex flex-col overflow-hidden border border-slate-200 hover:border-slate-300 dark:border-slate-700/30 h-full bg-white/30 dark:bg-slate-900/30 rounded-lg shadow-none hover:shadow-sm transition-all duration-200 backdrop-blur-sm">
          <div className="relative">
            {/* Image optimisée */}
            <ServiceImage
              image={hasValidImage ? service.images?.[0] : undefined}
              title={service.title}
              onError={handleImageError}
              isPriority={isPriority}
            >
              {showStatusBadge && <StatusBadges active={service.active} status={service.status} />}
            </ServiceImage>
          </div>
          
          <div className="p-3 flex flex-col flex-grow justify-between space-y-1">
            {/* Informations du vendeur et évaluations */}
            <div className="flex items-center justify-between">
              <FreelanceAvatar
                profile={service.profiles}
                onError={handleAvatarError}
                onClick={goToFreelanceProfile}
              />
              
              <div className="flex items-center">
                <Rating
                  averageRating={averageRating}
                  reviewCount={reviewCount}
                  isNew={isNew}
                />
              </div>
            </div>
            
            {/* Titre et catégorie */}
            <div>
              <h3 className="text-sm font-light line-clamp-2 text-slate-800 dark:text-vynal-text-primary mb-0.5">
                {highlightedTitle}
              </h3>
              
              {service.categories && (
                <div className="flex items-center text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                  <span className="truncate max-w-[120px]">{service.categories.name}</span>
                  {service.subcategories && (
                    <>
                      <ChevronRight className="h-2.5 w-2.5 mx-0.5 text-slate-600/70 dark:text-vynal-text-secondary/70" />
                      <span className="truncate max-w-[120px]">{service.subcategories.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Espace flexible pour pousser le prix vers le bas */}
            <div className="flex-grow"></div>
            
            {/* Ajout du prix dans le footer */}
            {service.price !== undefined && service.price > 0 && (
              <div className="flex justify-between items-center mt-auto pt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary/80 font-medium">À partir de</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-vynal-accent-primary mt-0.5 price-value">
                    <PriceDisplay price={service.price || 0} showFixedIndicator={false} />
                  </span>
                </div>

                {/* Boutons d'action déplacés ici, en face du prix */}
                {isManageable && (
                  <ActionButtons 
                    isManageable={isManageable}
                    isDeletable={isDeletable}
                    isDeleting={isDeleting}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  },
  arePropsEqual
);

// Optimisation pour le profiling React
ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;