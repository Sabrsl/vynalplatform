import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice, formatDate } from "@/lib/utils";
import { AlertCircle, ArrowLeft, Calendar, Clock, Tag, CheckCircle, XCircle } from "lucide-react";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  delivery_time?: number;
  moderation_comment?: string;
  admin_notes?: string | null;
}

interface ServiceDetailsProps {
  service: ExtendedService;
  onBack?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  isFreelanceView?: boolean;
  loading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}

// Fonction utilitaire pour obtenir le badge de statut de validation
const getValidationBadge = (status?: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-amber-500/80 text-white hover:bg-amber-500 border-amber-500/50 text-xs py-0.5 px-2">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-500/80 text-white hover:bg-green-500 border-green-500/50 text-xs py-0.5 px-2">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approuvé
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="bg-red-500/80 text-white hover:bg-red-500 border-red-500/50 text-xs py-0.5 px-2">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeté
        </Badge>
      );
    default:
      return null;
  }
};

/**
 * Composant réutilisable pour afficher les détails d'un service (version freelance)
 */
const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  service,
  onBack,
  onView,
  onEdit,
  isFreelanceView = true,
  loading = false,
  error = null,
  children,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-7 w-7 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-2 sm:p-4">
        <div className="flex items-center mb-4">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mr-2 sm:mr-4 p-1.5 sm:p-2 h-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs">Retour</span>
            </Button>
          )}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Détails du service</h1>
        </div>
        
        <Card>
          <CardContent className="pt-4 px-3 sm:p-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="p-2 sm:p-4">
        <div className="flex items-center mb-4">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mr-2 sm:mr-4 p-1.5 sm:p-2 h-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs">Retour</span>
            </Button>
          )}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Service non trouvé</h1>
        </div>
        
        <Card>
          <CardContent className="pt-4 px-3 sm:p-4">
            <p className="text-xs sm:text-sm">Le service demandé n'existe pas ou a été supprimé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Vérifier si le service a des images valides
  const hasImages = service.images && 
                  Array.isArray(service.images) && 
                  service.images.length > 0;
  
  // S'assurer que active est toujours un booléen pour éviter les problèmes de rendu
  const isActive = typeof service.active === 'string' 
    ? service.active === 'true' 
    : Boolean(service.active);
  
  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mr-2 p-1.5 h-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Retour</span>
            </Button>
          )}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Détails</h1>
        </div>
        
        <div className="flex gap-2 mt-2 sm:mt-0">
          {onView && (
            <Button 
              variant="outline"
              onClick={onView}
              className="text-xs py-1 px-2.5 h-8"
            >
              Voir sur le site
            </Button>
          )}
          {onEdit && (
            <Button 
              onClick={onEdit}
              className="text-xs py-1 px-2.5 h-8"
            >
              Modifier
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <div className="max-w-full">
                  <CardTitle className="break-words text-sm sm:text-lg md:text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    ID: {service.id}
                  </CardDescription>
                </div>
                <div className="text-base sm:text-lg font-bold text-right whitespace-nowrap">
                  {formatPrice(service.price)} FCFA
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge 
                  variant="outline" 
                  className={`
                    text-xs py-0.5 px-2
                    ${isActive 
                      ? "bg-vynal-status-success/80 text-white hover:bg-vynal-status-success border-vynal-status-success/50" 
                      : "bg-vynal-status-warning/80 text-white hover:bg-vynal-status-warning border-vynal-status-warning/50"}
                  `}
                >
                  {isActive ? "Actif" : "Inactif"}
                </Badge>
                
                {getValidationBadge(service.status)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-medium mb-1.5">Description</h3>
                <div className="bg-muted dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-md whitespace-pre-wrap">
                  <p className="text-xs text-gray-700 dark:text-gray-300 break-words">{service.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2">
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Catégorie</p>
                    <p className="text-xs sm:text-sm font-medium">{service.categories?.name || "Non spécifiée"}</p>
                  </div>
                </div>
                
                {service.subcategories && (
                  <div className="flex items-center space-x-2">
                    <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Sous-catégorie</p>
                      <p className="text-xs sm:text-sm font-medium">{service.subcategories.name}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Livraison</p>
                    <p className="text-xs sm:text-sm font-medium">{service.delivery_time || 0} jour{(service.delivery_time || 0) > 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Créé le</p>
                    <p className="text-xs sm:text-sm font-medium">{formatDate(service.created_at)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm sm:text-base font-medium mb-1.5">Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {hasImages ? (
                    service.images?.map((img, index) => (
                      <div 
                        key={index} 
                        className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden"
                      >
                        <img 
                          src={img} 
                          alt={`Image ${index + 1} du service`} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Aucune image</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {children && (
        <div className="space-y-2 sm:space-y-3 mt-3">{children}</div>
      )}
    </div>
  );
};

export default ServiceDetails;