"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpRight, FileText, Clock, Activity, Eye, 
  CreditCard, MessageCircle, Bell, Package, Mail,
  ShoppingCart, Star, AlertTriangle, Upload, MessageSquare, CheckCircle,
  Zap, Users
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

// Type pour les statistiques d'un client
interface ClientStats {
  activeOrders: number;
  unreadMessages: number;
  pendingDeliveries: number;
  pendingReviews: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, isClient } = useUser();
  
  // Rediriger les freelances vers leur propre tableau de bord
  useEffect(() => {
    if (user?.user_metadata?.role === 'freelance') {
      window.location.href = '/dashboard/freelance';
    }
  }, [user]);
  
  // Utiliser le nom complet du profil en priorité
  const userName = profile?.full_name || profile?.username || user?.user_metadata?.name || "Utilisateur";
  
  // État pour les activités récentes
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // Statistiques pour les clients
  const [clientStats, setClientStats] = useState<ClientStats>({
    activeOrders: 0,
    unreadMessages: 0,
    pendingDeliveries: 0,
    pendingReviews: 0
  });
  const [loadingClientStats, setLoadingClientStats] = useState(false);
  
  // Charger les statistiques du client
  useEffect(() => {
    const fetchClientStats = async () => {
      if (!user?.id || !profile?.id) return;
      
      setLoadingClientStats(true);
      
      try {
        // Commandes actives
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, status')
          .eq('client_id', profile.id)
          .in('status', ['pending', 'in_progress', 'revision_requested']);
          
        if (ordersError) throw ordersError;
        
        // Messages non lus
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', profile.id)
          .eq('read', false);
          
        if (messagesError) throw messagesError;
        
        // Livraisons en attente
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('orders')
          .select('id')
          .eq('client_id', profile.id)
          .eq('status', 'delivered')
          .is('completed_at', null);
          
        if (deliveriesError) throw deliveriesError;
        
        // Commandes complétées sans avis
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('orders')
          .select('id, has_review')
          .eq('client_id', profile.id)
          .eq('status', 'completed')
          .eq('has_review', false);
          
        if (reviewsError) throw reviewsError;
        
        // Mettre à jour les statistiques
        setClientStats({
          activeOrders: ordersData?.length || 0,
          unreadMessages: messagesData?.length || 0,
          pendingDeliveries: deliveriesData?.length || 0,
          pendingReviews: reviewsData?.length || 0
        });
        
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques client:", error);
      } finally {
        setLoadingClientStats(false);
      }
    };
    
    fetchClientStats();
  }, [user?.id, profile?.id]);

  // Charger les activités récentes
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!user?.id) return;
      
      setLoadingActivities(true);
      
      try {
        // À implémenter: récupération des activités récentes depuis l'API
        // Pour l'instant, initialiser avec un tableau vide
        setRecentActivities([]);
      } catch (error) {
        console.error("Erreur lors du chargement des activités récentes:", error);
      } finally {
        setLoadingActivities(false);
      }
    };
    
    fetchRecentActivities();
  }, [user?.id]);

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
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-6 sm:space-y-8 pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <div className="flex items-center space-x-1">
            <span className="text-lg font-semibold text-vynal-purple-light dark:text-vynal-text-secondary">Hey</span>
            <span className="animate-bounce inline-block">👋</span>
            <span className="text-lg font-bold text-vynal-accent-secondary dark:text-vynal-text-primary">{userName}</span>
          </div>
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
            Voici ton activité sur la plateforme
          </p>
        </div>
      
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-primary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Commandes en cours</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {loadingClientStats ? "-" : clientStats.activeOrders}
              </div>
              <div className="flex items-center mt-1">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary mr-1"></div>
                <p className="text-[10px] sm:text-xs text-vynal-accent-secondary dark:text-emerald-400 truncate">
                  En attente
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
                {loadingClientStats ? "-" : clientStats.unreadMessages}
              </div>
              <div className="flex items-center mt-1">
                <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-accent-secondary/30 to-vynal-accent-secondary/20 text-vynal-accent-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-vynal-accent-secondary truncate">
                  {clientStats.unreadMessages > 0 ? "À lire" : "À jour"}
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
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Livraisons à venir</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {loadingClientStats ? "-" : clientStats.pendingDeliveries}
              </div>
              <div className="flex items-center mt-1">
                <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 text-vynal-purple-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-amber-400 truncate">
                  Prochainement
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-emerald-400/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-emerald-400" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Avis à laisser</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {loadingClientStats ? "-" : clientStats.pendingReviews}
              </div>
              <div className="flex items-center mt-1">
                <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-accent-primary/30 to-vynal-accent-primary/20 text-vynal-accent-primary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-emerald-400 truncate">
                  {clientStats.pendingReviews > 0 ? "Services à évaluer" : "Tout est à jour"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-8 sm:mt-6">
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
              {loadingActivities ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
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
                <div className="rounded-lg border border-gray-200 dark:border-vynal-purple-secondary/20 p-3 sm:p-4 flex items-center justify-center flex-col bg-gradient-to-br from-gray-50 to-white dark:from-vynal-purple-secondary/5 dark:to-transparent">
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 dark:text-vynal-text-secondary/40 mb-2" />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-vynal-text-secondary">
                    Aucune activité récente à afficher
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
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
              <div className="space-y-2 sm:space-y-3">
                <Link href="/services" className="group flex justify-between items-center p-2 sm:p-3 rounded-lg transition-all bg-gradient-to-r from-vynal-accent-primary/15 via-vynal-accent-primary/25 to-vynal-accent-primary/15 hover:translate-y-[-1px] hover:shadow-sm border border-vynal-accent-primary/10 dark:from-vynal-purple-secondary/10 dark:via-vynal-purple-secondary/15 dark:to-vynal-purple-secondary/10 dark:hover:from-vynal-purple-secondary/20 dark:hover:via-vynal-purple-secondary/25 dark:hover:to-vynal-purple-secondary/20">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-2 p-1 sm:p-2 rounded-full bg-gradient-to-br from-vynal-accent-primary/40 to-vynal-accent-primary/30 text-vynal-accent-primary group-hover:shadow-sm dark:from-vynal-purple-secondary/40 dark:to-vynal-purple-secondary/20 dark:text-vynal-accent-primary flex-shrink-0">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate">Explorer les services</span>
                  </div>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform dark:text-vynal-accent-primary flex-shrink-0 ml-1" />
                </Link>
                <Link href="/dashboard/orders" className="group flex justify-between items-center p-2 sm:p-3 rounded-lg transition-all bg-gradient-to-r from-vynal-accent-secondary/15 via-vynal-accent-secondary/25 to-vynal-accent-secondary/15 hover:translate-y-[-1px] hover:shadow-sm border border-vynal-accent-secondary/10 dark:from-vynal-purple-secondary/10 dark:via-vynal-purple-secondary/15 dark:to-vynal-purple-secondary/10 dark:hover:from-vynal-purple-secondary/20 dark:hover:via-vynal-purple-secondary/25 dark:hover:to-vynal-purple-secondary/20">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-2 p-1 sm:p-2 rounded-full bg-gradient-to-br from-vynal-accent-secondary/40 to-vynal-accent-secondary/30 text-vynal-accent-secondary group-hover:shadow-sm dark:from-vynal-purple-secondary/40 dark:to-vynal-purple-secondary/20 dark:text-vynal-accent-secondary flex-shrink-0">
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate whitespace-nowrap">Gérer mes commandes</span>
                  </div>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform dark:text-vynal-accent-secondary flex-shrink-0 ml-1" />
                </Link>
                <Link href="/dashboard/profile" className="group flex justify-between items-center p-2 sm:p-3 rounded-lg transition-all bg-gradient-to-r from-vynal-purple-secondary/15 via-vynal-purple-secondary/25 to-vynal-purple-secondary/15 hover:translate-y-[-1px] hover:shadow-sm border border-vynal-purple-secondary/10 dark:from-vynal-purple-secondary/10 dark:via-vynal-purple-secondary/15 dark:to-vynal-purple-secondary/10 dark:hover:from-vynal-purple-secondary/20 dark:hover:via-vynal-purple-secondary/25 dark:hover:to-vynal-purple-secondary/20">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-2 p-1 sm:p-2 rounded-full bg-gradient-to-br from-vynal-purple-secondary/40 to-vynal-purple-secondary/30 text-vynal-purple-secondary group-hover:shadow-sm dark:from-vynal-purple-secondary/40 dark:to-vynal-purple-secondary/20 dark:text-emerald-400 flex-shrink-0">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate whitespace-nowrap">Mon&nbsp;profil</span>
                  </div>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-purple-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform dark:text-emerald-400 flex-shrink-0 ml-1" />
                </Link>
                <Link href="/dashboard/messages" className="group flex justify-between items-center p-2 sm:p-3 rounded-lg transition-all bg-gradient-to-r from-vynal-accent-secondary/15 via-vynal-accent-secondary/25 to-vynal-accent-secondary/15 hover:translate-y-[-1px] hover:shadow-sm border border-vynal-accent-secondary/10 dark:from-vynal-purple-secondary/10 dark:via-vynal-purple-secondary/15 dark:to-vynal-purple-secondary/10 dark:hover:from-vynal-purple-secondary/20 dark:hover:via-vynal-purple-secondary/25 dark:hover:to-vynal-purple-secondary/20">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-2 p-1 sm:p-2 rounded-full bg-gradient-to-br from-vynal-accent-secondary/40 to-vynal-accent-secondary/30 text-vynal-accent-secondary group-hover:shadow-sm dark:from-vynal-purple-secondary/40 dark:to-vynal-purple-secondary/20 dark:text-amber-400 flex-shrink-0">
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate">Messages</span>
                  </div>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform dark:text-amber-400 flex-shrink-0 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 