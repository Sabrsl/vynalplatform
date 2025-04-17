"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { validate as isUUID } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { ServiceCard } from '@/components/services/ServiceCard';
import ServiceView from '@/components/services/ServiceView';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ServiceDetailPage() {
  // États pour gérer le chargement et les erreurs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<any>(null);
  const [relatedServices, setRelatedServices] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Obtenir le paramètre slug ou id de l'URL
  const params = useParams<{ slug: string }>();
  const slugOrId = params?.slug as string;

  useEffect(() => {
    async function fetchServiceData() {
      if (!slugOrId) {
        setError("Identifiant de service manquant");
        setIsLoading(false);
        return;
      }

      try {
        // Vérifier si le slug est un UUID
        const isIdUUID = isUUID(slugOrId);
        console.log("Le paramètre est un UUID:", isIdUUID);

        // Requête Supabase conditionnelle
        let query = supabase
          .from('services')
          .select(`
            *,
            categories(*),
            profiles(*)
          `);

        // Filtrer soit par ID soit par slug
        query = isIdUUID 
          ? query.eq('id', slugOrId) 
          : query.eq('slug', slugOrId);

        // Exécuter la requête
        const { data: serviceData, error: serviceError } = await query.single();

        if (serviceError) {
          console.error("Erreur lors de la récupération du service:", serviceError);
          setError("Service introuvable");
          setIsLoading(false);
          return;
        }

        if (!serviceData) {
          setError("Service introuvable");
          setIsLoading(false);
          return;
        }

        // Enrichir les données du service avec des valeurs par défaut si nécessaire
        const enrichedService = {
          ...serviceData,
          profiles: serviceData.profiles || {
            id: serviceData.freelance_id || '',
            username: 'utilisateur',
            full_name: 'Utilisateur',
            avatar_url: null
          },
          categories: serviceData.categories || null,
          images: Array.isArray(serviceData.images) ? serviceData.images : (serviceData.images ? [serviceData.images] : [])
        };

        setService(enrichedService);
        setError(null);

        // Charger les services connexes
        if (enrichedService.profiles?.id) {
          await loadRelatedServices(enrichedService.profiles.id, enrichedService.id);
        } else {
          setLoadingRelated(false);
        }
      } catch (err) {
        console.error("Erreur inattendue:", err);
        setError("Une erreur est survenue lors du chargement des détails du service");
        setLoadingRelated(false);
      } finally {
        setIsLoading(false);
      }
    }

    // Fonction pour charger les services connexes
    async function loadRelatedServices(freelanceId: string, currentServiceId: string) {
      try {
        console.log("Chargement des services connexes du freelance:", freelanceId);
        const { data: relatedData, error: relatedError } = await supabase
          .from('services')
          .select(`
            *,
            profiles (*),
            categories (*)
          `)
          .eq('profiles.id', freelanceId)
          .eq('active', true)
          .neq('id', currentServiceId)
          .limit(3);

        if (relatedError) {
          console.error("Erreur lors du chargement des services connexes:", relatedError);
        } else if (relatedData && Array.isArray(relatedData)) {
          console.log("Services connexes chargés:", relatedData.length);
          setRelatedServices(relatedData);
        }
      } catch (err) {
        console.error("Erreur inattendue lors du chargement des services connexes:", err);
      } finally {
        setLoadingRelated(false);
      }
    }

    // Lancer la récupération des données
    setIsLoading(true);
    fetchServiceData();
  }, [slugOrId]);

  // Rendu pour l'état de chargement
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/services" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-[400px] w-full mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Rendu pour l'état d'erreur
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/services" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-8 flex flex-col items-center justify-center">
          <AlertTriangle className="text-red-500 h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Service introuvable</h2>
          <p className="text-red-600 text-center mb-4">{error}</p>
          <Button asChild variant="default">
            <Link href="/services">Parcourir tous les services</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Rendu pour afficher les détails du service
  return (
    <div className="bg-gradient-to-b from-indigo-50/50 to-white min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/services" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Link>
        </div>
        
        {service && (
          <ServiceView 
            service={service}
            loading={false}
            error={null}
            isFreelanceView={false}
            relatedServices={relatedServices}
            loadingRelated={loadingRelated}
          />
        )}
      </div>
    </div>
  );
} 