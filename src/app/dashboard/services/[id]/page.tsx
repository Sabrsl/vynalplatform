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
  const { getServiceById } = useServices();
  const { toast } = useToast();
  
  const [service, setService] = useState<ExtendedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Récupérer l'ID du service depuis les paramètres d'URL
  const serviceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);
  
  // Charger les détails du service
  useEffect(() => {
    async function loadServiceDetails() {
      if (!serviceId) {
        setError("Identifiant de service invalide");
        setLoading(false);
        return;
      }
      
      // Ne pas essayer de charger le service si le profil n'est pas chargé
      if (!profile) {
        return;
      }
      
      try {
        console.log("Chargement du service avec ID:", serviceId);
        
        // Appel direct à Supabase avec timeout et retry
        const fetchServiceWithRetry = async (retries = 3, delay = 1000) => {
          let attempt = 0;
          
          while (attempt < retries) {
            try {
              // Créer une Promise avec timeout
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Timeout lors de la récupération du service")), 8000);
              });
              
              // Faire la requête Supabase
              const supabasePromise = supabase
                .from('services')
                .select(`
                  *,
                  profiles!services_freelance_id_fkey (
                    id, 
                    username, 
                    full_name, 
                    avatar_url, 
                    email, 
                    role,
                    bio
                  ),
                  categories (id, name, slug),
                  subcategories (id, name, slug)
                `)
                .eq('id', serviceId)
                .single();
              
              // Utiliser Promise.race pour implémenter le timeout
              const result = await Promise.race([supabasePromise, timeoutPromise]) as any;
              
              if (result.error) {
                throw result.error;
              }
              
              return result.data;
            } catch (error: any) {
              console.warn(`Tentative ${attempt + 1} échouée:`, error);
              
              // Si c'est la dernière tentative, relancer l'erreur
              if (attempt === retries - 1) {
                throw error;
              }
              
              // Sinon, attendre et réessayer
              await new Promise(resolve => setTimeout(resolve, delay));
              attempt++;
            }
          }
          
          // Si on arrive ici, c'est qu'on a épuisé toutes les tentatives
          throw new Error("Impossible de récupérer le service après plusieurs tentatives");
        };
        
        const data = await fetchServiceWithRetry();
        
        if (!data) {
          throw new Error("Service non trouvé");
        }
        
        // Vérifier que le service appartient bien au freelancer connecté
        // On permet l'accès si c'est le propriétaire ou un admin
        const isOwnService = data.freelance_id === profile.id;
        const isAdmin = profile.role === 'admin';
        
        if (!isOwnService && !isAdmin) {
          throw new Error("Vous n'êtes pas autorisé à voir ce service");
        }
        
        console.log("Service chargé:", data);
        
        // Transformer les données
        const serviceData: ExtendedService = {
          ...data,
          profiles: data.profiles,
          categories: data.categories,
          subcategories: data.subcategories,
        };
        
        setService(serviceData);
      } catch (err: any) {
        console.error('Erreur lors du chargement du service:', err);
        setError(err.message || "Une erreur est survenue lors du chargement du service");
      } finally {
        setLoading(false);
      }
    }
    
    if (serviceId && profile) {
      loadServiceDetails();
    }
  }, [serviceId, profile]);
  
  // Rediriger si l'utilisateur n'est pas freelance
  useEffect(() => {
    if (profile && !isFreelance && profile.role !== 'admin') {
      router.push("/dashboard");
    }
  }, [profile, isFreelance, router]);
  
  // Handlers
  const handleBack = () => router.push("/dashboard/services");
  const handleView = () => service && router.push(`/services/${service.slug || service.id}`);
  const handleEdit = () => service && router.push(`/dashboard/services/edit/${service.id}`);
  const handleDelete = async () => {
    if (!service || !profile) return;
    
    setIsDeleteDialogOpen(false);
    
    try {
      console.log("Tentative de suppression du service:", service.id);
      
      // Vérifier que l'utilisateur est bien le propriétaire ou un admin
      if (service.freelance_id !== profile.id && profile.role !== 'admin') {
        throw new Error("Vous n'êtes pas autorisé à supprimer ce service");
      }
      
      // Supprimer les images associées au service
      if (service.images && service.images.length > 0) {
        // Extraire les noms de fichiers des URL
        const fileNames = service.images.map(url => {
          const parts = url.split('/');
          return parts[parts.length - 1];
        }).filter(Boolean);
        
        if (fileNames.length > 0) {
          console.log("Suppression des images:", fileNames);
          
          try {
            const { error: deleteImagesError } = await supabase.storage
              .from('services')
              .remove(fileNames);
              
            if (deleteImagesError) {
              console.warn("Erreur lors de la suppression des images:", deleteImagesError);
              // Continuer malgré l'erreur pour supprimer le service
            }
          } catch (err) {
            console.warn("Exception lors de la suppression des images:", err);
            // Continuer malgré l'erreur
          }
        }
      }
      
      // Supprimer le service directement avec Supabase
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);
        
      if (deleteError) {
        throw deleteError;
      }
      
      console.log("Service supprimé avec succès");
      
      toast({
        title: "Succès",
        description: "Service supprimé avec succès"
      });
      
      // Publier un événement personnalisé pour informer les autres composants
      window.dispatchEvent(new CustomEvent('vynal:service-deleted', { 
        detail: { 
          serviceId: service.id
        } 
      }));
      
      // Rediriger vers la liste des services
      router.push('/dashboard/services');
      
    } catch (err: any) {
      console.error("Erreur lors de la suppression du service:", err);
      
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue lors de la suppression du service",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container max-w-6xl mt-6 flex flex-col gap-6">
      <ServiceDetails 
        service={service as ExtendedService}
        loading={loading}
        error={error}
        onBack={handleBack}
        onView={handleView}
        onEdit={handleEdit}
        isFreelanceView={true}
      >
        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={handleEdit}
            variant="outline"
            className="flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
          
          <ConfirmDialog
            title="Supprimer le service"
            description="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
            confirmText="Supprimer"
            variant="destructive"
            onConfirm={handleDelete}
            trigger={
              <Button 
                variant="destructive" 
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Supprimer
              </Button>
            }
          />
        </div>
      </ServiceDetails>
    </div>
  );
} 