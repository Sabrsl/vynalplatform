"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { useFreelanceStats } from "@/hooks/useFreelanceStats";
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
import { Plus, PenSquare, Trash2, Clock, AlertCircle, BarChart3, CheckCircle2, DollarSign, Layers, Eye, ShoppingBag, MessageSquare, RefreshCw } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/services/ServiceCard";
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_EXPIRY,
  CACHE_PRIORITIES
} from '@/lib/optimizations';

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
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  // Gestion de la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const itemsPerPage = 10;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Utilisation du hook personnalisé pour les statistiques
  const { stats, loading: loadingStats, error: statsError, refreshStats } = useFreelanceStats(profile?.id);

  // Fonction pour charger les services avec pagination - mémorisée avec useCallback
  const loadServices = useCallback(async (profileId: string, forceRefresh = false) => {
    if (isRefreshing && !forceRefresh) return;

    try {
      setLoading(true);
      if (forceRefresh) setIsRefreshing(true);
      setError(null);
      
      // Vérifier le cache si ce n'est pas un forceRefresh
      if (!forceRefresh) {
        const cacheKey = `services_freelance_${profileId}_page_${currentPage}`;
        const cachedServices = getCachedData<{
          services: ServiceWithFreelanceAndCategories[],
          total: number
        }>(cacheKey);
        
        if (cachedServices) {
          setServices(cachedServices.services);
          setTotalServices(cachedServices.total);
          setLoading(false);
          setLastRefresh(new Date());
          
          // Ne pas rafraîchir en arrière-plan à chaque rendu
          return;
        }
      }
      
      // Récupérer d'abord le nombre total de services pour la pagination
      const { count, error: countError } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('freelance_id', profileId);
      
      if (countError) {
        console.error('Erreur lors du comptage des services:', countError);
        throw new Error('Impossible de récupérer le nombre total de services.');
      }
      
      // Mettre à jour le nombre total pour la pagination
      setTotalServices(count || 0);
      
      // Récupérer seulement les services pour la page courante avec pagination
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          categories (id, name, slug),
          subcategories (id, name, slug)
        `)
        .eq('freelance_id', profileId)
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Erreur lors du chargement des services:', fetchError);
        throw new Error('Impossible de charger vos services. Veuillez réessayer.');
      }
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      const transformedServices = data.map((service: any) => ({
        ...service,
        profiles: service.profiles,
        categories: service.categories,
        subcategories: service.subcategories,
      }));
      
      setServices(transformedServices);
      
      // Mettre en cache les résultats
      const cacheKey = `services_freelance_${profileId}_page_${currentPage}`;
      setCachedData(
        cacheKey, 
        { services: transformedServices, total: count || 0 },
        { 
          expiry: CACHE_EXPIRY.SERVICES,
          priority: CACHE_PRIORITIES.HIGH
        }
      );
      
      // Mettre à jour le timestamp de dernier rafraîchissement
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Erreur lors du chargement des services:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des services');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, itemsPerPage, isRefreshing]);

  // Fonction pour gérer la suppression d'un service - mémorisée avec useCallback
  const handleDeleteService = useCallback(async (serviceId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.")) {
      setIsDeleting(serviceId);
      setDeleteError(null);
      
      try {
        const result = await deleteService(serviceId);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // Mettre à jour la liste des services après suppression
        setServices(services.filter((service: ServiceWithFreelanceAndCategories) => service.id !== serviceId));
        
        // Invalider le cache des services
        if (profile?.id) {
          invalidateCache(`services_freelance_${profile.id}`);
        }
        
        // Rafraîchir les statistiques
        refreshStats();
        
        // Afficher un message de confirmation positif (optionnel)
        setError(null); // Effacer les erreurs précédentes
      } catch (err: any) {
        console.error("Erreur lors de la suppression du service:", err);
        
        // Fournir un message d'erreur plus précis
        let errorMessage = "Une erreur est survenue lors de la suppression du service";
        
        // Vérifier si l'erreur contient "JSON object requested, multiple rows returned"
        if (err.message && err.message.includes("JSON object requested")) {
          errorMessage = "Impossible d'identifier le service de manière unique. Veuillez réessayer ou contacter le support.";
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setDeleteError(errorMessage);
      } finally {
        setIsDeleting(null);
      }
    }
  }, [deleteService, services, profile?.id, refreshStats]);

  // Fonction pour changer de page - mémorisée avec useCallback
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Fonction pour rafraîchir manuellement les données
  const refreshData = useCallback(() => {
    if (!profile?.id || isRefreshing) return;
    
    setIsRefreshing(true);
    
    // Invalider explicitement tous les caches liés aux services du freelance
    invalidateCache(`services_freelance_${profile.id}`);
    invalidateCache(`dashboard_stats_freelance_${profile.id}`);
    
    // Forcer le rechargement complet sans utiliser le cache
    loadServices(profile.id, true).then(() => {
      // Actualiser aussi les statistiques du freelance
      refreshStats();
    }).finally(() => {
      setIsRefreshing(false);
    });
  }, [profile?.id, isRefreshing, loadServices, refreshStats]);

  // Effet #1: Redirection si l'utilisateur n'est pas freelance - simplifié
  useEffect(() => {
    if (profile && !isFreelance) {
      router.push("/dashboard");
    }
  }, [profile, isFreelance, router]);

  // Effet #2: Chargement initial des services + abonnement aux changements
  useEffect(() => {
    // Ne rien faire si aucun profil n'est disponible
    if (!profile?.id) return;
    
    // Variable pour le suivi du montage du composant
    let isMounted = true;
    
    // Fonction pour charger les données initiales
    const initialLoad = async () => {
      try {
        // Charger les services (une seule fois)
        await loadServices(profile.id);
      } catch (err) {
        console.error("Erreur lors du chargement initial :", err);
      }
    };
    
    // Exécuter le chargement initial seulement une fois
    initialLoad();
    
    // Configurer l'abonnement aux changements - limiter les événements
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
        filter: `freelance_id=eq.${profile.id}`
      }, (payload) => {
        // Recharger uniquement si le composant est toujours monté et pas déjà en train de recharger
        if (isMounted && !isRefreshing) {
          console.log("Changement détecté, rechargement des données...");
          // Utiliser une seule méthode de rechargement pour éviter les doublons
          if (payload.eventType === 'DELETE') {
            // Si suppression, mettre à jour localement sans requête API
            setServices(prev => prev.filter(s => s.id !== payload.old.id));
          } else {
            // Sinon charger depuis l'API
            loadServices(profile.id, true);
            // Recharger les stats seulement si nécessaire (création/modification)
            refreshStats();
          }
        }
      })
      .subscribe();
    
    // Nettoyage à la désactivation du composant
    return () => {
      isMounted = false;
      servicesSubscription.unsubscribe();
    };
  }, [profile?.id, loadServices, refreshStats, isRefreshing]);

  // Effet pour recharger les services quand la pagination change
  useEffect(() => {
    // Ne pas recharger si on n'a pas de profil
    if (!profile?.id) return;
    
    // Vérifier d'abord le cache avant de faire l'appel réseau
    const cacheKey = `services_freelance_${profile.id}_page_${currentPage}`;
    const cachedServices = getCachedData<{
      services: ServiceWithFreelanceAndCategories[],
      total: number
    }>(cacheKey);
    
    if (cachedServices) {
      setServices(cachedServices.services);
      setTotalServices(cachedServices.total);
      // N'appelez pas loadServices ici pour éviter le cycle
    } else {
      loadServices(profile.id);
    }
  }, [currentPage, profile?.id, loadServices]);

  // Vérifier si on vient de créer un service sans images
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get('status');
    
    if (status === 'created-without-images') {
      setError("Votre service a été créé avec succès, mais les images n'ont pas pu être associées. Vous pouvez les ajouter en modifiant votre service.");
      
      // Nettoyer l'URL pour éviter que le message ne réapparaisse après refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Écouter les événements d'invalidation du cache - optimisé
  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined') return;
    
    // Utiliser un debounce pour éviter les rechargements multiples
    let debounceTimer: NodeJS.Timeout;
    
    const handleCacheInvalidation = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isRefreshing) {
          console.log('Cache invalidé - rechargement des services');
          loadServices(profile.id, true);
        }
      }, 300);
    };
    
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    return () => {
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
      clearTimeout(debounceTimer);
    };
  }, [profile?.id, loadServices, isRefreshing]);

  // Écouter les événements de service pour rafraîchir la liste - avec debounce
  useEffect(() => {
    if (!profile?.id) return;
    
    let debounceTimer: NodeJS.Timeout;
    
    const handleServiceEvent = (event: Event) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isRefreshing) {
          console.log('Service event detected, refreshing services list');
          // Invalider le cache et recharger les services
          if (profile?.id) {
            const cacheKey = `services_freelance_${profile.id}_page_${currentPage}`;
            invalidateCache(cacheKey);
            loadServices(profile.id, true);
          }
        }
      }, 300);
    };
    
    // Ajouter les écouteurs pour tous les types d'événements de service
    window.addEventListener('vynal:service-created', handleServiceEvent);
    window.addEventListener('vynal:service-updated', handleServiceEvent);
    window.addEventListener('vynal:service-deleted', handleServiceEvent);
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      window.removeEventListener('vynal:service-created', handleServiceEvent);
      window.removeEventListener('vynal:service-updated', handleServiceEvent);
      window.removeEventListener('vynal:service-deleted', handleServiceEvent);
      clearTimeout(debounceTimer);
    };
  }, [profile?.id, currentPage, loadServices, isRefreshing]);

  // Filtrer les services en fonction de l'onglet actif
  const filteredServices = services.filter((service: ServiceWithFreelanceAndCategories) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return service.active;
    if (activeTab === 'inactive') return !service.active;
    return true;
  });

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalServices / itemsPerPage);

  // Obtenir le texte de dernière mise à jour
  const getLastRefreshText = useCallback(() => {
    if (!lastRefresh) return 'Jamais rafraîchi';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diff < 60) return 'Il y a quelques secondes';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  }, [lastRefresh]);

  return (
    <div>
      {/* Tableau de bord du services avec statistiques */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Mes services</h1>
            <p className="text-slate-500 mt-1 text-sm">Gérez et améliorez vos prestations pour attirer plus de clients</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={refreshData}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              {isRefreshing ? (
                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 rounded-full border-t-transparent"></div>
              ) : (
                <RefreshCw className="h-4 w-4 text-indigo-600" />
              )}
            </Button>
            
            <Button 
              onClick={() => router.push("/dashboard/services/new")} 
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Ajouter un service
            </Button>
          </div>
        </div>

        {/* Statistiques en cards */}
        {services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-1">Services actifs</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? (
                      <Loader size="sm" variant="primary" className="text-emerald-500" />
                    ) : (
                      stats.active
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Revenus cumulés</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? (
                      <Loader size="sm" variant="primary" className="text-blue-500" />
                    ) : (
                      stats.totalRevenue > 0 
                        ? `${formatPrice(stats.totalRevenue)} FCFA` 
                        : "-"
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border border-purple-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Commandes totales</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? (
                      <Loader size="sm" variant="primary" className="text-purple-500" />
                    ) : (
                      stats.totalOrders > 0 ? stats.totalOrders : "-"
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-white border border-cyan-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-600 mb-1">Commandes en cours</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? (
                      <Loader size="sm" variant="primary" className="text-cyan-500" />
                    ) : (
                      stats.activeOrders > 0 ? stats.activeOrders : "-"
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-cyan-100 text-cyan-600">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seconde rangée de statistiques */}
        {services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">Note moyenne (sur 5)</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? (
                      <Loader size="sm" variant="primary" className="text-amber-500" />
                    ) : (
                      stats.averageRating > 0 
                        ? stats.averageRating.toFixed(1) 
                        : "-"
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ajouter l'indicateur de dernière mise à jour */}
        <div className="text-xs text-slate-400 dark:text-slate-500 text-right mt-4">
          {isRefreshing ? 'Rafraîchissement en cours...' : `Dernière mise à jour: ${getLastRefreshText()}`}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start mb-6 text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur lors du chargement</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => profile && loadServices(profile.id)}
              className="mt-2 text-xs"
            >
              <Loader size="sm" variant="primary" className="text-emerald-500" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {statsError && (
        <div className="bg-red-50 p-4 rounded-md flex items-start mb-6 text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur lors du chargement des statistiques</p>
            <p className="text-sm mt-1">{statsError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshStats}
              className="mt-2 text-xs"
            >
              <Loader size="sm" variant="primary" className="text-emerald-500" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 p-4 rounded-md flex items-start mb-6 text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur lors de la suppression</p>
            <p className="text-sm mt-1">{deleteError}</p>
          </div>
        </div>
      )}

      {/* Onglets de filtrage */}
      {services.length > 0 && (
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Tous ({totalServices})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === 'active'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Actifs ({stats.active})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === 'inactive'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Inactifs ({totalServices - stats.active})
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-md border border-dashed border-gray-200 bg-gray-50 h-[300px]">
          <Loader size="lg" variant="primary" showText={true} text="Chargement de vos services..." />
        </div>
      ) : services.length === 0 ? (
        <Card className="mt-6 sm:mt-8 border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Layers className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 text-center">Vous n'avez pas encore de services</h3>
            <p className="text-slate-500 mb-8 text-center max-w-md">Créez votre premier service pour mettre en valeur vos compétences et attirer des clients potentiels</p>
            <Button 
              size="lg" 
              onClick={() => router.push("/dashboard/services/new")} 
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all"
            >
              <Plus className="mr-2 h-5 w-5" /> Créer mon premier service
            </Button>
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 && currentPage === 1 ? (
        <div className="bg-slate-50 rounded-lg p-8 text-center border border-slate-200">
          <p className="text-slate-600">Aucun service ne correspond au filtre sélectionné.</p>
        </div>
      ) : filteredServices.length === 0 && currentPage > 1 ? (
        <div className="bg-slate-50 rounded-lg p-8 text-center border border-slate-200">
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-600">Aucun service trouvé sur cette page.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(1)}
              className="mt-2"
            >
              Retourner à la première page
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service: ServiceWithFreelanceAndCategories) => (
            <ServiceCard
              key={service.id}
              service={service}
              isManageable={true}
              isDeletable={true}
              isDeleting={isDeleting === service.id}
              onView={(id) => router.push(`/dashboard/services/${id}`)}
              onEdit={(id) => router.push(`/dashboard/services/edit/${id}`)}
              onDelete={(id) => handleDeleteService(id)}
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3"
          >
            Précédent
          </Button>
          
          {/* Affichage des numéros de page */}
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculer les pages à afficher (max 5)
              let pageNum;
              if (totalPages <= 5) {
                // Si moins de 5 pages, on affiche toutes les pages
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                // Si on est au début, on affiche les 5 premières pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // Si on est à la fin, on affiche les 5 dernières pages
                pageNum = totalPages - 4 + i;
              } else {
                // Sinon on affiche 2 pages avant et 2 pages après la page courante
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 p-0 ${
                    currentPage === pageNum 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : ''
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            {/* Afficher ... si nécessaire */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="flex items-center justify-center w-9 h-9">...</span>
            )}
            
            {/* Toujours afficher la dernière page si on a plus de 5 pages */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                className="w-9 h-9 p-0"
              >
                {totalPages}
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
} 