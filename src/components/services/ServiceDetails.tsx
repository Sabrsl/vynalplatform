"use client";

import React, { useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
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
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { AlertCircle, ArrowLeft, Calendar, Clock, Tag, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { Loader } from "@/components/ui/loader";
import Image from 'next/image';

// Extension du type avec vérifications strictes pour la robustesse
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
  className?: string;
}

/**
 * Composant ServiceDetails optimisé pour l'affichage détaillé d'un service
 * - Support complet des thèmes clair/sombre
 * - Optimisations mobile avec design responsive
 * - Gestion robuste des erreurs et des données manquantes
 * - Performance améliorée avec mémoïsation
 * 
 * @author Modernisé et optimisé pour performance et fiabilité
 * @version 2.0.0
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
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // État local pour la gestion de l'état d'interface
  const uiState = useMemo(() => {
    return {
      isActive: service ? (service.active === true || String(service.active) === 'true') : false
    };
  }, [service?.active]);

  // Fonction utilitaire pour obtenir des classes CSS selon le thème
  const getThemeClasses = useCallback((darkClass: string, lightClass: string) => {
    return isDarkMode ? darkClass : lightClass;
  }, [isDarkMode]);

  // Fonction utilitaire pour obtenir le badge de statut de validation - mémoïsée pour éviter les recalculs
  const ValidationBadge = useMemo(() => {
    if (!service || !service.status) return null;
    
    const status = service.status;
    
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className={cn(
            "bg-amber-500/80 text-white hover:bg-amber-500 border-amber-500/50 text-xs py-0.5 px-2",
            "flex items-center"
          )}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className={cn(
            "bg-green-500/80 text-white hover:bg-green-500 border-green-500/50 text-xs py-0.5 px-2",
            "flex items-center"
          )}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className={cn(
            "bg-red-500/80 text-white hover:bg-red-500 border-red-500/50 text-xs py-0.5 px-2",
            "flex items-center"
          )}>
            <XCircle className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return null;
    }
  }, [service]);
  
  // Rendu conditionnel pour état de chargement
  if (loading || !service) {
    return (
      <div className={cn("p-2 sm:p-4", className)}>
        <Card className={cn(
          "overflow-hidden border shadow-md rounded-lg",
          isDarkMode 
            ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30" 
            : "bg-white border-gray-200"
        )}>
          <CardContent className="p-4 flex items-center justify-center h-40">
            <p className={cn(
              "text-center",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>Chargement des détails du service...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rendu conditionnel pour erreur
  if (error) {
    return (
      <div className={cn("p-2 sm:p-4", className)}>
        <Card className={cn(
          "overflow-hidden border shadow-md rounded-lg",
          isDarkMode 
            ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30" 
            : "bg-white border-gray-200"
        )}>
          <CardContent className="p-4 flex items-center justify-center min-h-[160px]">
            <p className={cn(
              "text-center text-red-500",
              isDarkMode ? "text-red-400" : "text-red-600"
            )}>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Rendu principal du composant
  return (
    <div className={cn("p-2 sm:p-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className={cn(
                "mr-2 p-1.5 h-auto transition-colors",
                isDarkMode 
                  ? "text-vynal-text-primary hover:bg-vynal-purple-secondary/20 hover:text-vynal-accent-primary" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
              )}
              aria-label="Retour"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Retour</span>
            </Button>
          )}
          <h1 className={cn(
            "text-lg sm:text-xl md:text-2xl font-bold tracking-tight",
            isDarkMode ? "text-vynal-text-primary" : "text-gray-900"
          )}>Détails</h1>
        </div>
        
        <div className="flex gap-2 mt-2 sm:mt-0">
          {onView && (
            <Button 
              variant="outline"
              onClick={onView}
              className={cn(
                "text-xs py-1 px-2.5 h-8 transition-colors",
                isDarkMode 
                  ? "border-vynal-purple-secondary/30 hover:border-vynal-purple-light/50 bg-vynal-purple-secondary/20" 
                  : "border-gray-200 hover:border-indigo-200 bg-gray-50"
              )}
            >
              Voir sur le site
            </Button>
          )}
          {onEdit && (
            <Button 
              onClick={onEdit}
              className={cn(
                "text-xs py-1 px-2.5 h-8 transition-colors",
                isDarkMode 
                  ? "bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              Modifier
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <Card className={cn(
          "overflow-hidden border shadow-md rounded-lg",
          isDarkMode 
            ? "bg-vynal-purple-dark/90 border-vynal-purple-secondary/30" 
            : "bg-white border-gray-200"
        )}>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <div className="max-w-full">
                  <CardTitle className={cn(
                    "break-words text-sm sm:text-lg md:text-xl font-normal",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>{service.title || "Sans titre"}</CardTitle>
                  <CardDescription className="text-xs mt-2">
                    ID: {service.id || "N/A"}
                  </CardDescription>
                </div>
                <div className={cn(
                  "text-base sm:text-lg text-right whitespace-nowrap mt-2",
                  isDarkMode ? "text-vynal-accent-primary" : "text-indigo-600"
                )}>
                  {formatPrice(service.price || 0)} FCFA
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs py-0.5 px-2 flex items-center",
                    uiState.isActive 
                      ? "bg-vynal-status-success/80 text-white hover:bg-vynal-status-success border-vynal-status-success/50" 
                      : "bg-vynal-status-warning/80 text-white hover:bg-vynal-status-warning border-vynal-status-warning/50"
                  )}
                >
                  {uiState.isActive ? "Actif" : "Inactif"}
                </Badge>
                
                {ValidationBadge}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className={cn(
                  "text-sm sm:text-base font-normal mb-1.5",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>Description</h3>
                <div className={cn(
                  "p-2.5 sm:p-3 rounded-md whitespace-pre-wrap",
                  isDarkMode ? "bg-slate-800/60" : "bg-slate-50"
                )}>
                  <p className={cn(
                    "text-xs break-words",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>{service.description || "Aucune description disponible"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2">
                  <Tag className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0",
                    isDarkMode ? "text-indigo-400" : "text-indigo-600"
                  )} />
                  <div>
                    <p className={cn(
                      "text-[10px] sm:text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>Catégorie</p>
                    <p className={cn(
                      "text-xs sm:text-sm font-normal",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>{service.categories?.name || "Non spécifiée"}</p>
                  </div>
                </div>
                
                {service.subcategories && (
                  <div className="flex items-center space-x-2">
                    <Tag className={cn(
                      "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0",
                      isDarkMode ? "text-indigo-400" : "text-indigo-600"
                    )} />
                    <div>
                      <p className={cn(
                        "text-[10px] sm:text-xs",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>Sous-catégorie</p>
                      <p className={cn(
                        "text-xs sm:text-sm font-normal",
                        isDarkMode ? "text-white" : "text-gray-900"
                      )}>{service.subcategories.name}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Clock className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0",
                    isDarkMode ? "text-indigo-400" : "text-indigo-600"
                  )} />
                  <div>
                    <p className={cn(
                      "text-[10px] sm:text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>Livraison</p>
                    <p className={cn(
                      "text-xs sm:text-sm font-normal",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>{service.delivery_time || 0} jour{(service.delivery_time || 0) > 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0",
                    isDarkMode ? "text-indigo-400" : "text-indigo-600"
                  )} />
                  <div>
                    <p className={cn(
                      "text-[10px] sm:text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>Créé le</p>
                    <p className={cn(
                      "text-xs sm:text-sm font-normal",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>{formatDate(service.created_at || new Date().toISOString())}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className={cn(
                  "text-sm sm:text-base font-normal mb-1.5",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {service.images && service.images.length > 0 ? (
                    service.images.map((img, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "aspect-video rounded-md overflow-hidden",
                          isDarkMode ? "bg-slate-800" : "bg-slate-100"
                        )}
                      >
                        <Image 
                          src={img} 
                          alt={`Image ${index + 1} du service`} 
                          className="w-full h-full object-cover"
                          width={500}
                          height={300}
                          unoptimized
                          loading={index < 4 ? "eager" : "lazy"}
                          onError={(e) => {
                            // Fallback en cas d'erreur d'image
                            e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22 width%3D%2224%22 height%3D%2224%22%3E%3Cpath fill%3D%22%23ccc%22 d%3D%22M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E';
                            e.currentTarget.classList.add('error-image');
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className={cn(
                      "aspect-video rounded-md flex items-center justify-center",
                      isDarkMode ? "bg-slate-800" : "bg-slate-100"
                    )}>
                      <p className={cn(
                        "text-xs",
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      )}>Aucune image</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Commentaires de modération (si présents) */}
              {service.moderation_comment && (
                <div className={cn(
                  "p-3 rounded-md border",
                  isDarkMode 
                    ? "bg-amber-900/20 border-amber-800/30" 
                    : "bg-amber-50 border-amber-200"
                )}>
                  <h4 className={cn(
                    "text-xs font-semibold mb-1 flex items-center",
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  )}>
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Commentaire de modération
                  </h4>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-amber-200" : "text-amber-700"
                  )}>{service.moderation_comment}</p>
                </div>
              )}
              
              {/* Notes d'administration (si présentes et en vue admin) */}
              {isFreelanceView && service.admin_notes && (
                <div className={cn(
                  "p-3 rounded-md border",
                  isDarkMode 
                    ? "bg-blue-900/20 border-blue-800/30" 
                    : "bg-blue-50 border-blue-200"
                )}>
                  <h4 className={cn(
                    "text-xs font-semibold mb-1",
                    isDarkMode ? "text-blue-300" : "text-blue-800"
                  )}>Notes administratives</h4>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-blue-200" : "text-blue-700"
                  )}>{service.admin_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Contenu enfant optionnel */}
      {children && (
        <div className="space-y-2 sm:space-y-3 mt-3">{children}</div>
      )}
    </div>
  );
};

export default ServiceDetails;