"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  XCircle,
  FileSearch,
  RefreshCw
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { 
  getCachedData, 
  setCachedData, 
  CACHE_EXPIRY, 
  CACHE_KEYS
} from '@/lib/optimizations';

// Type pour les services
interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  freelancer_name?: string;
  category?: string;
  rejection_reason?: string;
  created_at: string;
  active: boolean;
}

// Clé de cache pour les services en validation
const VALIDATION_SERVICES_KEY = 'admin_validation_services_';

// Composant pour afficher une carte de service
interface ServiceCardProps {
  service: Service;
  onApprove: (id: string) => void;
  onReject: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onApprove, onReject }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
        <p className="text-sm mb-2">{service.description}</p>
        <p className="text-sm mb-2">Prix: {service.price} €</p>
        <p className="text-sm mb-3">Statut: {service.status}</p>
        
        {service.status === 'pending' && (
          <div className="flex mt-3 gap-2">
            <Button onClick={() => onApprove(service.id)}>
              Approuver
            </Button>
            <Button variant="outline" onClick={() => onReject(service)}>
              Refuser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ValidationsPage() {
  const { toast } = useToast();
  
  // État pour stocker les services
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Charger les services depuis Supabase avec cache
  const fetchServices = useCallback(async (forceFetch = false) => {
    try {
      setLoading(true);
      
      // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
      if (!forceFetch) {
        const cachedData = getCachedData<Service[]>(VALIDATION_SERVICES_KEY);
        if (cachedData) {
          setServices(cachedData);
          setLoading(false);
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Mettre en cache les données pour une durée très longue (invalidation par événement)
      setCachedData(
        VALIDATION_SERVICES_KEY,
        data,
        { expiry: CACHE_EXPIRY.LONG, priority: 'high' }
      );
      
      setServices(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des services:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les services à valider",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fonction pour forcer le rafraîchissement des données
  const handleRefresh = () => {
    // Forcer le rafraîchissement des données
    fetchServices(true);
    
    // Invalider explicitement tous les caches via le service centralisé
    import('@/lib/services/servicesInvalidationService').then(({ triggerServicesInvalidation }) => {
      triggerServicesInvalidation();
    });
    
    // Invalider aussi explicitement le cache local pour une mise à jour immédiate
    setCachedData(
      VALIDATION_SERVICES_KEY,
      null,
      { expiry: 0 } // Expiration immédiate = invalidation
    );
    
    // Invalider aussi le cache des services admin
    setCachedData(
      CACHE_KEYS.ADMIN_SERVICES_LIST,
      null,
      { expiry: 0 }
    );
    
    toast({
      title: "Actualisation",
      description: "Les services ont été actualisés"
    });
  };
  
  // Invalider les caches liés aux services
  const invalidateServiceCaches = () => {
    // Utiliser le service d'invalidation centralisé
    if (currentService) {
      // Si un service courant est disponible, utiliser l'invalidation spécifique
      import('@/lib/services/servicesInvalidationService').then(({ invalidateAfterServiceValidation }) => {
        invalidateAfterServiceValidation(
          currentService.id,
          currentService.title || "Service sans titre"
        );
      });
    } else {
      // Sinon, utiliser l'invalidation générique
      import('@/lib/services/servicesInvalidationService').then(({ triggerServicesInvalidation }) => {
        triggerServicesInvalidation();
      });
    }
    
    // Maintenir l'invalidation locale pour une cohérence immédiate
    // Invalider le cache des validations
    setCachedData(
      VALIDATION_SERVICES_KEY,
      null,
      { expiry: 0 }
    );
    
    // Invalider aussi le cache des services admin
    setCachedData(
      CACHE_KEYS.ADMIN_SERVICES_LIST,
      null,
      { expiry: 0 }
    );
    
    // Déclencher des événements pour informer les autres composants
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:service-updated'));
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
        detail: { key: VALIDATION_SERVICES_KEY }
      }));
    }
  };
  
  // Écouter les événements de mise à jour des services
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleServiceUpdated = () => {
        console.log('Service mis à jour, rafraîchissement des validations...');
        fetchServices(true);
      };
      
      // Ajouter l'écouteur d'événements
      window.addEventListener('vynal:service-updated', handleServiceUpdated);
      window.addEventListener('vynal:cache-invalidated', handleServiceUpdated);
      
      // Nettoyer l'écouteur lors du démontage
      return () => {
        window.removeEventListener('vynal:service-updated', handleServiceUpdated);
        window.removeEventListener('vynal:cache-invalidated', handleServiceUpdated);
      };
    }
  }, [fetchServices]);
  
  // Charger les services au montage du composant
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filtrer les services en fonction de la recherche et de l'onglet actif
  const filteredServices = services.filter((service) => {
    // Filtrer par statut
    const statusMatch = 
      (activeTab === 'pending' && service.status === 'pending') ||
      (activeTab === 'approved' && service.status === 'approved') ||
      (activeTab === 'rejected' && service.status === 'rejected');
    
    // Filtrer par terme de recherche
    const searchMatch = 
      !searchTerm ||
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.freelancer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  // Gérer la validation d'un service
  const handleValidate = async (serviceId: string) => {
    try {
      // Récupérer les informations du service avant la mise à jour
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('title, freelance_id')
        .eq('id', serviceId)
        .single();
      
      if (serviceError) {
        throw serviceError;
      }
      
      // Mettre à jour le statut du service
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'approved',
          active: true, // S'assurer que le service est aussi actif/publié
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      const updatedServices = services.map(service => 
        service.id === serviceId 
          ? { ...service, status: 'approved' as const, active: true } 
          : service
      );
      
      setServices(updatedServices);
      
      // Mettre à jour le cache courant
      setCachedData(
        VALIDATION_SERVICES_KEY,
        updatedServices,
        { expiry: CACHE_EXPIRY.LONG, priority: 'high' }
      );
      
      // Mettre temporairement le service courant pour l'invalidation
      setCurrentService({
        id: serviceId,
        title: serviceData?.title || "Service sans titre",
        description: "",
        price: 0,
        status: "approved" as const,
        created_at: new Date().toISOString(),
        active: true,
        freelance_id: serviceData?.freelance_id
      } as Service);
      
      // Invalider les autres caches liés et envoyer notification
      setTimeout(() => {
        invalidateServiceCaches();
        
        // Envoyer une notification au freelance si applicable
        if (serviceData?.freelance_id) {
          sendNotification(
            serviceData.freelance_id,
            'service_approved',
            {
              serviceId: serviceId,
              serviceTitle: serviceData.title,
              approvalDate: new Date().toISOString()
            }
          ).catch((error: Error) => console.error('Erreur lors de l\'envoi de notification:', error));
        }
      }, 100);
      
      toast({
        title: "Service approuvé",
        description: "Le service a été approuvé avec succès"
      });
    } catch (err) {
      console.error('Erreur lors de la validation du service:', err);
      toast({
        title: "Erreur",
        description: "Impossible de valider le service",
        variant: "destructive"
      });
    }
  };

  // Gérer le rejet d'un service
  const handleReject = async (serviceId: string, reason: string) => {
    try {
      // Récupérer les informations du service avant la mise à jour
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('title, freelance_id')
        .eq('id', serviceId)
        .single();
      
      if (serviceError) {
        throw serviceError;
      }
      
      // Mettre à jour le statut du service avec les informations de rejet
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'rejected',
          active: false, // Désactiver le service rejeté
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      const updatedServices = services.map(service => 
        service.id === serviceId 
          ? { 
              ...service, 
              status: 'rejected' as const, 
              rejection_reason: reason,
              active: false 
            } 
          : service
      );
      
      setServices(updatedServices);
      
      // Mettre à jour le cache courant
      setCachedData(
        VALIDATION_SERVICES_KEY,
        updatedServices,
        { expiry: CACHE_EXPIRY.LONG, priority: 'high' }
      );
      
      // Spécifier le service actuel pour l'invalidation
      setCurrentService({
        id: serviceId,
        title: serviceData?.title || "Service sans titre",
        description: "",
        price: 0,
        status: "rejected" as const,
        created_at: new Date().toISOString(),
        active: false,
        freelance_id: serviceData?.freelance_id,
        rejection_reason: reason
      } as Service);
      
      // Invalider les autres caches liés et envoyer notification
      setTimeout(() => {
        // Invalider les caches
        invalidateServiceCaches();
        
        // Envoyer une notification au freelance si applicable
        if (serviceData?.freelance_id) {
          sendNotification(
            serviceData.freelance_id,
            'service_rejected',
            {
              serviceId: serviceId,
              serviceTitle: serviceData.title,
              rejectionReason: reason,
              rejectionDate: new Date().toISOString()
            }
          ).catch((error: Error) => console.error('Erreur lors de l\'envoi de notification:', error));
        }
      }, 100);
      
      toast({
        title: "Service rejeté",
        description: "Le service a été rejeté avec succès"
      });
    } catch (err) {
      console.error('Erreur lors du rejet du service:', err);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le service",
        variant: "destructive"
      });
    }
  };

  // État pour gérer la boîte de dialogue de rejet
  const openRejectDialog = (service: Service) => {
    setCurrentService(service);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setCurrentService(null);
  };

  const confirmReject = () => {
    if (currentService && rejectionReason.trim()) {
      handleReject(currentService.id, rejectionReason);
      closeRejectDialog();
    }
  };

  // Fonction pour envoyer des notifications aux freelances
  const sendNotification = async (userId: string, type: string, content: any): Promise<boolean> => {
    try {
      // Vérifier que les données sont valides
      if (!userId || !type || !content) {
        console.warn('Données de notification incomplètes:', { userId, type });
        return false;
      }

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          content: JSON.stringify(content)
        }),
      });

      if (!response.ok) {
        // Récupérer le message d'erreur pour plus de détails
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || '';
        } catch (e) {
          errorDetails = 'Impossible de lire les détails de l\'erreur';
        }

        console.error(`Erreur lors de l'envoi de la notification (${response.status}): ${errorDetails}`);
        return false;
      }

      // Notification envoyée avec succès
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      return false;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        Validation des services
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="w-full md:w-1/3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rechercher un service..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="flex items-center gap-1 mr-2"
              >
                <RefreshCw size={14} />
                <span>Actualiser</span>
              </Button>
              <div className="flex border-b">
                <button
                  className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('pending')}
                >
                  En attente
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'approved' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('approved')}
                >
                  Approuvés
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('rejected')}
                >
                  Rejetés
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onApprove={handleValidate}
              onReject={openRejectDialog}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <FileSearch className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg text-gray-500">
            Aucun service {activeTab === 'pending' ? 'en attente' : activeTab === 'approved' ? 'validé' : 'refusé'} trouvé
          </p>
        </div>
      )}

      {rejectDialogOpen && currentService && (
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent aria-labelledby="rejection-title" aria-describedby="rejection-description">
            <DialogHeader className="pb-2">
              <DialogTitle id="rejection-title" className="text-base font-medium">Refuser le service</DialogTitle>
              <DialogDescription id="rejection-description" className="text-xs">
                Veuillez indiquer la raison du refus. Cette information sera transmise au freelance.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-3">
              <Textarea
                placeholder="Raison du refus..."
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                className="min-h-[100px] text-xs"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={closeRejectDialog}
                size="sm"
                className="text-xs"
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
              >
                Confirmer le refus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 