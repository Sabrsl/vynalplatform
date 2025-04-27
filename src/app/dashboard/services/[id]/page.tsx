"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { supabase } from "@/lib/supabase/client";
import ServiceDetails from "@/components/services/ServiceDetails";
import { ArrowLeftIcon, CopyIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from "@/components/ui/use-toast";

// Extension du type pour inclure les propriétés d'images
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
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
  
  // Récupérer l'ID du service depuis les paramètres d'URL
  const serviceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    // Éviter la redirection prématurée pendant le chargement initial
    // et permettre à l'authentification de se terminer correctement
    if (loading) return;
    
    // Attendre un court instant avant de vérifier l'authentification
    // pour permettre à Auth de réinitialiser son état
    const timer = setTimeout(() => {
      if (!user && !loading) {
        router.push("/login");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user, router, loading]);
  
  // Charger les détails du service avec gestion des erreurs améliorée
  useEffect(() => {
    let isMounted = true; // Indicateur pour éviter les mises à jour sur composant démonté
    
    async function loadServiceDetails() {
      if (!serviceId) {
        if (isMounted) {
          setError("Identifiant de service invalide");
          setLoading(false);
        }
        return;
      }
      
      // Ne pas essayer de charger le service si le profil n'est pas chargé
      if (!profile) {
        return;
      }
      
      try {
        console.log("Chargement du service avec ID:", serviceId);
        
        // Utiliser le hook getServiceById au lieu d'appeler directement Supabase
        const { service: serviceData, error: serviceError } = await getServiceById(serviceId);
        
        // Vérifier si le composant est toujours monté avant de mettre à jour l'état
        if (!isMounted) return;
        
        if (serviceError) {
          console.error("Erreur lors du chargement du service:", serviceError);
          throw new Error(serviceError);
        }
        
        if (!serviceData) {
          throw new Error("Service non trouvé");
        }
        
        // Les vérifications de permission sont déjà faites dans getServiceById
        // Vérifier si le service est valide et contient les données nécessaires
        if (!serviceData.profiles || !serviceData.profiles.id) {
          console.warn("Service incomplet: données de profil manquantes");
          // Créer un profil par défaut si manquant pour éviter les erreurs d'affichage
          serviceData.profiles = {
            id: serviceData.freelance_id || '',
            username: 'utilisateur',
            full_name: 'Utilisateur',
            avatar_url: null,
            bio: null,
            email: null,
            role: null
          };
        }
        
        // Les vérifications de permission sont déjà faites dans getServiceById
        // Nous vérifions quand même ici pour plus de sécurité côté client
        if (profile && serviceData.profiles.id !== profile.id && profile.role !== 'admin') {
          console.warn("Vous n'êtes pas autorisé à voir ce service");
          setError("Vous n'êtes pas autorisé à voir ce service");
          setLoading(false);
          return;
        }
        
        console.log("Service chargé:", serviceData);
        setService(serviceData as ExtendedService);
      } catch (err: any) {
        if (isMounted) {
          console.error('Erreur lors du chargement du service:', err);
          setError(err.message || "Une erreur est survenue lors du chargement du service");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    if (serviceId && profile) {
      loadServiceDetails();
    }
    
    // Fonction de nettoyage
    return () => {
      isMounted = false;
    };
  }, [serviceId, profile, getServiceById]);
  
  // Rediriger si l'utilisateur n'est pas freelance
  useEffect(() => {
    if (profile && !isFreelance && profile.role !== 'admin') {
      router.push("/dashboard");
    }
  }, [profile, isFreelance, router]);
  
  // Handlers
  const handleBack = () => router.push("/dashboard/services");
  const handleView = () => {
    // Utiliser l'ID du service directement s'il existe, au lieu d'attendre le chargement du service
    const idToUse = serviceId || (service && service.id);
    if (idToUse) {
      router.push(`/services/${idToUse}`);
    } else {
      console.error("Impossible d'afficher ce service: ID manquant");
    }
  };
  const handleEdit = () => {
    // Utiliser l'ID du service directement s'il existe
    const idToUse = serviceId || (service && service.id);
    if (idToUse) {
      router.push(`/dashboard/services/edit/${idToUse}`);
    } else {
      console.error("Impossible d'éditer ce service: ID manquant");
    }
  };
  
  return (
    <div className="container px-4 sm:px-6 md:max-w-6xl mt-4 sm:mt-6 flex flex-col gap-4 sm:gap-6">
      <ServiceDetails 
        service={service as ExtendedService}
        loading={loading}
        error={error}
        onBack={handleBack}
        onView={handleView}
        onEdit={handleEdit}
        isFreelanceView={true}
      >
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 mt-3 sm:mt-4">
          <Button
            onClick={handleEdit}
            variant="outline"
            className="flex items-center justify-center gap-2 w-full xs:w-auto"
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
          
          <ConfirmDialog
            title="Supprimer le service"
            description="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
            confirmText="Supprimer"
            variant="destructive"
            onConfirm={async () => {
              if (!serviceId) return;
              
              try {
                setIsDeleting(true);
                
                // Appeler la fonction de suppression du service
                const result = await deleteService(serviceId);
                
                if (!result.success) {
                  throw new Error(result.error || "Erreur lors de la suppression du service");
                }
                
                toast({
                  title: "Succès",
                  description: "Service supprimé avec succès"
                });
                
                // Attendre un court instant avant de rediriger pour que le toast s'affiche
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
            trigger={
              <Button 
                variant="destructive" 
                className="flex items-center justify-center gap-2 w-full xs:w-auto"
                disabled={isDeleting}
              >
                <TrashIcon className="h-4 w-4" />
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            }
          />
        </div>
      </ServiceDetails>
    </div>
  );
} 