"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { ServiceSummary } from "@/components/orders/ServiceSummary";
import { OrderForm } from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Loader, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function NewOrderPage() {
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get("serviceId");
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwnService, setIsOwnService] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (isFreelance) {
      router.push("/dashboard");
      return;
    }

    // Récupérer les données du service depuis l'API
    const fetchService = async () => {
      setLoading(true);
      try {
        if (!serviceId) {
          setError("Aucun service n'a été spécifié");
          return;
        }
        
        // Appel à Supabase pour récupérer les données du service
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
          return;
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
        setService({
          ...data,
          profiles: data.profiles ? {
            ...data.profiles,
            rating: rating
          } : undefined
        });
      } catch (err: any) {
        console.error("Erreur lors de la récupération du service", err);
        setError(err.message || "Une erreur s'est produite lors du chargement du service");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [user, router, serviceId, profile, isFreelance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isOwnService) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Vous ne pouvez pas commander votre propre service
              </h2>
              <p className="text-gray-600 mb-6">
                En tant que prestataire, vous ne pouvez pas acheter les services que vous proposez.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => router.push('/dashboard/services')} className="mx-2">
                  Retour à mes services
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/services')} 
                  className="mx-2"
                >
                  Explorer d'autres services
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Service introuvable"}
          </h2>
          <p className="text-slate-600 mb-6">
            Impossible de charger les détails du service demandé.
          </p>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Commander un service</h1>
        <p className="text-slate-600 flex items-center mt-1">
          <Clock className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Délai de traitement estimé: 24-48h après la validation de votre commande
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ServiceSummary service={service} />
        </div>
        
        <div className="lg:col-span-2">
          <OrderForm serviceId={service.id} />
        </div>
      </div>
    </div>
  );
} 