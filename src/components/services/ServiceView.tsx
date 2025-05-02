import React, { useMemo, useState, useCallback, useEffect, Suspense, Dispatch, SetStateAction, LegacyRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  ChevronRight, 
  Clock, 
  Calendar, 
  FileText,
  Heart,
  Share2,
  User,
  Star,
  Shield,
  Package2,
  AlertCircle,
  ArrowLeft,
  Tag,
  Image as ImageIcon,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  ExternalLink,
  X
} from "lucide-react";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceImageGallery from './ServiceImageGallery';
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import MessagingDialog from "@/components/messaging/MessagingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { OrderButton } from "@/components/orders/OrderButton";
import { useTheme } from "next-themes";

// Chargement différé des composants lourds
const ServiceReviews = dynamic(() => import('../reviews/ServiceReviews'), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-vynal-purple-secondary/30 rounded w-1/3"></div>
      <div className="h-40 bg-vynal-purple-secondary/30 rounded"></div>
    </div>
  ),
  ssr: false
});

// Hook personnalisé pour l'intersection observer
interface IntersectionOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

const useInView = (options: IntersectionOptions = {}): [(node: HTMLDivElement | null) => void, boolean] => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(options.triggerOnce ? true : false);
  
  useEffect(() => {
    if (!ref) return;
    
    // Si IntersectionObserver n'est pas supporté, considérer comme visible
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    
    // Utilisation d'une variable pour stocker la position initiale
    let initialScroll = window.scrollY;
    
    const observer = new IntersectionObserver(([entry]) => {
      // Éviter tout scroll brusque en préservant la position
      const currentScroll = window.scrollY;
      
      setIsInView(entry.isIntersecting);
      
      // Assurer que le scroll reste stable
      if (Math.abs(currentScroll - initialScroll) > 5) {
        setTimeout(() => window.scrollTo(0, currentScroll), 10);
      }
      
      // Si triggerOnce est activé, déconnecte l'observer après la première intersection
      if (entry.isIntersecting && options.triggerOnce) {
        observer.disconnect();
      }
    }, {
      threshold: options.threshold || 0,
      rootMargin: options.rootMargin || '0px',
    });
    
    observer.observe(ref);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, options.threshold, options.triggerOnce, options.rootMargin]);
  
  // Création d'un callback approprié pour les refs React au lieu de retourner setRef directement
  const nodeRef = useCallback((node: HTMLDivElement | null) => {
    setRef(node);
  }, []);
  
  return [nodeRef, isInView];
};

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
}

interface ServiceViewProps {
  service: ExtendedService | null;
  loading?: boolean;
  error?: string | null;
  isFreelanceView?: boolean;
  relatedServices?: ServiceWithFreelanceAndCategories[];
  loadingRelated?: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  className?: string;
}

/**
 * Composant de vue détaillée d'un service - optimisé pour performances
 * - Chargement différé des sections avec prioritisation
 * - Optimisé pour SEO et accessibilité
 * - Support complet des thèmes clair/sombre
 * - Responsive design mobile-first
 * - Gestion optimisée des ressources
 */
const ServiceView: React.FC<ServiceViewProps> = (props) => {
  // Extraction des props avec valeurs par défaut
  const {
    service,
    loading = false,
    error = null,
    isFreelanceView = false,
    relatedServices = [],
    loadingRelated = false,
    onBack,
    onEdit,
    className = ""
  } = props;
  
  // Hooks React et personnalisés
  const router = useRouter();
  const user = useUser();
  
  // Vérification du rendu côté client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Use theme only on client side to prevent hydration mismatches
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = isClient ? (resolvedTheme === 'dark' || theme === 'dark') : false;
  
  // Observers pour les sections avec chargement différé
  const [relatedRef, relatedInView] = useInView({ 
    threshold: 0.1, 
    triggerOnce: true,
    rootMargin: '200px 0px' // Plus large pour un préchargement anticipé
  });
  
  const [reviewsRef, reviewsInView] = useInView({ 
    threshold: 0.1, 
    triggerOnce: true,
    rootMargin: '250px 0px'
  });
  
  // État pour la mise en favoris
  const [isFavorite, setIsFavorite] = useState(false);
  
  // États pour le partage
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Récupération des données de notation avec cache interne
  const { averageRating, reviewCount } = useFreelancerRating(service?.profiles?.id || '');

  // Mémoïsation des données du service pour éviter les recalculs
  const serviceMeta = useMemo(() => {
    if (!service) return null;
    
    // Valeurs par défaut pour éviter les erreurs
    return {
      id: service.id || '',
      title: service.title || 'Service sans titre',
      description: service.description || 'Aucune description disponible',
      price: service.price || 0,
      delivery_time: service.delivery_time || 1,
      created_at: service.created_at || new Date().toISOString(),
      active: typeof service.active === 'string' 
        ? service.active === 'true' 
        : Boolean(service.active),
      status: service.status || 'pending',
      freelance: service.profiles || {
        id: '',
        username: 'utilisateur',
        full_name: 'Utilisateur',
        avatar_url: null,
        bio: null
      },
      category: service.categories || {
        id: '',
        name: 'Catégorie',
        slug: 'categorie'
      },
      subcategory: service.subcategories || null,
      images: Array.isArray(service.images) ? service.images : [],
      hasImages: Array.isArray(service.images) && service.images.length > 0
    };
  }, [service]);
  
  // Extraction des initiales du freelance pour l'avatar
  const freelanceInitials = useMemo(() => {
    if (!serviceMeta?.freelance) return "UN";
    
    try {
      const nameSource = serviceMeta.freelance.full_name || serviceMeta.freelance.username || 'UN';
      return nameSource
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } catch {
      return "UN"; // Fallback sécurisé
    }
  }, [serviceMeta?.freelance]);
  
  // Formattage de la description avec préservation des sauts de ligne
  const formattedDescription = useMemo(() => {
    if (!serviceMeta?.description) return "Aucune description disponible";
    
    try {
      return serviceMeta.description.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < serviceMeta.description.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    } catch {
      return "Aucune description disponible";
    }
  }, [serviceMeta?.description]);
  
  // Filtrage des services connexes optimisé
  const filteredRelatedServices = useMemo(() => {
    if (!Array.isArray(relatedServices) || relatedServices.length === 0 || !serviceMeta?.id) {
      return [];
    }
    
    return relatedServices
      .filter(rs => rs && rs.id && rs.id !== serviceMeta.id)
      .slice(0, 3);
  }, [relatedServices, serviceMeta?.id]);
  
  // Création de la liste d'étoiles de notation une seule fois
  const ratingStars = useMemo(() => {
    if (!averageRating) return null;
    
    return (
      <div className="flex space-x-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const star = index + 1;
          const isFilled = star <= Math.floor(averageRating);
          const isPartiallyFilled = !isFilled && star === Math.ceil(averageRating);
          const fillPercentage = isPartiallyFilled 
            ? Math.round((averageRating % 1) * 100) 
            : 0;
          
          return (
            <div key={star} className="relative">
              {/* Étoile de fond */}
              <Star className={cn(
                "h-3.5 w-3.5",
                isDarkMode 
                  ? "text-vynal-purple-secondary/40 fill-vynal-purple-secondary/40" 
                  : "text-vynal-purple-secondary/30 fill-vynal-purple-secondary/30"
              )} />
              
              {/* Étoile colorée (complète ou partielle) */}
              {(isFilled || isPartiallyFilled) && (
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ 
                    width: isFilled ? '100%' : `${fillPercentage}%` 
                  }}
                >
                  <Star className="h-3.5 w-3.5 text-vynal-accent-primary fill-vynal-accent-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [averageRating, isDarkMode]);
  
  // Toggle favoris
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // Ici, vous pourriez ajouter une logique pour sauvegarder l'état dans l'API
  }, []);
  
  // Partage du service
  const handleShare = useCallback(() => {
    // Vérifier si l'API de partage est disponible
    if (navigator.share && serviceMeta) {
      navigator.share({
        title: serviceMeta.title,
        text: `Découvrez ce service : ${serviceMeta.title}`,
        url: window.location.href
      }).catch(() => {
        setIsShareModalOpen(true);
      });
    } else {
      setIsShareModalOpen(true);
    }
  }, [serviceMeta]);
  
  // Copie du lien dans le presse-papier
  const copyToClipboard = useCallback(() => {
    if (!navigator.clipboard) return;
    
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie: ', err);
      });
  }, []);
  
  // Navigation optimisée
  const handleViewProfile = useCallback(() => {
    if (!serviceMeta?.freelance?.id) return;
    
    const path = user?.profile?.id === serviceMeta.freelance.id
      ? "/dashboard/profile"
      : serviceMeta.freelance.username 
        ? `/profile/${serviceMeta.freelance.username}` 
        : `/profile/id/${serviceMeta.freelance.id}`;
    
    router.push(path);
  }, [serviceMeta?.freelance, user?.profile?.id, router]);
  
  // Formattage du prix pour éviter les recalculs
  const formattedPrice = useMemo(() => formatPrice(serviceMeta?.price || 0), [serviceMeta?.price]);
  
  // État de chargement - Composant optimisé avec Skeleton
  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="w-full aspect-video rounded-lg bg-vynal-purple-secondary/30" />
              <Card className={cn(
                "rounded-xl shadow-lg",
                isDarkMode 
                  ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 shadow-vynal-accent-secondary/20" 
                  : "bg-white border-gray-200 shadow-gray-200/20"
              )}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-3/4 mb-4 bg-vynal-purple-secondary/30" />
                  <div className="space-y-2 mb-6">
                    <Skeleton className="h-4 w-full bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-4 w-full bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-4 w-2/3 bg-vynal-purple-secondary/30" />
                  </div>
                  <Skeleton className="h-24 w-full bg-vynal-purple-secondary/30" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className={cn(
                "mb-4 rounded-xl shadow-lg",
                isDarkMode 
                  ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 shadow-vynal-accent-secondary/20" 
                  : "bg-white border-gray-200 shadow-gray-200/20"
              )}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-8 w-full bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-1/2 bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-8 w-1/2 bg-vynal-purple-secondary/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className={cn(
                "rounded-xl shadow-lg",
                isDarkMode 
                  ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 shadow-vynal-accent-secondary/20" 
                  : "bg-white border-gray-200 shadow-gray-200/20"
              )}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full bg-vynal-purple-secondary/30" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-3 w-20 bg-vynal-purple-secondary/30" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur - Interface améliorée
  if (error || !service) {
    return (
      <div className={cn(
        "container mx-auto px-4 py-12",
        className
      )}>
        <Card className={cn(
          "max-w-2xl mx-auto overflow-hidden rounded-xl shadow-lg",
          isDarkMode 
            ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 shadow-vynal-accent-secondary/20" 
            : "bg-white border-gray-200 shadow-gray-100"
        )}>
          <div className={cn(
            "p-4 flex items-center space-x-3 border-b",
            isDarkMode 
              ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30" 
              : "bg-gray-50 border-gray-200"
          )}>
            <AlertCircle className={cn(
              "h-6 w-6 flex-shrink-0",
              isDarkMode ? "text-vynal-status-error" : "text-red-500"
            )} />
            <h2 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-vynal-text-primary" : "text-gray-800"
            )}>Service non disponible</h2>
          </div>
          <CardContent className="p-6">
            <p className={cn(
              "mb-6",
              isDarkMode ? "text-vynal-text-secondary" : "text-gray-600"
            )}>{error || "Ce service n'existe pas ou a été supprimé."}</p>
            <div className="flex flex-wrap gap-2">
              {onBack ? (
                <Button 
                  variant="outline" 
                  onClick={onBack} 
                  className={cn(
                    "group transition-colors",
                    isDarkMode 
                      ? "border-vynal-purple-secondary/50 bg-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/50" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Retour
                </Button>
              ) : (
                <Link href="/services" className="group">
                  <Button variant="outline" className={cn(
                    "transition-colors",
                    isDarkMode 
                      ? "border-vynal-purple-secondary/50 bg-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/50" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  )}>
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Retour aux services
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si tout est OK, continuer avec le rendu du service
  if (!serviceMeta) {
    return null; // Sécurité supplémentaire
  }

  return (
    <div className={cn(
      "min-h-screen pb-8",
      isDarkMode ? "bg-vynal-purple-dark" : "bg-gray-50",
      className
    )}>
      {/* Bannière stylisée - uniquement visible en mode public */}
      {!isFreelanceView && (
        <div className={cn(
          "h-32 sm:h-48 relative overflow-hidden",
          isDarkMode 
            ? "bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest" 
            : "bg-gradient-to-b from-indigo-100 to-white"
        )}>
          <div className="absolute inset-0 opacity-20 bg-[url('/img/grid-pattern.svg')] bg-center"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: isDarkMode 
                ? 'radial-gradient(circle, rgba(125,99,210,0.5) 0%, rgba(95,60,170,0.2) 70%)' 
                : 'radial-gradient(circle, rgba(99,125,210,0.3) 0%, rgba(80,90,170,0.1) 70%)'
            }}
          ></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: isDarkMode 
                ? 'radial-gradient(circle, rgba(150,110,230,0.5) 0%, rgba(120,80,200,0.2) 70%)' 
                : 'radial-gradient(circle, rgba(110,130,230,0.3) 0%, rgba(90,100,200,0.1) 70%)'
            }}
          ></div>
        </div>
      )}
      
      <div className={cn(
        "container mx-auto px-3 sm:px-4 lg:px-6 relative",
        !isFreelanceView ? "-mt-16 sm:-mt-24" : ""
      )}>
        {/* Fil d'Ariane - version publique */}
        {!isFreelanceView && serviceMeta.category && (
          <nav 
            className={cn(
              "flex items-center text-xs sm:text-sm mb-3 sm:mb-4 rounded-lg shadow-lg p-2 border overflow-x-auto whitespace-nowrap",
              isDarkMode 
                ? "bg-vynal-purple-dark/90 shadow-vynal-accent-secondary/20 border-vynal-purple-secondary/30 text-vynal-text-primary" 
                : "bg-white shadow-gray-200/40 border-gray-200 text-gray-700"
            )}
            aria-label="Fil d'Ariane"
          >
            <Link href="/" className={cn(
              "transition-colors",
              isDarkMode ? "text-vynal-text-secondary hover:text-vynal-accent-primary" : "text-gray-500 hover:text-indigo-600"
            )}>
              Accueil
            </Link>
            <ChevronRight className={cn(
              "h-4 w-4 mx-2 flex-shrink-0",
              isDarkMode ? "text-vynal-text-secondary" : "text-gray-400"
            )} aria-hidden="true" />
            
            <Link href="/services" className={cn(
              "transition-colors",
              isDarkMode ? "text-vynal-text-secondary hover:text-vynal-accent-primary" : "text-gray-500 hover:text-indigo-600"
            )}>
              Services
            </Link>
            <ChevronRight className={cn(
              "h-4 w-4 mx-2 flex-shrink-0",
              isDarkMode ? "text-vynal-text-secondary" : "text-gray-400"
            )} aria-hidden="true" />
            
            <Link 
              href={`/services?category=${serviceMeta.category.slug}`} 
              className={cn(
                "transition-colors",
                isDarkMode ? "text-vynal-text-secondary hover:text-vynal-accent-primary" : "text-gray-500 hover:text-indigo-600"
              )}
            >
              {serviceMeta.category.name}
            </Link>
            
            {serviceMeta.subcategory && (
              <>
                <ChevronRight className={cn(
                  "h-4 w-4 mx-2 flex-shrink-0",
                  isDarkMode ? "text-vynal-text-secondary" : "text-gray-400"
                )} aria-hidden="true" />
                <Link 
                  href={`/services?category=${serviceMeta.category.slug}&subcategory=${serviceMeta.subcategory.slug}`} 
                  className={cn(
                    "transition-colors",
                    isDarkMode ? "text-vynal-text-secondary hover:text-vynal-accent-primary" : "text-gray-500 hover:text-indigo-600"
                  )}
                >
                  {serviceMeta.subcategory.name}
                </Link>
              </>
            )}
            
            <ChevronRight className={cn(
              "h-4 w-4 mx-2 flex-shrink-0",
              isDarkMode ? "text-vynal-text-secondary" : "text-gray-400"
            )} aria-hidden="true" />
            
            <span className={cn(
              "font-medium truncate",
              isDarkMode ? "text-vynal-accent-primary" : "text-indigo-600"
            )}>{serviceMeta.title}</span>
          </nav>
        )}

        {/* En-tête avec bouton de retour - version admin/dashboard */}
        {isFreelanceView && (
          <div className="flex items-center mb-4 pt-4">
            {onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className={cn(
                  "mr-4 group transition-colors",
                  isDarkMode 
                    ? "border-vynal-purple-secondary/30 bg-vynal-purple-secondary/10 text-vynal-text-primary hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary" 
                    : "border-gray-200 bg-gray-100/50 text-gray-700 hover:bg-gray-200/50 hover:text-indigo-600"
                )}
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Retour
              </Button>
            )}
            
            <h1 className={cn(
              "text-2xl font-bold",
              isDarkMode ? "text-vynal-text-primary" : "text-gray-800"
            )}>Détails du service</h1>
            
            {onEdit && (
              <Button onClick={onEdit} className={cn(
                "ml-auto transition-all",
                isDarkMode 
                  ? "bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}>
                Modifier
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Partie gauche: informations principales du service */}
          <div className="lg:col-span-2">
            {/* Galerie d'images du service */}
            <div className="mb-4">
              {serviceMeta.hasImages ? (
                <ServiceImageGallery
                  images={serviceMeta.images}
                  altText={serviceMeta.title}
                  lazyLoadingEnabled={true}
                />
              ) : (
                <div className={cn(
                  "aspect-video rounded-lg flex items-center justify-center shadow-inner",
                  isDarkMode ? "bg-vynal-purple-secondary/30" : "bg-gray-100"
                )}>
                  <ImageIcon className={cn(
                    "h-12 w-12",
                    isDarkMode ? "text-vynal-text-secondary" : "text-gray-400"
                  )} aria-hidden="true" />
                  <span className="sr-only">Aucune image disponible</span>
                  <p className={cn(
                    "ml-2",
                    isDarkMode ? "text-vynal-text-secondary" : "text-gray-500"
                  )}>Aucune image disponible</p>
                </div>
              )}
            </div>

            <Card className={cn(
              "overflow-hidden border shadow-lg rounded-xl",
              isDarkMode 
                ? "border-vynal-purple-secondary/30 shadow-vynal-accent-secondary/20 bg-vynal-purple-dark/90 backdrop-blur-sm" 
                : "border-gray-200 shadow-gray-100 bg-white"
            )}>
              <CardContent className="p-4 sm:p-6">
                {/* Statut du service - visible uniquement en mode admin */}
                {isFreelanceView && serviceMeta.active !== undefined && (
                  <div className="mb-4 flex justify-between items-center">
                    <Badge variant={serviceMeta.active ? "default" : "secondary"} className={
                      serviceMeta.active 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "bg-yellow-600 text-white hover:bg-yellow-700"
                    }>
                      {serviceMeta.active ? "Actif" : "Inactif"}
                    </Badge>
                    
                    <span className={cn(
                      "text-xs",
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    )}>ID: {serviceMeta.id}</span>
                  </div>
                )}

                {/* Titre du service */}
                <div className="mb-3 sm:mb-4">
                  <h1 
                    className={cn(
                      "text-xl sm:text-2xl md:text-3xl font-bold break-words",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )} 
                    id="service-title"
                  >
                    {serviceMeta.title}
                  </h1>
                </div>
                
                {/* Informations principales */}
                <div className={cn(
                  "flex flex-wrap gap-2 mb-4 p-3 rounded-lg border",
                  isDarkMode 
                    ? "bg-vynal-purple-darkest/50 border-vynal-purple-mid/20" 
                    : "bg-gray-50 border-gray-200"
                )}>
                  <div className="flex items-center space-x-2">
                    <Tag className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                    )} aria-hidden="true" />
                    <div className="flex items-center">
                      <p className={cn(
                        "text-xs mr-1",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>Catégorie:</p>
                      <p className={cn(
                        "text-xs font-medium truncate max-w-[120px]",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>{serviceMeta.category?.name || 'Non spécifiée'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                    )} aria-hidden="true" />
                    <div className="flex items-center">
                      <p className={cn(
                        "text-xs mr-1",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>Temps de livraison:</p>
                      <p className={cn(
                        "text-xs font-medium",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>{serviceMeta.delivery_time} jour{Number(serviceMeta.delivery_time) > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                    )} aria-hidden="true" />
                    <div className="flex items-center">
                      <p className={cn(
                        "text-xs mr-1",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>Créé le:</p>
                      <p className={cn(
                        "text-xs font-medium",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>{formatDate(serviceMeta.created_at)}</p>
                    </div>
                  </div>
                  
                  {serviceMeta.subcategory && (
                    <div className="flex items-center space-x-2">
                      <FileText className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                      )} aria-hidden="true" />
                      <div className="flex items-center">
                        <p className={cn(
                          "text-xs mr-1",
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>Sous-catégorie:</p>
                        <p className={cn(
                          "text-xs font-medium truncate max-w-[120px]",
                          isDarkMode ? "text-white" : "text-gray-900"
                        )}>{serviceMeta.subcategory.name}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Description du service */}
                <div className="mb-4">
                  <h2 className={cn(
                    "text-lg font-semibold mb-2",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>Description</h2>
                  <div className={cn(
                    "border rounded-lg p-4 shadow-inner",
                    isDarkMode 
                      ? "bg-vynal-purple-darkest/50 border-vynal-purple-mid/20" 
                      : "bg-gray-50 border-gray-200"
                  )}>
                    <div className={cn(
                      "prose prose-sm max-w-none overflow-hidden break-words",
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {formattedDescription}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ajout des avis sur le service - après les services connexes */}
            {!isFreelanceView && serviceMeta.id && (
              <div
                ref={reviewsRef}
                className="mt-8 sm:mt-10"
              >
                {reviewsInView && (
                  <Suspense fallback={
                    <div className="animate-pulse space-y-4">
                      <div className="h-10 bg-vynal-purple-secondary/30 rounded w-1/3"></div>
                      <div className="h-40 bg-vynal-purple-secondary/30 rounded"></div>
                    </div>
                  }>
                    <ServiceReviews serviceId={serviceMeta.id} />
                  </Suspense>
                )}
              </div>
            )}
          </div>
          
          {/* Partie droite: prix, actions, et info freelance */}
          <div className="lg:block">
            <div className="lg:sticky lg:top-4 space-y-4">
              {/* Carte de prix et actions */}
              <Card className={cn(
                "overflow-hidden shadow-md border rounded-xl",
                isDarkMode 
                  ? "border-vynal-purple-secondary/30 shadow-vynal-accent-secondary/20 bg-vynal-purple-dark/90" 
                  : "border-gray-200 shadow-gray-100 bg-white"
              )}>
                <div className={cn(
                  "p-4 border-b",
                  isDarkMode 
                    ? "bg-gradient-to-r from-vynal-purple-darkest to-vynal-purple-dark border-vynal-purple-mid/20" 
                    : "bg-gradient-to-r from-gray-50 to-white border-gray-200"
                )}>
                  <h2 className={cn(
                    "text-2xl font-bold",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {formattedPrice} FCFA
                  </h2>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>Prix final, sans frais supplémentaires</p>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3 mb-4">
                    <OrderButton
                      serviceId={serviceMeta.id}
                      price={Number(serviceMeta.price)}
                      showIcon={true}
                      fullWidth={true}
                      variant="default"
                      className={cn(
                        "font-medium shadow-md transform hover:scale-[1.02] transition-all",
                        isDarkMode
                          ? "bg-gradient-to-r from-vynal-purple-light to-vynal-purple-mid hover:from-vynal-purple-mid hover:to-vynal-purple"
                          : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
                      )}
                      customLabel="Commander ce service"
                    />
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className={cn(
                          "flex-1 text-xs",
                          isFavorite ? (
                            isDarkMode
                              ? "bg-vynal-purple-secondary/30 text-vynal-accent-primary border-vynal-accent-primary/50"
                              : "bg-indigo-50 text-indigo-600 border-indigo-200"
                          ) : ""
                        )} 
                        size="sm"
                        onClick={handleToggleFavorite}
                      >
                        <Heart className={cn(
                          "h-4 w-4 mr-1.5",
                          isFavorite ? "fill-current" : ""
                        )} aria-hidden="true" />
                        {isFavorite ? "Favori" : "Favoris"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-xs" 
                        size="sm"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                        Partager
                      </Button>
                    </div>
                  </div>
                  
                  {/* Garanties du service */}
                  <div className={cn(
                    "border-t pt-3",
                    isDarkMode ? "border-vynal-purple-mid/20" : "border-gray-200"
                  )}>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Clock className={cn(
                          "h-4 w-4 mr-2 mt-0.5 flex-shrink-0",
                          isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                        )} aria-hidden="true" />
                        <span className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        )}>Livraison en {serviceMeta.delivery_time} jour{Number(serviceMeta.delivery_time) > 1 ? 's' : ''}</span>
                      </li>
                      <li className="flex items-start">
                        <MessageSquare className={cn(
                          "h-4 w-4 mr-2 mt-0.5 flex-shrink-0",
                          isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                        )} aria-hidden="true" />
                        <span className={cn(
                          "text-sm",
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        )}>Support personnalisé assuré</span>
                      </li>
                      <li className="flex flex-col">
                        <div className="flex items-start">
                          <Shield className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <span className={cn(
                            "text-sm",
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          )}>Paiement sécurisé</span>
                        </div>
                        <span className={cn(
                          "text-xs ml-6",
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>Vos informations sont chiffrées par TLS</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {/* Informations sur le freelance */}
              <Card className={cn(
                "overflow-hidden shadow-md border rounded-xl",
                isDarkMode 
                  ? "border-vynal-purple-secondary/30 shadow-vynal-accent-secondary/20 bg-vynal-purple-dark/90" 
                  : "border-gray-200 shadow-gray-100 bg-white"
              )}>
                <div className={cn(
                  "p-4 border-b",
                  isDarkMode 
                    ? "bg-gradient-to-r from-vynal-purple-darkest to-vynal-purple-dark border-vynal-purple-mid/20" 
                    : "bg-gradient-to-r from-gray-50 to-white border-gray-200"
                )}>
                  <h3 className={cn(
                    "font-semibold",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>À propos du vendeur</h3>
                </div>
                
                <CardContent className="p-4">
                  {/* Vérifier la présence des données du freelance */}
                  {serviceMeta.freelance && (
                    <>
                      <div className="flex items-center mb-3">
                        <Avatar className={cn(
                          "h-12 w-12 mr-3 border shadow-sm",
                          isDarkMode ? "border-vynal-purple-mid/30" : "border-gray-200"
                        )}>
                          <AvatarImage 
                            src={serviceMeta.freelance.avatar_url || undefined} 
                            alt={serviceMeta.freelance.username || 'Avatar du vendeur'} 
                            className="object-cover"
                          />
                          <AvatarFallback className={cn(
                            "text-sm",
                            isDarkMode ? "bg-vynal-purple-light text-white" : "bg-indigo-500 text-white"
                          )}>
                            {freelanceInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <h3 className={cn(
                            "font-semibold text-sm truncate",
                            isDarkMode ? "text-white" : "text-gray-900"
                          )}>
                            {serviceMeta.freelance.full_name || serviceMeta.freelance.username || 'Vendeur'}
                          </h3>
                          <p className={cn(
                            "text-xs truncate",
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          )}>@{serviceMeta.freelance.username || 'username'}</p>
                          
                          {/* Affichage de la note moyenne */}
                          <div className="flex items-center mt-1">
                            {ratingStars}
                            <span className={cn(
                              "text-xs ml-1.5 font-medium",
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            )}>
                              {averageRating > 0 
                                ? `${averageRating.toFixed(1)} (${reviewCount})` 
                                : "Aucun avis"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bio du vendeur si disponible */}
                      {serviceMeta.freelance.bio && (
                        <div className={cn(
                          "mb-3 p-2.5 rounded-md",
                          isDarkMode ? "bg-vynal-purple-darkest/50" : "bg-gray-50"
                        )}>
                          <h4 className={cn(
                            "text-xs font-medium mb-1",
                            isDarkMode ? "text-white" : "text-gray-900"
                          )}>À propos du vendeur</h4>
                          <p className={cn(
                            "text-xs line-clamp-3",
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          )}>
                            {serviceMeta.freelance.bio}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {serviceMeta.freelance.id && (
                            <MessagingDialog 
                              freelanceId={serviceMeta.freelance.id}
                              freelanceName={serviceMeta.freelance.full_name || serviceMeta.freelance.username || 'Freelance'}
                              buttonVariant="default"
                              className={cn(
                                "w-full text-xs",
                                isDarkMode
                                  ? "bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                              )}
                              size="sm"
                            />
                          )}
                          
                          <Button 
                            variant="outline" 
                            className="w-full text-xs flex items-center justify-center" 
                            size="sm"
                            onClick={handleViewProfile}
                          >
                            <User className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                            {user?.profile?.id === serviceMeta.freelance.id ? "Mon profil" : "Voir profil"}
                          </Button>
                        </div>
                        
                        {serviceMeta.freelance.id && (
                          <Link 
                            href={
                              user?.profile?.id === serviceMeta.freelance.id
                                ? "/dashboard/services"
                                : `/services?freelancer=${serviceMeta.freelance.id}`
                            } 
                            className="w-full block"
                          >
                            <Button variant="ghost" className="w-full text-xs group" size="sm">
                              {user?.profile?.id === serviceMeta.freelance.id 
                                ? "Gérer mes services" 
                                : "Voir tous ses services"}
                              <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                  {!serviceMeta.freelance && (
                    <div className="text-center p-2 text-gray-400 text-sm">
                      <p>Information du vendeur non disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Services connexes - uniquement en mode public */}
        {!isFreelanceView && serviceMeta.freelance?.id && (
          <div
            ref={relatedRef}
            className="mt-8 sm:mt-10"
          >
            <div className="mb-4">
              <h2 className={cn(
                "text-base sm:text-lg font-bold flex items-center",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                <Package2 className={cn(
                  "h-5 w-5 mr-2",
                  isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                )} aria-hidden="true" />
                Autres services de {serviceMeta.freelance.full_name || serviceMeta.freelance.username}
              </h2>
              <p className={cn(
                "text-sm ml-7",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>Découvrez d'autres services proposés par ce vendeur</p>
            </div>
            
            {relatedInView && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {loadingRelated ? (
                  // Skeletons pour les services en chargement
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className={cn(
                      "overflow-hidden h-64 border",
                      isDarkMode 
                        ? "border-vynal-purple-secondary/30 bg-vynal-purple-dark/60" 
                        : "border-gray-200 bg-white"
                    )}>
                      <div className="h-32 animate-pulse bg-vynal-purple-secondary/30"></div>
                      <CardContent className="p-3">
                        <Skeleton className="h-4 w-3/4 mb-2 bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-4 w-1/2 mb-2 bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-6 w-1/3 mt-4 bg-vynal-purple-secondary/30" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  filteredRelatedServices.length > 0 ? (
                    filteredRelatedServices.map(relatedService => {
                      const linkPath = relatedService.slug
                        ? `/services/${relatedService.slug}`
                        : `/services/${relatedService.id}`;
                      
                      return (
                        <Link 
                          href={linkPath} 
                          key={relatedService.id}
                          className="block transition-transform duration-300 hover:scale-[1.02]"
                        >
                          <ServiceCard 
                            service={relatedService} 
                            className="h-full shadow-sm"
                            useDemo={false} 
                          />
                        </Link>
                      );
                    })
                  ) : (
                    <div className={cn(
                      "col-span-full text-center p-8 rounded-lg border border-dashed",
                      isDarkMode 
                        ? "bg-vynal-purple-darkest/30 border-vynal-purple-mid/20" 
                        : "bg-gray-50 border-gray-200"
                    )}>
                      <Package2 className={cn(
                        "h-10 w-10 mx-auto mb-3",
                        isDarkMode ? "text-gray-400" : "text-gray-300"
                      )} aria-hidden="true" />
                      <p className={cn(
                        "mb-1",
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      )}>Ce vendeur n'a pas d'autres services pour le moment</p>
                      <p className={cn(
                        "text-sm",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>Revenez plus tard pour découvrir ses nouveaux services</p>
                    </div>
                  )
                )}
                
                {/* Affichage "Voir tous les services" uniquement si nécessaire */}
                {!loadingRelated && filteredRelatedServices.length > 0 && filteredRelatedServices.length < 3 && (
                  <Link href={`/services?freelancer=${serviceMeta.freelance.id}`} className="block">
                    <Card className={cn(
                      "h-full border border-dashed group hover:border-solid transition-colors flex items-center justify-center",
                      isDarkMode 
                        ? "bg-gradient-to-br from-vynal-purple-darkest/30 to-vynal-purple-dark/30 hover:from-vynal-purple-darkest hover:to-vynal-purple-dark border-vynal-purple-mid/20" 
                        : "bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border-gray-200"
                    )}>
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform",
                          isDarkMode 
                            ? "bg-vynal-purple-light/20" 
                            : "bg-indigo-100"
                        )}>
                          <Package2 className={cn(
                            "h-5 w-5",
                            isDarkMode ? "text-vynal-purple-light" : "text-indigo-500"
                          )} aria-hidden="true" />
                        </div>
                        <h3 className={cn(
                          "text-sm font-medium mb-1 group-hover:text-white transition-colors",
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        )}>
                          Voir tous les services
                        </h3>
                        <p className={cn(
                          "text-xs group-hover:text-gray-300 transition-colors",
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          Découvrez la liste complète des services
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modal de partage simplifié pour optimiser les performances */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className={cn(
              "w-full max-w-md rounded-lg p-6 relative",
              isDarkMode ? "bg-vynal-purple-dark border border-vynal-purple-secondary/50" : "bg-white shadow-xl"
            )}
          >
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-3 right-3 rounded-full p-1 hover:bg-gray-200/20"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className={cn(
              "text-lg font-bold mb-4",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>Partager ce service</h3>
            
            <div className="flex items-center">
              <input 
                type="text" 
                value={isClient ? window.location.href : ''}
                readOnly
                className={cn(
                  "flex-1 px-3 py-2 rounded-l-md border-r-0 focus:outline-none",
                  isDarkMode 
                    ? "bg-vynal-purple-darkest/50 border-vynal-purple-secondary/50 text-white" 
                    : "bg-gray-50 border-gray-300 text-gray-900"
                )}
              />
              <button 
                onClick={copyToClipboard}
                className={cn(
                  "px-3 py-2 rounded-r-md font-medium focus:outline-none transition-colors",
                  copySuccess ? (
                    isDarkMode 
                      ? "bg-green-600 text-white" 
                      : "bg-green-600 text-white"
                  ) : (
                    isDarkMode 
                      ? "bg-vynal-accent-primary text-vynal-purple-dark hover:bg-vynal-accent-secondary" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  )
                )}
              >
                {copySuccess ? "Copié !" : "Copier"}
              </button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsShareModalOpen(false)}
                className={cn(
                  isDarkMode 
                    ? "border-vynal-purple-secondary/50 bg-vynal-purple-secondary/20 text-white hover:bg-vynal-purple-secondary/40" 
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                )}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceView;