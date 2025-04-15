"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
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
import { AlertCircle, ArrowLeft, Calendar, Clock, Loader2, Tag, User } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const { getServiceById } = useServices();
  
  const [service, setService] = useState<ServiceWithFreelanceAndCategories | null>(null);
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
        const serviceData = {
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/dashboard/services")} 
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
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
          <Button 
            variant="ghost" 
            onClick={() => router.push("/dashboard/services")} 
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
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
  
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/dashboard/services")} 
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Détails du service</h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push(`/services/${service.slug}`)}
            className="w-full sm:w-auto"
          >
            Voir sur le site
          </Button>
          <Button 
            onClick={() => router.push(`/dashboard/services/edit/${service.id}`)}
            className="w-full sm:w-auto"
          >
            Modifier
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <CardTitle className="break-words">{service.title}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap items-center mt-1 gap-2">
                      <Badge variant={service.active ? "default" : "secondary"} className={service.active ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}>
                        {service.active ? "Actif" : "Inactif"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ID: {service.id}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <div className="text-2xl font-bold text-left sm:text-right">
                  {formatPrice(service.price)} FCFA
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                    <p className="text-sm text-gray-700 break-words">{service.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Tag className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Catégorie</p>
                      <p className="font-medium">{service.categories?.name || "Non spécifiée"}</p>
                    </div>
                  </div>
                  
                  {service.subcategories && (
                    <div className="flex items-center space-x-3">
                      <Tag className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sous-catégorie</p>
                        <p className="font-medium">{service.subcategories.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Délai de livraison</p>
                      <p className="font-medium">{service.delivery_time} jour(s)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date de création</p>
                      <p className="font-medium">{formatDate(service.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations du prestataire</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage 
                    src={profile?.avatar_url || service.profiles?.avatar_url || ""} 
                    alt={profile?.full_name || "Prestataire"} 
                  />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0) || "F"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {profile?.full_name || "Prestataire"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{profile?.username || "freelancer"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {service.profiles?.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Biographie</p>
                    <p className="text-sm mt-1 break-words">
                      {service.profiles.bio}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">Vues</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">Commandes</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 