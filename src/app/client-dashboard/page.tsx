"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, MessageSquare, Bell, Package, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { profile, loading } = useUser();
  const [stats, setStats] = useState({
    activeOrders: 0,
    unreadMessages: 0,
    pendingDeliveries: 0,
    completedOrders: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Simuler le chargement des statistiques
  useEffect(() => {
    const loadStats = async () => {
      // Ici, vous chargeriez les vraies données depuis votre API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données fictives pour la démo
      setStats({
        activeOrders: 2,
        unreadMessages: 5,
        pendingDeliveries: 1,
        completedOrders: 8
      });
      
      setLoadingStats(false);
    };
    
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" variant="primary" className="mx-auto" />
      </div>
    );
  }

  if (loadingStats) {
    return <ClientDashboardPageSkeleton />;
  }

  const userName = profile?.full_name || profile?.username || user?.user_metadata?.name || "Client";

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-1 mb-6">
        <div className="flex items-center space-x-1">
          <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">Bienvenue,</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{userName}</span>
          <span className="animate-bounce inline-block">👋</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Voici votre activité sur la plateforme
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 dark:from-indigo-900/20 dark:to-transparent dark:border-indigo-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Commandes actives</p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {stats.activeOrders}
              </p>
            </div>
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 dark:from-emerald-900/20 dark:to-transparent dark:border-emerald-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Livraisons en attente</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.pendingDeliveries}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 dark:from-amber-900/20 dark:to-transparent dark:border-amber-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Messages non lus</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {stats.unreadMessages}
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 dark:from-violet-900/20 dark:to-transparent dark:border-violet-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-1">Commandes terminées</p>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                {stats.completedOrders}
              </p>
            </div>
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
              <Bell className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link 
                href="/services" 
                className="bg-indigo-50 hover:bg-indigo-100 p-3 rounded-lg flex items-center gap-2 transition-colors dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30"
              >
                <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Explorer les services</span>
              </Link>
              
              <Link 
                href="/client-dashboard/orders" 
                className="bg-emerald-50 hover:bg-emerald-100 p-3 rounded-lg flex items-center gap-2 transition-colors dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30"
              >
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Gérer mes commandes</span>
              </Link>
              
              <Link 
                href="/client-dashboard/messages" 
                className="bg-amber-50 hover:bg-amber-100 p-3 rounded-lg flex items-center gap-2 transition-colors dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
              >
                <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Voir mes messages</span>
              </Link>
              
              <Link 
                href="/client-dashboard/payments" 
                className="bg-violet-50 hover:bg-violet-100 p-3 rounded-lg flex items-center gap-2 transition-colors dark:bg-violet-900/20 dark:hover:bg-violet-900/30"
              >
                <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Gérer mes paiements</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Commandes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.activeOrders > 0 ? (
              <div className="space-y-3">
                <div className="border-l-2 border-indigo-400 pl-3 py-2">
                  <p className="text-sm font-medium">Développement d'un site web</p>
                  <p className="text-xs text-slate-500">Status: En cours</p>
                </div>
                <div className="border-l-2 border-amber-400 pl-3 py-2">
                  <p className="text-sm font-medium">Conception logo</p>
                  <p className="text-xs text-slate-500">Status: En attente de validation</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">Aucune commande active</p>
                <Link href="/services" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
                  Explorer les services
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 