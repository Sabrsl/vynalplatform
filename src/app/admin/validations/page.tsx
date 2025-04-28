"use client";

import React, { useState, useEffect } from 'react';
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
  FileSearch 
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';

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
}

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

  // Créer le client Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Charger les services depuis Supabase
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('services')
          .select('*');

        if (error) {
          throw error;
        }

        setServices(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        setError('Impossible de charger les services. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [supabase]);

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
      const { error } = await supabase
        .from('services')
        .update({ status: 'approved' })
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setServices(services.map(service => 
        service.id === serviceId 
          ? { ...service, status: 'approved' } 
          : service
      ));

      toast({
        title: "Succès",
        description: "Le service a été approuvé avec succès."
      });
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider ce service.",
        variant: "destructive"
      });
    }
  };

  // Gérer le rejet d'un service
  const handleReject = async (serviceId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'rejected',
          rejection_reason: reason 
        })
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setServices(services.map(service => 
        service.id === serviceId 
          ? { ...service, status: 'rejected', rejection_reason: reason } 
          : service
      ));

      toast({
        title: "Succès",
        description: "Le service a été rejeté avec succès."
      });
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter ce service.",
        variant: "destructive"
      });
    }
  };

  // État pour gérer la boîte de dialogue de rejet
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const openRejectDialog = (service: Service) => {
    setSelectedService(service);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedService(null);
  };

  const confirmReject = () => {
    if (selectedService && rejectionReason.trim()) {
      handleReject(selectedService.id, rejectionReason);
      closeRejectDialog();
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

      {rejectDialogOpen && selectedService && (
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm">Refuser le service</DialogTitle>
              <DialogDescription className="text-xs">
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