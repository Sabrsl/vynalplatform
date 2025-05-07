import React, { useMemo, useState, useCallback, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";

// Composants UI - import seulement ceux nécessaires
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificationBadge } from "@/components/ui/certification-badge";

// Composants métier
import ServiceCard from "@/components/services/ServiceCard";
import ServiceImageGallery from './ServiceImageGallery';
import MessagingDialog from "@/components/messaging/MessagingDialog";
import { OrderButton } from "@/components/orders/OrderButton";

// Hooks et utils
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import { useUser } from "@/hooks/useUser";
import { CURRENCY } from "@/lib/constants";

// Icônes - n'importer que celles utilisées
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
  X,
  Facebook,
  MessageCircle,
  Mail,
  Send,
  Link as LinkIcon,
} from "lucide-react";

// Composants pour le Popover
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

// Chargement différé des composants lourds
const ServiceReviews = dynamic(() => import('../reviews/ServiceReviews'), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-100 dark:bg-vynal-purple-secondary/30 rounded w-1/3"></div>
      <div className="h-40 bg-gray-100 dark:bg-vynal-purple-secondary/30 rounded"></div>
    </div>
  ),
  ssr: false
});

// Types
interface IntersectionOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  profiles: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
    role?: string | null;
    bio?: string | null;
    is_certified?: boolean;
    certification_type?: 'standard' | 'premium' | 'expert' | null;
  };
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

// Hook personnalisé pour l'intersection observer
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

// Style global pour les titres et textes secondaires
const textStyles = {
  title: (isDark: boolean) => cn(
    "text-vynal-title"
  ),
  secondary: (isDark: boolean) => cn(
    "text-vynal-body"
  ),
  accent: (isDark: boolean) => cn(
    isDark ? "text-vynal-accent-primary" : "text-[#A020F0]"
  )
};

// Ajouter l'import des constantes de routes
import { FREELANCE_ROUTES, CLIENT_ROUTES, PUBLIC_ROUTES } from "@/config/routes";

/**
 * Composant d'erreur pour afficher lorsque le service n'est pas disponible
 */
const ServiceErrorView = React.memo(({ error, onBack, isDarkMode }: { 
  error: string | null, 
  onBack?: () => void, 
  isDarkMode: boolean 
}) => (
  <div className="container mx-auto px-4 py-12">
    <Card className={cn(
      "max-w-2xl mx-auto overflow-hidden card-vynal",
      isDarkMode ? "dark" : "light"
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
        <h2 className="text-lg font-semibold text-vynal-title">Service non disponible</h2>
      </div>
      <CardContent className="p-6">
        <p className="mb-6 text-vynal-body">{error || "Ce service n'existe pas ou a été supprimé."}</p>
        <div className="flex flex-wrap gap-2">
          {onBack ? (
            <Button 
              variant="outline" 
              onClick={onBack} 
              className={cn(
                "group transition-colors btn-vynal-outline",
                isDarkMode ? "dark" : "light"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Retour
            </Button>
          ) : (
            <Link href={PUBLIC_ROUTES.SERVICES} className="group">
              <Button variant="outline" className={cn(
                "transition-colors btn-vynal-outline text-[10px]",
                isDarkMode ? "dark" : "light",
                "text-vynal-body/30"
              )}>
                <ArrowLeft className="h-3 w-3 mr-1 group-hover:-translate-x-1 transition-transform icon-vynal" aria-hidden="true" />
                Retour aux services
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
));
ServiceErrorView.displayName = 'ServiceErrorView';

/**
 * Composant de chargement (Skeleton)
 */
const ServiceLoadingView = React.memo(({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className="min-h-screen py-8">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="w-full aspect-video rounded-lg bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          <Card className={cn(
            "rounded-xl",
            isDarkMode 
              ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30"
              : "bg-white border-gray-200"
          )}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              <div className="space-y-2 mb-6">
                <Skeleton className="h-4 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                <Skeleton className="h-4 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                <Skeleton className="h-4 w-2/3 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              </div>
              <Skeleton className="h-24 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className={cn(
            "mb-4 rounded-xl",
            isDarkMode 
              ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30"
              : "bg-white border-gray-200"
          )}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              <Skeleton className="h-10 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-1/2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                <Skeleton className="h-8 w-1/2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn(
            "rounded-xl",
            isDarkMode 
              ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30"
              : "bg-white border-gray-200"
          )}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-3 w-20 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
));
ServiceLoadingView.displayName = 'ServiceLoadingView';

/**
 * Composant de partage modal
 */
const ShareModal = React.memo(({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  isClient, 
  copySuccess, 
  onCopy 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  isDarkMode: boolean, 
  isClient: boolean, 
  copySuccess: boolean, 
  onCopy: () => void 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className={cn(
          "w-full max-w-md rounded-lg p-6 relative card-vynal",
          isDarkMode ? "dark" : "light"
        )}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 hover:bg-gray-200/20"
        >
          <X className="h-5 w-5 text-vynal-body" />
        </button>
        
        <h3 className="text-lg font-bold mb-4 text-vynal-title">Partager ce service</h3>
        
        <div className="flex items-center">
          <input 
            type="text" 
            value={isClient ? window.location.href : ''}
            readOnly
            className={cn(
              "flex-1 px-3 py-2 rounded-l-md border-r-0 focus:outline-none",
              isDarkMode 
                ? "bg-vynal-purple-darkest/50 border-vynal-purple-secondary/50 text-white" 
                : "bg-gray-50 border-[#E0E0E0] text-[#2C1A4C]"
            )}
          />
          <button 
            onClick={onCopy}
            className={cn(
              "px-3 py-2 rounded-r-md font-medium focus:outline-none transition-colors",
              copySuccess ? (
                "bg-green-600 text-white"
              ) : (
                isDarkMode 
                  ? "bg-vynal-accent-primary text-vynal-purple-dark hover:bg-vynal-accent-secondary" 
                  : "bg-[#FF66B2] text-[#2C1A4C] hover:bg-[#FF007F]"
              )
            )}
          >
            {copySuccess ? "Copié !" : "Copier"}
          </button>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className={cn(
              "btn-vynal-outline",
              isDarkMode ? "dark" : "light"
            )}
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
});
ShareModal.displayName = 'ShareModal';

// Composant pour l'overlay flou
const BlurOverlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      aria-hidden="true"
    />
  );
};

/**
 * Composant d'information de service
 */
const ServiceInfo = React.memo(({ 
  category, 
  subcategory, 
  deliveryTime, 
  createdAt,
  isDarkMode,
  onShare,
  shareUrl,
  title,
  onCopyLink
}: { 
  category: any, 
  subcategory: any, 
  deliveryTime: number, 
  createdAt: string,
  isDarkMode: boolean,
  onShare?: () => void,
  shareUrl?: string,
  title?: string,
  onCopyLink?: () => void
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  return (
  <div className={cn(
    "flex flex-wrap gap-3 mb-5 py-3 px-3 rounded-lg border text-xs relative",
    isDarkMode 
      ? "bg-vynal-purple-darkest/30 border-vynal-purple-mid/20" 
      : "bg-gray-50 border-gray-200"
  )}>
    {/* Effet de flou d'arrière-plan quand le Popover est ouvert */}
    <BlurOverlay isOpen={isPopoverOpen} onClose={() => setIsPopoverOpen(false)} />
    
    {/* Icône de partage élégante et moderne avec Popover */}
    {onShare && (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "absolute top-3 right-3 p-1.5 rounded-full transition-colors z-10",
              isDarkMode
                ? "text-vynal-text-secondary hover:text-vynal-accent-primary hover:bg-vynal-purple-dark/60"
                : "text-gray-500 hover:text-[#FF66B2] hover:bg-gray-100/80"
            )}
            aria-label="Partager ce service"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-64 p-2 z-50 shadow-md border",
            isDarkMode 
              ? "bg-vynal-purple-dark border-vynal-purple-secondary/30 text-vynal-text-primary"
              : "bg-white border-gray-200 text-gray-800"
          )}
          align="end" 
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className={cn(
              "text-sm font-medium pb-1 border-b mb-2",
              isDarkMode
                ? "border-vynal-purple-secondary/40 text-vynal-text-primary"
                : "border-gray-200 text-[#2C1A4C]"
            )}>
              Partager ce service
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full p-0 border-blue-500/30 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl || window.location.href)}`, '_blank')}
              >
                <Facebook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full p-0 border-black/30 hover:border-black hover:bg-black/5 dark:border-white/30 dark:hover:border-white dark:hover:bg-white/10"
                onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl || window.location.href)}&text=${encodeURIComponent(`Découvrez ce service: ${title || 'Service'} sur Vynal Platform`)}`, '_blank')}
              >
                <X className="h-4 w-4 text-black dark:text-white" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full p-0 border-green-500/30 hover:border-green-500 hover:bg-green-50 dark:border-green-500/30 dark:hover:border-green-500 dark:hover:bg-green-900/20"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Découvrez ce service sur Vynal Platform: ${shareUrl || window.location.href}`)}`, '_blank')}
              >
                <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full p-0 border-blue-400/30 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-400/30 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl || window.location.href)}&text=${encodeURIComponent(`Découvrez ce service: ${title || 'Service'} sur Vynal Platform`)}`, '_blank')}
              >
                <Send className="h-4 w-4 text-blue-400 dark:text-blue-300" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full p-0 border-pink-500/30 hover:border-pink-500 hover:bg-pink-50 dark:border-pink-500/30 dark:hover:border-pink-500 dark:hover:bg-pink-900/20"
                onClick={() => window.open(`mailto:?subject=${encodeURIComponent(`Découvrez ce service sur Vynal Platform`)}&body=${encodeURIComponent(`Hey, je voulais partager ce service avec toi: ${title || 'Service'}\n${shareUrl || window.location.href}`)}`, '_blank')}
              >
                <Mail className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </Button>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "justify-start text-xs h-8",
                  isDarkMode
                    ? "border-vynal-purple-secondary/40 text-vynal-text-primary hover:bg-vynal-purple-secondary/20"
                    : "border-gray-200 text-[#2C1A4C] hover:bg-gray-100"
                )}
                onClick={onCopyLink}
              >
                <LinkIcon className={cn(
                  "h-3.5 w-3.5 mr-2", 
                  isDarkMode ? "text-vynal-accent-primary" : "text-[#FF66B2]"
                )} />
                Copier le lien
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )}
    
    {/* Catégorie */}
    <div className="flex items-center">
      <div className="w-3 flex justify-center">
        <Tag className="h-3 w-3 flex-shrink-0 icon-vynal" aria-hidden="true" />
      </div>
      <div className="flex items-center ml-0.5">
        <p className="text-[10px] mr-1 text-vynal-body">Catégorie:</p>
        <p className="text-[10px] font-medium truncate max-w-[120px] text-vynal-title">
          {category?.name || 'Non spécifiée'}
        </p>
      </div>
    </div>
    
    {/* Temps de livraison */}
    <div className="flex items-center">
      <div className="w-3 flex justify-center">
        <Clock className="h-3 w-3 flex-shrink-0 icon-vynal" aria-hidden="true" />
      </div>
      <div className="flex items-center ml-0.5">
        <p className="text-[10px] mr-1 text-vynal-body">Temps de livraison:</p>
        <p className="text-[10px] font-medium text-vynal-title">
          {deliveryTime} jour{Number(deliveryTime) > 1 ? 's' : ''}
        </p>
      </div>
    </div>
    
    {/* Date de création */}
    <div className="flex items-center">
      <div className="w-3 flex justify-center">
        <Calendar className="h-3 w-3 flex-shrink-0 icon-vynal" aria-hidden="true" />
      </div>
      <div className="flex items-center ml-0.5">
        <p className="text-[10px] mr-1 text-vynal-body">Créé le:</p>
        <p className="text-[10px] font-medium text-vynal-title">
          {formatDate(createdAt)}
        </p>
      </div>
    </div>
    
    {/* Sous-catégorie */}
    {subcategory && (
      <div className="flex items-center">
        <div className="w-3 flex justify-center">
          <FileText className="h-3 w-3 flex-shrink-0 icon-vynal" aria-hidden="true" />
        </div>
        <div className="flex items-center ml-0.5">
          <p className="text-[10px] mr-1 text-vynal-body">Sous-catégorie:</p>
          <p className="text-[10px] font-medium truncate max-w-[120px] text-vynal-title">
            {subcategory.name}
          </p>
        </div>
      </div>
    )}
  </div>
)});
ServiceInfo.displayName = 'ServiceInfo';

/**
 * Composant de garanties de service
 */
const ServiceGuarantees = React.memo(({ deliveryTime }: { deliveryTime: number }) => (
  <div className="pt-3 lg:pt-2">
    <ul className="space-y-2.5 lg:space-y-2 mt-2">
      <li className="flex items-center">
        <div className="w-4 flex justify-center">
          <Clock className="h-3 w-3 flex-shrink-0 icon-vynal" aria-hidden="true" />
        </div>
        <span className="text-xs ml-1.5 text-vynal-body">
          Livraison en {deliveryTime} jour{Number(deliveryTime) > 1 ? 's' : ''}
        </span>
      </li>
      <li className="flex items-center">
        <div className="w-4 flex justify-center">
          <MessageSquare className="h-3 w-3 flex-shrink-0 icon-vynal" aria-hidden="true" />
        </div>
        <span className="text-xs ml-1.5 text-vynal-body">Support personnalisé assuré</span>
      </li>
      <li className="flex flex-col">
        <div className="flex items-center">
          <div className="w-4 flex justify-center">
            <Shield className="h-3 w-3 flex-shrink-0 text-green-500" aria-hidden="true" />
          </div>
          <span className="text-xs ml-1.5 text-vynal-body">Paiement sécurisé</span>
        </div>
        <span className="text-[10px] ml-6 text-vynal-body">
          Vos informations sont chiffrées par TLS
        </span>
      </li>
    </ul>
  </div>
));
ServiceGuarantees.displayName = 'ServiceGuarantees';

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
  
  // === Hooks React et personnalisés ===
  const router = useRouter();
  const user = useUser();
  const { averageRating, reviewCount } = useFreelancerRating(service?.profiles?.id || '');
  const { toast } = useToast();
  
  // === Gestion du thème ===
  // Vérification du rendu côté client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Use theme only on client side to prevent hydration mismatches
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = isClient ? (resolvedTheme === 'dark' || theme === 'dark') : false;
  
  // === États locaux ===
  // États pour les interactions utilisateur
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // === Observers pour le chargement différé ===
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
  
  // === Données dérivées mémoïsées ===
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
  
  // Formattage du prix pour éviter les recalculs
  const formattedPrice = useMemo(() => 
    formatPrice(serviceMeta?.price || 0), 
  [serviceMeta?.price]);
  
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
                  : "text-[#A020F0]/30 fill-[#A020F0]/30"
              )} />
              
              {/* Étoile colorée (complète ou partielle) */}
              {(isFilled || isPartiallyFilled) && (
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ 
                    width: isFilled ? '100%' : `${fillPercentage}%` 
                  }}
                >
                  <Star className={cn(
                    "h-3.5 w-3.5",
                    isDarkMode 
                      ? "text-vynal-accent-primary fill-vynal-accent-primary"
                      : "text-[#A020F0] fill-[#A020F0]"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [averageRating, isDarkMode]);
  
  // === Handlers d'événements ===
  // Toggle favoris
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // Ici, vous pourriez ajouter une logique pour sauvegarder l'état dans l'API
  }, []);
  
  // Partage du service - optimisé avec moins de dépendances
  const handleShare = useCallback(() => {
    // L'API de partage Web est maintenant gérée via le Popover
    // La fonction reste pour la compatibilité
    if (!isClient) {
      setIsShareModalOpen(true);
    }
  }, [isClient]);
  
  // Copie du lien dans le presse-papier
  const copyToClipboard = useCallback(() => {
    if (!navigator.clipboard) return;
    
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setCopySuccess(true);
        
        // Afficher un toast pour informer l'utilisateur
        toast({
          title: "Lien copié",
          description: "Le lien du service a été copié dans le presse-papiers.",
          duration: 3000
        });
        
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie: ', err);
        
        // Toast d'erreur
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien.",
          variant: "destructive",
          duration: 3000
        });
      });
  }, [toast]);
  
  // Navigation optimisée
  const handleViewProfile = useCallback(() => {
    if (!serviceMeta?.freelance?.id) return;
    
    const path = user?.profile?.id === serviceMeta.freelance.id
      ? FREELANCE_ROUTES.PROFILE
      : serviceMeta.freelance.username 
        ? `/profile/${serviceMeta.freelance.username}` 
        : `/profile/id/${serviceMeta.freelance.id}`;
    
    router.push(path);
  }, [serviceMeta?.freelance?.id, serviceMeta?.freelance?.username, user?.profile?.id, router]);
  
  // === Rendu conditionnel ===
  // État de chargement - Composant optimisé avec Skeleton
  if (loading) {
    return (
      <ServiceLoadingView isDarkMode={isDarkMode} />
    );
  }

  // État d'erreur - Interface améliorée
  if (error || !service) {
    return (
      <ServiceErrorView error={error} onBack={onBack} isDarkMode={isDarkMode} />
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
      {false && !isFreelanceView && (
        <div className={cn(
          "h-32 sm:h-48 relative overflow-hidden",
          isDarkMode 
            ? "bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest" 
            : "bg-gradient-to-b from-indigo-100 to-white"
        )}>
          <div className={`absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center ${isDarkMode ? 'opacity-20' : 'opacity-0'}`}></div>
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
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative">
        {/* Fil d'Ariane - version publique - temporairement masqué */}
        {/* Pour réactiver, supprimez simplement ce commentaire et décommentez le bloc ci-dessous
        {!isFreelanceView && serviceMeta?.category && (
          <nav 
            className={cn(
              "flex items-center text-[10px] mb-2 rounded-lg p-1.5 border overflow-x-auto whitespace-nowrap",
              isDarkMode 
                ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 text-vynal-text-primary"
                : "bg-white border-[#E0E0E0] text-[#2C1A4C]"
            )}
            aria-label="Fil d'Ariane"
          >
            <Link href="/">Accueil</Link>
            <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" aria-hidden="true" />
            <Link href="/services">Services</Link>
            <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" aria-hidden="true" />
            <Link href={`/services?category=${serviceMeta?.category?.slug}`}>{serviceMeta?.category?.name}</Link>
            {serviceMeta?.subcategory && (
              <>
                <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" aria-hidden="true" />
                <Link href={`/services?category=${serviceMeta?.category?.slug}&subcategory=${serviceMeta?.subcategory?.slug}`}>
                  {serviceMeta?.subcategory?.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium truncate text-[10px]">{serviceMeta?.title}</span>
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
                    : "border-[#E0E0E0] bg-gray-100/50 text-[#2C1A4C] hover:bg-gray-200/50 hover:text-[#A020F0]"
                )}
                aria-label="Retour"
              >
                <ArrowLeft className={cn(
                  "h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform",
                  textStyles.accent(isDarkMode)
                )} />
                Retour
              </Button>
            )}
            
            <h1 className="text-2xl font-normal text-vynal-title">Détails du service</h1>
            
            {onEdit && (
              <Button onClick={onEdit} className={cn(
                "ml-auto transition-all btn-vynal-primary",
                isDarkMode ? "dark" : "light"
              )}>
                Modifier
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          {/* Partie gauche: informations principales du service */}
          <div className="md:col-span-2">
            {/* Galerie d'images du service */}
            <div className="mb-6 md:mb-7 lg:mb-8">
              {serviceMeta.hasImages ? (
                <ServiceImageGallery
                  images={serviceMeta.images}
                  altText={serviceMeta.title}
                  lazyLoadingEnabled={true}
                />
              ) : (
                <div className={cn(
                  "aspect-video rounded-lg flex items-center justify-center",
                  isDarkMode ? "bg-vynal-purple-secondary/10" : "bg-gray-50 border border-[#E0E0E0]"
                )}>
                  <ImageIcon className="h-10 w-10 md:h-12 md:w-12 text-vynal-body" aria-hidden="true" />
                  <span className="ml-2 text-vynal-body">Aucune image disponible</span>
                </div>
              )}
            </div>

            <Card className={cn(
              "card-vynal",
              isDarkMode ? "dark" : "light"
            )}>
              <CardContent className="p-4 sm:p-5 lg:p-6">
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
                    
                    <span className="text-xs text-vynal-body">ID: {serviceMeta.id}</span>
                  </div>
                )}

                {/* Titre du service */}
                <div className="mb-4 sm:mb-5">
                  <h1 
                    className="text-xl sm:text-2xl font-bold break-words text-vynal-title"
                    id="service-title"
                  >
                    {serviceMeta.title}
                  </h1>
                </div>
                
                {/* Informations principales */}
                <ServiceInfo 
                  category={serviceMeta.category}
                  subcategory={serviceMeta.subcategory}
                  deliveryTime={serviceMeta.delivery_time}
                  createdAt={serviceMeta.created_at}
                  isDarkMode={isDarkMode}
                  onShare={handleShare}
                  shareUrl={isClient ? window.location.href : ''}
                  title={serviceMeta.title}
                  onCopyLink={copyToClipboard}
                />
                
                {/* Description du service */}
                <div className="mb-3 md:mb-4">
                  <h2 className="text-base font-semibold mb-2 text-vynal-title">Description</h2>
                  <div className={cn(
                    "rounded-lg py-3 px-0",
                    isDarkMode ? "" : "bg-gray-50"
                  )}>
                    <div className="prose prose-sm max-w-none overflow-hidden break-words text-xs md:text-sm text-vynal-title">
                      {formattedDescription}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Partie droite: prix, actions, et info freelance */}
          <div className="md:col-span-1">
            <div className="md:sticky md:top-4 space-y-5 md:space-y-6">
              {/* Carte de prix et actions */}
              <Card className={cn(
                "card-vynal mt-5 md:mt-0", 
                isDarkMode ? "dark" : "light"
              )}>
                <div className={cn(
                  "p-4 border-b",
                  isDarkMode 
                    ? "bg-gradient-to-r from-vynal-purple-darkest to-vynal-purple-dark border-vynal-purple-mid/20" 
                    : "bg-gradient-to-r from-gray-50 to-white border-gray-200"
                )}>
                  <h2 className={cn(
                    "text-2xl font-bold",
                    isDarkMode ? "text-vynal-accent-primary" : "text-vynal-title"
                  )}>
                    {formattedPrice}
                  </h2>
                  <p className="text-xs text-vynal-body">Prix final, sans frais supplémentaires</p>
                </div>
                
                <CardContent className="p-5 lg:p-4">
                  <div className="space-y-4 mb-5">
                    <OrderButton
                      serviceId={serviceMeta.id}
                      price={Number(serviceMeta.price)}
                      showIcon={true}
                      fullWidth={true}
                      variant="default"
                      className={cn(
                        "btn-vynal-primary",
                        isDarkMode ? "dark" : "light",
                        "py-3 lg:py-2"
                      )}
                      customLabel="Commander ce service"
                    />
                    
                    {/* Bouton de messagerie déplacé ici */}
                    {serviceMeta.freelance && serviceMeta.freelance.id && (
                      <MessagingDialog 
                        freelanceId={serviceMeta.freelance.id}
                        freelanceName={serviceMeta.freelance.full_name || serviceMeta.freelance.username || 'Freelance'}
                        buttonVariant="outline"
                        className={cn(
                          "w-full text-xs inline-flex items-center justify-center rounded-md font-medium transition-colors h-10 px-4 py-2",
                          isDarkMode 
                            ? "border bg-vynal-purple-dark/30 text-vynal-accent-primary border-vynal-accent-primary/50 hover:bg-vynal-purple-secondary/30" 
                            : "border bg-white text-[#FF66B2] border-[#FF66B2]/50 hover:bg-gray-100"
                        )}
                      />
                    )}
                  </div>
                  
                  {/* Garanties du service */}
                  <ServiceGuarantees deliveryTime={serviceMeta.delivery_time} />
                </CardContent>
              </Card>
              
              {/* Informations sur le freelance */}
              <Card className={cn(
                "card-vynal", 
                isDarkMode ? "dark" : "light"
              )}>
                <div className={cn(
                  "p-5 lg:p-4",
                  isDarkMode 
                    ? "" 
                    : "bg-gradient-to-r from-gray-50 to-white"
                )}>
                  <h3 className="font-semibold mb-2 text-vynal-title">À propos du vendeur</h3>
                </div>
                
                <CardContent className="p-5 lg:p-4">
                  {/* Vérifier la présence des données du freelance */}
                  {serviceMeta.freelance && (
                    <>
                      <div className="flex items-center mb-3">
                        <Avatar className={cn(
                          "h-12 w-12 sm:h-14 sm:w-14 lg:h-12 lg:w-12 mr-3 border",
                          isDarkMode 
                            ? "border-vynal-purple-secondary/40"
                            : "border-gray-200"
                        )}>
                          <AvatarImage 
                            src={serviceMeta.freelance.avatar_url || undefined} 
                            alt={serviceMeta.freelance.username || 'Avatar du vendeur'} 
                            className="object-cover"
                          />
                          <AvatarFallback className={cn(
                            "text-sm",
                            isDarkMode ? "bg-vynal-accent-primary text-vynal-purple-dark" : "bg-[#FF66B2] text-[#2C1A4C]"
                          )}>
                            {freelanceInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <h3 className="text-sm sm:text-base truncate font-normal text-vynal-title">
                            {serviceMeta.freelance.full_name || serviceMeta.freelance.username || 'Vendeur'}
                          </h3>
                          <div className="flex items-center">
                            <p className="text-xs truncate text-vynal-body">
                              @{serviceMeta.freelance.username || 'username'}
                            </p>
                            
                            {/* Badge de certification */}
                            {serviceMeta.freelance.is_certified && serviceMeta.freelance.certification_type && (
                              <div className="ml-2">
                                <CertificationBadge 
                                  type={serviceMeta.freelance.certification_type as 'standard' | 'premium' | 'expert'} 
                                  size="sm"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Affichage de la note moyenne */}
                          <div className="flex items-center mt-1">
                            {ratingStars}
                            <span className="text-xs ml-1.5 font-medium text-vynal-body">
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
                          "mb-4 p-3 rounded-md",
                          isDarkMode ? "" : "bg-gray-50"
                        )}>
                          <h4 className="text-xs font-normal mb-1 text-vynal-title">À propos du vendeur</h4>
                          <p className="text-xs line-clamp-3 text-vynal-body">
                            {serviceMeta.freelance.bio}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-3 lg:space-y-2">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full text-xs inline-flex items-center justify-center rounded-md font-medium transition-colors h-10 px-4 py-2",
                              isDarkMode 
                                ? "border bg-vynal-purple-dark/30 text-vynal-title border-vynal-purple-secondary/50 hover:bg-vynal-purple-secondary/30" 
                                : "border bg-white text-vynal-title border-gray-200 hover:bg-gray-100"
                            )}
                            onClick={handleViewProfile}
                          >
                            <User className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 icon-vynal" aria-hidden="true" />
                            <span className="whitespace-nowrap">{user?.profile?.id === serviceMeta.freelance.id ? "Mon profil" : "Voir profil"}</span>
                          </Button>
                        </div>
                        
                        {serviceMeta.freelance.id && (
                          <Link 
                            href={
                              user?.profile?.id === serviceMeta.freelance.id
                                ? FREELANCE_ROUTES.SERVICES
                                : `/services?freelancer=${serviceMeta.freelance.id}`
                            } 
                            className="w-full block"
                          >
                            <Button 
                              variant="ghost" 
                              className={cn(
                                "w-full text-xs group",
                                isDarkMode
                                  ? "text-vynal-text-secondary hover:text-vynal-text-primary hover:bg-vynal-purple-secondary/20"
                                  : "text-[#2C1A4C] hover:text-[#2C1A4C] hover:bg-[#FF66B2]/10"
                              )} 
                              size="sm"
                            >
                              {user?.profile?.id === serviceMeta.freelance.id 
                                ? "Gérer mes services" 
                                : "Voir tous ses services"}
                              <ChevronRight className="h-3.5 w-3.5 ml-0.5 group-hover:translate-x-1 transition-transform icon-vynal" aria-hidden="true" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                  {!serviceMeta.freelance && (
                    <div className="text-center p-2 text-sm text-vynal-body">
                      <p>Information du vendeur non disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Ajout des avis sur le service - déplacé ici */}
              {!isFreelanceView && serviceMeta.id && (
                <div
                  ref={reviewsRef}
                  className="mt-0"
                >
                  {reviewsInView && (
                    <Suspense fallback={
                      <div className={cn(
                        "animate-pulse space-y-4",
                        textStyles.secondary(isDarkMode)
                      )}>
                        <div className="h-10 bg-gray-100 dark:bg-vynal-purple-secondary/30 rounded w-1/3"></div>
                        <div className="h-40 bg-gray-100 dark:bg-vynal-purple-secondary/30 rounded"></div>
                      </div>
                    }>
                      <ServiceReviews serviceId={serviceMeta.id} />
                    </Suspense>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Services connexes - uniquement en mode public */}
        {!isFreelanceView && serviceMeta.freelance?.id && (
          <div
            ref={relatedRef}
            className="mt-8 sm:mt-10 lg:mt-12"
          >
            <div className="mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg flex flex-wrap items-center text-vynal-title">
                <Package2 className={cn(
                  "h-5 w-5 mr-2",
                  textStyles.accent(isDarkMode)
                )} aria-hidden="true" />
                <span>Autres services de <span className="font-medium">{serviceMeta.freelance.full_name || serviceMeta.freelance.username}</span></span>
              </h2>
              <p className="text-xs sm:text-sm ml-7 text-vynal-body">Découvrez d'autres services proposés par ce vendeur</p>
            </div>
            
            {relatedInView && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {loadingRelated ? (
                  // Skeletons pour les services en chargement
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className={cn(
                      "overflow-hidden h-64 border",
                      isDarkMode 
                        ? "border-vynal-purple-secondary/30 bg-vynal-purple-dark/60" 
                        : "border-[#E0E0E0] bg-white"
                    )}>
                      <div className="h-32 animate-pulse bg-gray-100 dark:bg-vynal-purple-secondary/30"></div>
                      <CardContent className="p-3">
                        <Skeleton className="h-4 w-3/4 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-4 w-1/2 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-6 w-1/3 mt-4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
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
                            className="h-full"
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
                        textStyles.secondary(isDarkMode)
                      )} aria-hidden="true" />
                      <p className={cn(
                        "mb-1",
                        textStyles.secondary(isDarkMode)
                      )}>Ce vendeur n'a pas d'autres services pour le moment</p>
                      <p className={cn(
                        "text-sm",
                        textStyles.secondary(isDarkMode)
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
                            textStyles.accent(isDarkMode)
                          )} aria-hidden="true" />
                        </div>
                        <h3 className={cn(
                          "text-sm font-medium mb-1 group-hover:text-white transition-colors",
                          textStyles.title(isDarkMode)
                        )}>
                          Voir tous les services
                        </h3>
                        <p className={cn(
                          "text-xs group-hover:text-vynal-text-secondary transition-colors",
                          textStyles.secondary(isDarkMode)
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
      
      {/* Modal de partage simplifié pour optimiser les performances - Utilisé comme fallback */}
      {isShareModalOpen && (
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          isDarkMode={isDarkMode}
          isClient={isClient}
          copySuccess={copySuccess}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  );
};

export default ServiceView;