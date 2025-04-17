"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Calendar, Clock, FileText, Upload, AlertCircle, ArrowRight } from "lucide-react";
import { FileUpload } from "@/components/orders/FileUpload";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

interface OrderFormProps {
  serviceId: string;
}

interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: number;
  images?: string[];
  profiles?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    rating?: number;
  };
}

export function OrderForm({ serviceId }: OrderFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUser();
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(true);
  const [service, setService] = useState<ServiceData | null>(null);
  const [requirements, setRequirements] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorFading, setErrorFading] = useState(false);
  const [isOwnService, setIsOwnService] = useState(false);

  // Effet pour faire disparaître les messages d'erreur après quelques secondes
  useEffect(() => {
    if (error) {
      // Attendre 3 secondes avant de commencer à faire disparaître le message
      const fadeTimer = setTimeout(() => {
        setErrorFading(true);
        
        // Attendre 1 seconde pour l'animation avant de supprimer complètement le message
        const removeTimer = setTimeout(() => {
          setError(null);
          setErrorFading(false);
        }, 1000);
        
        return () => clearTimeout(removeTimer);
      }, 3000);
      
      return () => clearTimeout(fadeTimer);
    }
  }, [error]);

  // Charger les données du service
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId) return;
      
      setLoadingService(true);
      try {
        // Appel direct à Supabase pour récupérer les données du service
        const { data, error: fetchError } = await supabase
          .from('services')
          .select(`
            *,
            profiles!services_freelance_id_fkey (
              id, 
              username, 
              full_name, 
              avatar_url
            )
          `)
          .eq('id', serviceId)
          .single();
        
        if (fetchError) {
          console.error("Erreur lors de la récupération du service:", fetchError);
          throw new Error(fetchError.message);
        }
        
        if (!data) {
          throw new Error("Service non trouvé");
        }
        
        // Vérifier si l'utilisateur est le propriétaire du service
        if (profile && data.freelance_id === profile.id) {
          setIsOwnService(true);
          setError("Vous ne pouvez pas commander votre propre service");
        }
        
        // Récupérer la note moyenne du prestataire si disponible
        let rating = 0;
        if (data.freelance_id) {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('freelance_id', data.freelance_id);
            
          if (!reviewsError && reviewsData && reviewsData.length > 0) {
            rating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
          }
        }
        
        // Formater les données du service
        const serviceData: ServiceData = {
          ...data,
          profiles: data.profiles ? {
            ...data.profiles,
            rating: rating
          } : undefined
        };
        
        setService(serviceData);
      } catch (err: any) {
        console.error("Erreur lors du chargement du service:", err);
        setError(err.message || "Impossible de charger les détails du service");
      } finally {
        setLoadingService(false);
      }
    };
    
    fetchServiceData();
  }, [serviceId, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Empêcher la commande si c'est le propre service de l'utilisateur
    if (isOwnService) {
      setError("Vous ne pouvez pas commander votre propre service");
      return;
    }
    
    if (!requirements.trim()) {
      setError("Veuillez fournir des instructions pour cette commande");
      return;
    }

    if (!deliveryDate) {
      setError("Veuillez sélectionner une date de livraison souhaitée");
      return;
    }

    setLoading(true);

    try {
      // Préparation des données de la commande pour le sessionStorage
      const orderData = {
        service_id: serviceId,
        requirements,
        delivery_date: deliveryDate,
        has_files: files && files.length > 0
      };
      
      // Stockage des données temporaire dans le sessionStorage
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
      
      // Redirection vers la page de paiement
      router.push(`/dashboard/orders/payment?serviceId=${serviceId}`);
    } catch (err: any) {
      console.error("Erreur lors de la préparation de la commande", err);
      setError("Une erreur s'est produite lors de la préparation de la commande: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  if (loadingService) {
    return (
      <Card className="relative min-h-[300px] flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        <p className="text-sm text-gray-500 mt-2">Chargement des détails du service...</p>
      </Card>
    );
  }

  if (!service) {
    return (
      <Card className="border-red-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Service non disponible</h3>
            <p className="text-sm text-gray-500 mt-1">
              Impossible de charger les détails de ce service. Veuillez réessayer ultérieurement.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mt-4"
            >
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Détails de votre commande</CardTitle>
          <CardDescription>
            Veuillez fournir toutes les informations nécessaires pour votre projet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alerte si c'est le propre service de l'utilisateur */}
          {isOwnService && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <p className="text-sm">Vous ne pouvez pas commander votre propre service.</p>
              </div>
            </div>
          )}
          
          {/* Résumé du service */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                {service?.images && service.images.length > 0 ? (
                  <Image 
                    src={service.images[0]} 
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 text-gray-900">
                  {service?.title}
                </h3>
                <div className="flex items-center mt-1 text-xs text-gray-600">
                  <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  <span>Livraison: {service?.delivery_time || 1} jour{(service?.delivery_time || 1) > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    {service?.profiles?.rating && (
                      <>
                        <svg className="h-3.5 w-3.5 text-amber-500 fill-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span className="text-xs ml-1 font-medium">{service?.profiles?.rating.toFixed(1) || "-"}</span>
                      </>
                    )}
                  </div>
                  <div className="text-indigo-700 font-semibold">
                    {formatPrice(service?.price || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className={`bg-red-50 p-2 rounded-md flex items-start gap-2 text-red-700 text-xs mb-3 max-h-20 overflow-y-auto transition-opacity duration-1000 ${errorFading ? 'opacity-0' : 'opacity-100'}`}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="requirements" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Instructions du projet
            </Label>
            <Textarea
              id="requirements"
              placeholder="Décrivez précisément ce que vous attendez du prestataire..."
              rows={5}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <FileUpload
              onChange={(files) => setFiles(files)}
              label="Documents & Ressources"
              description="Glissez-déposez ou cliquez pour téléverser"
              multiple={true}
              maxFiles={5}
              maxSize={10}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery-date" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Date de livraison souhaitée
            </Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Retour
          </Button>
          <Button 
            type="submit" 
            disabled={loading || isOwnService}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Chargement...
              </>
            ) : (
              <>
                Continuer au paiement
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 