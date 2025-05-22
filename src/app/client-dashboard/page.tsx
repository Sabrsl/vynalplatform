"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  ShoppingBag, MessageSquare, Bell, Package, Clock, LayoutDashboard, 
  ShoppingCart, CheckCircle, Euro, Star, Users, TrendingUp, User, RefreshCw 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/format";
import { useClientStats } from "@/hooks/useClientStats";
import { useRecentClientOrders } from "@/hooks/useRecentClientOrders";
import { useRecommendedFreelancers } from "@/hooks/useRecommendedFreelancers";
import { ClientGuard } from "@/lib/guards/roleGuards";
import { useOptimizedDashboard } from "@/hooks/useDashboard";
import { CLIENT_ROUTES } from "@/config/routes";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

// Types définis
interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled';
  service: {
    id: string;
    title: string;
    price: number;
    description?: string;
  };
  freelance: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  client: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  is_client_view: boolean;
  total_amount?: number;
  delivery_time: number;
}

interface Freelancer {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  isExpert: boolean;
  completedProjects: number;
  reviews: number;
}

interface Stats {
  activeOrders: number;
  unreadMessages: number;
  pendingDeliveries: number;
  completedOrders: number;
  totalSpent: number;
}

// Composant de bouton de rafraîchissement
function RefreshButton({ onClick, isRefreshing, lastRefreshText }: { 
  onClick: () => void; 
  isRefreshing: boolean;
  lastRefreshText: string;
}) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick} 
      disabled={isRefreshing}
      className="text-gray-600 dark:text-gray-400 hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary flex items-center gap-1 text-xs"
    >
      {isRefreshing ? (
        <Loader className="h-3 w-3 animate-spin text-vynal-accent-primary" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      <span className="hidden sm:inline">{isRefreshing ? 'Actualisation...' : lastRefreshText}</span>
    </Button>
  );
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  
  // Utiliser les nouveaux hooks
  const { stats, loading: statsLoading, isRefreshing: statsRefreshing, lastRefreshText, refresh: refreshStats } = useClientStats();
  const { recentOrders, loading: ordersLoading, isRefreshing: ordersRefreshing, refresh: refreshOrders } = useRecentClientOrders({ limit: 3 });
  const { freelancers, loading: freelancersLoading, isRefreshing: freelancersRefreshing, refresh: refreshFreelancers } = useRecommendedFreelancers({ limit: 3 });
  
  // Variable isLoading unique
  const isLoading = profileLoading || statsLoading || ordersLoading || freelancersLoading;
  
  // Variable isRefreshing unique
  const isRefreshing = statsRefreshing || ordersRefreshing || freelancersRefreshing;

  // Fonction combinée pour rafraîchir toutes les données
  const handleRefresh = useCallback(() => {
    refreshStats();
    refreshOrders();
    refreshFreelancers();
  }, [refreshStats, refreshOrders, refreshFreelancers]);

  // Helper pour les classes de badges
  const getStatusBadgeClasses = useCallback((status: Order['status']) => {
    const baseClasses = "text-[8px] sm:text-[8px] border transition-colors";
    
    switch(status) {
      case "in_progress":
        return cn(baseClasses, "bg-blue-700/10 text-blue-700 border-blue-700/20 hover:bg-blue-700/15 hover:border-blue-700/30 dark:bg-blue-500/10 dark:border-blue-500/20 dark:hover:bg-blue-500/20 dark:hover:border-blue-500/40");
      case "completed":
      case "delivered":
        return cn(baseClasses, "bg-green-700/10 text-green-700 border-green-700/20 hover:bg-green-700/15 hover:border-green-700/30 dark:bg-green-500/10 dark:border-green-500/20 dark:hover:bg-green-500/20 dark:hover:border-green-500/40");
      case "pending":
        return cn(baseClasses, "bg-yellow-700/10 text-yellow-700 border-yellow-700/20 hover:bg-yellow-700/15 hover:border-yellow-700/30 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:hover:bg-yellow-500/20 dark:hover:border-yellow-500/40");
      case "revision_requested":
        return cn(baseClasses, "bg-orange-700/10 text-orange-700 border-orange-700/20 hover:bg-orange-700/15 hover:border-orange-700/30 dark:bg-orange-500/10 dark:border-orange-500/20 dark:hover:bg-orange-500/20 dark:hover:border-orange-500/40");
      case "cancelled":
        return cn(baseClasses, "bg-red-700/10 text-red-700 border-red-700/20 hover:bg-red-700/15 hover:border-red-700/30 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:hover:border-red-500/40");
      default:
        return baseClasses;
    }
  }, []);

  // Helper pour le texte du statut
  const getStatusText = useCallback((status: Order['status']) => {
    switch(status) {
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminée";
      case "delivered":
        return "Livrée";
      case "pending":
        return "En attente";
      case "revision_requested":
        return "Révision demandée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  }, []);

  // Classes dynamiques
  const titleClasses = 'text-slate-800 dark:text-vynal-text-primary';
  const subtitleClasses = 'text-slate-600 dark:text-vynal-text-secondary';
  const mainCardClasses = 'bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-700/40 transition-all duration-200 shadow-sm backdrop-blur-sm';  
  
  // Nom d'utilisateur formaté pour l'affichage
  const userName = useMemo(() => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.username) return profile.username;
    return "client";
  }, [profile]);

  // Afficher un écran de chargement si nécessaire
  if (isLoading) {
    return <ClientDashboardPageSkeleton />;
  }

  return (
    <ClientGuard>
      <div className="container max-w-6xl mx-auto px-4 py-6" data-content="loaded">
        {/* En-tête du tableau de bord */}
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className={`text-base sm:text-lg md:text-xl font-bold ${titleClasses} flex items-center`}>
                <LayoutDashboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
                Tableau de bord
              </h1>
              <p className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
                Bienvenue, {userName}
              </p>
            </div>
            <RefreshButton 
              onClick={handleRefresh} 
              isRefreshing={isRefreshing} 
              lastRefreshText={lastRefreshText}
            />
          </div>
        </div>

        <div className="grid gap-6">
          {/* Statistiques - cartes principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className={`${mainCardClasses} p-2 sm:p-3`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>
                  Commandes en cours
                </CardTitle>
                <ShoppingCart className="h-3 w-3 sm:h-3 sm:w-3 text-vynal-accent-primary" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-1">
                <div className={`text-lg sm:text-xl font-bold text-vynal-accent-primary dark:text-vynal-accent-primary`}>{stats.activeOrders}</div>
                <p className={`text-[8px] sm:text-[10px] ${subtitleClasses}`}>
                  <span className="flex items-center">
                    <TrendingUp className="h-2 w-2 mr-1 text-vynal-accent-primary" />
                    Commandes actives
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className={`${mainCardClasses} p-2 sm:p-3`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>
                  Commandes terminées
                </CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-3 sm:w-3 text-emerald-500" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-1">
                <div className="text-lg sm:text-xl font-bold text-emerald-500 dark:text-emerald-400">{stats.completedOrders}</div>
                <p className={`text-[8px] sm:text-[10px] ${subtitleClasses}`}>
                  <span className="flex items-center">
                    <TrendingUp className="h-2 w-2 mr-1 text-emerald-500" />
                    Livrées avec succès
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className={`${mainCardClasses} p-2 sm:p-3`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>
                  Dépenses totales
                </CardTitle>
                <span className="text-[10px] sm:text-xs font-semibold text-blue-500">₣</span>
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-1">
                <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                  <CurrencyDisplay amount={stats.totalSpent} displayFullName={true} />
                </div>
                <p className={`text-[8px] sm:text-[10px] ${subtitleClasses}`}>
                  <span className="flex items-center">
                    <TrendingUp className="h-2 w-2 mr-1 text-emerald-500" />
                    Investissement total
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className={`${mainCardClasses} p-2 sm:p-3`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>
                  Messages non lus
                </CardTitle>
                <MessageSquare className="h-3 w-3 sm:h-3 sm:w-3 text-amber-500" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-1">
                <div className={`text-lg sm:text-xl font-bold ${titleClasses}`}>{stats.unreadMessages}</div>
                <p className={`text-[8px] sm:text-[10px] ${subtitleClasses}`}>
                  <span className="flex items-center">
                    <Bell className="h-2 w-2 mr-1 text-amber-500" />
                    Nouvelles notifications
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commandes récentes - conteneur principal avec sous-conteneurs */}
          <Card className={mainCardClasses}>
            <CardHeader className="p-3 sm:p-4 border-b border-slate-200/10 dark:border-slate-700/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-sm sm:text-sm md:text-base flex items-center ${titleClasses}`}>
                    <ShoppingCart className="mr-2 h-3 w-3 sm:h-3 sm:w-3 text-vynal-accent-primary" />
                    Commandes récentes
                  </CardTitle>
                  <CardDescription className={`text-[10px] sm:text-[10px] ${subtitleClasses}`}>
                    Vos {recentOrders.length} commandes les plus récentes
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${subtitleClasses} text-slate-600 dark:text-slate-400 hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary flex items-center gap-1 text-xs`}
                  asChild
                >
                  <Link href={CLIENT_ROUTES.ORDERS}>Voir tout</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {recentOrders.map((order) => (
                  <Card className={`${mainCardClasses} cursor-pointer transition-all duration-200 hover:shadow-md group hover:border-vynal-accent-primary/20`} key={order.id}>
                    <Link href={`${CLIENT_ROUTES.ORDERS}/${order.id}`}>
                      <CardContent className="p-2.5 sm:p-3">
                        <div className="flex flex-col">
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-[10px] sm:text-xs md:text-[10px] lg:text-[11px] text-slate-800 dark:text-vynal-text-primary group-hover:text-vynal-accent-primary transition-colors line-clamp-1 pr-1">
                              {order.service?.title || "Commande sans titre"}
                            </h3>
                            <Badge variant="outline" className={getStatusBadgeClasses(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                          <div className="mt-1.5 flex items-center text-[8px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary">
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 opacity-70" />
                            <span>{typeof order.freelance === 'string' ? order.freelance : order.freelance?.full_name || "Freelance"}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[8px] sm:text-[10px] font-medium text-vynal-accent-primary">
                              <CurrencyDisplay amount={order.total_amount || 0} displayFullName={true} />
                            </span>
                            <div className="flex items-center text-[8px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary/70">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 opacity-70" />
                              <span>{order.delivery_time} {order.delivery_time > 1 ? 'jours' : 'jour'}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Freelances recommandés - conteneur principal avec sous-conteneurs */}
          <Card className={mainCardClasses}>
            <CardHeader className="p-3 sm:p-4 border-b border-slate-200/10 dark:border-slate-700/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-sm sm:text-sm md:text-base flex items-center ${titleClasses}`}>
                    <Users className="mr-2 h-3 w-3 sm:h-3 sm:w-3 text-vynal-accent-primary" />
                    Freelances recommandés
                  </CardTitle>
                  <CardDescription className={`text-[10px] sm:text-[10px] ${subtitleClasses}`}>
                    Découvrez nos meilleurs freelances
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${subtitleClasses} text-slate-600 dark:text-slate-400 hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary flex items-center gap-1 text-xs`}
                  asChild
                >
                  <Link href="/services">Explorer</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {freelancers.map((freelancer) => (
                  <Card key={freelancer.id} className={`${mainCardClasses} cursor-pointer transition-all duration-200 hover:shadow-md group hover:border-vynal-accent-primary/20`}>
                    <Link href={`/profile/id/${freelancer.id}`}>
                      <CardContent className="p-2.5 sm:p-3">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage src={freelancer.avatar_url || ''} alt={freelancer.full_name || 'Freelance'} />
                            <AvatarFallback className="bg-slate-100/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400">
                              {(freelancer.full_name || freelancer.username || 'F').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-[10px] sm:text-xs text-slate-800 dark:text-vynal-text-primary group-hover:text-vynal-accent-primary transition-colors">
                                {freelancer.full_name || freelancer.username || 'Anonyme'}
                              </h3>
                              {freelancer.is_certified && (
                                <Badge variant="outline" className="text-[8px] sm:text-[10px] bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/15 hover:border-vynal-accent-primary/30 dark:bg-vynal-accent-primary/10 dark:border-vynal-accent-primary/20 dark:hover:bg-vynal-accent-primary/20 dark:hover:border-vynal-accent-primary/40">
                                  Expert
                                </Badge>
                              )}
                            </div>
                            <p className="text-[8px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary mt-0.5">
                              {freelancer.specialty || 'Divers'}
                            </p>
                            <div className="flex items-center mt-1.5 text-[8px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary/70">
                              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-amber-500" />
                              <span>{freelancer.rating?.toFixed(1) || '0.0'} ({freelancer.completed_projects || 0} projets)</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientGuard>
  );
} 