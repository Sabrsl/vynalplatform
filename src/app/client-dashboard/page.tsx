"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  ShoppingBag, MessageSquare, Bell, Package, Clock, LayoutDashboard, 
  ShoppingCart, CheckCircle, Euro, Star, Users, TrendingUp, User 
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

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  
  // Utiliser les nouveaux hooks
  const { stats, loading: statsLoading } = useClientStats();
  const { recentOrders, loading: ordersLoading } = useRecentClientOrders({ limit: 3 });
  const { freelancers, loading: freelancersLoading } = useRecommendedFreelancers({ limit: 3 });
  
  // Variable isLoading unique
  const isLoading = profileLoading || statsLoading || ordersLoading || freelancersLoading;

  // Helper pour les classes de badges
  const getStatusBadgeClasses = useCallback((status: Order['status']) => {
    const baseClasses = "text-[8px] sm:text-[8px] border transition-colors";
    
    switch(status) {
      case "in_progress":
        return cn(baseClasses, "bg-amber-500/20 text-amber-600 border-amber-500/30 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20 dark:hover:bg-amber-500/15");
      case "completed":
      case "delivered":
        return cn(baseClasses, "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20 dark:hover:bg-emerald-500/15");
      case "pending":
        return cn(baseClasses, "bg-slate-500/20 text-slate-600 border-slate-500/30 hover:bg-slate-500/25 dark:bg-slate-500/10 dark:text-slate-500 dark:border-slate-500/20 dark:hover:bg-slate-500/15");
      case "revision_requested":
        return cn(baseClasses, "bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20 dark:hover:bg-blue-500/15");
      case "cancelled":
        return cn(baseClasses, "bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20 dark:hover:bg-red-500/15");
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

  // Classes CSS communes - optimisées pour l'élégance
  const mainCardClasses = "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-sm rounded-lg transition-all duration-200";
  const secondaryCardClasses = "bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm border border-slate-200/20 dark:border-slate-700/20 shadow-none rounded-lg transition-all duration-200";
  const innerCardClasses = "bg-white/25 dark:bg-slate-800/25 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/40 rounded-lg transition-all duration-200";
  const titleClasses = "text-slate-800 dark:text-vynal-text-primary";
  const subtitleClasses = "text-slate-600 dark:text-vynal-text-secondary";
  const buttonClasses = "text-[8px] sm:text-[8px] text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100/40 dark:hover:bg-slate-700/40 transition-colors";
  
  // Loading skeleton
  if (isLoading) {
    return <ClientDashboardPageSkeleton />;
  }

  const userName = profile?.full_name || profile?.username || user?.user_metadata?.name || "Client";

  return (
    <ClientGuard>
      <div className="container max-w-6xl mx-auto px-4 py-6" data-content="loaded">
        {/* En-tête du tableau de bord */}
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <div>
            <h1 className={`text-base sm:text-lg md:text-xl font-bold ${titleClasses} flex items-center`}>
              <LayoutDashboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
              Tableau de bord
            </h1>
            <p className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
              Bienvenue, {userName}
            </p>
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
                <ShoppingCart className="h-3 w-3 sm:h-3 sm:w-3 text-amber-500" />
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-1">
                <div className={`text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400`}>{stats.activeOrders}</div>
                <p className={`text-[8px] sm:text-[10px] ${subtitleClasses}`}>
                  <span className="flex items-center">
                    <TrendingUp className="h-2 w-2 mr-1 text-amber-500" />
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
                <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{stats.completedOrders}</div>
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
                <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.totalSpent)}</div>
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
                  className={buttonClasses}
                  asChild
                >
                  <Link href={CLIENT_ROUTES.ORDERS}>Voir tout</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {recentOrders.map((order) => (
                  <Card className={`${mainCardClasses} cursor-pointer transition-all duration-300 hover:shadow-md group hover:border-vynal-accent-primary/20`} key={order.id}>
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
                              {order.total_amount} FCFA
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
                    Nos meilleurs freelances certifiés et évalués
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={buttonClasses}
                  asChild
                >
                  <Link href="/services">Explorer</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {freelancers.map((freelancer) => (
                  <div
                    key={freelancer.id}
                    className={`p-3 rounded-lg ${innerCardClasses}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <Avatar className="h-8 w-8 ring-1 ring-slate-200/30 dark:ring-slate-700/30">
                        <AvatarImage src={freelancer.avatar_url || ''} alt={freelancer.full_name || 'Freelance'} className="object-cover" />
                        <AvatarFallback className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-vynal-text-primary">
                          {(freelancer.full_name || freelancer.username || 'F').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <p className={`text-[9px] sm:text-[9px] font-medium ${titleClasses}`}>
                              {freelancer.full_name || freelancer.username || 'Anonyme'}
                            </p>
                            {freelancer.is_certified && (
                              <Badge className="text-[6px] sm:text-[6px] bg-vynal-accent-primary/20 text-vynal-accent-primary border border-vynal-accent-primary/30 hover:bg-vynal-accent-primary/25 dark:bg-vynal-accent-primary/10 dark:text-vynal-accent-primary dark:border-vynal-accent-primary/20 dark:hover:bg-vynal-accent-primary/15 px-1 h-2.5">
                                Expert
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className={`text-[7px] sm:text-[7px] ${subtitleClasses}`}>
                          {freelancer.specialty || 'Divers'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 hover:bg-yellow-500/25 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/20 dark:hover:bg-yellow-500/15 px-1.5 py-0.5 rounded-full">
                            <Star className="h-1.5 w-1.5" />
                            <span className={`text-[7px] sm:text-[7px] font-medium ${titleClasses}`}>
                              {freelancer.rating.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20 dark:hover:bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                            <CheckCircle className="h-1.5 w-1.5" />
                            <span className={`text-[7px] sm:text-[7px] ${subtitleClasses}`}>
                              {freelancer.completed_projects}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${buttonClasses} h-4 border-slate-200/20 dark:border-slate-700/20`}
                        asChild
                      >
                        <Link href={`/freelancers/${freelancer.id}`}>Profil</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientGuard>
  );
} 