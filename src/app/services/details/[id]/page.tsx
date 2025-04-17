"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { supabase } from "@/lib/supabase/client";
import ServiceView from "@/components/services/ServiceView";

// Extension du type pour inclure les propriétés d'images
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
}

export default function PublicServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  
  const [service, setService] = useState<ExtendedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freelanceId, setFreelanceId] = useState<string | null>(null);
  
  // Récupérer l'ID du service depuis les paramètres d'URL
  const serviceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  // Récupérer les services connexes
  const [relatedServices, setRelatedServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  
  // Charger les détails du service
  useEffect(() => {
    async function loadServiceDetails() {
      if (!serviceId) {
        setError("Identifiant de service invalide");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setLoadingRelated(true);
      
      try {
        console.log("Chargement du service avec ID:", serviceId);
        
        // Appel direct à Supabase pour récupérer les données du service
        const { data, error: fetchError } = await supabase
          .from('services')
          .select(`
            *,
            profiles!services_freelance_id_fkey (
              id, 
              username, 
              full_name, 
              avatar_url,
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
        
        console.log("Service chargé:", data);
        console.log("Données du profil:", data.profiles);
        
        // Construire les données du service avec des valeurs par défaut si nécessaire
        const serviceDetails: ExtendedService = {
          ...data,
          // S'assurer que le profil est correctement formaté
          profiles: (() => {
            if (!data.profiles) {
              return {
                id: data.freelance_id || '',
                username: 'utilisateur',
                full_name: 'Utilisateur',
                avatar_url: null,
                bio: null
              };
            }
            // Si c'est un tableau, prendre le premier élément
            if (Array.isArray(data.profiles)) {
              console.log("Profiles est un tableau, prenant le premier élément");
              return data.profiles[0];
            }
            // Sinon retourner tel quel
            return data.profiles;
          })(),
          // S'assurer que les catégories sont correctement formatées
          categories: data.categories || {
            id: data.category_id || '',
            name: 'Catégorie',
            slug: 'categorie'
          },
          // Autres propriétés
          subcategories: data.subcategories || null,
          images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : [])
        };
        
        console.log("Service formaté pour l'affichage:", serviceDetails);
        console.log("Profile formaté:", serviceDetails.profiles);
        
        setService(serviceDetails);
        setError(null);
        
        // Charger les services connexes si le freelance_id est disponible
        if (data.freelance_id) {
          await loadRelatedServices(data.freelance_id, serviceId);
        } else {
          setLoadingRelated(false);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement du service:', err);
        setError(err.message || "Une erreur est survenue lors du chargement du service");
        setLoadingRelated(false);
      } finally {
        setLoading(false);
      }
    }
    
    if (serviceId) {
      loadServiceDetails();
    }
  }, [serviceId]);
  
  // Fonction pour charger les services connexes
  async function loadRelatedServices(freelanceId: string, currentServiceId: string) {
    try {
      console.log("Chargement des services connexes du freelance:", freelanceId);
      const { data: relatedData, error: relatedError } = await supabase
        .from('services')
        .select(`
          *,
          profiles!services_freelance_id_fkey (
            id, 
            username, 
            full_name, 
            avatar_url,
            bio
          ),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('freelance_id', freelanceId)
        .eq('active', true)
        .neq('id', currentServiceId)
        .limit(3);
        
      if (relatedError) {
        console.error("Erreur lors du chargement des services connexes:", relatedError);
      } else if (relatedData && Array.isArray(relatedData)) {
        console.log("Services connexes chargés:", relatedData.length);
        
        // Formater correctement chaque service connexe
        const formattedRelatedServices = relatedData.map(service => {
          // S'assurer que les profiles sont correctement formatés
          const profiles = Array.isArray(service.profiles) 
            ? service.profiles[0] 
            : service.profiles || {
                id: service.freelance_id || '',
                username: 'utilisateur',
                full_name: 'Utilisateur',
                avatar_url: null,
                bio: null
              };
              
          return {
            ...service,
            profiles,
            // S'assurer que les catégories sont correctement formatées
            categories: service.categories || {
              id: service.category_id || '',
              name: 'Catégorie',
              slug: 'categorie'
            },
            // Convertir les images en tableau si nécessaire
            images: Array.isArray(service.images) 
              ? service.images 
              : (service.images ? [service.images] : [])
          };
        });
        
        setRelatedServices(formattedRelatedServices as ServiceWithFreelanceAndCategories[]);
      }
    } catch (err) {
      console.error("Erreur inattendue lors du chargement des services connexes:", err);
    } finally {
      setLoadingRelated(false);
    }
  }
  
  // Retour à la liste des services
  const handleBack = () => router.push("/services");
  
  return (
    <ServiceView 
      service={service}
      loading={loading}
      error={error}
      isFreelanceView={false}
      relatedServices={relatedServices}
      loadingRelated={loadingRelated}
      onBack={handleBack}
    />
  );
} 