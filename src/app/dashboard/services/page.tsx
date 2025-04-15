"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Plus, PenSquare, Trash2, Clock, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const [services, setServices] = useState<ServiceWithFreelanceAndCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { deleteService } = useServices();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Rediriger si l'utilisateur n'est pas freelance
  useEffect(() => {
    if (profile && !isFreelance) {
      router.push("/dashboard");
    }
  }, [profile, isFreelance, router]);

  // Charger les services lorsque le profil est disponible
  useEffect(() => {
    async function loadServices() {
      if (profile?.id) {
        try {
          setLoading(true);
          setError(null);
          
          // Utiliser directement supabase pour récupérer les services
          const { data, error: fetchError } = await supabase
            .from('services')
            .select(`
              *,
              profiles (id, username, full_name, avatar_url),
              categories (id, name, slug),
              subcategories (id, name, slug)
            `)
            .eq('freelance_id', profile.id);
          
          if (fetchError) throw fetchError;
          
          // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
          const transformedServices = data.map((service: any) => ({
            ...service,
            profiles: service.profiles,
            categories: service.categories,
            subcategories: service.subcategories,
          }));
          
          setServices(transformedServices);
        } catch (err: any) {
          console.error('Erreur lors du chargement des services:', err);
          setError(err.message || 'Une erreur est survenue lors du chargement des services');
        } finally {
          setLoading(false);
        }
      }
    }
    
    if (profile) {
      loadServices();
    }
  }, [profile]);

  // Souscrire aux changements des services en temps réel
  useEffect(() => {
    if (!profile?.id) return;
    
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
        filter: `freelance_id=eq.${profile.id}`
      }, () => {
        // Recharger les services quand il y a un changement
        loadServices(profile.id);
      })
      .subscribe();
    
    return () => {
      servicesSubscription.unsubscribe();
    };
  }, [profile]);

  // Fonction pour charger les services (pour la mise à jour en temps réel)
  const loadServices = async (profileId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('freelance_id', profileId);
      
      if (fetchError) throw fetchError;
      
      // Transformer les données
      const transformedServices = data.map((service: any) => ({
        ...service,
        profiles: service.profiles,
        categories: service.categories,
        subcategories: service.subcategories,
      }));
      
      setServices(transformedServices);
    } catch (err: any) {
      console.error('Erreur lors du chargement des services:', err);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.")) {
      setIsDeleting(serviceId);
      setDeleteError(null);
      
      try {
        const result = await deleteService(serviceId);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // Mettre à jour la liste des services après suppression
        setServices(services.filter((service) => service.id !== serviceId));
      } catch (err: any) {
        setDeleteError(err.message || "Une erreur est survenue lors de la suppression du service");
        console.error("Erreur lors de la suppression du service:", err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div>
      {/* Afficher le titre et le bouton d'ajout uniquement s'il y a des services */}
      {services.length > 0 && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Mes services</h1>
          <Button onClick={() => router.push("/dashboard/services/new")}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un service
          </Button>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 p-4 rounded-md flex items-start mb-6 text-red-800">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{deleteError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : services.length === 0 ? (
        <Card className="mt-10">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <h3 className="text-xl font-medium text-gray-800 mb-4">Vous n'avez pas encore de services</h3>
            <p className="text-gray-500 mb-8 text-center">Créez votre premier service et commencez à recevoir des commandes</p>
            <Button size="lg" onClick={() => router.push("/dashboard/services/new")}>
              <Plus className="mr-2 h-5 w-5" /> Créer mon premier service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className={!service.active ? "opacity-70" : undefined}>
              {/* Image du service (placeholder pour l'instant) */}
              <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-gray-500">Photo du service</span>
                </div>
                {!service.active && (
                  <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                    Inactif
                  </div>
                )}
              </div>
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-2">{service.title}</CardTitle>
                <CardDescription className="text-sm flex items-center mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1" /> Livraison en {service.delivery_time} jours
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-gray-500 line-clamp-3">{service.description}</p>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <span className="font-semibold text-indigo-700">{formatPrice(service.price)} FCFA</span>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/services/edit/${service.id}`)}
                  >
                    <PenSquare className="h-4 w-4" />
                    <span className="sr-only">Modifier</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteService(service.id)}
                    disabled={isDeleting === service.id}
                  >
                    {isDeleting === service.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 