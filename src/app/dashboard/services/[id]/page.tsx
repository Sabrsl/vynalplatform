"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories, invalidateServiceCache } from "@/hooks/useServices";
import { supabase } from "@/lib/supabase/client";
import ServiceDetails from "@/components/services/ServiceDetails";
import { ArrowLeftIcon, PencilIcon, TrashIcon, LockIcon, AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Extension du type pour inclure les propriétés d'images
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  moderation_comment?: string;
  admin_notes?: string | null;
}

export default function ServiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const { getServiceById, deleteService } = useServices();
  const { toast } = useToast();
  
  const [service, setService] = useState<ExtendedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPendingValidation, setIsPendingValidation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Références pour éviter les rechargements redondants
  const lastRefreshTime = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);
  const supabaseChannel = useRef<any>(null);
  
  // Récupérer l'ID du service depuis les paramètres d'URL
  const serviceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  // Charger les détails du service avec gestion des erreurs améliorée
  const loadServiceDetails = async (force = false) => {
    if (!serviceId || !profile) return;
    
    // Limiter la fréquence des actualisations (pas plus d'une fois toutes les 2 secondes)
    const now = Date.now();
    if (!force && !isInitialLoad.current && now - lastRefreshTime.current < 2000) {
      console.log("Actualisation ignorée (trop fréquente)");
      return;
    }
    
    lastRefreshTime.current = now;
    
    try {
      if (isInitialLoad.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      console.log("Chargement du service avec ID:", serviceId);
      
      // Utiliser le hook getServiceById au lieu d'appeler directement Supabase
      const { service: serviceData, error: serviceError } = await getServiceById(serviceId);
      
      if (serviceError) {
        console.error("Erreur lors du chargement du service:", serviceError);
        throw new Error(serviceError);
      }
      
      if (!serviceData) {
        throw new Error("Service non trouvé");
      }
      
      // Vérifier si le service est en attente de validation
      setIsPendingValidation(serviceData.status === 'pending');
      
      // Vérifier les permissions une dernière fois côté client
      if (profile && serviceData.profiles.id !== profile.id && profile.role !== 'admin') {
        console.warn("Vous n'êtes pas autorisé à voir ce service");
        setError("Vous n'êtes pas autorisé à voir ce service");
        return;
      }
      
      setService(serviceData as ExtendedService);
      setLastUpdateTime(new Date());
      isInitialLoad.current = false;
    } catch (err: any) {
      console.error('Erreur lors du chargement du service:', err);
      setError(err.message || "Une erreur est survenue lors du chargement du service");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Chargement initial des données
  useEffect(() => {
    if (profile && serviceId) {
      loadServiceDetails(true);
    }
  }, [serviceId, profile]);
  
  // Configurer la souscription aux mises à jour en temps réel
  useEffect(() => {
    if (!serviceId || typeof window === 'undefined') return;
    
    // Nettoyer tout abonnement existant
    if (supabaseChannel.current) {
      supabase.removeChannel(supabaseChannel.current);
    }
    
    // Fonction pour gérer les mises à jour de statut
    const handleStatusChange = (event: CustomEvent) => {
      if (!event.detail) return;
      
      const { serviceId: updatedServiceId, status, active } = event.detail;
      
      // Ignorer les événements qui ne concernent pas notre service
      if (updatedServiceId !== serviceId) return;
      
      console.log(`Mise à jour de statut reçue: ${status}, actif: ${active}`);
      
      // Mettre à jour notre état local sans recharger complètement
      setService(prevService => {
        if (!prevService) return null;
        
        const updatedService = {
          ...prevService,
          status,
          active: typeof active === 'string' ? active === 'true' : Boolean(active)
        };
        
        // Mettre à jour le statut de validation
        setIsPendingValidation(status === 'pending');
        setLastUpdateTime(new Date());
        
        return updatedService;
      });
      
      // Notification à l'utilisateur
      toast({
        title: "Service mis à jour",
        description: `Le statut du service a été mis à jour (${status})`,
        variant: "default"
      });
    };
    
    // Créer le canal Supabase
    supabaseChannel.current = supabase
      .channel(`service-detail-${serviceId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'services',
          filter: `id=eq.${serviceId}`
        }, 
        async (payload) => {
          console.log("Changement Supabase détecté:", payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            // Vérifier si des propriétés importantes ont changé
            const shouldReload = service && (
              payload.new.status !== service.status ||
              payload.new.active !== service.active ||
              payload.new.moderation_comment !== service.moderation_comment ||
              payload.new.admin_notes !== service.admin_notes
            );
            
            if (shouldReload) {
              // Actualiser seulement si nécessaire et pas trop fréquemment
              const now = Date.now();
              if (now - lastRefreshTime.current > 2000) {
                lastRefreshTime.current = now;
                console.log("Rechargement du service suite à une mise à jour");
                loadServiceDetails();
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setError("Ce service a été supprimé");
            toast({
              title: "Service supprimé",
              description: "Ce service n'existe plus",
              variant: "destructive"
            });
          }
        })
      .subscribe();
    
    // Ajouter l'écouteur d'événements pour les changements de statut
    window.addEventListener('vynal:service-status-change', handleStatusChange as EventListener);
    
    // Nettoyer à la désinscription
    return () => {
      window.removeEventListener('vynal:service-status-change', handleStatusChange as EventListener);
      
      if (supabaseChannel.current) {
        supabase.removeChannel(supabaseChannel.current);
        supabaseChannel.current = null;
      }
    };
  }, [serviceId, service, toast]);
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, router, loading]);
  
  // Rediriger si l'utilisateur n'est pas freelance
  useEffect(() => {
    if (!loading && profile && !isFreelance && profile.role !== 'admin') {
      router.push("/dashboard");
    }
  }, [profile, isFreelance, router, loading]);
  
  // Handlers
  const handleBack = () => router.push("/dashboard/services");
  const handleView = () => {
    const idToUse = serviceId || (service && service.id);
    if (idToUse) {
      router.push(`/services/${idToUse}`);
    }
  };
  
  const handleEdit = () => {
    // Si le service est en attente de validation et que l'utilisateur n'est pas admin, bloquer l'édition
    if (isPendingValidation && profile?.role !== 'admin') {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas modifier un service en cours de validation par l'équipe de modération.",
        variant: "destructive"
      });
      return;
    }
    
    const idToUse = serviceId || (service && service.id);
    if (idToUse) {
      router.push(`/dashboard/services/edit/${idToUse}`);
    }
  };
  
  // Fonction pour actualiser manuellement les données du service
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Forcer l'actualisation
      await loadServiceDetails(true);
      toast({
        title: "Succès",
        description: "Informations du service actualisées"
      });
    } catch (err) {
      console.error("Erreur lors de l'actualisation:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les informations du service",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="container px-2 sm:px-3 md:px-4 lg:px-6 md:max-w-6xl mt-2 sm:mt-3 md:mt-4 flex flex-col gap-2 sm:gap-3 md:gap-4">
      {/* Notifications spécifiques selon le statut du service et s'il a un commentaire de modération */}
      {service && service.status === 'rejected' && (service.moderation_comment || service.admin_notes) && (
        <div className="mb-2 sm:mb-3 p-2.5 sm:p-3 md:p-4 rounded-md bg-red-100 border border-red-300">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-1.5 sm:mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-red-800 mb-0.5 sm:mb-1">Votre service a été rejeté par la modération</h4>
              <p className="text-xs sm:text-sm text-red-700 mb-1.5 sm:mb-2">{service.moderation_comment || service.admin_notes}</p>
              <p className="text-[10px] sm:text-xs text-red-600">Vous pouvez modifier votre service pour corriger les problèmes signalés et le soumettre à nouveau.</p>
            </div>
          </div>
        </div>
      )}
      
      {service && service.status === 'approved' && (service.moderation_comment || service.admin_notes) && (
        <div className="mb-2 sm:mb-3 p-2.5 sm:p-3 md:p-4 rounded-md bg-green-100 border border-green-300">
          <div className="flex items-start">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-1.5 sm:mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-green-800 mb-0.5 sm:mb-1">Votre service a été approuvé</h4>
              <p className="text-xs sm:text-sm text-green-700">{service.moderation_comment || service.admin_notes}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Avertissement de modération seulement si pas de notification spécifique */}
      {profile && profile.role !== 'admin' && service && service.status === 'pending' && (
        <div className="mb-2 sm:mb-3 p-2.5 sm:p-3 md:p-4 rounded-md bg-amber-100 border border-amber-300">
          <div className="flex items-start">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 mr-1.5 sm:mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-amber-800 mb-0.5 sm:mb-1">Service en attente de modération</h4>
              <p className="text-xs sm:text-sm text-amber-700 mb-1.5 sm:mb-2">Votre service est actuellement en cours d'examen par notre équipe de modération.</p>
              {service && (service.moderation_comment || service.admin_notes) && (
                <div className="mt-1.5 sm:mt-2 pl-3 sm:pl-4 border-l-2 border-amber-300">
                  <p className="text-[10px] sm:text-xs text-amber-800 mb-0.5">Commentaire de modération:</p>
                  <p className="text-xs sm:text-sm text-amber-700">{service.moderation_comment || service.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-1.5 sm:mb-2 px-0.5 sm:px-1">
        <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
          {lastUpdateTime && (
            <span>MAJ: {lastUpdateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="h-6 sm:h-7 text-[9px] sm:text-[10px] py-0 px-1.5 sm:px-2 flex items-center gap-1 text-vynal-purple-dark hover:text-vynal-purple-dark/80 dark:text-slate-400 dark:hover:text-slate-100"
        >
          {isRefreshing ? (
            <>
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin">⟳</span>
              Actualisation...
            </>
          ) : (
            <>
              <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Actualiser
            </>
          )}
        </Button>
      </div>
      
      <ServiceDetails 
        service={service as ExtendedService}
        loading={loading}
        error={error}
        onBack={handleBack}
        onView={handleView}
        onEdit={handleEdit}
        isFreelanceView={true}
      >
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
          {isPendingValidation && profile?.role !== 'admin' ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-1.5 w-full xs:w-auto text-[10px] sm:text-xs py-0.5 sm:py-1 h-7 sm:h-8 text-vynal-purple-dark/30 hover:text-vynal-purple-dark/30 dark:text-slate-400/50 dark:hover:text-slate-400/50"
                    disabled
                  >
                    <LockIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    Modifier
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[10px] sm:text-xs p-2 max-w-[200px]">
                  <p>Ce service est en cours de validation et ne peut pas être modifié pour le moment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={handleEdit}
              variant="outline"
              className="flex items-center justify-center gap-1.5 w-full xs:w-auto text-[10px] sm:text-xs py-0.5 sm:py-1 h-7 sm:h-8 text-vynal-purple-dark hover:text-vynal-purple-dark/90 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              Modifier
            </Button>
          )}
          
          <Button 
            variant="destructive" 
            className="flex items-center justify-center gap-1.5 w-full xs:w-auto text-[10px] sm:text-xs py-0.5 sm:py-1 h-7 sm:h-8 text-white hover:text-white/80"
            disabled={isDeleting}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </ServiceDetails>
      
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 max-w-[425px] w-full mx-4">
            <div className="space-y-4">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-vynal-purple-dark dark:text-slate-100">
                Confirmation de suppression
              </h3>
              <p className="text-[10px] sm:text-xs text-vynal-purple-dark/80 dark:text-slate-400">
                Voulez-vous vraiment supprimer ce service ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="text-[10px] sm:text-xs text-vynal-purple-dark hover:text-vynal-purple-dark/80 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!serviceId) return;
                    
                    try {
                      setIsDeleting(true);
                      setIsDeleteDialogOpen(false);
                      
                      const result = await deleteService(serviceId);
                      
                      if (!result.success) {
                        throw new Error(result.error || "Erreur lors de la suppression du service");
                      }
                      
                      toast({
                        title: "Succès",
                        description: "Service supprimé avec succès"
                      });
                      
                      setTimeout(() => {
                        router.push('/dashboard/services');
                      }, 500);
                    } catch (err: any) {
                      console.error("Erreur lors de la suppression:", err);
                      toast({
                        title: "Erreur",
                        description: err.message || "Une erreur est survenue lors de la suppression",
                        variant: "destructive"
                      });
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="text-[10px] sm:text-xs text-white hover:text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Confirmer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 