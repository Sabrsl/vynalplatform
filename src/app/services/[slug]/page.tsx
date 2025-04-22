"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { validate as isUUID } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import ServiceCard from '@/components/services/ServiceCard';
import ServiceView from '@/components/services/ServiceView';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function ServiceDetailContent() {
  // États pour gérer le chargement et les erreurs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<any>(null);
  const [relatedServices, setRelatedServices] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Obtenir le paramètre slug ou id de l'URL
  const params = useParams<{ slug: string }>();
  const slugOrId = params?.slug as string;

  // Fonction pour récupérer les données du service
  const fetchServiceData = async () => {
    if (!slugOrId) {
      setError("Identifiant de service manquant");
      setIsLoading(false);
      return;
    }

    try {
      // Vérifier si le slug est un UUID
      const isIdUUID = isUUID(slugOrId);
      
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
  };

  // Fonction pour charger les services connexes
  const loadRelatedServices = async (freelanceId: string, currentServiceId: string) => {
    try {
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
        setRelatedServices(relatedData);
      }
    } catch (err) {
      console.error("Erreur inattendue lors du chargement des services connexes:", err);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Effet pour charger les données initiales
  useEffect(() => {
    setIsLoading(true);
    fetchServiceData();
  }, [slugOrId]);

  // Écouter les événements d'invalidation du cache pour rafraîchir les données
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCacheInvalidation = () => {
      if (service) {
        // Rafraîchir les données du service sans montrer l'état de chargement complet
        fetchServiceData();
      }
    };
    
    // Écouter l'événement d'invalidation du cache
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    };
  }, [service]);

  // Rendu pour l'état de chargement
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 bg-vynal-purple-dark/90 text-vynal-text-primary rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
        <div className="mb-6">
          <Link href="/services" className="inline-flex items-center text-vynal-text-primary hover:text-vynal-accent-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-[400px] w-full mb-4 bg-vynal-purple-secondary/30" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-vynal-purple-secondary/30" />
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <Skeleton className="h-8 w-3/4 mb-4 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-6 w-1/2 mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-32 w-full mb-6 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30" />
          </div>
        </div>
      </div>
    );
  }

  // Rendu pour l'état d'erreur
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 bg-vynal-purple-dark/90 text-vynal-text-primary rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
        <div className="mb-6">
          <Link href="/services" className="inline-flex items-center text-vynal-text-primary hover:text-vynal-accent-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Link>
        </div>
        
        <div className="bg-vynal-purple-dark/50 border border-vynal-purple-secondary/30 rounded-lg p-6 my-8 flex flex-col items-center justify-center">
          <AlertTriangle className="text-vynal-status-error h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold text-vynal-text-primary mb-2">Service introuvable</h2>
          <p className="text-vynal-text-secondary text-center mb-4">{error}</p>
          <Button asChild variant="default" className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark">
            <Link href="/services">Parcourir tous les services</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Rendu pour afficher les détails du service
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/services" className="inline-flex items-center text-vynal-text-primary hover:text-vynal-accent-primary transition-colors">
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

// Conteneur de chargement pour le Suspense
function ServiceDetailLoading() {
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/services" className="inline-flex items-center text-vynal-text-primary hover:text-vynal-accent-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-[400px] w-full mb-4 bg-vynal-purple-secondary/30" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-vynal-purple-secondary/30" />
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <Skeleton className="h-8 w-3/4 mb-4 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-6 w-1/2 mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-32 w-full mb-6 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Page principale avec Suspense boundary
export default function ServiceDetailPage() {
  return (
    <Suspense fallback={<ServiceDetailLoading />}>
      <ServiceDetailContent />
    </Suspense>
  );
} 