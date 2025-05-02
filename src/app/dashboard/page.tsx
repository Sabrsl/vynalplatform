"use client";

import { useDashboard } from "@/hooks/useDashboard";
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
import { useCallback, useMemo, memo, useState, useEffect } from "react";
import { DashboardPageSkeleton } from "@/components/skeletons/DashboardPageSkeleton";

// Type pour les statistiques d'un freelance
interface FreelanceStats {
  activeOrders: number;
  unreadMessages: number;
  pendingDeliveries: number;
  totalEarnings: number;
  servicesCount: number;
}

// Constantes pour les couleurs et icônes - définis hors du composant pour éviter les recréations
const STAT_CARD_STYLES = {
  activeOrders: {
    iconBgClass: "bg-green-100 dark:bg-green-900/20",
    iconTextClass: "text-green-600 dark:text-green-400",
    subtitleBgClass: "bg-green-50 dark:bg-green-900/30",
    subtitleTextClass: "text-green-700 dark:text-green-400"
  },
  unreadMessages: {
    iconBgClass: "bg-blue-100 dark:bg-blue-900/20",
    iconTextClass: "text-blue-600 dark:text-blue-400",
    subtitleBgClass: "bg-blue-50 dark:bg-blue-900/30",
    subtitleTextClass: "text-blue-700 dark:text-blue-400"
  },
  pendingDeliveries: {
    iconBgClass: "bg-amber-100 dark:bg-amber-900/20",
    iconTextClass: "text-amber-600 dark:text-amber-400",
    subtitleBgClass: "bg-amber-50 dark:bg-amber-900/30",
    subtitleTextClass: "text-amber-700 dark:text-amber-400"
  },
  totalEarnings: {
    iconBgClass: "bg-purple-100 dark:bg-purple-900/20",
    iconTextClass: "text-purple-600 dark:text-purple-400",
    subtitleBgClass: "bg-purple-50 dark:bg-purple-900/30",
    subtitleTextClass: "text-purple-700 dark:text-purple-400"
  },
  servicesCount: {
    iconBgClass: "bg-rose-100 dark:bg-rose-900/20",
    iconTextClass: "text-rose-600 dark:text-rose-400",
    subtitleBgClass: "bg-rose-50 dark:bg-rose-900/30",
    subtitleTextClass: "text-rose-700 dark:text-rose-400"
  }
};

const STAT_CARD_ICONS = {
  activeOrders: ShoppingCart,
  unreadMessages: MessageSquare,
  pendingDeliveries: Clock,
  totalEarnings: CreditCard,
  servicesCount: FileText
};

// Composant memoïsé pour les cartes de statistiques
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  iconBgClass, 
  iconTextClass, 
  subtitleText, 
  subtitleBgClass,
  subtitleTextClass,
  isLoading
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconBgClass: string;
  iconTextClass: string;
  subtitleText: string;
  subtitleBgClass?: string;
  subtitleTextClass?: string;
  isLoading: boolean;
}) => (
  <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-primary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
      <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
        <div className="flex items-center">
          <div className={`mr-2 p-1 sm:p-1.5 rounded-full ${iconBgClass} shadow-sm flex-shrink-0`}>
            <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${iconTextClass}`} />
          </div>
          <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">
            {title}
          </span>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
      <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
        {isLoading ? "-" : value}
      </div>
      <div className="flex items-center mt-1">
        <div className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${subtitleBgClass || ''} ${subtitleTextClass || ''} rounded-md truncate`}>
          {subtitleText}
        </div>
      </div>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// Composant memoïsé pour la section des activités récentes
const RecentActivities = memo(({ activities, loading }: { activities: any[], loading: boolean }) => {
  // Mémoriser les fonctions pour éviter des calculs répétés
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
  
  const getActivityBorderColor = useCallback((type: string) => {
    switch (type) {
      case 'order_created': return 'border-green-400';
      case 'review_added': return 'border-blue-400';
      case 'dispute_opened': return 'border-amber-400';
      case 'file_uploaded': return 'border-purple-400';
      case 'message_received': return 'border-indigo-400';
      case 'delivery_validated': return 'border-rose-400';
      default: return 'border-slate-400';
    }
  }, []);
  
  // État de chargement mémorisé
  const loadingContent = useMemo(() => (
    <div className="flex justify-center items-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  ), []);
  
  // État vide mémorisé
  const emptyContent = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-6">
      <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucune activité récente</p>
    </div>
  ), []);
  
  return (
    <Card className="md:col-span-7 border border-vynal-purple-secondary/10 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-purple-secondary/10 before:via-vynal-purple-secondary/5 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/10 dark:before:from-vynal-purple-secondary/15 dark:before:via-vynal-purple-secondary/5 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
      <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg text-vynal-purple-light dark:text-vynal-text-primary">Activité récente</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
              Vos dernières interactions sur la plateforme
            </CardDescription>
          </div>
          <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 shadow-sm dark:from-vynal-purple-secondary/20 dark:to-vynal-purple-secondary/10">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6 relative z-10">
        {loading ? loadingContent : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div 
                key={activity.id || index} 
                className={`border-l-2 ${getActivityBorderColor(activity.type)} pl-4 py-2 bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-secondary/10 dark:to-transparent rounded-md shadow-sm`}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-vynal-text-primary font-medium">
                      {activity.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-vynal-text-secondary mt-1">
                      {new Date(activity.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : emptyContent}
      </CardContent>
    </Card>
  );
});

RecentActivities.displayName = 'RecentActivities';

// Composant memoïsé pour le bouton de rafraîchissement
const RefreshButton = memo(({ onClick, isRefreshing, lastRefreshText }: { 
  onClick: () => void;
  isRefreshing: boolean;
  lastRefreshText: string;
}) => (
  <Button
    onClick={onClick}
    disabled={isRefreshing}
    variant="ghost"
    size="sm"
    className="flex items-center gap-1.5 text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary hover:text-vynal-accent-secondary dark:hover:text-vynal-accent-primary transition-colors"
  >
    <RefreshIndicator 
      isRefreshing={isRefreshing} 
      size="sm" 
      text 
      variant="secondary"
    />
  </Button>
));

RefreshButton.displayName = 'RefreshButton';

// Composant pour les statistiques du tableau de bord
const DashboardStats = memo(({ stats, loading }: { 
  stats: FreelanceStats, 
  loading: boolean 
}) => {
  // Tableau mémorisé des configurations de cartes de statistiques
  const statCards = useMemo(() => [
    {
      key: 'activeOrders',
      title: 'Commandes actives',
      value: stats.activeOrders,
      icon: STAT_CARD_ICONS.activeOrders,
      ...STAT_CARD_STYLES.activeOrders,
      subtitleText: 'En cours de traitement'
    },
    {
      key: 'unreadMessages',
      title: 'Messages non lus',
      value: stats.unreadMessages,
      icon: STAT_CARD_ICONS.unreadMessages,
      ...STAT_CARD_STYLES.unreadMessages,
      subtitleText: 'À répondre'
    },
    {
      key: 'pendingDeliveries',
      title: 'Livraisons en attente',
      value: stats.pendingDeliveries,
      icon: STAT_CARD_ICONS.pendingDeliveries,
      ...STAT_CARD_STYLES.pendingDeliveries,
      subtitleText: 'À livrer'
    },
    {
      key: 'totalEarnings',
      title: 'Revenus totaux',
      value: formatPrice(stats.totalEarnings),
      icon: STAT_CARD_ICONS.totalEarnings,
      ...STAT_CARD_STYLES.totalEarnings,
      subtitleText: 'Depuis le début'
    },
    {
      key: 'servicesCount',
      title: 'Services actifs',
      value: stats.servicesCount,
      icon: STAT_CARD_ICONS.servicesCount,
      ...STAT_CARD_STYLES.servicesCount,
      subtitleText: 'Visibles aux clients'
    }
  ], [stats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {statCards.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          value={card.value}
          icon={card.icon}
          iconBgClass={card.iconBgClass}
          iconTextClass={card.iconTextClass}
          subtitleText={card.subtitleText}
          subtitleBgClass={card.subtitleBgClass}
          subtitleTextClass={card.subtitleTextClass}
          isLoading={loading}
        />
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

// Configuration globale pour le dashboard
// Forcer le rendu dynamique pour résoudre les erreurs de revalidation
export const dynamic = 'force-dynamic';

// Composant principal optimisé
export default function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useUser();
  const { 
    freelanceStats, 
    recentActivities, 
    loadingStats, 
    loadingActivities,
    refreshDashboard,
    isRefreshing,
    getLastRefreshText
  } = useDashboard();
  
  // Mémoriser le handler pour le rafraîchissement
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      refreshDashboard();
    }
  }, [isRefreshing, refreshDashboard]);
  
  // Mémoriser le texte du dernier rafraîchissement
  const lastRefreshText = useMemo(() => getLastRefreshText(true), [getLastRefreshText]);
  
  // Effet pour rafraîchir les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Rafraîchir seulement si la page était cachée depuis un certain temps
        const lastHidden = document.hidden ? Date.now() - 60000 : 0; // 60 secondes
        if (lastHidden > 0) {
          refreshDashboard();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDashboard]);
  
  // Message de bienvenue mémorisé
  const welcomeMessage = useMemo(() => {
    const userName = profile?.full_name || user?.user_metadata?.name || 'Freelance';
    return `Bienvenue, ${userName} 👋`;
  }, [profile?.full_name, user?.user_metadata?.name]);
  
  // Afficher le skeleton pendant le chargement initial
  if (loadingStats && loadingActivities) {
    return <DashboardPageSkeleton />;
  }
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête du Dashboard */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
          {welcomeMessage}
        </h1>
        <RefreshButton 
          onClick={handleRefresh} 
          isRefreshing={isRefreshing} 
          lastRefreshText={lastRefreshText}
        />
      </div>
      
      {/* Section des statistiques */}
      <DashboardStats stats={freelanceStats} loading={loadingStats} />
      
      {/* Section principale avec activités récentes et actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Activités récentes */}
        <RecentActivities activities={recentActivities} loading={loadingActivities} />
        
        {/* Actions rapides */}
        <div className="md:col-span-5 space-y-4">
          {/* Carte des actions rapides */}
          <Card className="border border-vynal-purple-secondary/10 shadow-sm dark:bg-vynal-purple-dark/10">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-lg text-vynal-purple-light dark:text-vynal-text-primary">Actions rapides</CardTitle>
              <CardDescription className="text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                Accédez rapidement aux fonctionnalités essentielles
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/services/new" className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-4 rounded-lg flex flex-col items-center text-center gap-2 transition-colors">
                  <Package className="h-6 w-6 text-vynal-accent-primary" />
                  <span className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Créer un service</span>
                </Link>
                <Link href="/dashboard/messages" className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-4 rounded-lg flex flex-col items-center text-center gap-2 transition-colors">
                  <MessageCircle className="h-6 w-6 text-vynal-accent-primary" />
                  <span className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Messages</span>
                </Link>
                <Link href="/dashboard/orders" className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-4 rounded-lg flex flex-col items-center text-center gap-2 transition-colors">
                  <Clock className="h-6 w-6 text-vynal-accent-primary" />
                  <span className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commandes</span>
                </Link>
                <Link href="/dashboard/wallet" className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-4 rounded-lg flex flex-col items-center text-center gap-2 transition-colors">
                  <CreditCard className="h-6 w-6 text-vynal-accent-primary" />
                  <span className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Paiements</span>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Section Performance */}
          <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/10 overflow-hidden">
            <CardHeader className="px-6 pt-6 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-vynal-purple-light dark:text-vynal-text-primary">Performance</CardTitle>
                <div className="bg-vynal-accent-primary/10 p-1.5 rounded-full">
                  <Zap className="h-4 w-4 text-vynal-accent-primary" />
                </div>
              </div>
              <CardDescription className="text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                Analyse de vos performances récentes
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Note moyenne</p>
                      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">Sur les 30 derniers jours</p>
                    </div>
                  </div>
                  <div className="text-xl font-semibold text-vynal-purple-light dark:text-vynal-text-primary">4.9/5</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center">
                      <Eye className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Visiteurs</p>
                      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">Sur votre profil</p>
                    </div>
                  </div>
                  <div className="text-xl font-semibold text-vynal-purple-light dark:text-vynal-text-primary">324</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Taux de conversion</p>
                      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">Visiteurs → Commandes</p>
                    </div>
                  </div>
                  <div className="text-xl font-semibold text-vynal-purple-light dark:text-vynal-text-primary">8.2%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 