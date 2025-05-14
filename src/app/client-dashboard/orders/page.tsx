"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderCard } from "@/components/orders/OrderCard";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { ShoppingBag, Search, Filter, X, Calendar, Clock, Package, CheckCircle, AlertCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { PaginationControls } from "@/components/ui/pagination";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

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
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState({
    activeCount: 0,
    pendingCount: 0,
    completedCount: 0, 
    cancelledCount: 0,
    totalCount: 0
  });
  const itemsPerPage = 10;
  const searchQueryRef = useRef(searchQuery);
  const debouncedSearchRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Méthode de secours si la RPC échoue
  const loadDataLegacy = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Utilisation de la méthode de secours pour charger les données");
      
      // Exécuter les requêtes en parallèle pour éviter la cascade
      const ordersPromise = (() => {
        let query = supabase
          .from('orders')
          .select(`
            *,
            service:services(title, description),
            freelance:profiles!freelance_id(full_name, avatar_url)
          `, { count: 'exact' })
          .eq('client_id', user.id);

        // Appliquer le filtre par status
        if (activeTab === "active") {
          query = query.in('status', ['in_progress', 'completed', 'delivered']);
        } else if (activeTab === "pending") {
          query = query.eq('status', 'pending');
        } else if (activeTab === "completed") {
          query = query.in('status', ['completed', 'delivered']);
        } else if (activeTab === "cancelled") {
          query = query.eq('status', 'cancelled');
        }

        // Appliquer la recherche
        if (searchQuery) {
          query = query.or(`service.title.ilike.%${searchQuery}%,freelance.full_name.ilike.%${searchQuery}%`);
        }

        // Appliquer le tri
        if (sortBy === "recent") {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === "oldest") {
          query = query.order('created_at', { ascending: true });
        } else if (sortBy === "price_high") {
          query = query.order('price', { ascending: false });
        } else if (sortBy === "price_low") {
          query = query.order('price', { ascending: true });
        }

        // Pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        return query;
      })();

      // Obtenir les compteurs en une seule requête
      const countsPromise = supabase
        .from('orders')
        .select('status')
        .eq('client_id', user.id);

      // Attendre les deux requêtes
      const [ordersResult, countsResult] = await Promise.all([ordersPromise, countsPromise]);
      
      // Gérer les erreurs potentielles
      if (ordersResult.error) throw ordersResult.error;
      if (countsResult.error) throw countsResult.error;
      
      // Calculer les compteurs à partir des résultats
      const counts = {
        totalCount: 0,
        activeCount: 0,
        pendingCount: 0,
        completedCount: 0,
        cancelledCount: 0
      };

      // Compter les statuts
      countsResult.data?.forEach((order: { status: Order['status'] }) => {
        counts.totalCount++;
        switch(order.status) {
          case 'in_progress':
          case 'completed':
          case 'delivered':
            counts.activeCount++;
            break;
          case 'pending':
            counts.pendingCount++;
            break;
          case 'completed':
          case 'delivered':
            counts.completedCount++;
            break;
          case 'cancelled':
            counts.cancelledCount++;
            break;
        }
      });

      // Mettre à jour les états
      setCounts(counts);
      setOrders(ordersResult.data || []);
      setTotalCount(ordersResult.count || 0);
    } catch (error) {
      console.error("Erreur lors du chargement des données de secours:", error);
      throw error;
    }
  }, [user, activeTab, searchQuery, sortBy, currentPage, itemsPerPage, setCounts, setOrders, setTotalCount]);

  // Fonction unifiée pour charger à la fois les compteurs et les commandes
  const loadOrdersData = useCallback(async () => {
    if (!user) return;
    
    if (initialLoadRef.current) {
      // Ne pas modifier le state loading au début si c'est le chargement initial
      // Cela évite de déclencher un rendu supplémentaire
      initialLoadRef.current = false;
    } else {
      setLoading(true);
    }

    try {
      // 1. Utiliser une RPC unifiée qui retourne à la fois les compteurs et les commandes filtrées
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_client_orders_with_counts', {
        p_client_id: user.id,
        p_status: activeTab === 'all' ? null : 
                 activeTab === 'active' ? ['in_progress', 'completed', 'delivered'] :
                 activeTab === 'pending' ? ['pending'] :
                 activeTab === 'completed' ? ['completed', 'delivered'] :
                 activeTab === 'cancelled' ? ['cancelled'] : null,
        p_search_query: searchQuery || null,
        p_sort_by: sortBy,
        p_page: currentPage,
        p_items_per_page: itemsPerPage
      });

      if (rpcError) {
        console.error("Erreur RPC:", rpcError);
        // Méthode de secours: charger séparément les données, mais de manière optimisée
        await loadDataLegacy();
        return;
      }

      if (rpcData) {
        // Mettre à jour les états en une seule fois pour éviter les rendus multiples
        const updates = {
          counts: {
            totalCount: rpcData.counts.total_count || 0,
            activeCount: rpcData.counts.active_count || 0,
            pendingCount: rpcData.counts.pending_count || 0,
            completedCount: rpcData.counts.completed_count || 0,
            cancelledCount: rpcData.counts.cancelled_count || 0
          },
          orders: rpcData.orders || [],
          totalCount: rpcData.counts.filtered_count || 0
        };
        
        // Batch update pour minimiser les rendus
        setCounts(updates.counts);
        setOrders(updates.orders);
        setTotalCount(updates.totalCount);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      // Méthode de secours en cas d'exception
      await loadDataLegacy();
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, searchQuery, sortBy, currentPage, itemsPerPage, loadDataLegacy, setCounts, setOrders, setTotalCount, setLoading]);

  // Charger les données au montage et quand les dépendances changent
  useEffect(() => {
    if (user) {
      loadOrdersData();
    }
  }, [loadOrdersData, user]);

  // Gérer le debounce pour la recherche
  useEffect(() => {
    // Stocker la valeur actuelle pour comparaison
    searchQueryRef.current = searchQuery;
    
    // Annuler le timer précédent
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }
    
    // Configurer un nouveau timer
    debouncedSearchRef.current = setTimeout(() => {
      if (searchQueryRef.current === searchQuery) {
        loadOrdersData();
      }
    }, 300);
    
    return () => {
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }
    };
  }, [searchQuery, loadOrdersData]);

  // Handler pour la recherche avec reset de pagination
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Réinitialiser la pagination
  }, []);

  // Handler pour le changement d'onglet
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Réinitialiser la pagination
  }, []);

  // Handler pour le changement de tri
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Réinitialiser la pagination
  }, []);

  // Gérer le changement de page
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Faire défiler vers le haut
    window.scrollTo(0, 0);
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
  const titleClasses = "text-[10px] sm:text-xs md:text-[10px] lg:text-[11px] text-slate-800 dark:text-vynal-text-primary";
  const subtitleClasses = "text-slate-600 dark:text-vynal-text-secondary";
  const buttonClasses = "text-[8px] sm:text-[8px] text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100/40 dark:hover:bg-slate-700/40 transition-colors";
  const countClasses = "text-[8px] sm:text-[8px] text-slate-600 dark:text-vynal-text-secondary hover:text-white dark:hover:text-white transition-colors";

  // Éviter les cascades d'affichage avec un rendu conditionnel optimisé
  const renderOrdersList = useCallback(() => {
    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="rounded-full bg-slate-100/20 dark:bg-slate-800/20 p-3 mb-2">
            <ShoppingBag className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-slate-800 dark:text-vynal-text-primary">Aucune commande</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-vynal-text-secondary max-w-sm">
            Vous n'avez pas encore de commandes. Trouvez un service pour commencer.
          </p>
          <Button size="sm" className="mt-3" asChild>
            <Link href="/services">Trouver un service</Link>
          </Button>
        </div>
      );
    }

    // Utiliser un Fragment pour minimiser les éléments DOM
    return (
      <Fragment>
        {orders.map((order) => (
          <Link href={`/client-dashboard/orders/${order.id}`} key={order.id} className="block mb-3">
            <div className={`p-3 ${innerCardClasses} hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className={`text-[10px] sm:text-[10px] ${titleClasses}`}>
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
              <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                  <span className="text-[8px] sm:text-[8px] text-slate-500 dark:text-vynal-text-secondary"></span>
                  <span className={`${countClasses} font-bold`}>
                    <CurrencyDisplay amount={Math.round(order.price)} displayFullName={true} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {totalCount > itemsPerPage && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / itemsPerPage)}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Fragment>
    );
  }, [orders, totalCount, currentPage, itemsPerPage, innerCardClasses, titleClasses, subtitleClasses, countClasses, getStatusBadgeClasses, getStatusText, handlePageChange]);

  if (authLoading || loading) {
    return <ClientDashboardPageSkeleton />;
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className={`text-base sm:text-lg md:text-2xl font-bold ${titleClasses} flex items-center`}>
            <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
            Mes Commandes
          </h1>
          <p className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
            Gérez et suivez toutes vos commandes
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/client-dashboard">
            <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Tableau de bord
            </Button>
          </Link>
          <Link href="/services">
            <Button className="bg-vynal-accent-primary/90 hover:bg-vynal-accent-primary text-white text-[10px] sm:text-xs shadow-sm transition-all duration-200">
              Explorer les services
            </Button>
          </Link>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Rechercher une commande..."
              className="pl-7 h-8 text-[10px] sm:text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30 text-slate-800 dark:text-vynal-text-primary focus:ring-1 focus:ring-slate-300/50 dark:focus:ring-slate-600/50 w-full"
            />
          </div>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-8 w-full sm:w-auto text-[10px] sm:text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30">
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
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-slate-100/70 dark:bg-slate-800/20 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/20 w-full flex flex-nowrap overflow-x-auto scrollbar-hide">
            <TabsTrigger 
              value="all"
              className="flex-none whitespace-nowrap data-[state=active]:bg-vynal-accent-primary/30 data-[state=active]:text-vynal-accent-primary dark:data-[state=active]:bg-vynal-accent-primary/5 dark:data-[state=active]:text-vynal-accent-primary/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 hover:bg-vynal-accent-primary/10"
            >
              Tous
              <Badge className="ml-2 bg-vynal-accent-primary/20 text-vynal-accent-primary border border-vynal-accent-primary/30 text-[8px] hover:bg-vynal-accent-primary/30">
                {counts.totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="flex-none whitespace-nowrap data-[state=active]:bg-amber-500/30 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-500/5 dark:data-[state=active]:text-amber-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-500/10"
            >
              En cours
              <Badge className="ml-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[8px] hover:bg-amber-500/30">
                {counts.activeCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="flex-none whitespace-nowrap data-[state=active]:bg-slate-500/30 data-[state=active]:text-slate-600 dark:data-[state=active]:bg-slate-500/5 dark:data-[state=active]:text-slate-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-500/10"
            >
              En attente
              <Badge className="ml-2 bg-slate-500/20 text-slate-500 border border-slate-500/30 text-[8px] hover:bg-slate-500/30">
                {counts.pendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="flex-none whitespace-nowrap data-[state=active]:bg-emerald-500/30 data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-emerald-500/5 dark:data-[state=active]:text-emerald-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10"
            >
              Terminées
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[8px] hover:bg-emerald-500/30">
                {counts.completedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled"
              className="flex-none whitespace-nowrap data-[state=active]:bg-red-500/30 data-[state=active]:text-red-600 dark:data-[state=active]:bg-red-500/5 dark:data-[state=active]:text-red-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 hover:bg-red-500/10"
            >
              Annulées
              <Badge className="ml-2 bg-red-500/20 text-red-500 border border-red-500/30 text-[8px] hover:bg-red-500/30">
                {counts.cancelledCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="m-0">
            <div className="space-y-3">
              {renderOrdersList()}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="m-0">
            <div className="space-y-3">
              {renderOrdersList()}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="m-0">
            <div className="space-y-3">
              {renderOrdersList()}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="m-0">
            <div className="space-y-3">
              {renderOrdersList()}
            </div>
          </TabsContent>

          <TabsContent value="active" className="m-0">
            <div className="space-y-3">
              {renderOrdersList()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}