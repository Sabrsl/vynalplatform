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
  AlertCircle, MessageSquare, TrendingUp, CalendarDays,
  CheckCircle2, Users, Star
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

// Données fictives pour les graphiques
const MOCK_MONTHLY_REVENUE = [
  { month: 'Jan', amount: 0 },
  { month: 'Fév', amount: 0 },
  { month: 'Mar', amount: 0 },
  { month: 'Avr', amount: 0 },
  { month: 'Mai', amount: 350 },
  { month: 'Juin', amount: 525.50 },
  { month: 'Juil', amount: 0 },
  { month: 'Août', amount: 0 },
  { month: 'Sep', amount: 0 },
  { month: 'Oct', amount: 0 },
  { month: 'Nov', amount: 0 },
  { month: 'Déc', amount: 0 },
];

const MOCK_PERFORMANCE = {
  completionRate: 100,
  responseTime: 2, // en heures
  repeatClients: 1,
  orderTrends: [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 12 mois
};

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Utilise le hook pour obtenir les statistiques
  const { stats, loading, error, refreshStats } = useFreelanceStats(profile?.id);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user?.user_metadata?.role !== "freelance") {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" variant="primary" showText={true} />
      </div>
    );
  }

  const { active, totalRevenue, totalOrders, activeOrders, averageRating } = stats;

  return (
    <div className="container max-w-6xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Statistiques & Performance</h1>
          <p className="text-slate-500 text-sm mt-1">Analysez vos performances et votre activité</p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshStats}
          className="flex items-center gap-1"
        >
          <Loader size="sm" variant="primary" className="mr-1" /> 
          Actualiser
        </Button>
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
              onClick={refreshStats}
              className="mt-2 text-xs"
            >
              <Loader size="sm" variant="primary" className="mr-1 animate-spin" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

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
                    <span className="text-2xl font-semibold text-slate-900">{MOCK_PERFORMANCE.completionRate}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-500">Temps de réponse</span>
                    <span className="text-2xl font-semibold text-slate-900">{MOCK_PERFORMANCE.responseTime}h</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-500">Clients fidèles</span>
                    <span className="text-2xl font-semibold text-slate-900">{MOCK_PERFORMANCE.repeatClients}</span>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Revenus</h2>
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${selectedPeriod === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600'}`}
                onClick={() => setSelectedPeriod('month')}
              >
                Mois
              </button>
              <button
                className={`px-3 py-1 text-sm ${selectedPeriod === 'year' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600'}`}
                onClick={() => setSelectedPeriod('year')}
              >
                Année
              </button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenus mensuels</CardTitle>
              <CardDescription>Répartition de vos revenus sur l'année</CardDescription>
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
              <CardDescription>Données basées sur votre activité globale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-medium mb-4">Satisfaction client</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-600">Note moyenne</span>
                        <span className="text-sm font-medium">{averageRating > 0 ? averageRating.toFixed(1) : "-"}/5</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" 
                          style={{ width: `${(averageRating / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-4">Taux de complétion</h3>
                  <div className="flex items-center">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{MOCK_PERFORMANCE.completionRate}%</span>
                      </div>
                      <svg className="w-24 h-24" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="2"></circle>
                        <circle 
                          cx="18" cy="18" r="16" fill="none" stroke="#818cf8" strokeWidth="2" 
                          strokeDasharray={`${MOCK_PERFORMANCE.completionRate}, 100`} 
                          transform="rotate(-90 18 18)"
                        ></circle>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-slate-500">Commandes livrées à temps</p>
                      <p className="text-sm font-medium">2 sur 2</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 