"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { useFreelanceStats } from "@/hooks/useFreelanceStats";
import { useDebounce } from "@/hooks/useDebounce";
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
import { Plus, PenSquare, Trash2, Clock, AlertCircle, BarChart3, CheckCircle2, DollarSign, Layers, Eye, ShoppingBag, MessageSquare, RefreshCw, XCircle, CheckCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/services/ServiceCard";
import { 
  getCachedData, 
  setCachedData, 
  CACHE_EXPIRY
} from '@/lib/optimizations/cache';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ServicesPageSkeleton } from "@/components/skeletons/ServicesPageSkeleton";
import { ServiceRulesModal } from "@/components/services/ServiceRulesModal";

// Performance optimizations - Dynamic imports
import dynamic from 'next/dynamic';

// Définition locale des priorités du cache au cas où l'import ne fonctionne pas
const CACHE_PRIORITIES_LOCAL = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

// Définition d'une fonction d'invalidation de cache locale
const invalidateCacheLocal = (key: string) => {
  // Si nous sommes dans le navigateur, envoyons un événement pour informer qu'un cache a été invalidé
  if (typeof window !== 'undefined') {
    console.log(`Cache invalidé: ${key}`);
    // Stocker la clé dans le sessionStorage pour indiquer qu'elle a été invalidée
    sessionStorage.setItem(`cache_invalidated:${key}`, Date.now().toString());
    // Émettre un événement personnalisé
    window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { detail: { key } }));
  }
};

// Types strictes pour améliorer la sécurité et la robustesse
interface ServicePageState {
  readonly services: ServiceWithFreelanceAndCategories[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly isDeleting: string | null;
  readonly deleteError: string | null;
  readonly activeTab: 'all' | 'active' | 'inactive';
  readonly currentPage: number;
  readonly totalServices: number;
  readonly isRefreshing: boolean;
  readonly lastRefresh: Date | null;
}

// Loading fallbacks pour les composants chargés dynamiquement
const ServicesLoadingPlaceholder = memo(function ServicesLoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-md border border-dashed border-gray-200 bg-gray-50 h-[300px]">
      <div className="animate-pulse space-y-3 w-full max-w-md">
        <div className="h-6 bg-vynal-purple-secondary/30 rounded w-3/4 mx-auto animate-pulse"></div>
        <div className="h-4 bg-vynal-purple-secondary/30 rounded w-1/2 mx-auto animate-pulse"></div>
        <div className="h-24 bg-vynal-purple-secondary/30 rounded w-full mx-auto mt-6 animate-pulse"></div>
      </div>
    </div>
  );
});

// Composants mémoïsés pour réduire les re-rendus
const StatsCard = memo(function StatsCard({
  title,
  value,
  isLoading,
  icon,
  bgClass
}: {
  title: string;
  value: string | number;
  isLoading: boolean;
  icon: React.ReactNode;
  bgClass: string;
}) {
  return (
    <Card className="h-full overflow-hidden rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-vynal-purple-secondary/5 dark:from-vynal-purple-dark/50 dark:to-vynal-purple-dark/30 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              {title}
            </p>
            {isLoading ? (
              <div className="h-6 w-20 bg-vynal-purple-secondary/30 rounded animate-pulse"></div>
            ) : (
              <p className="text-base sm:text-lg font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {value}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-full ${bgClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Tableau de stats mémoïsé
const StatsDashboard = memo(function StatsDashboard({
  stats,
  loadingStats,
  services
}: {
  stats: any;
  loadingStats: boolean;
  services: ServiceWithFreelanceAndCategories[];
}) {
  // Ne rien afficher si aucun service ou si stats est undefined
  if (services.length === 0 || !stats) return null;
  
  // Valeurs par défaut sécurisées
  const active = stats.active || 0;
  const totalRevenue = stats.totalRevenue || 0;
  const totalOrders = stats.totalOrders || 0;
  const activeOrders = stats.activeOrders || 0;
  const averageRating = stats.averageRating || 0;
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Services actifs"
          value={active}
          isLoading={loadingStats}
          icon={<CheckCircle2 className="h-5 w-5" />}
          bgClass="from-emerald-50 to-white"
        />

        <StatsCard
          title="Revenus cumulés"
          value={totalRevenue > 0 ? `${formatPrice(totalRevenue)} FCFA` : "-"}
          isLoading={loadingStats}
          icon={<DollarSign className="h-5 w-5" />}
          bgClass="from-blue-50 to-white"
        />

        <StatsCard
          title="Commandes totales"
          value={totalOrders > 0 ? totalOrders : "-"}
          isLoading={loadingStats}
          icon={<ShoppingBag className="h-5 w-5" />}
          bgClass="from-purple-50 to-white"
        />

        <StatsCard
          title="Commandes en cours"
          value={activeOrders > 0 ? activeOrders : "-"}
          isLoading={loadingStats}
          icon={<Clock className="h-5 w-5" />}
          bgClass="from-cyan-50 to-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <StatsCard
          title="Note moyenne (sur 5)"
          value={averageRating > 0 ? averageRating.toFixed(1) : "-"}
          isLoading={loadingStats}
          icon={<MessageSquare className="h-5 w-5" />}
          bgClass="from-amber-50 to-white"
        />
      </div>
    </>
  );
});

// Composant pour afficher les erreurs
const ErrorDisplay = memo(function ErrorDisplay({
  title,
  message,
  retryAction,
  retryLabel
}: {
  title: string;
  message: string;
  retryAction?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="bg-red-50 p-4 rounded-md flex items-start mb-6 text-red-800 border border-red-200">
      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1">{message}</p>
        {retryAction && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retryAction}
            className="mt-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {retryLabel || "Réessayer"}
          </Button>
        )}
      </div>
    </div>
  );
});

const EmptyStateCard = memo(function EmptyStateCard({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="mt-6 sm:mt-8 border border-slate-200 shadow-sm overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <Layers className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 text-center">Vous n'avez pas encore de services</h3>
        <p className="text-slate-500 mb-8 text-center max-w-md">Créez votre premier service pour mettre en valeur vos compétences et attirer des clients potentiels</p>
        <Button 
          size="lg" 
          onClick={onCreateClick} 
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all"
        >
          <Plus className="mr-2 h-5 w-5" /> Créer mon premier service
        </Button>
      </CardContent>
    </Card>
  );
});

// Composant principal de la page optimisé
export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  
  // État optimisé avec typage strict et immutabilité
  const [state, setState] = useState<ServicePageState>({
    services: [],
    loading: true,
    error: null,
    isDeleting: null,
    deleteError: null,
    activeTab: 'all',
    currentPage: 1,
    totalServices: 0,
    isRefreshing: false,
    lastRefresh: null
  });
  
  // Destructurer l'état pour plus de lisibilité
  const {
    services,
    loading,
    error,
    isDeleting,
    deleteError,
    activeTab,
    currentPage,
    totalServices,
    isRefreshing,
    lastRefresh
  } = state;
  
  // Utilisation du hook personnalisé pour les statistiques
  const { stats, loading: loadingStats, error: statsError, refreshStats } = useFreelanceStats(profile?.id);
  const { deleteService } = useServices();
  const itemsPerPage = 10;
  
  // Références pour optimiser la performance et éviter les courses
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRefreshTimeRef = useRef<number>(0); // Nouvelle référence pour suivre le temps écoulé depuis le dernier rafraîchissement
  const MIN_REFRESH_INTERVAL = 10000; // 10 secondes minimum entre les rafraîchissements automatiques
  
  // Setter d'état optimisé et sécurisé
  const safeSetState = useCallback((updater: (prev: ServicePageState) => ServicePageState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);
  
  // Cache key mémoïsé
  const currentCacheKey = useMemo(() => 
    profile?.id ? `services_freelance_${profile.id}_page_${currentPage}` : null, 
    [profile?.id, currentPage]
  );
  
  // Fonction optimisée pour charger les services avec gestion du cache et des erreurs
  const loadServices = useCallback(async (profileId: string, forceRefresh = false) => {
    if ((isRefreshing && !forceRefresh) || !mountedRef.current) return;
    
    // Éviter les duplications de requêtes
    if (loadingRef.current) {
      console.warn("Requête de chargement déjà en cours, ignorée");
      return;
    }
    
    // Vérifier l'intervalle minimum entre les rafraîchissements automatiques
    const now = Date.now();
    if (!forceRefresh && now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
      console.log("Rafraîchissement ignoré - intervalle minimum non atteint");
      return;
    }
    
    // Mettre à jour le timestamp du dernier rafraîchissement
    lastRefreshTimeRef.current = now;
    
    // Mettre en place un délai maximum de sécurité
    const timeout = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.warn("Requête annulée - timeout dépassé");
        if (mountedRef.current) {
          safeSetState(prev => ({
            ...prev,
            loading: false,
            isRefreshing: false,
            error: "Temps d'attente dépassé. Veuillez réessayer."
          }));
        }
        loadingRef.current = false;
      }
    }, 15000); // 15 secondes de timeout
    
    try {
      // Annuler toutes les requêtes précédentes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Créer un nouveau contrôleur d'annulation
      abortControllerRef.current = new AbortController();
      
      // Verrouiller pour éviter les appels multiples
      loadingRef.current = true;
      
      safeSetState(prev => ({
        ...prev,
        loading: !forceRefresh || prev.services.length === 0,
        isRefreshing: forceRefresh,
        error: null
      }));
      
      // Construction de la clé de cache incluant le filtre actuel
      const cacheKey = activeTab === 'all' 
        ? `services_freelance_${profileId}_page_${currentPage}` 
        : `services_freelance_${profileId}_${activeTab}_page_${currentPage}`;
      
      // Vérifier le cache si ce n'est pas un forceRefresh
      if (!forceRefresh) {
        const cachedServices = getCachedData<{
          services: ServiceWithFreelanceAndCategories[],
          total: number
        }>(cacheKey);
        
        if (cachedServices) {
          safeSetState(prev => ({
            ...prev,
            services: cachedServices.services,
            totalServices: cachedServices.total,
            loading: false,
            lastRefresh: new Date()
          }));
          
          // Rafraîchir en arrière-plan uniquement si ça fait longtemps
          if (mountedRef.current) {
            const now = Date.now();
            // Ne rafraîchir que si le cache a plus de 30 secondes
            if (now - lastRefreshTimeRef.current >= 30000) {
              const refreshDelay = setTimeout(() => {
                if (mountedRef.current) loadServices(profileId, true);
              }, 2000); // Délai augmenté à 2 secondes
              lastRefreshTimeRef.current = now;
              return () => clearTimeout(refreshDelay);
            }
          }
          
          loadingRef.current = false;
          clearTimeout(timeout);
          return;
        }
      }
      
      // Préparation de la requête de base
      let query = supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('freelance_id', profileId);
      
      // Ajouter des filtres en fonction de l'onglet actif
      if (activeTab === 'active') {
        query = query.eq('active', true);
      } else if (activeTab === 'inactive') {
        query = query.eq('active', false);
      }
        
      // Récupérer d'abord le nombre total de services pour la pagination
      const { count, error: countError } = await query.abortSignal(abortControllerRef.current?.signal);
      
      if (countError) {
        console.error('Erreur lors du comptage des services:', countError);
        throw new Error('Impossible de récupérer le nombre total de services.');
      }
      
      if (!mountedRef.current) {
        loadingRef.current = false;
        clearTimeout(timeout);
        return;
      }
      
      // Mettre à jour le nombre total pour la pagination
      safeSetState(prev => ({
        ...prev, 
        totalServices: count || 0
      }));
      
      // Préparation de la requête pour récupérer les données détaillées
      let dataQuery = supabase
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
      
      // Ajouter des filtres en fonction de l'onglet actif
      if (activeTab === 'active') {
        dataQuery = dataQuery.eq('active', true);
      } else if (activeTab === 'inactive') {
        dataQuery = dataQuery.eq('active', false);
      }
      
      // Exécuter la requête
      const { data, error: fetchError } = await dataQuery.abortSignal(abortControllerRef.current?.signal);
      
      if (fetchError) {
        console.error('Erreur lors du chargement des services:', fetchError);
        throw new Error('Impossible de charger vos services. Veuillez réessayer.');
      }
      
      if (!mountedRef.current) {
        loadingRef.current = false;
        clearTimeout(timeout);
        return;
      }
      
      // Transformer les données pour correspondre au type ServiceWithFreelanceAndCategories
      const transformedServices = data.map((service: any) => ({
        ...service,
        profiles: service.profiles,
        categories: service.categories,
        subcategories: service.subcategories,
      }));
      
      // Mettre en cache les résultats avec priorité appropriée
      setCachedData(
        cacheKey, 
        { services: transformedServices, total: count || 0 },
        { 
          expiry: CACHE_EXPIRY.DASHBOARD_DATA,
          priority: forceRefresh ? 'medium' : 'high'
        }
      );
      
      // Mise à jour atomique de l'état
      safeSetState(prev => ({
        ...prev,
        services: transformedServices,
        loading: false,
        isRefreshing: false,
        lastRefresh: new Date(),
        error: null
      }));
    } catch (err: any) {
      console.error('Erreur lors du chargement des services:', err);
      
      // Ne pas afficher d'erreur si la requête a été annulée délibérément
      if (
        err.name === 'AbortError' || 
        err.message === 'AbortError' || 
        err.message === 'The user aborted a request.' || 
        err.message?.includes('aborted') || 
        err.message?.includes('abort') || 
        err.message?.includes('signal is aborted')
      ) {
        console.log('Requête de services annulée délibérément');
        return;
      }
      
      if (mountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: err.message || 'Une erreur est survenue lors du chargement des services',
          loading: false,
          isRefreshing: false
        }));
      }
    } finally {
      // Nettoyer
      loadingRef.current = false;
      clearTimeout(timeout);
      abortControllerRef.current = null;
    }
  }, [currentPage, itemsPerPage, isRefreshing, safeSetState, activeTab]);

  // Fonction optimisée pour gérer la suppression d'un service
  const handleDeleteService = useCallback(async (serviceId: string) => {
    if (!mountedRef.current) return;
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.")) {
      safeSetState(prev => ({ 
        ...prev,
        isDeleting: serviceId,
        deleteError: null
      }));
      
      try {
        const result = await deleteService(serviceId);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        if (!mountedRef.current) return;
        
        // Mise à jour optimiste de l'UI sans rechargement complet
        safeSetState(prev => ({
          ...prev,
          services: prev.services.filter(service => service.id !== serviceId)
        }));
        
        // Invalider le cache des services pour toutes les pages potentiellement affectées
        if (profile?.id) {
          for (let i = 1; i <= Math.ceil(totalServices / itemsPerPage); i++) {
            // Invalider pour tous les types d'onglets
            invalidateCacheLocal(`services_freelance_${profile.id}_page_${i}`);
            invalidateCacheLocal(`services_freelance_${profile.id}_active_page_${i}`);
            invalidateCacheLocal(`services_freelance_${profile.id}_inactive_page_${i}`);
          }
        }
        
        // Rafraîchir les statistiques en arrière-plan
        refreshStats(true);
      } catch (err: any) {
        console.error("Erreur lors de la suppression du service:", err);
        
        if (!mountedRef.current) return;
        
        // Fournir un message d'erreur plus précis
        let errorMessage = "Une erreur est survenue lors de la suppression du service";
        
        // Vérifier les types d'erreur spécifiques
        if (err.message && err.message.includes("JSON object requested")) {
          errorMessage = "Impossible d'identifier le service de manière unique. Veuillez réessayer ou contacter le support.";
        } else if (err.message && err.message.includes("foreign key constraint")) {
          errorMessage = "Ce service ne peut pas être supprimé car il est référencé par des commandes existantes.";
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        safeSetState(prev => ({
          ...prev,
          deleteError: errorMessage
        }));
      } finally {
        if (mountedRef.current) {
          safeSetState(prev => ({
            ...prev,
            isDeleting: null
          }));
        }
      }
    }
  }, [deleteService, profile?.id, refreshStats, totalServices, itemsPerPage, safeSetState]);

  // Fonction optimisée pour changer de page
  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || !mountedRef.current) return;
    
    // Scroll en haut de la page pour une meilleure UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    safeSetState(prev => ({ ...prev, currentPage: page }));
  }, [currentPage, safeSetState]);

  // Fonction optimisée pour rafraîchir manuellement les données
  const refreshData = useCallback(() => {
    if (!profile?.id || isRefreshing || !mountedRef.current) return;
    
    // Pour le rafraîchissement manuel, on ignore l'intervalle minimum
    // car c'est une action explicite de l'utilisateur
    lastRefreshTimeRef.current = Date.now(); // Mettre à jour le timestamp
    
    // Invalider le cache pour la page actuelle uniquement mais pour tous les types d'onglets
    if (profile?.id) {
      // Construire la clé de cache en fonction de l'onglet actif
      const cacheKey = activeTab === 'all' 
        ? `services_freelance_${profile.id}_page_${currentPage}` 
        : `services_freelance_${profile.id}_${activeTab}_page_${currentPage}`;
      
      invalidateCacheLocal(cacheKey);
    }
    
    // Recharger les données
    loadServices(profile.id, true);
    refreshStats(true);
  }, [profile?.id, loadServices, refreshStats, isRefreshing, currentPage, activeTab]);

  // Fonction pour changer l'onglet actif
  const handleTabChange = useCallback((tab: 'all' | 'active' | 'inactive') => {
    if (tab === activeTab || !mountedRef.current) return;
    
    console.log(`Changement d'onglet de ${activeTab} à ${tab}`);
    
    safeSetState(prev => ({ 
      ...prev, 
      activeTab: tab,
      // Remettre la pagination à 1 lors du changement d'onglet pour éviter les confusions
      currentPage: 1
    }));
    
    // Force refresh des services pour s'assurer que la liste est mise à jour
    if (profile?.id && !loadingRef.current) {
      // Petite pause avant de rafraîchir pour laisser l'état se mettre à jour
      setTimeout(() => {
        if (mountedRef.current) {
          // Actualiser les données avec l'onglet nouvellement sélectionné
          loadServices(profile.id, true);
        }
      }, 100);
    }
  }, [activeTab, safeSetState, profile?.id, loadServices]);

  // Effet de nettoyage et d'initialisation du composant
  useEffect(() => {
    mountedRef.current = true;
    
    // Nettoyer lors du démontage
    return () => {
      mountedRef.current = false;
      
      // Annuler toutes les requêtes en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Redirection si l'utilisateur n'est pas freelance - optimisé
  useEffect(() => {
    if (profile && !isFreelance) {
      router.push("/dashboard");
    }
  }, [profile, isFreelance, router]);

  // Chargement initial des services + abonnement aux changements - optimisé
  useEffect(() => {
    // Ne rien faire si aucun profil n'est disponible
    if (!profile?.id || !mountedRef.current) return;
    
    // Éviter les chargements multiples
    if (loadingRef.current) return;
    
    // Charger les services (initial load)
    loadServices(profile.id);
    
    // Utiliser un délai pour la réaction aux modifications (debounce)
    let changeTimer: NodeJS.Timeout;
    
    // Configurer l'abonnement aux changements de manière optimisée
    const servicesSubscription = supabase
      .channel(`services-changes-${profile.id}`) // Nom unique par utilisateur
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
        filter: `freelance_id=eq.${profile.id}`
      }, () => {
        // Recharger uniquement si le composant est toujours monté et pas déjà en chargement
        if (mountedRef.current && !loadingRef.current) {
          // Nettoyer tout délai précédent
          clearTimeout(changeTimer);
          
          // Ajouter un délai pour éviter les rechargements en cascade
          changeTimer = setTimeout(() => {
            if (mountedRef.current) {
              // Vérifier l'intervalle minimum entre les rafraîchissements
              const now = Date.now();
              if (now - lastRefreshTimeRef.current >= MIN_REFRESH_INTERVAL) {
                loadServices(profile.id, true);
              }
            }
          }, 2000); // Délai augmenté à 2 secondes pour réduire la fréquence
        }
      })
      .subscribe();
    
    // Nettoyage à la désactivation du composant
    return () => {
      clearTimeout(changeTimer);
      servicesSubscription.unsubscribe();
    };
  }, [profile?.id, loadServices]);

  // Effet pour recharger les services quand la pagination change - optimisé
  useEffect(() => {
    // Ne rien lancer si on n'a pas changé de page (évite le chargement redondant)
    if (profile?.id && !loadingRef.current && mountedRef.current) {
      // Charger uniquement lorsque la page change explicitement, pas à chaque rendu
      const pageCacheKey = `current_page_${profile.id}`;
      const storedPage = sessionStorage.getItem(pageCacheKey);
      
      // Uniquement si la page a réellement changé
      if (storedPage !== String(currentPage)) {
        sessionStorage.setItem(pageCacheKey, String(currentPage));
        loadServices(profile.id);
      }
    }
  }, [currentPage, profile?.id, loadServices]); // Suppression de services.length qui causait des rechargements excessifs

  // Écouter les événements d'invalidation du cache avec debounce - optimisé
  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined' || !mountedRef.current) return;
    
    let cacheTimer: NodeJS.Timeout;
    
    const handleCacheInvalidation = () => {
      // Éviter les chargements multiples
      if (loadingRef.current || !mountedRef.current) return;
      
      // Vérifier l'intervalle minimum
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
        console.log("Invalidation de cache ignorée - intervalle minimum non atteint");
        return;
      }
      
      // Nettoyer tout délai précédent
      clearTimeout(cacheTimer);
      
      // Ajouter un délai pour éviter les rechargements en cascade
      cacheTimer = setTimeout(() => {
        if (mountedRef.current && profile?.id) {
          lastRefreshTimeRef.current = Date.now();
          loadServices(profile.id, true);
        }
      }, 1000); // Délai augmenté pour réduire la fréquence
    };
    
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    return () => {
      clearTimeout(cacheTimer);
      window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    };
  }, [profile?.id, loadServices]);

  // Vérifier les paramètres d'URL au chargement initial - optimisé
  useEffect(() => {
    if (typeof window === 'undefined' || !mountedRef.current) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams?.get('status');
    const error = searchParams?.get('error');
    
    if (status === 'created-without-images') {
      safeSetState(prev => ({
        ...prev,
        error: "Votre service a été créé avec succès, mais les images n'ont pas pu être associées. Vous pouvez les ajouter en modifiant votre service."
      }));
      
      // Nettoyer l'URL pour éviter que le message ne réapparaisse après refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error === 'max_services_reached') {
      safeSetState(prev => ({
        ...prev,
        error: "Vous avez atteint la limite maximale de 6 services actifs. Pour créer un nouveau service, vous devez d'abord désactiver ou supprimer un service existant. Pour supprimer cette limitation, obtenez une certification expert."
      }));
      
      // Nettoyer l'URL pour éviter que le message ne réapparaisse après refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [safeSetState]);

  // Filtrer les services en fonction de l'onglet actif - mémoïsé pour optimiser les performances
  const filteredServices = useMemo(() => {
    // Version corrigée du filtrage pour assurer que les services sont correctement filtrés
    return services.filter((service: ServiceWithFreelanceAndCategories) => {
      // Debug pour trouver les problèmes potentiels
      console.log(`Service ${service.id} - active: ${service.active}, type: ${typeof service.active}`);
      
      if (activeTab === 'all') return true;
      
      // Gestion stricte des booléens pour éviter les problèmes de type
      if (activeTab === 'active') return service.active === true;
      if (activeTab === 'inactive') return service.active === false;
      
      return true;
    });
  }, [services, activeTab]);

  // Optimiser le calcul du nombre total de pages
  const totalPages = useMemo(() => 
    Math.ceil(totalServices / itemsPerPage), 
    [totalServices, itemsPerPage]
  );

  // Obtenir le texte de dernière mise à jour de manière optimisée
  const lastRefreshText = useMemo(() => {
    if (!lastRefresh) return 'Jamais rafraîchi';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diff < 60) return 'Il y a quelques secondes';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  }, [lastRefresh]);

  // Afficher les statistiques des onglets
  const activeServicesCount = useMemo(() => 
    services.filter(service => service.active === true).length, 
    [services]
  );
  
  const inactiveServicesCount = useMemo(() => 
    services.filter(service => service.active === false).length, 
    [services]
  );

  // useEffect pour configurer les abonnements Supabase en temps réel
  useEffect(() => {
    if (!profile?.id) return;
    
    // Créer un canal de souscription pour les services du freelance connecté
    const serviceChannel = supabase
      .channel(`freelance-services-${profile.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'services',
          filter: `freelance_id=eq.${profile.id}`
        }, 
        (payload) => {
          console.log('Changement détecté sur un service:', payload);
          
          // Limiter la fréquence des mises à jour
          const now = Date.now();
          if (now - lastRefreshTimeRef.current < 1000) {
            console.log('Ignorer la mise à jour (trop fréquente)');
            return;
          }
          
          // Si c'est un UPDATE, mettre à jour le service dans l'état local sans recharger toute la liste
          if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            safeSetState(prev => {
              // Trouver le service dans l'état actuel et le mettre à jour de manière sélective
              const updatedServices = prev.services.map(service => {
                if (service.id === payload.new.id) {
                  return {
                    ...service,
                    // Ne mettre à jour que les propriétés présentes dans payload.new
                    status: payload.new.status !== undefined ? payload.new.status : service.status,
                    active: payload.new.active !== undefined ? 
                      (payload.new.active === true || payload.new.active === 'true') : 
                      service.active,
                    moderation_comment: payload.new.moderation_comment !== undefined ? 
                      payload.new.moderation_comment : 
                      service.moderation_comment,
                    admin_notes: payload.new.admin_notes !== undefined ? 
                      payload.new.admin_notes : 
                      service.admin_notes
                  };
                }
                return service;
              });
              
              // Émettre un événement pour d'autres composants contenant ce service
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('vynal:service-status-change', { 
                  detail: { 
                    serviceId: payload.new.id,
                    status: payload.new.status,
                    active: payload.new.active,
                  }
                }));
              }
              
              lastRefreshTimeRef.current = now;
              return {
                ...prev,
                services: updatedServices
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            // Pour les suppressions, retirer le service de l'état local
            safeSetState(prev => ({
              ...prev,
              services: prev.services.filter(service => service.id !== payload.old.id)
            }));
            
            lastRefreshTimeRef.current = now;
          } else {
            // Pour les autres types d'événements, programmer un rechargement complet différé
            const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
            if (timeSinceLastRefresh > 5000 && !loadingRef.current) {
              console.log('Rechargement complet programmé');
              lastRefreshTimeRef.current = now;
              loadServices(profile.id, true);
            }
          }
        })
      .subscribe();
    
    // Nettoyer l'abonnement lors du démontage
    return () => {
      supabase.removeChannel(serviceChannel);
    };
  }, [profile?.id, safeSetState, loadServices]);

  // Effet pour écouter les événements personnalisés de mise à jour des services
  useEffect(() => {
    // Gestionnaire d'événements pour les mises à jour de services
    const handleServiceUpdated = (event: CustomEvent) => {
      if (!event.detail) return;
      
      // Utiliser les détails de l'événement pour une mise à jour sélective
      const { serviceId, type } = event.detail;
      
      // Si c'est une mise à jour globale ou si le service n'est pas spécifié, rafraîchir avec un délai
      if (type === 'global-update' || !serviceId) {
        if (profile?.id && !loadingRef.current) {
          // Éviter les rafraîchissements trop fréquents
          const now = Date.now();
          if (now - lastRefreshTimeRef.current > 3000) {
            console.log('Rafraîchissement global différé');
            setTimeout(() => {
              if (!loadingRef.current) {
                lastRefreshTimeRef.current = now;
                loadServices(profile.id, true);
              }
            }, 1000);
          }
        }
      }
      // Sinon, ne rien faire car les mises à jour spécifiques sont gérées par l'abonnement Supabase
    };
    
    // Ajouter l'écouteur d'événements
    window.addEventListener('vynal:service-updated', handleServiceUpdated as EventListener);
    
    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener('vynal:service-updated', handleServiceUpdated as EventListener);
    };
  }, [profile?.id, loadServices]);

  // À ajouter dans votre état
  const [moderationDialog, setModerationDialog] = useState<{
    isOpen: boolean;
    serviceId: string | null;
    comment: string | null;
    title: string | null;
    status: string | null;
  }>({
    isOpen: false,
    serviceId: null,
    comment: null,
    title: null,
    status: null,
  });

  // Fonction pour ouvrir la boîte de dialogue des commentaires de modération
  const showModerationComment = useCallback((service: ServiceWithFreelanceAndCategories) => {
    if ((service.status === 'rejected' || service.status === 'approved') && service.moderation_comment) {
      setModerationDialog({
        isOpen: true,
        serviceId: service.id,
        comment: service.moderation_comment || '',
        title: service.title,
        status: service.status
      });
    } else {
      // Si le service n'a pas de commentaire de modération, on redirige vers la page de détails
      router.push(`/dashboard/services/${service.id}`);
    }
  }, [router]);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const handleCreateService = () => {
    setIsRulesModalOpen(true);
  };

  const handleAcceptRules = () => {
    setIsRulesModalOpen(false);
    router.push("/dashboard/services/new");
  };

  // Display skeleton during initial loading
  if (loading && !isRefreshing) {
    return <ServicesPageSkeleton />;
  }

  // Rendu principal avec composants mémoïsés
  return (
    <div>
      {/* Tableau de bord du services avec statistiques */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-5">
          <div>
            <h1 className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-vynal-text-primary">Mes services</h1>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary/80">Gérez vos prestations pour attirer plus de clients</p>
          </div>
          
          {services.length > 0 && (
            <div className="w-full sm:w-auto flex justify-center sm:justify-end">
              <Button 
                onClick={handleCreateService} 
                className="w-full sm:w-auto text-xs sm:text-sm bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:hover:from-vynal-accent-primary/90 dark:hover:to-vynal-accent-secondary/90 transition-all duration-300 shadow-sm hover:shadow-md"
                disabled={!loading && profile !== null && profile !== undefined && profile.role === 'freelance' && (!profile.is_certified || profile.certification_type !== 'expert') && activeServicesCount >= 6}
                title={!loading && profile !== null && profile !== undefined && profile.role === 'freelance' && (!profile.is_certified || profile.certification_type !== 'expert') && activeServicesCount >= 6 ? 
                  "Vous avez atteint la limite de 6 services actifs" : 
                  "Créer un nouveau service"}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Nouveau service
              </Button>
            </div>
          )}
        </div>

        {/* Ajouter l'indicateur de dernière mise à jour */}
        <div className="text-[10px] sm:text-[10px] md:text-[10px] text-slate-500 dark:text-slate-500 text-right">
          {isRefreshing ? 'Rafraîchissement en cours...' : `Mise à jour: ${lastRefreshText}`}
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <ErrorDisplay
          title="Erreur lors du chargement"
          message={error}
          retryAction={() => profile && loadServices(profile.id)}
          retryLabel="Réessayer"
        />
      )}

      {deleteError && (
        <ErrorDisplay
          title="Erreur lors de la suppression"
          message={deleteError}
        />
      )}

      {/* Message d'information sur la limitation des services actifs */}
      {!loading && profile && profile.role === 'freelance' && (!profile.is_certified || profile.certification_type !== 'expert') && (
        <div className="mb-3 p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-amber-800 dark:text-amber-400">Limitation des services actifs</p>
            <p className="text-[8px] sm:text-[10px] text-amber-700 dark:text-amber-400">Sans certification expert, vous êtes limité à 6 services actifs maximum. Actuellement, vous avez {activeServicesCount} service{activeServicesCount > 1 ? 's' : ''} actif{activeServicesCount > 1 ? 's' : ''}. Pour supprimer cette limitation, obtenez une certification expert.</p>
          </div>
        </div>
      )}

      {/* Onglets de filtrage et bouton d'actualisation */}
      {services.length > 0 && (
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 mb-4 sm:mb-5">
          <div className="flex overflow-x-auto no-scrollbar gap-1">
            <button
              onClick={() => handleTabChange('all')}
              className={`pb-1.5 sm:pb-2 px-2 sm:px-4 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                activeTab === 'all'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Tous ({totalServices})
            </button>
            <button
              onClick={() => handleTabChange('active')}
              className={`pb-1.5 sm:pb-2 px-2 sm:px-4 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                activeTab === 'active'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Actifs ({activeServicesCount})
            </button>
            <button
              onClick={() => handleTabChange('inactive')}
              className={`pb-1.5 sm:pb-2 px-2 sm:px-4 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                activeTab === 'inactive'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Inactifs ({inactiveServicesCount})
            </button>
          </div>
          <Button 
            onClick={refreshData}
            disabled={isRefreshing || loading}
            variant="outline"
            size="sm"
            className={`bg-white dark:bg-transparent h-8 w-8 p-0 transition-colors duration-200 ${Date.now() - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL ? 'opacity-50' : 'opacity-100'}`}
            title={Date.now() - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL ? 
              `Rafraîchissement disponible dans ${Math.ceil((MIN_REFRESH_INTERVAL - (Date.now() - lastRefreshTimeRef.current)) / 1000)} secondes` : 
              'Rafraîchir les données'
            }
          >
            {isRefreshing ? (
              <div className="animate-spin h-3.5 w-3.5 border-2 border-indigo-600 dark:border-indigo-400 rounded-full border-t-transparent"></div>
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
          </Button>
        </div>
      )}

      {/* Rendu conditionnel optimisé */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4 rounded-md border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 h-[250px] sm:h-[300px]">
          <Loader size="md" variant="primary" showText={true} text="Chargement..." />
        </div>
      ) : services.length === 0 ? (
        <div className="mt-4 sm:mt-6 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden rounded-xl">
          <div className="flex flex-col items-center justify-center p-5 sm:p-8">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Layers className="h-6 sm:h-8 w-6 sm:w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-4 text-center">Vous n'avez pas encore de services</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 sm:mb-6 text-center max-w-md">Créez votre premier service pour mettre en valeur vos compétences</p>
            <Button 
              onClick={handleCreateService} 
              className="w-full sm:w-auto text-xs sm:text-sm bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:hover:from-vynal-accent-primary/90 dark:hover:to-vynal-accent-secondary/90 transition-all duration-300 shadow-sm hover:shadow-md"
              disabled={!loading && profile !== null && profile !== undefined && profile.role === 'freelance' && (!profile.is_certified || profile.certification_type !== 'expert') && activeServicesCount >= 6}
              title={!loading && profile !== null && profile !== undefined && profile.role === 'freelance' && (!profile.is_certified || profile.certification_type !== 'expert') && activeServicesCount >= 6 ? 
                "Vous avez atteint la limite de 6 services actifs" : 
                "Créer un nouveau service"}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Nouveau service
            </Button>
          </div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4 sm:p-6 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {activeTab === 'all' 
              ? "Aucun service trouvé."
              : `Aucun service ${activeTab === 'active' ? 'actif' : 'inactif'} trouvé.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service: ServiceWithFreelanceAndCategories) => (
            <ServiceCard
              key={service.id}
              service={service}
              isManageable={true}
              isDeletable={true}
              isDeleting={isDeleting === service.id}
              onView={() => showModerationComment(service)}
              onEdit={() => router.push(`/dashboard/services/edit/${service.id}`)}
              onDelete={() => handleDeleteService(service.id)}
            />
          ))}
        </div>
      )}
      
      {/* Pagination optimisée */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-5 sm:mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
          >
            Précédent
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              // Simplifier l'affichage pour mobile
              let pageNum;
              if (totalPages <= 3) {
                // Si moins de 3 pages, on affiche toutes les pages
                pageNum = i + 1;
              } else if (currentPage <= 2) {
                // Si on est au début, on affiche les 3 premières pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 1) {
                // Si on est à la fin, on affiche les 3 dernières pages
                pageNum = totalPages - 2 + i;
              } else {
                // Sinon on affiche la page courante et les pages adjacentes
                pageNum = currentPage - 1 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs ${
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
            {totalPages > 3 && currentPage < totalPages - 1 && (
              <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-xs">...</span>
            )}
            
            {/* Toujours afficher la dernière page si on a plus de 3 pages */}
            {totalPages > 3 && currentPage < totalPages - 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs"
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

      {/* Boîte de dialogue des commentaires de modération */}
      <Dialog open={moderationDialog.isOpen} onOpenChange={(open) => setModerationDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[550px]" aria-labelledby="moderation-dialog-title" aria-describedby="moderation-dialog-description">
          <DialogHeader>
            <DialogTitle id="moderation-dialog-title" className={`flex items-center gap-2 ${
              moderationDialog.status === 'rejected' ? 'text-red-600' : 'text-green-600'
            }`}>
              {moderationDialog.status === 'rejected' ? (
                <>
                  <XCircle className="h-5 w-5" />
                  Service rejeté par la modération
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Service approuvé par la modération
                </>
              )}
            </DialogTitle>
            <DialogDescription id="moderation-dialog-description" className="pt-2">
              <p className="text-base font-medium mb-1">{moderationDialog.title}</p>
              <div className={`mt-4 p-3 rounded-md border ${
                moderationDialog.status === 'rejected' 
                  ? 'bg-red-100 border-red-300' 
                  : 'bg-green-100 border-green-300'
              }`}>
                <h4 className={`font-medium text-sm mb-2 ${
                  moderationDialog.status === 'rejected' ? 'text-red-800' : 'text-green-800'
                }`}>
                  {moderationDialog.status === 'rejected' ? 'Raison du rejet :' : 'Commentaire de la modération :'}
                </h4>
                <p className={`text-sm ${
                  moderationDialog.status === 'rejected' ? 'text-red-700' : 'text-green-700'
                }`}>
                  {moderationDialog.comment}
                </p>
              </div>
              {moderationDialog.status === 'rejected' && (
                <p className="mt-4 text-xs text-gray-500">
                  Vous pouvez modifier votre service pour corriger les problèmes mentionnés ci-dessus 
                  et le soumettre à nouveau pour validation.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setModerationDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Fermer
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setModerationDialog(prev => ({ ...prev, isOpen: false }));
                router.push(`/dashboard/services/${moderationDialog.serviceId}`);
              }}
            >
              Voir les détails
            </Button>
            {moderationDialog.status === 'rejected' && (
              <Button 
                onClick={() => {
                  setModerationDialog(prev => ({ ...prev, isOpen: false }));
                  router.push(`/dashboard/services/edit/${moderationDialog.serviceId}`);
                }}
              >
                Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServiceRulesModal 
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onAccept={handleAcceptRules}
      />
    </div>
  );
} 