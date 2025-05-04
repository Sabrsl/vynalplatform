"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useFreelanceStats } from "@/hooks/useFreelanceStats";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart2, DollarSign, ShoppingBag, Clock, 
  AlertCircle, MessageSquare, CheckCircle2, Users, Star, RefreshCw
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  
  console.log("[StatsPage] User:", user);
  console.log("[StatsPage] Profile:", profile);
  
  // Utilise le hook pour obtenir les statistiques avec une vérification du profile
  const { stats, loading: statsLoading, error, refreshStats } = useFreelanceStats(
    profile?.id || user?.id
  );
  
  console.log("[StatsPage] Stats:", stats);
  console.log("[StatsPage] Loading:", statsLoading);
  console.log("[StatsPage] Error:", error);
  
  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas connecté
    if (!user) {
      console.log("[StatsPage] No user, redirecting to login");
      router.push('/auth/login');
      return;
    }
  }, [user, router]);

  // Afficher le loader si le profil est en cours de chargement
  if (profileLoading) {
    console.log("[StatsPage] Loading state, showing loader");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" variant="primary" showText={true} />
      </div>
    );
  }

  // Afficher le loader si les statistiques sont en cours de chargement
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" variant="primary" showText={true} />
      </div>
    );
  }

  // Afficher une erreur si le profil n'est pas chargé
  if (!profile) {
    console.log("[StatsPage] Error state: No profile loaded");
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-red-500">Erreur de chargement du profil</h2>
        <p className="text-sm text-gray-500">Impossible de charger les informations de votre profil</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  // Afficher une erreur si les stats n'ont pas pu être chargées
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-red-500">Erreur lors du chargement des statistiques</h2>
        <p className="text-sm text-gray-500">{error.message}</p>
        <Button onClick={() => refreshStats(true)} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  const { active, totalRevenue, totalOrders, activeOrders, averageRating } = stats;

  // Mapper les statistiques récupérées avec les bonnes valeurs
  const mappedStats = {
    active: stats.servicesCount || 0,
    totalRevenue: stats.totalEarnings || 0,
    totalOrders: stats.activeOrders || 0,
    activeOrders: stats.pendingDeliveries || 0,
    averageRating: stats.averageRating || 0
  };

  return (
    <div className="container max-w-6xl mx-auto py-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">Statistiques</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshStats(true)}
            disabled={statsLoading}
            className="flex items-center gap-1 text-[10px] text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:text-vynal-text-secondary dark:border-vynal-purple-secondary/40 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-text-primary"
          >
            <RefreshCw className={`h-3 w-3 ${statsLoading ? 'animate-spin' : ''}`} />
            {statsLoading ? 'Actualisation' : 'Actualiser'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-4">
          <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-blue-50/50 dark:from-vynal-purple-dark/50 dark:to-blue-900/20 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                Services actifs
              </CardDescription>
              <div className="p-1.5 rounded-full bg-gradient-to-tr from-blue-200/80 to-blue-100/80 shadow-sm dark:from-blue-900/20 dark:to-blue-800/20">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              {statsLoading ? (
                <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
              ) : (
                <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">{mappedStats.active}</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-amber-50/50 dark:from-vynal-purple-dark/50 dark:to-amber-900/20 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                Revenus totaux
              </CardDescription>
              <div className="p-1.5 rounded-full bg-gradient-to-tr from-amber-200/80 to-amber-100/80 shadow-sm dark:from-amber-900/20 dark:to-amber-800/20">
                <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              {statsLoading ? (
                <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
              ) : (
                <div className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400">{formatPrice(mappedStats.totalRevenue)}</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-green-50/50 dark:from-vynal-purple-dark/50 dark:to-green-900/20 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                Commandes totales
              </CardDescription>
              <div className="p-1.5 rounded-full bg-gradient-to-tr from-green-200/80 to-green-100/80 shadow-sm dark:from-green-900/20 dark:to-green-800/20">
                <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              {statsLoading ? (
                <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
              ) : (
                <div className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">{mappedStats.totalOrders}</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-red-50/50 dark:from-vynal-purple-dark/50 dark:to-red-900/20 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                Commandes en cours
              </CardDescription>
              <div className="p-1.5 rounded-full bg-gradient-to-tr from-red-200/80 to-red-100/80 shadow-sm dark:from-red-900/20 dark:to-red-800/20">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              {statsLoading ? (
                <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
              ) : (
                <div className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400">{mappedStats.activeOrders}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-vynal-purple-secondary/5 dark:from-vynal-purple-dark/50 dark:to-vynal-purple-dark/30 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold">Performance</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">Vos indicateurs de performance</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
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
                <div className="text-[10px] sm:text-lg font-semibold text-vynal-purple-light dark:text-vynal-text-primary">{averageRating}/5</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="overview" className="flex-1">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">Commandes</TabsTrigger>
          <TabsTrigger value="revenue" className="flex-1">Revenus</TabsTrigger>
          <TabsTrigger value="performance" className="flex-1">Performance</TabsTrigger>
        </TabsList>
        
        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-1">Services actifs</p>
                  <p className="text-2xl font-bold">{active}</p>
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
                    {totalRevenue > 0 
                      ? `${formatPrice(totalRevenue)}` 
                      : "-"}
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
                    {totalOrders > 0 ? totalOrders : "-"}
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
                    {activeOrders > 0 ? activeOrders : "-"}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-cyan-100 text-cyan-600">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 lg:col-span-1">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">Note moyenne (sur 5)</p>
                  <p className="text-2xl font-bold flex items-center">
                    {averageRating > 0 
                      ? averageRating.toFixed(1)
                      : "-"} 
                    {averageRating > 0 && <Star className="h-4 w-4 ml-1 text-amber-500 fill-amber-500" />}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance mensuelle</CardTitle>
                <CardDescription>Vos statistiques des 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-500">Taux de complétion</span>
                    <span className="text-2xl font-semibold text-slate-900">100%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-500">Temps de réponse</span>
                    <span className="text-2xl font-semibold text-slate-900">2h</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-500">Clients fidèles</span>
                    <span className="text-2xl font-semibold text-slate-900">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Onglet Commandes */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendance des commandes</CardTitle>
              <CardDescription>Évolution du nombre de commandes reçues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500 flex items-center">
                  <Loader size="xs" variant="primary" className="mr-1" />
                  Pas encore de données
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Revenus */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenus</CardTitle>
              <CardDescription>Analyse de vos revenus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500 flex items-center">
                  <Loader size="xs" variant="primary" className="mr-1" />
                  Pas encore de données
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indicateurs de performance</CardTitle>
              <CardDescription>Analyse détaillée de vos performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500 flex items-center">
                  <Loader size="xs" variant="primary" className="mr-1" />
                  Pas encore de données
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 