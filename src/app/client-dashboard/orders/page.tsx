"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderCard } from "@/components/orders/OrderCard";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { ShoppingBag, Search, Filter, X, Calendar, Clock, Package, CheckCircle, AlertCircle, ShoppingCart, Euro } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { PaginationControls } from "@/components/ui/pagination";

// Types pour les commandes
interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  freelance_id: string;
  service_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled';
  price: number;
  delivery_time: number;
  requirements: string | null;
  completed_at: string | null;
  delivery: {
    files?: string[];
    message?: string;
    date?: string;
  } | null;
  service: {
    title: string;
    description: string;
  };
  freelance: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function ClientOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Optimisation : utilisation de useCallback pour éviter les rendus inutiles
  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          service:services(title, description),
          freelance:profiles!freelance_id(full_name, avatar_url)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Optimisation : Utilisation de useMemo pour éviter les calculs répétés
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtrer par recherche
      if (searchQuery && !order.service.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !order.freelance.full_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filtrer par statut
      if (activeTab === "active") {
        return ['in_progress', 'completed', 'delivered'].includes(order.status);
      } else if (activeTab === "pending") {
        return order.status === 'pending';
      } else if (activeTab === "completed") {
        return ['completed', 'delivered'].includes(order.status);
      } else if (activeTab === "cancelled") {
        return order.status === 'cancelled';
      }
      
      return true;
    });
  }, [orders, searchQuery, activeTab]);

  // Optimisation : Tri mémorisé des commandes
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "price_high") {
        return b.price - a.price;
      } else if (sortBy === "price_low") {
        return a.price - b.price;
      }
      return 0;
    });
  }, [filteredOrders, sortBy]);

  // Optimisation : Calcul mémorisé des compteurs
  const { activeCount, pendingCount, completedCount, cancelledCount } = useMemo(() => {
    return {
      activeCount: orders.filter(order => ['in_progress', 'completed', 'delivered'].includes(order.status)).length,
      pendingCount: orders.filter(order => order.status === 'pending').length,
      completedCount: orders.filter(order => ['completed', 'delivered'].includes(order.status)).length,
      cancelledCount: orders.filter(order => order.status === 'cancelled').length
    };
  }, [orders]);

  // Optimisation : Fonction de gestion des recherches avec debounce implicite
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Optimisation : Helper pour les classes de badge selon le statut
  const getStatusBadgeClasses = useCallback((status: Order['status']) => {
    const baseClasses = "text-[8px] sm:text-[8px] border hover:text-white dark:hover:text-white transition-colors";
    
    switch(status) {
      case 'in_progress':
        return cn(baseClasses, "bg-amber-500/10 text-amber-500 border-amber-500/20");
      case 'completed':
      case 'delivered':
        return cn(baseClasses, "bg-emerald-500/10 text-emerald-500 border-emerald-500/20");
      case 'pending':
        return cn(baseClasses, "bg-slate-500/10 text-slate-500 border-slate-500/20");
      case 'revision_requested':
        return cn(baseClasses, "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20");
      case 'cancelled':
        return cn(baseClasses, "bg-red-500/10 text-red-500 border-red-500/20");
      default:
        return baseClasses;
    }
  }, []);

  // Optimisation : Helper pour le texte du statut
  const getStatusText = useCallback((status: Order['status']) => {
    switch(status) {
      case 'in_progress':
        return "En cours";
      case 'completed':
        return "Terminée";
      case 'delivered':
        return "Livrée";
      case 'pending':
        return "En attente";
      case 'revision_requested':
        return "Révision demandée";
      case 'cancelled':
        return "Annulée";
      default:
        return status;
    }
  }, []);

  // Classes de style unifiées pour une UI cohérente
  const mainCardClasses = "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-sm rounded-lg transition-all duration-200";
  const innerCardClasses = "bg-white/25 dark:bg-slate-800/25 backdrop-blur-sm border border-slate-200/15 dark:border-slate-700/15 rounded-lg transition-all duration-200";
  const badgeClasses = "bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm text-slate-700 dark:text-vynal-text-primary border-slate-200/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30";
  const titleClasses = "text-slate-800 dark:text-vynal-text-primary";
  const subtitleClasses = "text-slate-600 dark:text-vynal-text-secondary";
  const buttonClasses = "text-[8px] sm:text-[8px] text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100/40 dark:hover:bg-slate-700/40 transition-colors";
  const countClasses = "text-[8px] sm:text-[8px] text-slate-600 dark:text-vynal-text-secondary hover:text-white dark:hover:text-white transition-colors";

  // Calculer les commandes paginées
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedOrders.slice(startIndex, endIndex);
  }, [sortedOrders, currentPage]);

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(sortedOrders.length / itemsPerPage);
  }, [sortedOrders]);

  // Gérer le changement de page
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  if (authLoading || loading) {
    return <ClientDashboardPageSkeleton />;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className={`text-base sm:text-lg md:text-xl font-bold ${titleClasses} flex items-center`}>
            <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
            Mes Commandes
          </h1>
          <p className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
            Gérez et suivez toutes vos commandes
          </p>
        </div>
        
        <Link href="/services">
          <Button className="bg-vynal-accent-primary/90 hover:bg-vynal-accent-primary text-white text-[10px] sm:text-xs shadow-sm transition-all duration-200">
            Explorer les services
          </Button>
        </Link>
      </div>

      {/* Recherche et filtres */}
      <div className="mb-4">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Rechercher une commande..."
              className="pl-7 h-8 text-[10px] sm:text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30 text-slate-800 dark:text-vynal-text-primary focus:ring-1 focus:ring-slate-300/50 dark:focus:ring-slate-600/50"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-auto text-[10px] sm:text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent" className="text-[10px] sm:text-xs">Les plus récentes</SelectItem>
              <SelectItem value="oldest" className="text-[10px] sm:text-xs">Les plus anciennes</SelectItem>
              <SelectItem value="price_high" className="text-[10px] sm:text-xs">Prix: décroissant</SelectItem>
              <SelectItem value="price_low" className="text-[10px] sm:text-xs">Prix: croissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs pour filtrer les commandes */}
      <div className="flex justify-center mb-6">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100/70 dark:bg-slate-800/20 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/20">
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-500/5 dark:data-[state=active]:text-amber-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300"
            >
              En cours
              <Badge className="ml-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[8px]">
                {activeCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="data-[state=active]:bg-slate-500/20 data-[state=active]:text-slate-600 dark:data-[state=active]:bg-slate-500/5 dark:data-[state=active]:text-slate-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300"
            >
              En attente
              <Badge className="ml-2 bg-slate-500/20 text-slate-500 border border-slate-500/30 text-[8px]">
                {pendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-emerald-500/5 dark:data-[state=active]:text-emerald-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300"
            >
              Terminées
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[8px]">
                {completedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled"
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-600 dark:data-[state=active]:bg-red-500/5 dark:data-[state=active]:text-red-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300"
            >
              Annulées
              <Badge className="ml-2 bg-red-500/20 text-red-500 border border-red-500/30 text-[8px]">
                {cancelledCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="m-0">
            <div className="space-y-3">
              {activeCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100/20 dark:bg-slate-800/20 p-3 mb-2">
                    <ShoppingCart className="h-5 w-5 text-amber-500/60" />
                  </div>
                  <p className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>Aucune commande trouvée</p>
                  <p className={`text-[8px] sm:text-[10px] max-w-xs ${subtitleClasses}`}>
                    Aucune commande à afficher
                  </p>
                </div>
              ) : (
                <>
                  {paginatedOrders.map((order) => (
                    order.status === 'in_progress' && (
                      <div
                        key={order.id}
                        className={`p-3 ${innerCardClasses}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className={`text-[10px] sm:text-[10px] font-medium ${titleClasses}`}>
                              {order.service.title}
                            </p>
                            <p className={`text-[8px] sm:text-[8px] ${subtitleClasses}`}>
                              {order.freelance.full_name}
                            </p>
                          </div>
                          <Badge className={getStatusBadgeClasses(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Calendar className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Clock className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.delivery_time} jours
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Euro className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.price.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="m-0">
            <div className="space-y-3">
              {pendingCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100/20 dark:bg-slate-800/20 p-3 mb-2">
                    <Clock className="h-5 w-5 text-slate-500/60" />
                  </div>
                  <p className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>Aucune commande trouvée</p>
                  <p className={`text-[8px] sm:text-[10px] max-w-xs ${subtitleClasses}`}>
                    Aucune commande à afficher
                  </p>
                </div>
              ) : (
                <>
                  {paginatedOrders.map((order) => (
                    order.status === 'pending' && (
                      <div
                        key={order.id}
                        className={`p-3 ${innerCardClasses}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className={`text-[10px] sm:text-[10px] font-medium ${titleClasses}`}>
                              {order.service.title}
                            </p>
                            <p className={`text-[8px] sm:text-[8px] ${subtitleClasses}`}>
                              {order.freelance.full_name}
                            </p>
                          </div>
                          <Badge className={getStatusBadgeClasses(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Calendar className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Clock className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.delivery_time} jours
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Euro className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.price.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="m-0">
            <div className="space-y-3">
              {completedCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100/20 dark:bg-slate-800/20 p-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500/60" />
                  </div>
                  <p className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>Aucune commande trouvée</p>
                  <p className={`text-[8px] sm:text-[10px] max-w-xs ${subtitleClasses}`}>
                    Aucune commande à afficher
                  </p>
                </div>
              ) : (
                <>
                  {paginatedOrders.map((order) => (
                    order.status === 'completed' && (
                      <div
                        key={order.id}
                        className={`p-3 ${innerCardClasses}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className={`text-[10px] sm:text-[10px] font-medium ${titleClasses}`}>
                              {order.service.title}
                            </p>
                            <p className={`text-[8px] sm:text-[8px] ${subtitleClasses}`}>
                              {order.freelance.full_name}
                            </p>
                          </div>
                          <Badge className={getStatusBadgeClasses(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Calendar className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Clock className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.delivery_time} jours
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Euro className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.price.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="m-0">
            <div className="space-y-3">
              {cancelledCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100/20 dark:bg-slate-800/20 p-3 mb-2">
                    <X className="h-5 w-5 text-red-500/60" />
                  </div>
                  <p className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>Aucune commande trouvée</p>
                  <p className={`text-[8px] sm:text-[10px] max-w-xs ${subtitleClasses}`}>
                    Aucune commande à afficher
                  </p>
                </div>
              ) : (
                <>
                  {paginatedOrders.map((order) => (
                    order.status === 'cancelled' && (
                      <div
                        key={order.id}
                        className={`p-3 ${innerCardClasses}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className={`text-[10px] sm:text-[10px] font-medium ${titleClasses}`}>
                              {order.service.title}
                            </p>
                            <p className={`text-[8px] sm:text-[8px] ${subtitleClasses}`}>
                              {order.freelance.full_name}
                            </p>
                          </div>
                          <Badge className={getStatusBadgeClasses(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Calendar className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Clock className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.delivery_time} jours
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Euro className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                            <span className={countClasses}>
                              {order.price.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}