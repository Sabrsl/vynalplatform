"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { supabase } from "@/lib/supabase/client";
import ServiceDetails from "@/components/services/ServiceDetails";

// Extension du type pour inclure les propriétés d'images
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
}

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const { getServiceById } = useServices();
  
  const [service, setService] = useState<ExtendedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer l'ID du service depuis les paramètres d'URL
  const serviceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
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
  
  return (
    <ServiceDetails 
      service={service as ExtendedService}
      loading={loading}
      error={error}
      onBack={handleBack}
      onView={handleView}
      onEdit={handleEdit}
      isFreelanceView={true}
    />
  );
} 