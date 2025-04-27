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

// Type pour les statistiques d'un freelance
interface FreelanceStats {
  activeOrders: number;
  unreadMessages: number;
  pendingDeliveries: number;
  totalEarnings: number;
  servicesCount: number;
}

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
  // Fonction pour rendre une icône d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_created': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'review_added': return <Star className="h-4 w-4 text-blue-500" />;
      case 'dispute_opened': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'file_uploaded': return <Upload className="h-4 w-4 text-purple-500" />;
      case 'message_received': return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'delivery_validated': return <CheckCircle className="h-4 w-4 text-rose-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };
  
  // Fonction pour obtenir la couleur de la bordure
  const getActivityBorderColor = (type: string) => {
    switch (type) {
      case 'order_created': return 'border-green-400';
      case 'review_added': return 'border-blue-400';
      case 'dispute_opened': return 'border-amber-400';
      case 'file_uploaded': return 'border-purple-400';
      case 'message_received': return 'border-indigo-400';
      case 'delivery_validated': return 'border-rose-400';
      default: return 'border-slate-400';
    }
  };
  
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
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : activities.length > 0 ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucune activité récente</p>
          </div>
        )}
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
  } = useDashboard({ useCache: true });
  
  // Utiliser le nom complet du profil en priorité
  const userName = useMemo(() => 
    profile?.full_name || profile?.username || user?.user_metadata?.name || "Utilisateur",
    [profile?.full_name, profile?.username, user?.user_metadata?.name]
  );

  // Les données des cartes de stats mémoïsées
  const statCards = useMemo(() => [
    {
      title: "Commandes reçues",
      value: freelanceStats.activeOrders,
      icon: FileText,
      iconBgClass: "bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20",
      iconTextClass: "text-vynal-accent-primary dark:text-vynal-accent-primary",
      subtitleText: "Total commandes",
      subtitleBgClass: "",
      subtitleTextClass: "text-vynal-accent-secondary dark:text-emerald-400"
    },
    {
      title: "Messages non lus",
      value: freelanceStats.unreadMessages,
      icon: Mail,
      iconBgClass: "bg-gradient-to-tr from-vynal-accent-secondary/40 to-vynal-accent-secondary/20 dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20",
      iconTextClass: "text-vynal-accent-secondary dark:text-vynal-accent-secondary",
      subtitleText: freelanceStats.unreadMessages > 0 ? "À lire" : "À jour",
      subtitleBgClass: "bg-gradient-to-r from-vynal-accent-secondary/30 to-vynal-accent-secondary/20 dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20",
      subtitleTextClass: "text-vynal-accent-secondary"
    },
    {
      title: "Commandes en cours",
      value: freelanceStats.pendingDeliveries,
      icon: Package,
      iconBgClass: "bg-gradient-to-tr from-vynal-purple-secondary/40 to-vynal-purple-secondary/20 dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20",
      iconTextClass: "text-vynal-purple-secondary dark:text-amber-400",
      subtitleText: "En cours de traitement",
      subtitleBgClass: "bg-gradient-to-r from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20",
      subtitleTextClass: "text-vynal-purple-secondary dark:text-amber-400"
    },
    {
      title: "Revenus totaux",
      value: formatPrice(freelanceStats.totalEarnings),
      icon: CreditCard,
      iconBgClass: "bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20",
      iconTextClass: "text-vynal-accent-primary dark:text-emerald-400",
      subtitleText: `Services (${freelanceStats.servicesCount})`,
      subtitleBgClass: "bg-gradient-to-r from-vynal-accent-primary/30 to-vynal-accent-primary/20 dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20",
      subtitleTextClass: "text-vynal-accent-primary dark:text-emerald-400"
    }
  ], [freelanceStats]);

  // Fonction de rafraîchissement memoïsée
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      refreshDashboard();
    }
  }, [isRefreshing, refreshDashboard]);

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-6 sm:space-y-8 pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-lg font-semibold text-vynal-purple-light dark:text-vynal-text-secondary">Hey</span>
              <span className="animate-bounce inline-block">👋</span>
              <span className="text-lg font-bold text-vynal-accent-secondary dark:text-vynal-text-primary">{userName}</span>
            </div>
            <RefreshButton 
              onClick={handleRefresh}
              isRefreshing={isRefreshing}
              lastRefreshText={getLastRefreshText(true)}
            />
          </div>
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
            Voici votre activité sur la plateforme
          </p>
        </div>
       
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconBgClass={card.iconBgClass}
              iconTextClass={card.iconTextClass}
              subtitleText={card.subtitleText}
              subtitleBgClass={card.subtitleBgClass}
              subtitleTextClass={card.subtitleTextClass}
              isLoading={loadingStats}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-8 sm:mt-6">
          <RecentActivities 
            activities={recentActivities} 
            loading={loadingActivities} 
          />
          
          <Card className="md:col-span-5 border border-vynal-purple-secondary/10 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-purple-secondary/10 before:via-vynal-purple-secondary/5 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/10 dark:before:from-vynal-purple-secondary/15 dark:before:via-vynal-purple-secondary/5 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg text-vynal-purple-light dark:text-vynal-text-primary">Actions rapides</CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                    Accès rapide aux fonctionnalités principales
                  </CardDescription>
                </div>
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 shadow-sm dark:from-vynal-purple-secondary/20 dark:to-vynal-purple-secondary/10">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6 relative z-10">
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/dashboard/orders" 
                  className="flex items-center p-2 rounded-md bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-secondary/10 dark:to-transparent border border-slate-100 dark:border-vynal-purple-secondary/20 hover:shadow-sm transition-all"
                >
                  <div className="p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/20 to-vynal-accent-primary/10 shadow-sm mr-3">
                    <ShoppingCart className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <span className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commandes</span>
                </Link>
                
                <Link 
                  href="/dashboard/messages" 
                  className="flex items-center p-2 rounded-md bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-secondary/10 dark:to-transparent border border-slate-100 dark:border-vynal-purple-secondary/20 hover:shadow-sm transition-all"
                >
                  <div className="p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-secondary/20 to-vynal-accent-secondary/10 shadow-sm mr-3">
                    <MessageCircle className="h-4 w-4 text-vynal-accent-secondary" />
                  </div>
                  <span className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Messages</span>
                </Link>
                
                <Link 
                  href="/dashboard/services" 
                  className="flex items-center p-2 rounded-md bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-secondary/10 dark:to-transparent border border-slate-100 dark:border-vynal-purple-secondary/20 hover:shadow-sm transition-all"
                >
                  <div className="p-1.5 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/20 to-vynal-purple-secondary/10 shadow-sm mr-3">
                    <FileText className="h-4 w-4 text-vynal-purple-secondary" />
                  </div>
                  <span className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Services</span>
                </Link>
                
                <Link 
                  href="/dashboard/wallet" 
                  className="flex items-center p-2 rounded-md bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-secondary/10 dark:to-transparent border border-slate-100 dark:border-vynal-purple-secondary/20 hover:shadow-sm transition-all"
                >
                  <div className="p-1.5 rounded-full bg-gradient-to-tr from-vynal-purple-light/20 to-vynal-purple-light/10 shadow-sm mr-3">
                    <CreditCard className="h-4 w-4 text-vynal-purple-light" />
                  </div>
                  <span className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Paiements</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-slate-400 dark:text-vynal-text-secondary/60 text-right mt-4 pr-2">
          {getLastRefreshText()}
        </div>
      </div>
    </div>
  );
} 