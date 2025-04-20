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
        
        // Appel direct à Supabase pour éviter les problèmes potentiels
        const { data, error: fetchError } = await supabase
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
        
        if (fetchError) {
          console.error("Erreur Supabase:", fetchError);
          throw new Error(fetchError.message);
        }
        
        if (!data) {
          throw new Error("Service non trouvé");
        }
        
        // Vérifier que le service appartient bien au freelancer connecté
        if (profile && data.freelance_id !== profile.id && profile.role !== 'admin') {
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
  const handleView = () => service && router.push(`/services/${service.id}`);
  const handleEdit = () => service && router.push(`/dashboard/services/edit/${service.id}`);
  const handleDelete = () => {
    setIsDeleteDialogOpen(false)
    // Add your service deletion logic here
    console.log('Service deleted')
    router.push('/dashboard/services')
  }
  
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
            onConfirm={() => {
              console.log("Service deleted");
              toast({
                title: "Succès",
                description: "Service supprimé avec succès"
              });
              router.push('/dashboard/services');
            }}
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