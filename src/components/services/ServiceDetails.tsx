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
import { AlertCircle, ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  delivery_time?: number;
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
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">Détails du service</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 p-4 rounded-md flex items-start mb-6 text-red-800">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">Service non trouvé</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <p>Le service demandé n'existe pas ou a été supprimé.</p>
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
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mr-2 sm:mr-4 p-2 sm:p-3 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Retour</span>
            </Button>
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Détails du service</h1>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-0">
          {onView && (
            <Button 
              variant="outline"
              onClick={onView}
              className="w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-3 sm:px-4 h-auto"
            >
              Voir sur le site
            </Button>
          )}
          {onEdit && (
            <Button 
              onClick={onEdit}
              className="w-full sm:w-auto text-sm sm:text-base py-1 sm:py-2 px-3 sm:px-4 h-auto"
            >
              Modifier
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="max-w-full">
                  <CardTitle className="break-words text-lg sm:text-xl md:text-2xl">{service.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Service ID: {service.id}
                  </CardDescription>
                  <div className="flex flex-wrap items-center mt-1 gap-2">
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className={`
                        text-xs sm:text-sm py-0.5 px-2
                        ${isActive 
                          ? "bg-green-100 text-green-800 hover:bg-green-200" 
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}
                      `}
                    >
                      {isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-left sm:text-right whitespace-nowrap mt-2 sm:mt-0">
                  {formatPrice(service.price)} FCFA
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-2">Description</h3>
                  <div className="bg-muted p-3 sm:p-4 rounded-md whitespace-pre-wrap">
                    <p className="text-xs sm:text-sm text-gray-700 break-words">{service.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Catégorie</p>
                      <p className="text-sm sm:text-base font-medium">{service.categories?.name || "Non spécifiée"}</p>
                    </div>
                  </div>
                  
                  {service.subcategories && (
                    <div className="flex items-center space-x-3">
                      <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Sous-catégorie</p>
                        <p className="text-sm sm:text-base font-medium">{service.subcategories.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Temps de livraison</p>
                      <p className="text-sm sm:text-base font-medium">{service.delivery_time || 0} jour{(service.delivery_time || 0) > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Créé le</p>
                      <p className="text-sm sm:text-base font-medium">{formatDate(service.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-2">Images</h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {hasImages ? (
                      service.images?.map((img, index) => (
                        <div 
                          key={index} 
                          className="aspect-video bg-slate-100 rounded-md overflow-hidden"
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
                      <div className="aspect-video bg-slate-100 rounded-md flex items-center justify-center">
                        <p className="text-xs sm:text-sm text-slate-500">Aucune image disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Statistiques</CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-muted p-2 sm:p-3 rounded-md">
                  <p className="text-xs sm:text-sm text-muted-foreground">Vues</p>
                  <p className="text-xl sm:text-2xl font-bold">-</p>
                </div>
                
                <div className="bg-muted p-2 sm:p-3 rounded-md">
                  <p className="text-xs sm:text-sm text-muted-foreground">Commandes</p>
                  <p className="text-xl sm:text-2xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {children && (
        <div className="space-y-3 sm:space-y-4">{children}</div>
      )}
    </div>
  );
};

export default ServiceDetails;