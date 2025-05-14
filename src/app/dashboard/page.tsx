"use client";

import { useDashboard, Activity } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  ArrowUpRight, 
  Bell, 
  Calendar, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Circle, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Eye, 
  HardDrive, 
  Heart, 
  Mailbox, 
  MessageCircle, 
  Package, 
  RefreshCcw, 
  Settings, 
  ShoppingCart, 
  Star, 
  Truck, 
  User, 
  Users, 
  Zap,
  LucideIcon,
  AlertTriangle,
  Upload,
  MessageSquare,
  Activity as LucideActivity
} from 'lucide-react';
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { useCallback, useMemo, memo, useState, useEffect } from "react";
import { DashboardPageSkeleton } from "@/components/skeletons/DashboardPageSkeleton";
import { FREELANCE_ROUTES } from "@/config/routes";
import { FreelanceGuard } from "@/lib/guards/roleGuards";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import React from "react";

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
    iconBgClass: "bg-gradient-to-tr from-green-200/80 to-green-100/80 shadow-sm dark:from-green-900/20 dark:to-green-800/20",
    iconTextClass: "text-green-600 dark:text-green-400",
    subtitleBgClass: "bg-green-50 dark:bg-green-900/30",
    subtitleTextClass: "text-green-700 dark:text-green-400",
    cardBgClass: "bg-gradient-to-br from-white to-green-50/50 dark:from-vynal-purple-dark/50 dark:to-green-900/20",
    valueTextClass: "text-green-600 dark:text-green-400"
  },
  unreadMessages: {
    iconBgClass: "bg-gradient-to-tr from-blue-200/80 to-blue-100/80 shadow-sm dark:from-blue-900/20 dark:to-blue-800/20",
    iconTextClass: "text-blue-600 dark:text-blue-400",
    subtitleBgClass: "bg-blue-50 dark:bg-blue-900/30",
    subtitleTextClass: "text-blue-700 dark:text-blue-400",
    cardBgClass: "bg-gradient-to-br from-white to-blue-50/50 dark:from-vynal-purple-dark/50 dark:to-blue-900/20",
    valueTextClass: "text-blue-600 dark:text-blue-400"
  },
  pendingDeliveries: {
    iconBgClass: "bg-gradient-to-tr from-amber-200/80 to-amber-100/80 shadow-sm dark:from-amber-900/20 dark:to-amber-800/20",
    iconTextClass: "text-amber-600 dark:text-amber-400",
    subtitleBgClass: "bg-amber-50 dark:bg-amber-900/30",
    subtitleTextClass: "text-amber-700 dark:text-amber-400",
    cardBgClass: "bg-gradient-to-br from-white to-amber-50/50 dark:from-vynal-purple-dark/50 dark:to-amber-900/20",
    valueTextClass: "text-amber-600 dark:text-amber-400"
  },
  totalEarnings: {
    iconBgClass: "bg-gradient-to-tr from-purple-200/80 to-purple-100/80 shadow-sm dark:from-purple-900/20 dark:to-purple-800/20",
    iconTextClass: "text-purple-600 dark:text-purple-400",
    subtitleBgClass: "bg-purple-50 dark:bg-purple-900/30",
    subtitleTextClass: "text-purple-700 dark:text-purple-400",
    cardBgClass: "bg-gradient-to-br from-white to-purple-50/50 dark:from-vynal-purple-dark/50 dark:to-purple-900/20",
    valueTextClass: "text-purple-600 dark:text-purple-400"
  },
  servicesCount: {
    iconBgClass: "bg-gradient-to-tr from-rose-200/80 to-rose-100/80 shadow-sm dark:from-rose-900/20 dark:to-rose-800/20",
    iconTextClass: "text-rose-600 dark:text-rose-400",
    subtitleBgClass: "bg-rose-50 dark:bg-rose-900/30",
    subtitleTextClass: "text-rose-700 dark:text-rose-400",
    cardBgClass: "bg-gradient-to-br from-white to-rose-50/50 dark:from-vynal-purple-dark/50 dark:to-rose-900/20",
    valueTextClass: "text-rose-600 dark:text-rose-400"
  }
};

const STAT_CARD_ICONS = {
  activeOrders: ShoppingCart,
  unreadMessages: MessageCircle,
  pendingDeliveries: Clock,
  totalEarnings: CreditCard,
  servicesCount: ShoppingCart
};

// Map des icônes d'activité pour éviter des recalculs répétés
const ACTIVITY_ICONS = {
  order_created: <ShoppingCart className="h-4 w-4 text-green-500" />,
  review_added: <Star className="h-4 w-4 text-blue-500" />,
  dispute_opened: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  file_uploaded: <Upload className="h-4 w-4 text-purple-500" />,
  message_received: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  delivery_validated: <CheckCircle className="h-4 w-4 text-rose-500" />,
  default: <LucideActivity className="h-4 w-4 text-slate-500" />
} as const;

// Map des couleurs de bordure d'activité
const ACTIVITY_BORDER_COLORS = {
  order_created: 'border-green-400',
  review_added: 'border-blue-400',
  dispute_opened: 'border-amber-400',
  file_uploaded: 'border-purple-400',
  message_received: 'border-indigo-400',
  delivery_validated: 'border-rose-400',
  default: 'border-slate-400'
} as const;

// Type pour les types d'activité basé sur les clés des objets constants
type ActivityType = keyof typeof ACTIVITY_ICONS;

// Interface pour les props d'ActivityItem
interface ActivityItemProps {
  activity: Activity;
  index: number;
}

// Composant d'activité unique
const ActivityItem = memo(({ activity, index }: ActivityItemProps) => {
  const activityType = (activity.type in ACTIVITY_ICONS) 
    ? activity.type as ActivityType 
    : 'default' as ActivityType;
  
  const activityIcon = ACTIVITY_ICONS[activityType];
  const borderColor = ACTIVITY_BORDER_COLORS[activityType];
  
  return (
    <div 
      key={activity.id || index} 
      className={`border-l-2 ${borderColor} pl-3 py-1.5 bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-secondary/10 dark:to-transparent rounded-md shadow-sm`}
    >
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          {activityIcon}
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-800 dark:text-vynal-text-primary font-medium">
            {activity.content}
          </p>
          <p className="text-[8px] sm:text-[10px] text-gray-500 dark:text-vynal-text-secondary mt-0.5">
            {new Date(activity.created_at).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

// Composant memoïsé pour la section des activités récentes
const RecentActivities = memo(({ activities, loading }: { activities: Activity[], loading: boolean }) => {
  // État de chargement mémorisé
  const loadingContent = (
    <div className="flex justify-center items-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
  
  // État vide mémorisé
  const emptyContent = (
    <div className="flex flex-col items-center justify-center py-6">
      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucune activité récente</p>
    </div>
  );
  
  return (
    <Card className="md:col-span-7 border border-vynal-purple-secondary/10 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-purple-secondary/10 before:via-vynal-purple-secondary/5 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/10 dark:before:from-vynal-purple-secondary/15 dark:before:via-vynal-purple-secondary/5 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
      <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">Activité récente</CardTitle>
            <CardDescription className="mt-1 text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
              Vos dernières interactions sur la plateforme
            </CardDescription>
          </div>
          <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 shadow-sm dark:from-vynal-purple-secondary/20 dark:to-vynal-purple-secondary/10">
            <LucideActivity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6 relative z-10">
        {loading ? loadingContent : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <ActivityItem key={activity.id || index} activity={activity} index={index} />
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
    className="flex items-center gap-1.5 text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary hover:text-vynal-accent-secondary dark:hover:text-vynal-accent-primary transition-colors"
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

// Props pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBgClass: string;
  iconTextClass: string;
  cardBgClass: string;
  valueTextClass: string;
  subtitleTextClass: string;
  subtitleBgClass: string;
  titleClasses?: string;
  subtitleText?: string;
  isLoading: boolean;
  originalAmount?: number;
}

// Composant memoïsé pour les cartes de statistiques
const StatCard = memo(({ title, value, icon: Icon, iconBgClass, iconTextClass, cardBgClass, valueTextClass, subtitleTextClass, subtitleBgClass, titleClasses = "text-[10px] sm:text-xs font-medium", subtitleText, isLoading, originalAmount }: StatCardProps) => {
  // Formatter la valeur en fonction de son type
  const formattedValue = useMemo(() => {
    if (typeof originalAmount === 'number' && originalAmount > 999) {
      return new Intl.NumberFormat('fr-FR').format(value);
    }
    return value.toString();
  }, [value, originalAmount]);

  return (
    <div className={`rounded-lg border border-slate-100 shadow-sm p-2 sm:p-3 relative overflow-hidden transition-colors dark:border-vynal-purple-secondary/20 ${cardBgClass}`}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-1.5 sm:mb-2">
          <div className={titleClasses + " text-vynal-purple-light dark:text-vynal-text-primary"}>
            {title}
          </div>
          <div className={`${iconBgClass} p-1 rounded-full`}>
            <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${iconTextClass}`} />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div className={`text-sm sm:text-xl font-bold ${valueTextClass}`}>
            {isLoading ? (
              <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-12 rounded"></div>
            ) : (
              typeof originalAmount === 'number' && originalAmount > 100000 ? (
                <CurrencyDisplay amount={value} />
              ) : (
                formattedValue
              )
            )}
          </div>
          
          {subtitleText && (
            <div className="mt-1 sm:mt-2">
              <span className={`text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${subtitleBgClass} ${subtitleTextClass}`}>
                {subtitleText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Composant pour les statistiques du tableau de bord
const DashboardStats = memo(({ stats, loading }: { 
  stats: FreelanceStats, 
  loading: boolean 
}) => {
  const statCards = useMemo<StatCardProps[]>(() => [
    {
      title: 'Commandes actives',
      value: stats.activeOrders,
      icon: ShoppingCart,
      iconBgClass: STAT_CARD_STYLES.activeOrders.iconBgClass,
      iconTextClass: STAT_CARD_STYLES.activeOrders.iconTextClass,
      subtitleText: 'En cours de traitement',
      subtitleBgClass: STAT_CARD_STYLES.activeOrders.subtitleBgClass,
      subtitleTextClass: STAT_CARD_STYLES.activeOrders.subtitleTextClass,
      cardBgClass: STAT_CARD_STYLES.activeOrders.cardBgClass,
      valueTextClass: STAT_CARD_STYLES.activeOrders.valueTextClass,
      isLoading: loading,
      originalAmount: stats.activeOrders
    },
    {
      title: 'Messages non lus',
      value: stats.unreadMessages,
      icon: MessageCircle,
      iconBgClass: STAT_CARD_STYLES.unreadMessages.iconBgClass,
      iconTextClass: STAT_CARD_STYLES.unreadMessages.iconTextClass,
      subtitleText: 'À répondre',
      subtitleBgClass: STAT_CARD_STYLES.unreadMessages.subtitleBgClass,
      subtitleTextClass: STAT_CARD_STYLES.unreadMessages.subtitleTextClass,
      cardBgClass: STAT_CARD_STYLES.unreadMessages.cardBgClass,
      valueTextClass: STAT_CARD_STYLES.unreadMessages.valueTextClass,
      isLoading: loading,
      originalAmount: stats.unreadMessages
    },
    {
      title: 'Livraisons en attente',
      value: stats.pendingDeliveries,
      icon: Clock,
      iconBgClass: STAT_CARD_STYLES.pendingDeliveries.iconBgClass,
      iconTextClass: STAT_CARD_STYLES.pendingDeliveries.iconTextClass,
      subtitleText: 'À livrer',
      subtitleBgClass: STAT_CARD_STYLES.pendingDeliveries.subtitleBgClass,
      subtitleTextClass: STAT_CARD_STYLES.pendingDeliveries.subtitleTextClass,
      cardBgClass: STAT_CARD_STYLES.pendingDeliveries.cardBgClass,
      valueTextClass: STAT_CARD_STYLES.pendingDeliveries.valueTextClass,
      isLoading: loading,
      originalAmount: stats.pendingDeliveries
    },
    {
      title: 'Revenus totaux',
      value: stats.totalEarnings,
      icon: CreditCard,
      iconBgClass: STAT_CARD_STYLES.totalEarnings.iconBgClass,
      iconTextClass: STAT_CARD_STYLES.totalEarnings.iconTextClass,
      subtitleText: 'Depuis le début',
      subtitleBgClass: STAT_CARD_STYLES.totalEarnings.subtitleBgClass,
      subtitleTextClass: STAT_CARD_STYLES.totalEarnings.subtitleTextClass,
      cardBgClass: STAT_CARD_STYLES.totalEarnings.cardBgClass,
      valueTextClass: STAT_CARD_STYLES.totalEarnings.valueTextClass,
      isLoading: loading,
      originalAmount: stats.totalEarnings
    },
    {
      title: 'Services actifs',
      value: stats.servicesCount,
      icon: ShoppingCart,
      iconBgClass: STAT_CARD_STYLES.servicesCount.iconBgClass,
      iconTextClass: STAT_CARD_STYLES.servicesCount.iconTextClass,
      subtitleText: 'Visibles aux clients',
      subtitleBgClass: STAT_CARD_STYLES.servicesCount.subtitleBgClass,
      subtitleTextClass: STAT_CARD_STYLES.servicesCount.subtitleTextClass,
      cardBgClass: STAT_CARD_STYLES.servicesCount.cardBgClass,
      valueTextClass: STAT_CARD_STYLES.servicesCount.valueTextClass,
      isLoading: loading,
      originalAmount: stats.servicesCount
    }
  ], [stats, loading]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 xl:gap-6">
      {statCards.map((card) => (
        <div key={card.title} className="col-span-1">
          <StatCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconBgClass={card.iconBgClass}
            iconTextClass={card.iconTextClass}
            subtitleBgClass={card.subtitleBgClass}
            subtitleTextClass={card.subtitleTextClass}
            cardBgClass={card.cardBgClass}
            valueTextClass={card.valueTextClass}
            subtitleText={card.subtitleText}
            originalAmount={card.originalAmount}
            isLoading={card.isLoading}
          />
        </div>
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

// Composant pour les actions rapides
const QuickActions = memo(() => (
  <Card className="border border-vynal-purple-secondary/10 shadow-sm dark:bg-vynal-purple-dark/10">
    <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
      <CardTitle className="text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">Actions rapides</CardTitle>
      <CardDescription className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
        Accédez rapidement aux fonctionnalités essentielles
      </CardDescription>
    </CardHeader>
    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Link href={`${FREELANCE_ROUTES.SERVICES}/new`} className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-2 sm:p-4 rounded-lg flex flex-col items-center text-center gap-1 sm:gap-2 transition-colors">
          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
          <span className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Créer un service</span>
        </Link>
        <Link href={FREELANCE_ROUTES.MESSAGES} className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-2 sm:p-4 rounded-lg flex flex-col items-center text-center gap-1 sm:gap-2 transition-colors">
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
          <span className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Messages</span>
        </Link>
        <Link href={FREELANCE_ROUTES.ORDERS} className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-2 sm:p-4 rounded-lg flex flex-col items-center text-center gap-1 sm:gap-2 transition-colors">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
          <span className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commandes</span>
        </Link>
        <Link href={FREELANCE_ROUTES.WALLET} className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20 p-2 sm:p-4 rounded-lg flex flex-col items-center text-center gap-1 sm:gap-2 transition-colors">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
          <span className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Paiements</span>
        </Link>
      </div>
    </CardContent>
  </Card>
));

QuickActions.displayName = 'QuickActions';

// Composant pour les performances
const PerformanceCard = memo(() => (
  <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/10 overflow-hidden">
    <CardHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
      <div className="flex justify-between items-center">
        <CardTitle className="text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">Performance</CardTitle>
        <div className="bg-vynal-accent-primary/10 p-1 rounded-full">
          <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-vynal-accent-primary" />
        </div>
      </div>
      <CardDescription className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
        Analyse de vos performances récentes
      </CardDescription>
    </CardHeader>
    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center">
              <Star className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Note moyenne</p>
              <p className="text-[8px] sm:text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary">Sur les 30 derniers jours</p>
            </div>
          </div>
          <div className="text-[10px] sm:text-lg font-semibold text-vynal-purple-light dark:text-vynal-text-primary">4.9/5</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Visiteurs</p>
              <p className="text-[8px] sm:text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary">Sur votre profil</p>
            </div>
          </div>
          <div className="text-[10px] sm:text-lg font-semibold text-vynal-purple-light dark:text-vynal-text-primary">324</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center">
              <Users className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Taux de conversion</p>
              <p className="text-[8px] sm:text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary">Visiteurs → Commandes</p>
            </div>
          </div>
          <div className="text-[10px] sm:text-lg font-semibold text-vynal-purple-light dark:text-vynal-text-primary">8.2%</div>
        </div>
      </div>
    </CardContent>
  </Card>
));

PerformanceCard.displayName = 'PerformanceCard';

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
  
  // Message de bienvenue mémorisé
  const welcomeMessage = useMemo(() => {
    const userName = profile?.full_name || user?.user_metadata?.name || 'Freelance';
    return `Bienvenue, ${userName} 👋`;
  }, [profile?.full_name, user?.user_metadata?.name]);
  
  // Effet pour rafraîchir les données quand la page devient visible
  useEffect(() => {
    let lastHiddenTimestamp = 0;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenTimestamp = Date.now();
      } else if (document.visibilityState === 'visible' && lastHiddenTimestamp > 0) {
        // Rafraîchir seulement si la page était cachée depuis au moins 60 secondes
        if (Date.now() - lastHiddenTimestamp >= 60000) {
          refreshDashboard();
        }
        lastHiddenTimestamp = 0;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDashboard]);
  
  // Afficher le skeleton pendant le chargement initial
  if (loadingStats && loadingActivities) {
    return <DashboardPageSkeleton />;
  }
  
  return (
    <FreelanceGuard>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6" data-content="loaded">
        {/* En-tête du Dashboard */}
        <div className="flex justify-between items-center">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
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
          
          {/* Actions rapides et Performance */}
          <div className="md:col-span-5 space-y-4">
            <QuickActions />
            <PerformanceCard />
          </div>
        </div>
      </div>
    </FreelanceGuard>
  );
}