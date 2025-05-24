"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Info,
  User,
  Tag,
  Calendar,
  Send,
  X,
  EyeOff,
  RefreshCw,
  Check,
  Dices,
  ListFilter,
  Settings,
  SlidersHorizontal,
  Star,
  Trash,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { getCachedData, setCachedData, CACHE_EXPIRY, CACHE_KEYS } from '@/lib/optimizations';
import { Loader } from "@/components/ui/loader";

// Interface pour les services
interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  freelance_id: string;
  freelancer_name?: string;
  category?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  created_at: string;
  updated_at: string;
  admin_notes?: string | null;
  email?: string;
  phone?: string;
  active?: boolean;
  validated_at?: string;
  validated_by?: string;
  profiles?: {
    full_name: string | null;
  };
}

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Fonction pour obtenir le badge de statut
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': 
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 text-[10px] sm:text-xs border-amber-200 dark:border-amber-800/30">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          En attente
        </Badge>
      );
    case 'approved': 
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-[10px] sm:text-xs border-green-200 dark:border-green-800/30">
          <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
          Approuvé
        </Badge>
      );
    case 'rejected': 
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-[10px] sm:text-xs border-red-200 dark:border-red-800/30">
          <XCircle className="h-2.5 w-2.5 mr-0.5" />
          Rejeté
        </Badge>
      );
    default: 
      return <Badge variant="outline" className="text-[10px] sm:text-xs">{status}</Badge>;
  }
};

export default function ServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'moderation'>('details');
  const [rejectionReason, setRejectionReason] = useState('');
  const [unpublishReason, setUnpublishReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [moderationComment, setModerationComment] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [unpublishLoading, setUnpublishLoading] = useState(false);
  const [sendEmails, setSendEmails] = useState(true);
  const [notificationErrorCount, setNotificationErrorCount] = useState(0); // Compteur d'erreurs de notification
  const MAX_NOTIFICATION_ERRORS = 3; // Nombre maximum d'erreurs avant désactivation automatique

  // Vérifier si l'affichage est en mode mobile
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 640);
    };
    
    handleResize(); // Vérifier au chargement
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Charger les services depuis Supabase avec cache et debounce
  const fetchServices = useCallback(async (forceFetch = false) => {
    try {
      setLoading(true);
      
      // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
      if (!forceFetch) {
        const cachedServices = getCachedData<Service[]>(CACHE_KEYS.ADMIN_SERVICES_LIST);
        if (cachedServices && Array.isArray(cachedServices) && cachedServices.length > 0) {
          setServices(cachedServices);
          setLoading(false);
          console.log('Utilisation des données en cache pour les services admin');
          return;
        }
      }
      
      // Ajouter un timestamp pour éviter le cache du navigateur
      const timestamp = new Date().getTime();
      
      // Récupération avec un paramètre de requête pour contourner le cache si nécessaire
      let query = supabase
        .from('services')
        .select('*, profiles(full_name)')
        .order('updated_at', { ascending: false });
        
      // Contournement du cache sans utiliser .match() qui traite les paramètres comme des colonnes
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transformer les données pour inclure le nom du freelance
      const transformedData = Array.isArray(data) ? data.map((service: any) => ({
        ...service,
        freelancer_name: service.profiles?.full_name || 'Inconnu'
      })) : [];

      // Mise en cache des services avec durée et priorité optimisées
      setCachedData(
        CACHE_KEYS.ADMIN_SERVICES_LIST,
        transformedData,
        { 
          expiry: forceFetch ? CACHE_EXPIRY.SHORT : CACHE_EXPIRY.MEDIUM, 
          priority: 'high' 
        }
      );
      
      setServices(transformedData);
      console.log(`${transformedData.length} services chargés depuis l'API`);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      setError('Erreur lors du chargement des services');
      setServices([]); // Initialiser à un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour rafraîchir manuellement les données avec debounce
  const handleRefresh = useCallback(() => {
    // Éviter les clics multiples rapides
    if (loading) return;
    
    // Forcer le rafraîchissement des données
    fetchServices(true);
    
    // Invalider explicitement le cache
    setCachedData(
      CACHE_KEYS.ADMIN_SERVICES_LIST,
      null,
      { expiry: 0 } // Expiration immédiate = invalidation
    );
    
    toast({
      title: "Actualisation réussie",
      description: "La liste des services a été actualisée"
    });
  }, [fetchServices, loading, toast]);
  
  // Écouter les événements de mise à jour des services
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleServiceUpdated = () => {
        console.log('Service mis à jour, rafraîchissement des données...');
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

  // Invalider le cache après des opérations de modification
  const invalidateServicesCache = useCallback(() => {
    // S'assurer qu'on a un service courant
    if (!currentService || !currentService.id) {
      console.error("Tentative d'invalidation sans service spécifique");
      
      // Fallback: invalidation générale dans ce cas
      import('@/lib/services/servicesInvalidationService').then(({ triggerServicesInvalidation }) => {
        triggerServicesInvalidation();
      });
      
      return;
    }
    
    // Définir le type pour la propriété personnalisée sur l'objet window
    type CustomWindow = Window & typeof globalThis & {
      _serviceInvalidationTimeout?: NodeJS.Timeout;
      _lastServiceInvalidation?: number;
    };
    
    const customWindow = window as CustomWindow;
    
    // Utiliser un debounce pour éviter les multiples invalidations
    if (customWindow._serviceInvalidationTimeout) {
      clearTimeout(customWindow._serviceInvalidationTimeout);
    }
    
    const now = Date.now();
    
    // Si la dernière invalidation est trop récente (moins de 3 secondes), retarder davantage
    if (customWindow._lastServiceInvalidation && now - customWindow._lastServiceInvalidation < 3000) {
      console.log(`Invalidation retardée pour éviter les rate limits (dernière: ${Math.floor((now - (customWindow._lastServiceInvalidation || 0)) / 1000)}s)`);
      const delay = 3000 - (now - (customWindow._lastServiceInvalidation || 0));
      
      customWindow._serviceInvalidationTimeout = setTimeout(() => {
        // Invalider spécifiquement le cache pour ce service
        import('@/lib/services/servicesInvalidationService').then(({ invalidateAfterServiceUpdate }) => {
          invalidateAfterServiceUpdate(
            currentService.id, 
            currentService.title || "Service sans titre"
          );
          
          // Mettre à jour le timestamp de dernière invalidation
          customWindow._lastServiceInvalidation = Date.now();
        });
      }, delay);
      
      return;
    }
    
    // Définir un court délai pour grouper les invalidations potentielles
    customWindow._serviceInvalidationTimeout = setTimeout(() => {
      // Invalider spécifiquement le cache pour ce service
      import('@/lib/services/servicesInvalidationService').then(({ invalidateAfterServiceUpdate }) => {
        invalidateAfterServiceUpdate(
          currentService.id, 
          currentService.title || "Service sans titre"
        );
        
        // Mettre à jour le timestamp de dernière invalidation
        customWindow._lastServiceInvalidation = Date.now();
      });
    }, 200);
    
    // Invalidation locale des caches
    setCachedData(
      CACHE_KEYS.ADMIN_SERVICES_LIST,
      null,
      { expiry: 0 }
    );
    
    // Émettre des événements pour informer les autres composants
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:service-updated', {
        detail: { 
          serviceId: currentService.id,
          serviceTitle: currentService.title
        }
      }));
      
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
        detail: { 
          key: CACHE_KEYS.ADMIN_SERVICES_LIST,
          serviceId: currentService.id 
        }
      }));
    }
    
    console.log(`Invalidation ciblée pour le service ${currentService.id}`);
  }, [currentService]);
  
  // Charger les services au montage du composant
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filtrer les services selon les critères
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      searchTerm === '' || 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.freelancer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      activeTab === 'all' || 
      service.status === activeTab;

    return matchesSearch && matchesStatus;
  });

  // Fonction pour supprimer un service
  const deleteService = async () => {
    if (!currentService) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', currentService.id);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setServices(services.filter(service => service.id !== currentService.id));
      setShowDeleteDialog(false);
      
      toast({
        title: "Service supprimé",
        description: "Le service a été supprimé avec succès."
      });
      
      invalidateServicesCache();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer ce service.",
        variant: "destructive"
      });
    }
  };

  // Fonction pour envoyer une notification en toute sécurité
  const sendNotification = async (userId: string, type: string, content: any): Promise<boolean> => {
    // Si les notifications sont désactivées ou si trop d'erreurs ont été rencontrées
    if (!sendEmails || notificationErrorCount >= MAX_NOTIFICATION_ERRORS) {
      console.log(`Envoi d'email désactivé: sendEmails=${sendEmails}, errorCount=${notificationErrorCount}`);
      return false;
    }

    try {
      // Vérifier que les données sont valides
      if (!userId || userId.trim() === '' || !type || !content) {
        console.warn('Données de notification incomplètes:', { userId, type });
        return false;
      }

      console.log(`Envoi de notification en cours - Type: ${type}, UserId: ${userId.substring(0, 8)}...`);
      
      // IMPORTANT: Ne pas effectuer un double JSON.stringify sur le contenu
      // Le contenu est déjà un objet, le passer directement dans un seul JSON.stringify
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          content: content // Ne pas faire JSON.stringify(content)
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
        
        // Incrémenter le compteur d'erreurs
        const newErrorCount = notificationErrorCount + 1;
        setNotificationErrorCount(newErrorCount);
        
        // Si le seuil d'erreurs est atteint, désactiver automatiquement les notifications
        if (newErrorCount >= MAX_NOTIFICATION_ERRORS) {
          setSendEmails(false);
          toast({
            title: "Notifications désactivées automatiquement",
            description: `Trop d'erreurs de notification (${newErrorCount}). Les notifications ont été désactivées.`,
            variant: "destructive",
            duration: 5000
          });
        }
        
        return false;
      }

      // Notification envoyée avec succès - ajouter un message visible
      const responseData = await response.json();
      console.log('Email envoyé avec succès:', responseData);
      
      // Toast optionnel pour confirmer l'envoi
      toast({
        title: "Notification envoyée",
        description: `Email de notification "${type}" envoyé avec succès à ${userId.substring(0, 8)}...`,
        duration: 3000
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      
      // Incrémenter le compteur d'erreurs
      const newErrorCount = notificationErrorCount + 1;
      setNotificationErrorCount(newErrorCount);
      
      // Si le seuil d'erreurs est atteint, désactiver automatiquement les notifications
      if (newErrorCount >= MAX_NOTIFICATION_ERRORS) {
        setSendEmails(false);
        toast({
          title: "Notifications désactivées automatiquement",
          description: `Trop d'erreurs de notification (${newErrorCount}). Les notifications ont été désactivées.`,
          variant: "destructive",
          duration: 5000
        });
      }
      
      return false;
    }
  };

  // Fonction pour approuver un service
  const approveService = async () => {
    setApproveLoading(true);
    try {
      // Récupération de l'ID du service courant pour s'assurer qu'on ne travaille que sur ce service
      const serviceId = currentService?.id;
      if (!serviceId) {
        throw new Error('ID de service manquant');
      }

      const { error, data } = await supabase
        .from('services')
        .update({
          status: 'approved',
          admin_notes: moderationComment || undefined,
          active: true,
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select('*');

      if (error) throw error;

      // Vérifier qu'on a bien reçu les données mises à jour
      if (!data || data.length === 0) {
        throw new Error('Aucun service mis à jour');
      }

      // Mettre à jour l'état local en ne modifiant que le service spécifique
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId ? {
            ...service,
            status: 'approved',
            admin_notes: moderationComment || undefined,
            active: true,
            validated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : service
        )
      );

      // Envoyer une notification par email au freelance seulement si sendEmails est activé
      if (currentService && currentService.freelance_id) {
        await sendNotification(
          currentService.freelance_id,
          'service_approved',
          {
            serviceId: serviceId,
            serviceTitle: currentService.title,
            serviceDescription: currentService.description,
            servicePrice: currentService.price,
            adminNotes: moderationComment || undefined
          }
        );
      }
      
      toast({
        title: "Service approuvé",
        description: "Le service a été approuvé avec succès."
      });
      setShowDetailsDialog(false);
      setModerationComment('');
      
      // Invalider uniquement le cache concerné
      invalidateServicesCache();
    } catch (error) {
      console.error('Erreur lors de l\'approbation du service:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'approbation du service",
        variant: "destructive"
      });
    } finally {
      setApproveLoading(false);
    }
  };
  
  // Fonction pour rejeter un service
  const rejectService = async () => {
    setRejectLoading(true);
    try {
      // Récupération de l'ID du service courant pour s'assurer qu'on ne travaille que sur ce service
      const serviceId = currentService?.id;
      if (!serviceId) {
        throw new Error('ID de service manquant');
      }

      const { error, data } = await supabase
        .from('services')
        .update({
          status: 'rejected',
          admin_notes: moderationComment || 'Service rejeté par la modération',
          active: false,
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select('*');

      if (error) throw error;

      // Vérifier qu'on a bien reçu les données mises à jour
      if (!data || data.length === 0) {
        throw new Error('Aucun service mis à jour');
      }
      
      // Mettre à jour l'état local en ne modifiant que le service spécifique
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId ? {
            ...service,
            status: 'rejected',
            admin_notes: moderationComment || 'Service rejeté par la modération',
            active: false,
            validated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : service
        )
      );

      // Envoyer une notification par email au freelance seulement si sendEmails est activé
      if (currentService && currentService.freelance_id) {
        await sendNotification(
          currentService.freelance_id,
          'service_rejected',
          {
            serviceId: serviceId,
            serviceTitle: currentService.title,
            serviceDescription: currentService.description,
            servicePrice: currentService.price,
            adminNotes: moderationComment || 'Service rejeté par la modération'
          }
        );
      }
      
      toast({
        title: "Service rejeté",
        description: "Le service a été rejeté avec succès."
      });
      setShowDetailsDialog(false);
      setModerationComment('');
      
      // Invalider uniquement le cache concerné
      invalidateServicesCache();
    } catch (error) {
      console.error('Erreur lors du rejet du service:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du rejet du service",
        variant: "destructive"
      });
    } finally {
      setRejectLoading(false);
    }
  };

  // Ouvrir le modal de dépublication
  const openUnpublishModal = (service: Service) => {
    if (showUnpublishDialog) {
      setShowUnpublishDialog(false);
      setTimeout(() => {
        setCurrentService(service);
        setUnpublishReason('');
        setShowUnpublishDialog(true);
      }, 100);
    } else {
      setCurrentService(service);
      setUnpublishReason('');
      setShowUnpublishDialog(true);
    }
  };

  // Fermer le modal de dépublication
  const closeUnpublishModal = () => {
    setShowUnpublishDialog(false);
    setTimeout(() => {
      setCurrentService(null);
      setUnpublishReason('');
    }, 300);
  };

  // Ajouter cette fonction avant le return
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente de modération';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'Statut inconnu';
    }
  };

  // Ouvrir modal de détails
  const openDetailsModal = (service: Service) => {
    // Si un modal est déjà ouvert, le fermer et ouvrir le nouveau avec un délai
    if (showDetailsDialog) {
      setShowDetailsDialog(false);
      setTimeout(() => {
        setCurrentService(service);
        setShowDetailsDialog(true);
        setActiveDetailTab('details');
      }, 100);
    } else {
      setCurrentService(service);
      setShowDetailsDialog(true);
      setActiveDetailTab('details');
    }
  };

  // Fermer modal de détails
  const closeDetailsModal = () => {
    setShowDetailsDialog(false);
    setTimeout(() => {
      setCurrentService(null);
      setModerationComment('');
    }, 300);
  };

  // Ouvrir modal de suppression
  const openDeleteModal = (service: Service) => {
    // Si un modal est déjà ouvert, le fermer et ouvrir le nouveau avec un délai
    if (showDeleteDialog) {
      setShowDeleteDialog(false);
      setTimeout(() => {
        setCurrentService(service);
        setShowDeleteDialog(true);
      }, 100);
    } else {
      setCurrentService(service);
      setShowDeleteDialog(true);
    }
  };

  // Fermer modal de suppression
  const closeDeleteModal = () => {
    setShowDeleteDialog(false);
    setTimeout(() => {
      setCurrentService(null);
    }, 300);
  };

  // Ajouter un badge pour indiquer l'état de publication dans les tableaux
  const getPublicationBadge = (service: Service) => {
    if (service.status === 'approved') {
      return service.active ? (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-[10px] sm:text-xs">
          <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
          Publié
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 text-[10px] sm:text-xs">
          <EyeOff className="h-2.5 w-2.5 mr-0.5" />
          Dépublié
        </Badge>
      );
    }
    return null;
  };

  // Fonction pour dépublier ou republier un service
  const unpublishService = async () => {
    if (!currentService) return;
    
    setUnpublishLoading(true);
    try {
      // Récupération de l'ID du service courant pour s'assurer qu'on ne travaille que sur ce service
      const serviceId = currentService.id;
      if (!serviceId) {
        throw new Error('ID de service manquant');
      }
      
      // Déterminer la nouvelle valeur de active (inverse de l'état actuel)
      const newActiveState = !currentService.active;
      
      // Si on dépublie, on met aussi le statut à "rejected", sinon "approved"
      const newStatus = newActiveState ? "approved" : "rejected";
      
      // Mettre à jour uniquement le service sélectionné
      const { error, data } = await supabase
        .from('services')
        .update({
          active: newActiveState,
          status: newStatus,
          admin_notes: unpublishReason || 
            (newActiveState 
              ? "Service republié par l'administrateur" 
              : "Service dépublié par l'administrateur"),
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select('*');

      if (error) throw error;
      
      // Vérifier qu'on a bien reçu les données mises à jour
      if (!data || data.length === 0) {
        throw new Error('Aucun service mis à jour');
      }
      
      // Mettre à jour l'état local en ne modifiant que le service spécifique
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId ? {
            ...service,
            active: newActiveState,
            status: newStatus,
            admin_notes: unpublishReason || 
              (newActiveState 
                ? "Service republié par l'administrateur" 
                : "Service dépublié par l'administrateur"),
            updated_at: new Date().toISOString()
          } : service
        )
      );

      // Envoyer des notifications seulement si sendEmails est activé
      if (currentService && currentService.freelance_id) {
        // Si le service est dépublié
        if (!newActiveState) {
          await sendNotification(
            currentService.freelance_id,
            'service_unpublished',
            {
              serviceId: serviceId,
              serviceTitle: currentService.title,
              serviceDescription: currentService.description,
              servicePrice: currentService.price,
              adminNotes: unpublishReason || "Service dépublié par l'administrateur",
              unpublishedDate: new Date().toISOString()
            }
          );
        } 
        // Si le service est republié
        else if (newActiveState) {
          await sendNotification(
            currentService.freelance_id,
            'service_approved',
            {
              serviceId: serviceId,
              serviceTitle: currentService.title,
              serviceDescription: currentService.description,
              servicePrice: currentService.price,
              adminNotes: unpublishReason || "Service republié par l'administrateur",
              approvalDate: new Date().toISOString()
            }
          );
        }
      }
      
      // Notification appropriée selon l'action
      toast({
        title: newActiveState ? "Service republié" : "Service dépublié",
        description: newActiveState 
          ? "Le service a été republié et approuvé avec succès." 
          : "Le service a été dépublié et désapprouvé avec succès."
      });
      
      closeUnpublishModal();
      
      // Invalider uniquement le cache concerné
      invalidateServicesCache();
    } catch (error) {
      console.error('Erreur lors de la modification du statut du service:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut du service",
        variant: "destructive"
      });
    } finally {
      setUnpublishLoading(false);
    }
  };

  // Réinitialiser le compteur d'erreurs de notification
  const resetNotificationErrorCount = () => {
    setNotificationErrorCount(0);
  };

  return (
    <div className="space-y-4 p-1 sm:p-2">
      <div>
        <h1 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-gray-800 dark:text-vynal-text-primary">Gestion des services</h1>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-vynal-text-secondary">
          Gérez les services proposés par les freelances sur la plateforme.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400 dark:text-vynal-text-secondary/50" />
          <Input
            placeholder="Rechercher un service..."
            className="pl-7 h-7 sm:h-8 text-[10px] sm:text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline" 
            size="sm"
            className="h-7 sm:h-8 text-[10px] sm:text-xs flex items-center gap-1"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Chargement...' : 'Actualiser'}</span>
          </Button>
          <Button
            variant={sendEmails ? "default" : "outline"}
            size="sm"
            className="h-7 sm:h-8 text-[10px] sm:text-xs"
            onClick={() => {
              // Stocker l'état actuel pour l'utiliser dans le toast
              const currentState = sendEmails;
              
              // Si on active les notifications, réinitialiser le compteur d'erreurs
              if (!currentState) {
                resetNotificationErrorCount();
              }
              
              // Inverser l'état des emails
              setSendEmails(!currentState);
              
              // Afficher le toast en fonction de l'état FUTUR (inverse de l'état actuel)
              toast({
                title: !currentState ? "Notifications activées" : "Notifications désactivées",
                description: !currentState 
                  ? "Les emails de notification seront envoyés." 
                  : "Les emails de notification ne seront pas envoyés.",
                duration: 3000
              });
            }}
          >
            {sendEmails 
              ? notificationErrorCount > 0 
                ? `Emails: ON (${notificationErrorCount}/${MAX_NOTIFICATION_ERRORS})` 
                : "Emails: ON" 
              : "Emails: OFF"}
          </Button>
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-vynal-text-secondary">
            {filteredServices.length} service(s) trouvé(s)
          </span>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-2 sm:space-y-3">
        <TabsList className="grid grid-cols-4 h-8">
          <TabsTrigger value="all" className="flex gap-1 text-[10px] sm:text-xs h-8">
            <FileText className="h-3 w-3" />
            <span>Tous</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex gap-1 text-[10px] sm:text-xs h-8">
            <Clock className="h-3 w-3" />
            <span>En attente</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex gap-1 text-[10px] sm:text-xs h-8">
            <CheckCircle className="h-3 w-3" />
            <span>Approuvés</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex gap-1 text-[10px] sm:text-xs h-8">
            <XCircle className="h-3 w-3" />
            <span>Rejetés</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2 sm:space-y-3">
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-[11px] sm:text-sm">Liste des services</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                {filteredServices.length} service(s) {activeTab !== 'all' ? 
                  activeTab === 'pending' ? 'en attente' : 
                  activeTab === 'approved' ? 'approuvés' : 
                  'rejetés' : 
                  'au total'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Version mobile - Affichage en cartes */}
              {mobileView ? (
                <div className="p-2 space-y-2">
                  {loading ? (
                    <div className="flex justify-center items-center h-24">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-[10px]">Chargement...</span>
                    </div>
                  ) : filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <Card key={service.id} className="overflow-hidden border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-[11px] font-medium truncate">{service.title}</h3>
                              <p className="text-[9px] text-gray-500 dark:text-vynal-text-secondary">{service.freelancer_name}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              {getStatusBadge(service.status)}
                              {getPublicationBadge(service)}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1 text-[9px]">
                            <div>
                              <span className="font-medium">Prix:</span> {service.price} €
                            </div>
                            <div>
                              <span className="font-medium">Catégorie:</span> {service.category || 'Non spécifié'}
                            </div>
                          </div>
                          <div className="mt-1 flex justify-between items-center text-[9px]">
                            <span className="text-gray-500">{formatDate(service.created_at)}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[9px]"
                                onClick={() => openDetailsModal(service)}
                              >
                                <Eye className="h-2.5 w-2.5 mr-1" />
                                Détails
                              </Button>
                              {service.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[9px] text-amber-500"
                                  onClick={() => openUnpublishModal(service)}
                                >
                                  <EyeOff className="h-2.5 w-2.5 mr-1" />
                                  {service.active ? 'Dépublier' : 'Republier'}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 text-[9px]"
                                onClick={() => openDeleteModal(service)}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[10px] text-gray-500 dark:text-vynal-text-secondary">
                      Aucun service trouvé.
                    </div>
                  )}
                </div>
              ) : (
                /* Version desktop - Affichage en tableau */
                <div className="rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead className="text-[10px]">Titre</TableHead>
                        <TableHead className="text-[10px]">Freelance</TableHead>
                        <TableHead className="text-[10px]">Catégorie</TableHead>
                        <TableHead className="text-[10px]">Prix</TableHead>
                        <TableHead className="w-[120px] text-[10px]">
                        <div className="flex items-center">
                          Date
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                        <TableHead className="w-[100px] text-[10px]">Statut</TableHead>
                        <TableHead className="w-[100px] text-[10px]">Publication</TableHead>
                        <TableHead className="text-right w-[120px] text-[10px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-[10px]">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                            <span className="ml-2">Chargement...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredServices.length > 0 ? (
                      filteredServices.map((service) => (
                        <TableRow key={service.id}>
                            <TableCell className="font-medium text-[10px] py-2">{service.title}</TableCell>
                            <TableCell className="text-[10px] py-2">{service.freelancer_name}</TableCell>
                            <TableCell className="text-[10px] py-2">{service.category || 'Non spécifié'}</TableCell>
                            <TableCell className="text-[10px] py-2">{service.price} €</TableCell>
                            <TableCell className="text-[10px] py-2">{formatDate(service.created_at)}</TableCell>
                            <TableCell className="text-[10px] py-2">{getStatusBadge(service.status)}</TableCell>
                            <TableCell className="text-[10px] py-2">{getPublicationBadge(service)}</TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => openDetailsModal(service)}
                              >
                                <Eye className="h-3 w-3" />
                                <span className="sr-only">Détails</span>
                              </Button>
                                {service.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                    className={`h-6 w-6 p-0 ${service.active ? 'text-amber-500' : 'text-green-500'}`}
                                    onClick={() => openUnpublishModal(service)}
                                    title={service.active ? 'Dépublier' : 'Republier'}
                              >
                                    <EyeOff className="h-3 w-3" />
                                    <span className="sr-only">{service.active ? 'Dépublier' : 'Republier'}</span>
                              </Button>
                                )}
                              <Button
                                variant="outline"
                                size="sm"
                                  className="h-6 w-6 p-0 text-red-500"
                                  onClick={() => openDeleteModal(service)}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-[10px]">
                          Aucun service trouvé.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de détails du service */}
      {showDetailsDialog && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDetailsModal}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl mx-2 sm:mx-0 max-h-[90vh] overflow-auto p-4 sm:p-6 relative" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton de fermeture */}
            <button 
              onClick={closeDetailsModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </button>
            
            {/* En-tête */}
            <div className="mb-4">
              <h2 className="text-sm sm:text-base font-semibold">Détails du service</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-vynal-text-secondary">
                Informations complètes sur le service et options de modération.
              </p>
            </div>
            
            {/* Contenu */}
            <div className="space-y-4">
              {/* Onglets */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button 
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeDetailTab === 'details' 
                        ? 'border-vynal-accent-primary text-vynal-accent-primary' 
                        : 'border-transparent text-gray-500 dark:text-vynal-text-secondary hover:text-gray-700 dark:hover:text-vynal-text-primary'
                    }`}
                    onClick={() => setActiveDetailTab('details')}
                  >
                    Détails
                  </button>
                  <button 
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeDetailTab === 'moderation' 
                        ? 'border-vynal-accent-primary text-vynal-accent-primary' 
                        : 'border-transparent text-gray-500 dark:text-vynal-text-secondary hover:text-gray-700 dark:hover:text-vynal-text-primary'
                    }`}
                    onClick={() => setActiveDetailTab('moderation')}
                  >
                    Modération
                  </button>
                </div>
              </div>
              
              {/* Contenu de l'onglet Détails */}
              {activeDetailTab === 'details' && (
                <div className="space-y-4">
                <div>
                    <h3 className="text-xs sm:text-sm font-semibold mb-1">
                      Informations générales
                    </h3>
                    <div className="rounded-md border p-3 grid gap-2">
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Titre:</span>
                        <span className="col-span-2">{currentService.title}</span>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Description:</span>
                        <span className="col-span-2">{currentService.description || 'Non spécifié'}</span>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Prix:</span>
                        <span className="col-span-2">{currentService.price} €</span>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Catégorie:</span>
                        <span className="col-span-2">{currentService.category || 'Non spécifié'}</span>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Date:</span>
                        <span className="col-span-2">{formatDate(currentService.created_at)}</span>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Statut:</span>
                        <span className="col-span-2">{getStatusBadge(currentService.status)}</span>
                      </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs sm:text-sm font-semibold mb-1">
                      Informations du freelance
                    </h3>
                    <div className="rounded-md border p-3 grid gap-2">
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Nom:</span>
                        <span className="col-span-2">{currentService.freelancer_name}</span>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Email:</span>
                        <span className="col-span-2">{currentService.email || 'Non spécifié'}</span>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-500">Téléphone:</span>
                        <span className="col-span-2">{currentService.phone || 'Non spécifié'}</span>
                      </div>
                </div>
                </div>
                </div>
              )}

              {/* Contenu de l'onglet Modération */}
              {activeDetailTab === 'moderation' && (
                <div className="space-y-3">
                <div>
                    <h3 className="text-xs sm:text-sm font-semibold mb-1">Actions de modération</h3>
                    <div className="rounded-md border p-3 space-y-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs sm:text-sm font-medium">Statut actuel:</label>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(currentService.status)}
                          <span className="text-xs sm:text-sm">{getStatusText(currentService.status)}</span>
                </div>
              </div>
              
                      {currentService.status === 'pending' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="rejection-reason" className="text-xs sm:text-sm font-medium">
                              Commentaire de modération (optionnel):
                            </label>
                            <Textarea
                              id="rejection-reason"
                              placeholder="Raison de l'acceptation ou du rejet..."
                              className="h-20 text-xs sm:text-sm"
                              value={moderationComment}
                              onChange={(e) => setModerationComment(e.target.value)}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm"
                              onClick={() => rejectService()}
                              disabled={approveLoading || rejectLoading}
                            >
                              {rejectLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-vynal-accent-primary mr-2" />
                                  Traitement...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
                                  Rejeter
                                </>
                              )}
                            </Button>
                            <Button
                              variant="default"
                              size="sm" 
                              className="text-xs sm:text-sm"
                              onClick={() => approveService()}
                              disabled={approveLoading || rejectLoading}
                            >
                              {approveLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                  Traitement...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1 text-white" />
                                  Approuver
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentService.status !== 'pending' && (
                        <div className="space-y-3">
                          <div className="text-xs sm:text-sm text-gray-500">
                            Ce service a déjà été {currentService.status === 'approved' ? 'approuvé' : 'rejeté'}.
                            {currentService.admin_notes && (
                              <div className="mt-1">
                                <p className="font-medium">Commentaire:</p>
                                <p className="italic">{currentService.admin_notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex flex-col gap-2">
                              <label htmlFor="moderation-comment" className="text-xs sm:text-sm font-medium">
                                Nouveau commentaire de modération (optionnel):
                              </label>
                              <Textarea
                                id="moderation-comment"
                                placeholder="Ajoutez un nouveau commentaire de modération..."
                                className="h-20 text-xs sm:text-sm"
                                value={moderationComment}
                                onChange={(e) => setModerationComment(e.target.value)}
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-3">
                              {currentService.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs sm:text-sm"
                                  onClick={() => rejectService()}
                                  disabled={approveLoading || rejectLoading}
                                >
                                  {rejectLoading ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-vynal-accent-primary mr-2" />
                                      Traitement...
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
                                      Rejeter
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {currentService.status === 'rejected' && (
                                <Button
                                  variant="default"
                                  size="sm" 
                                  className="text-xs sm:text-sm"
                                  onClick={() => approveService()}
                                  disabled={approveLoading || rejectLoading}
                                >
                                  {approveLoading ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                      Traitement...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-white" />
                                      Approuver à nouveau
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          
            {/* Pied de page */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <Button 
              variant="outline" 
                onClick={closeDetailsModal}
              size="sm"
              className="text-xs"
            >
              Fermer
            </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteDialog && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDeleteModal}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm mx-2 sm:mx-0 p-4 sm:p-6 relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm sm:text-base font-semibold mb-2">Confirmer la suppression</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-vynal-text-secondary mb-4">
              Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.
            </p>
            
            <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
                onClick={closeDeleteModal}
              size="sm"
                className="text-[10px] sm:text-xs"
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              size="sm"
                className="text-[10px] sm:text-xs"
              onClick={deleteService}
            >
              Supprimer
            </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de dépublication */}
      {showUnpublishDialog && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeUnpublishModal}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm mx-2 sm:mx-0 p-4 sm:p-6 relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm sm:text-base font-semibold mb-2">
              {currentService.active ? 'Dépublier' : 'Republier'} le service
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-vynal-text-secondary mb-4">
              {currentService.active 
                ? 'Le service ne sera plus visible par les utilisateurs. Vous pouvez ajouter un commentaire pour expliquer la raison.'
                : 'Le service sera à nouveau visible par les utilisateurs. Vous pouvez ajouter un commentaire.'}
            </p>
            
            <div className="mb-4">
              <label htmlFor="unpublish-reason" className="block text-xs sm:text-sm font-medium mb-1">
                Commentaire (optionnel):
              </label>
              <Textarea
                id="unpublish-reason"
                placeholder="Raison de la dépublication..."
                className="h-20 text-xs sm:text-sm"
                value={unpublishReason}
                onChange={(e) => setUnpublishReason(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={closeUnpublishModal}
                size="sm"
                className="text-[10px] sm:text-xs"
              >
                Annuler
              </Button>
              <Button 
                variant="default"
                size="sm"
                className="text-[10px] sm:text-xs"
                onClick={unpublishService}
                disabled={unpublishLoading}
              >
                {unpublishLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {currentService.active ? 'Dépublier' : 'Republier'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 