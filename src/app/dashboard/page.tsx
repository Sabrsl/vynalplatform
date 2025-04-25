"use client";

import { memo, useCallback, useEffect, useState, useRef } from "react";
import { useOptimizedDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpRight, FileText, Clock, Activity, Eye, 
  CreditCard, MessageCircle, Bell, Package, Mail,
  ShoppingCart, Star, AlertTriangle, Upload, MessageSquare, CheckCircle,
  Zap, Users, RefreshCw
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { ClientStats, FreelanceStats, Activity as ActivityType } from "@/hooks/useDashboard";
import { NavigationLoadingState } from "@/app/providers";
import { SimplifyDashboardButton } from './simplify';

// Types pour les props des composants
interface StatsCardsProps {
  isClient: boolean;
  clientStats: ClientStats;
  freelanceStats: FreelanceStats;
  loadingStats: boolean;
}

interface RecentActivitiesProps {
  recentActivities: ActivityType[];
  loadingActivities: boolean;
  getActivityIcon: (type: string) => JSX.Element;
  getActivityBorderColor: (type: string) => string;
  forceHideSpinner?: boolean;
}

// Composant memoïsé pour les statistiques
const StatsCards = memo(({ 
  isClient, 
  clientStats, 
  freelanceStats, 
  loadingStats,
  forceHideSpinner = false  // Nouvelle prop pour forcer la désactivation du spinner
}: StatsCardsProps & { forceHideSpinner?: boolean }) => {
  // Protection contre les spinners en cascade: limiter le temps d'affichage du spinner
  const [showSpinner, setShowSpinner] = useState(loadingStats);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loadingStats && !forceHideSpinner) {  // Ne pas activer le spinner si forceHideSpinner est true
      setShowSpinner(true);
      // Forcer la fin de l'affichage du spinner après 5 secondes maximum
      timeoutId = setTimeout(() => {
        setShowSpinner(false);
      }, 5000);
    } else {
      setShowSpinner(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingStats, forceHideSpinner]);
  
  // Si on doit masquer le spinner, mais qu'on a des données, les afficher même en chargement
  if (loadingStats && !showSpinner && (
      (isClient && clientStats.activeOrders === 0 && clientStats.unreadMessages === 0) ||
      (!isClient && freelanceStats.activeOrders === 0 && freelanceStats.unreadMessages === 0)
  )) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 opacity-60">
        {/* Squelettes de cartes */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-100 dark:bg-vynal-purple-dark/10 animate-pulse"></div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-primary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
          <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
            <div className="flex items-center">
              <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
              </div>
              <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">
                {isClient ? "Commandes en cours" : "Commandes à traiter"}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
          <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
            {showSpinner ? "-" : (isClient ? clientStats.activeOrders : freelanceStats.activeOrders)}
          </div>
          <div className="flex items-center mt-1">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary mr-1"></div>
            <p className="text-[10px] sm:text-xs text-vynal-accent-secondary dark:text-emerald-400 truncate">
              {isClient ? "En attente" : "À traiter"}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border border-vynal-accent-secondary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-secondary/20 before:via-vynal-accent-secondary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-secondary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
          <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
            <div className="flex items-center">
              <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-secondary/40 to-vynal-accent-secondary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-secondary dark:text-vynal-accent-secondary" />
              </div>
              <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Messages non lus</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
          <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
            {showSpinner ? "-" : (isClient ? clientStats.unreadMessages : freelanceStats.unreadMessages)}
          </div>
          <div className="flex items-center mt-1">
            <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-accent-secondary/30 to-vynal-accent-secondary/20 text-vynal-accent-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-vynal-accent-secondary truncate">
              {(isClient ? clientStats.unreadMessages : freelanceStats.unreadMessages) > 0 ? "À lire" : "À jour"}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border border-vynal-purple-secondary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-purple-secondary/20 before:via-vynal-purple-secondary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-amber-400/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
          <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
            <div className="flex items-center">
              <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/40 to-vynal-purple-secondary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-amber-400" />
              </div>
              <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">
                {isClient ? "Livraisons à venir" : "Livraisons en attente"}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
          <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
            {showSpinner ? "-" : (isClient ? clientStats.pendingDeliveries : freelanceStats.pendingDeliveries)}
          </div>
          <div className="flex items-center mt-1">
            <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 text-vynal-purple-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-amber-400 truncate">
              {isClient ? "Prochainement" : "En attente de validation"}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-emerald-400/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
          <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
            <div className="flex items-center">
              <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                {isClient ? (
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-emerald-400" />
                ) : (
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-emerald-400" />
                )}
              </div>
              <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">
                {isClient ? "Avis à laisser" : "Services proposés"}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
          <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
            {showSpinner ? "-" : (isClient ? clientStats.pendingReviews : freelanceStats.servicesCount)}
          </div>
          <div className="flex items-center mt-1">
            <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-accent-primary/30 to-vynal-accent-primary/20 text-vynal-accent-primary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-emerald-400 truncate">
              {isClient 
                ? (clientStats.pendingReviews > 0 ? "Services à évaluer" : "Tout est à jour") 
                : (freelanceStats.servicesCount > 0 ? "Services actifs" : "Créez votre 1er service")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

// Composant pour afficher les activités récentes avec gestion optimisée du chargement
const RecentActivities = memo(({ 
  recentActivities, 
  loadingActivities, 
  getActivityIcon, 
  getActivityBorderColor,
  forceHideSpinner = false
}: RecentActivitiesProps) => {
  // État pour contrôler l'affichage du spinner avec limite temporelle
  const [showSpinner, setShowSpinner] = useState(false);
  // État pour activer les skeletons après la durée maximum du spinner
  const [showSkeletons, setShowSkeletons] = useState(false);
  // Référence pour suivre le timeout du spinner
  const spinnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Gérer l'affichage du spinner avec une limite de temps maximale
  useEffect(() => {
    // Nettoyer tout timer existant
    if (spinnerTimerRef.current) {
      clearTimeout(spinnerTimerRef.current);
      spinnerTimerRef.current = null;
    }
    
    if (loadingActivities) {
      // Activer immédiatement le spinner au début du chargement
      setShowSpinner(true);
      setShowSkeletons(false);
      
      // Définir un timer pour limiter l'affichage du spinner à 2.5 secondes maximum
      spinnerTimerRef.current = setTimeout(() => {
        setShowSpinner(false);
        // Activer les skeletons pour un état de chargement prolongé
        setShowSkeletons(true);
      }, 2500);
    } else {
      // Désactiver spinner et skeletons quand le chargement est terminé
      setShowSpinner(false);
      setShowSkeletons(false);
    }
    
    // Nettoyage lors du démontage
    return () => {
      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current);
      }
    };
  }, [loadingActivities, forceHideSpinner]);
  
  // Si les données sont en cours de chargement et que le spinner doit être affiché
  if (showSpinner && !forceHideSpinner) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-vynal-accent-primary rounded-full"></div>
      </div>
    );
  }
  
  // Si les données sont chargées mais vides, afficher un message approprié
  if (recentActivities.length === 0) {
    if ((loadingActivities && showSkeletons) || (loadingActivities && !showSpinner)) {
      // Afficher un skeleton loader pour un chargement prolongé
      return (
        <div className="space-y-3 px-1 opacity-60">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-vynal-purple-dark/10 animate-pulse"></div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="text-center py-6 text-vynal-text-secondary dark:text-vynal-text-secondary/70">
        Aucune activité récente à afficher
      </div>
    );
  }
  
  return (
    <div className="space-y-3 px-1">
      {recentActivities.map((activity) => (
        <div 
          key={activity.id}
          className={`flex items-start p-3 rounded-lg border-l-4 ${
            getActivityBorderColor(activity.type)
          } bg-white/90 dark:bg-vynal-purple-dark/20 shadow-sm hover:shadow transition-shadow duration-300`}
        >
          <div className="mr-3 mt-0.5">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-vynal-purple-dark dark:text-vynal-text-primary line-clamp-1">
              {activity.content}
            </p>
            <p className="text-xs text-vynal-purple-secondary/80 dark:text-vynal-text-secondary/70 mt-1">
              {new Date(activity.created_at).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});

RecentActivities.displayName = 'RecentActivities';

// Composant d'erreur avec retry
const ErrorDisplay = memo(({ 
  error, 
  onRetry 
}: { 
  error: string | null, 
  onRetry: () => void 
}) => {
  if (!error) return null;
  
  return (
    <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="text-red-500 dark:text-red-400 h-5 w-5 mr-2 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2 text-xs h-8 border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={onRetry}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Réessayer
          </Button>
        </div>
      </div>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';

// Fonction de rendu principale avec optimisations de mémoire
export default function DashboardPage() {
  const { user } = useAuth({ useCache: true });
  const { profile, isClient } = useUser({ useCache: true });
  const [abortController] = useState<AbortController | null>(() => {
    // Ne pas créer d'AbortController côté serveur
    return typeof window !== 'undefined' ? new AbortController() : null;
  });
  
  // Utiliser une référence pour suivre si le composant est monté
  const isMountedRef = useRef(true);
  
  const { 
    clientStats, 
    freelanceStats, 
    recentActivities, 
    loadingStats, 
    loadingActivities,
    refreshDashboard,
    isRefreshing,
    getLastRefreshText,
    refreshCount,
    error
  } = useOptimizedDashboard();
  
  // État pour indiquer si la page a été chargée au moins une fois
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  // État pour contrôler le niveau de chargement (permet d'éviter les cascades)
  const [isStabilizing, setIsStabilizing] = useState(false);
  // Référence pour bloquer les requêtes consécutives rapides
  const stabilizingTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Référence pour suivre le nombre de tentatives de rafraîchissement
  const refreshAttemptsRef = useRef(0);
  // Un état pour savoir si on est en phase de montage
  const [isMounting, setIsMounting] = useState(true);
  // État pour suivre les erreurs de chargement
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Utiliser le nom complet du profil en priorité
  const userName = profile?.full_name || profile?.username || user?.user_metadata?.name || "Utilisateur";
  
  // Vérifier si une navigation est en cours au montage et éviter le chargement double
  useEffect(() => {
    // Si le composant est démonté pendant cette vérification, on doit l'annuler
    if (!isMountedRef.current) return;
    
    const start = Date.now();
    
    // Définir un timeout de sécurité pour éviter le blocage complet
    const safetyTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setIsMounting(false);
        setLocalError("Chargement initial interrompu pour éviter un blocage. Rafraîchissez manuellement.");
      }
    }, 10000);
    
    // Vérifier l'état de navigation initial
    if (NavigationLoadingState.isNavigating) {
      console.log("Navigation en cours au montage, attente...");
      
      // Si en navigation, attendre qu'elle soit terminée
      const handleNavigationEnd = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (!isMountedRef.current) return;
        
        if (customEvent.detail?.isNavigating === false) {
          const elapsed = Date.now() - start;
          console.log(`Navigation terminée après ${elapsed}ms`);
          
          // Attendre un petit délai supplémentaire pour la stabilisation
          setTimeout(() => {
            if (isMountedRef.current) {
              clearTimeout(safetyTimeout);
              setIsMounting(false);
            }
          }, 300);
          
          window.removeEventListener('vynal:navigation-state-changed', handleNavigationEnd);
        }
      };
      
      window.addEventListener('vynal:navigation-state-changed', handleNavigationEnd);
      
      // Nettoyage
      return () => {
        window.removeEventListener('vynal:navigation-state-changed', handleNavigationEnd);
        clearTimeout(safetyTimeout);
      };
    } else {
      // Pas de navigation en cours, terminer le montage immédiatement
      clearTimeout(safetyTimeout);
      setIsMounting(false);
    }
    
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Annuler toutes les requêtes en cours
      if (abortController) {
        abortController.abort();
      }
      
      // Nettoyer tous les timers
      if (stabilizingTimerRef.current) {
        clearTimeout(stabilizingTimerRef.current);
      }
      
      // Forcer la fin de l'état de navigation si on quitte la page
      if (NavigationLoadingState.isNavigating && 
          NavigationLoadingState.activeNavigation.to === '/dashboard') {
        NavigationLoadingState.setIsNavigating(false);
      }
    };
  }, [abortController]);
  
  // Fonction pour rendre une icône d'activité - memoïsée 
  const getActivityIcon = useCallback((type: string) => {
    switch (type) {
      case 'order_created': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'review_added': return <Star className="h-4 w-4 text-blue-500" />;
      case 'dispute_opened': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'file_uploaded': return <Upload className="h-4 w-4 text-purple-500" />;
      case 'message_received': return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'delivery_validated': return <CheckCircle className="h-4 w-4 text-rose-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  }, []);
  
  // Fonction pour obtenir la couleur de la bordure - memoïsée
  const getActivityBorderColor = useCallback((type: string) => {
    switch (type) {
      case 'order_created': return 'border-green-400';
      case 'review_added': return 'border-blue-400';
      case 'dispute_opened': return 'border-amber-400';
      case 'file_uploaded': return 'border-purple-400';
      case 'message_received': return 'border-indigo-400';
      case 'delivery_validated': return 'border-rose-400';
      default: return 'border-slate-300';
    }
  }, []);
  
  // Gestionnaire d'actualisation avec protection contre les clics multiples
  const handleRefresh = useCallback(() => {
    // Ne rien faire si le composant est démonté
    if (!isMountedRef.current) return;
    
    // Vérification critique: si navigation en cours, annuler complètement
    if (NavigationLoadingState.isNavigating) {
      console.warn('Navigation en cours, actualisation annulée');
      setLocalError("Impossible d'actualiser pendant une navigation");
      setTimeout(() => setLocalError(null), 3000);
      return;
    }
    
    // Éviter les clicks multiples qui déclenchent plusieurs actualisations
    if (isRefreshing || isStabilizing) return;
    
    // Incrémenter le compteur de tentatives
    refreshAttemptsRef.current += 1;
    
    // Limite de tentatives rapprochées
    if (refreshAttemptsRef.current > 3) {
      console.warn('Trop de tentatives de rafraîchissement, attente forcée');
      setLocalError("Trop de tentatives, veuillez patienter quelques secondes");
      setTimeout(() => {
        refreshAttemptsRef.current = 0;
        setLocalError(null);
      }, 10000); // Réinitialiser après 10 secondes
      return;
    }
    
    setIsStabilizing(true);
    
    // Attendre un court délai avant de permettre une nouvelle actualisation
    if (stabilizingTimerRef.current) {
      clearTimeout(stabilizingTimerRef.current);
    }
    
    try {
      // Tentative de rafraîchissement
      refreshDashboard();
      
      // Bloquer de nouvelles actualisations pendant 3 secondes
      stabilizingTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsStabilizing(false);
        }
      }, 3000);
      
      // Sécurité supplémentaire: si après 10 secondes on est toujours en chargement, réinitialiser
      const safetyTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        if (isRefreshing || isStabilizing) {
          console.warn('Délai de sécurité atteint, réinitialisation forcée');
          setIsStabilizing(false);
          setLocalError("Le chargement a pris trop de temps, état réinitialisé");
          setTimeout(() => setLocalError(null), 3000);
        }
      }, 10000);
      
      return () => clearTimeout(safetyTimeout);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      setIsStabilizing(false);
      setLocalError("Erreur lors de l'actualisation");
      setTimeout(() => setLocalError(null), 3000);
    }
  }, [isRefreshing, isStabilizing, refreshDashboard]);
  
  // Si en phase de montage, afficher un indicateur de chargement
  if (isMounting) {
    return (
      <div className="p-2 sm:p-4 max-w-7xl mx-auto flex flex-col items-center justify-center h-[70vh]">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-vynal-accent-primary rounded-full mb-4"></div>
        <p className="text-vynal-purple-dark dark:text-vynal-text-primary">Chargement du tableau de bord...</p>
      </div>
    );
  }
  
  // UI normale une fois chargé
  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header avec actions */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-vynal-purple-darkest dark:text-vynal-text-primary">
            Bienvenue, {userName}
          </h1>
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
            Voici un aperçu de votre activité {isClient ? 'client' : 'freelance'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs bg-white dark:bg-vynal-purple-dark/30 hover:bg-slate-50 dark:hover:bg-vynal-purple-dark/50 text-vynal-purple-dark dark:text-vynal-text-secondary flex items-center gap-1.5 border border-slate-200 dark:border-vynal-purple-secondary/30"
            onClick={handleRefresh}
            disabled={isRefreshing || loadingStats || isStabilizing || NavigationLoadingState.isNavigating}
          >
            {isRefreshing || isStabilizing ? (
              <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-vynal-accent-primary rounded-full mr-1"></div>
            ) : (
              <RefreshCw className="h-3 w-3 text-vynal-accent-secondary" />
            )}
            <span>{isRefreshing || isStabilizing ? 'Actualisation...' : 'Actualiser'}</span>
          </Button>
          
          <div className="text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
            {getLastRefreshText()}
          </div>
        </div>
      </div>
      
      {/* Affichage des erreurs avec bouton vers version simplifiée */}
      {(error || localError) && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="text-red-500 dark:text-red-400 h-5 w-5 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-200">{error || localError}</p>
              <div className="mt-2 flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-8 border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/30"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isStabilizing || NavigationLoadingState.isNavigating}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Réessayer
                </Button>
                
                <SimplifyDashboardButton />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bouton de secours toujours visible en cas de problème persistant */}
      {(loadingStats || loadingActivities) && refreshAttemptsRef.current > 2 && (
        <div className="mb-4 flex justify-end">
          <SimplifyDashboardButton />
        </div>
      )}
      
      {/* Spinner global unique si les deux sections sont en chargement en même temps */}
      {(loadingStats && loadingActivities && !hasInitiallyLoaded) ? (
        <div className="py-10 my-5 flex flex-col items-center justify-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-vynal-accent-primary rounded-full mb-3"></div>
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
            Chargement des données du tableau de bord...
          </p>
        </div>
      ) : (
        <>
          {/* Statistiques principales - forcer masquage du spinner si le spinner global est affiché */}
          <StatsCards
            isClient={isClient}
            clientStats={clientStats}
            freelanceStats={freelanceStats}
            loadingStats={loadingStats}
            forceHideSpinner={loadingStats && loadingActivities && !hasInitiallyLoaded}
          />
          
          {/* Section des activités récentes - forcer masquage du spinner si le spinner global est affiché */}
          <div className="mt-4 md:mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-medium text-vynal-purple-dark dark:text-vynal-text-primary">
                Activités récentes
              </h2>
            </div>
            
            <div className="bg-white dark:bg-vynal-purple-dark/20 rounded-lg border border-slate-100 dark:border-vynal-purple-secondary/20 p-3 sm:p-4">
              <RecentActivities
                recentActivities={recentActivities}
                loadingActivities={loadingActivities}
                getActivityIcon={getActivityIcon}
                getActivityBorderColor={getActivityBorderColor}
                forceHideSpinner={loadingStats && loadingActivities && !hasInitiallyLoaded}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
} 