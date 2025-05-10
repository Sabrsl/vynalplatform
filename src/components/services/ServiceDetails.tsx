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
            "text-[10px] sm:text-xs py-0.5 px-2 flex items-center transition-all duration-200",
            isDarkMode
              ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 hover:border-amber-500/40"
              : "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 border-amber-500/30 hover:border-amber-500/40"
          )}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className={cn(
            "text-[10px] sm:text-xs py-0.5 px-2 flex items-center transition-all duration-200",
            isDarkMode
              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/40"
              : "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border-emerald-500/30 hover:border-emerald-500/40"
          )}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className={cn(
            "text-[10px] sm:text-xs py-0.5 px-2 flex items-center transition-all duration-200",
            isDarkMode
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40"
              : "bg-red-500/20 text-red-600 hover:bg-red-500/30 border-red-500/30 hover:border-red-500/40"
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
        <div className="flex items-center gap-3">
          {onBack && (
            <Button 
              variant="outline"
              onClick={onBack}
              className="flex items-center justify-center gap-1.5 w-full xs:w-auto text-[10px] sm:text-xs py-0.5 sm:py-1 h-7 sm:h-8"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              Retour
            </Button>
          )}
          <h1 className={cn(
            "text-lg sm:text-xl md:text-2xl font-bold tracking-tight",
            isDarkMode ? "text-vynal-text-primary" : "text-slate-800"
          )}>Détails</h1>
        </div>
        
        <div className="flex gap-2 mt-2 sm:mt-0">
          {onView && (
            <Button 
              variant="outline"
              onClick={onView}
              className={cn(
                "text-xs py-1 px-2.5 h-8 transition-all duration-200",
                isDarkMode 
                  ? "border-slate-700/30 hover:border-slate-700/50 bg-slate-900/20" 
                  : "border-slate-200 hover:border-slate-300 bg-white/25"
              )}
            >
              Voir sur le site
            </Button>
          )}
          {onEdit && (
            <Button 
              onClick={onEdit}
              className={cn(
                "text-xs py-1 px-2.5 h-8 transition-all duration-200",
                isDarkMode 
                  ? "bg-vynal-accent-primary/10 hover:bg-vynal-accent-primary/20 text-vynal-text-primary border-vynal-accent-primary/20" 
                  : "bg-vynal-accent-primary/10 hover:bg-vynal-accent-primary/15 text-slate-700 border-vynal-accent-primary/20"
              )}
            >
              Modifier
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <Card className={cn(
          "overflow-hidden border shadow-sm backdrop-blur-sm rounded-lg transition-all duration-200",
          isDarkMode 
            ? "bg-slate-900/30 border-slate-700/30" 
            : "bg-white/30 border-slate-200"
        )}>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <div className="max-w-full">
                  <CardTitle className={cn(
                    "break-words text-sm sm:text-lg md:text-xl font-normal",
                    isDarkMode ? "text-vynal-text-primary" : "text-slate-800"
                  )}>{service.title || "Sans titre"}</CardTitle>
                  <CardDescription className={cn(
                    "text-xs mt-2",
                    isDarkMode ? "text-vynal-text-secondary" : "text-slate-600"
                  )}>
                    ID: {service.id || "N/A"}
                  </CardDescription>
                </div>
                <div className={cn(
                  "text-base sm:text-lg text-right whitespace-nowrap mt-2 font-bold",
                  isDarkMode ? "text-vynal-accent-primary" : "text-slate-800"
                )}>
                  {formatPrice(service.price || 0)}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs py-0.5 px-2 flex items-center transition-all duration-200",
                    uiState.isActive 
                      ? isDarkMode
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/40"
                        : "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border-emerald-500/30 hover:border-emerald-500/40"
                      : isDarkMode
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40"
                        : "bg-red-500/20 text-red-600 hover:bg-red-500/30 border-red-500/30 hover:border-red-500/40"
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
                  "text-xs sm:text-sm md:text-base font-semibold mb-1.5",
                  isDarkMode ? "text-vynal-text-primary" : "text-slate-800"
                )}>Description</h3>
                <div className="p-2.5 sm:p-3 rounded-md whitespace-pre-wrap bg-white/20 dark:bg-slate-800/25">
                  <p className={cn(
                    "text-[10px] sm:text-xs break-words",
                    isDarkMode ? "text-vynal-text-secondary" : "text-slate-600"
                  )}>{service.description || "Aucune description disponible"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2">
                  <Tag className={cn(
                    "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0",
                    isDarkMode ? "text-vynal-accent-primary" : "text-vynal-accent-primary"
                  )} />
                  <div>
                    <p className={cn(
                      "text-[10px] sm:text-xs",
                      isDarkMode ? "text-vynal-text-secondary" : "text-slate-600"
                    )}>Catégorie</p>
                    <p className={cn(
                      "text-[10px] sm:text-xs font-normal",
                      isDarkMode ? "text-vynal-text-primary" : "text-slate-800"
                    )}>{service.categories?.name || "Non spécifiée"}</p>
                  </div>
                </div>
                
                {service.subcategories && (
                  <div className="flex items-center space-x-2">
                    <Tag className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0",
                      isDarkMode ? "text-vynal-accent-primary" : "text-vynal-accent-primary"
                    )} />
                    <div>
                      <p className={cn(
                        "text-[10px] sm:text-xs",
                        isDarkMode ? "text-vynal-text-secondary" : "text-slate-600"
                      )}>Sous-catégorie</p>
                      <p className={cn(
                        "text-[10px] sm:text-xs font-normal",
                        isDarkMode ? "text-vynal-text-primary" : "text-slate-800"
                      )}>{service.subcategories.name}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Clock className={cn(
                    "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0",
                    isDarkMode ? "text-vynal-accent-primary" : "text-vynal-accent-primary"
                  )} />
                  <div>
                    <p className={cn(
                      "text-[10px] sm:text-xs",
                      isDarkMode ? "text-vynal-text-secondary" : "text-slate-600"
                    )}>Livraison</p>
                    <p className={cn(
                      "text-[10px] sm:text-xs font-normal",
                      isDarkMode ? "text-vynal-text-primary" : "text-slate-800"
                    )}>{service.delivery_time || 0} jour{(service.delivery_time || 0) > 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className={cn(
                    "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0",
                    isDarkMode ? "text-vynal-accent-primary" : "text-vynal-accent-primary"
                  )} />
                  <div>
                    <p className={cn(
                      "text-[10px] sm:text-xs",
                      isDarkMode ? "text-vynal-text-secondary" : "text-slate-600"
                    )}>Créé le</p>
                    <p className={cn(
                      "text-[10px] sm:text-xs font-normal",
                      isDarkMode ? "text-vynal-text-primary" : "text-slate-800"
                    )}>{formatDate(service.created_at || new Date().toISOString())}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-vynal-text-primary mb-1.5">Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {service.images && service.images.length > 0 ? (
                    service.images.map((img, index) => (
                      <div 
                        key={index} 
                        className="aspect-video rounded-md overflow-hidden bg-white/20 dark:bg-slate-800/25"
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
                            e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22 width%3D%2224%22 height%3D%2224%22%3E%3Cpath fill%3D%22%23ccc%22 d%3D%22M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E';
                            e.currentTarget.classList.add('error-image');
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="aspect-video rounded-md flex items-center justify-center bg-white/20 dark:bg-slate-800/25">
                      <p className={cn(
                        "text-[10px] sm:text-xs",
                        isDarkMode ? "text-vynal-text-secondary" : "text-slate-600"
                      )}>Aucune image</p>
                    </div>
                  )}
                </div>
              </div>
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