"use client";

import React, { useState, useCallback, memo, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/orders/OrderCard";
import { Search, Filter, ShoppingBag, Clock, CheckCircle, BarChart, ChevronLeft, ChevronRight, RefreshCcw, AlertTriangle, Archive } from 'lucide-react';
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useOrders, TabValue } from "@/hooks/useOrders";
import { OrdersPageSkeleton } from "@/components/skeletons/OrdersPageSkeleton";
import { Badge } from "@/components/ui/badge";

// Optimisé et mémoizé: Composant pour afficher une statistique dans une carte
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  bgColor, 
  textColor, 
  loading 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  bgColor: string; 
  textColor: string; 
  loading: boolean;
}) => (
  <Card className="h-full overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-primary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
    <CardContent className="p-3 sm:p-4 md:p-5 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">{title}</p>
          <h2 className="text-sm sm:text-base font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
            {loading ? "..." : value}
          </h2>
        </div>
        <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${textColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// Composant de recherche optimisé
const SearchBar = memo(({ 
  tempQuery, 
  setTempQuery, 
  onSearch 
}: { 
  tempQuery: string; 
  setTempQuery: (query: string) => void; 
  onSearch: (e: React.FormEvent) => void; 
}) => (
  <form onSubmit={onSearch} className="relative">
    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
    <Input
      type="text"
      placeholder="Rechercher une commande..."
      className="pl-8 bg-white dark:bg-vynal-purple-dark/50 border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 w-full sm:w-[250px] text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary"
      value={tempQuery}
      onChange={(e) => setTempQuery(e.target.value)}
    />
  </form>
));

SearchBar.displayName = 'SearchBar';

// Composant pour l'en-tête de la page
const PageHeader = memo(({ 
  isFreelance, 
  isRefreshing, 
  refreshOrders, 
  getLastRefreshText 
}: { 
  isFreelance: boolean; 
  isRefreshing: boolean; 
  refreshOrders: () => void; 
  getLastRefreshText: () => string;
}) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-base sm:text-lg md:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
        Mes commandes
      </h1>
      <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
        {isFreelance 
          ? "Gérez les commandes de vos services" 
          : "Suivez les commandes de services que vous avez passées"}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button
        onClick={refreshOrders}
        variant="ghost"
        size="sm"
        disabled={isRefreshing}
        className="flex items-center gap-1.5 text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary hover:text-vynal-accent-secondary dark:hover:text-vynal-accent-primary transition-colors"
      >
        <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>Actualiser</span>
      </Button>
      <div className="text-[10px] text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">
        {getLastRefreshText()}
      </div>
    </div>
  </div>
));

PageHeader.displayName = 'PageHeader';

// Composant optimisé pour les statistiques
const StatsOverview = memo(({ stats, loading }: { stats: any; loading: boolean }) => {
  // Configuration des stats cards
  const statsConfig = [
    {
      title: "Total des commandes",
      value: stats.totalCount,
      icon: ShoppingBag,
      bgColor: "bg-vynal-purple-light/10",
      textColor: "text-vynal-purple-light dark:text-vynal-accent-primary"
    },
    {
      title: "Commandes actives",
      value: stats.activeOrders,
      icon: Clock,
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      textColor: "text-blue-500 dark:text-blue-400"
    },
    {
      title: "Commandes terminées",
      value: stats.completedOrders,
      icon: CheckCircle,
      bgColor: "bg-green-100 dark:bg-green-900/20",
      textColor: "text-green-500 dark:text-green-400"
    },
    {
      title: "Valeur totale",
      value: formatPrice(stats.totalValue),
      icon: BarChart,
      bgColor: "bg-purple-100 dark:bg-vynal-purple-secondary/20",
      textColor: "text-vynal-accent-secondary dark:text-vynal-accent-primary"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          bgColor={stat.bgColor}
          textColor={stat.textColor}
          loading={loading}
        />
      ))}
    </div>
  );
});

StatsOverview.displayName = 'StatsOverview';

// Composant pour la pagination
const Pagination = memo(({ 
  currentPage, 
  totalPages, 
  goToPage, 
  goToNextPage, 
  goToPreviousPage 
}: { 
  currentPage: number; 
  totalPages: number; 
  goToPage: (page: number) => void; 
  goToNextPage: () => void; 
  goToPreviousPage: () => void;
}) => {
  // Calculer les pages à afficher
  const pageNumbers = useMemo(() => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && startPage > 1) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center mt-6 space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0 flex items-center justify-center"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map(pageNum => (
        <Button
          key={`page-${pageNum}`}
          variant={currentPage === pageNum ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(pageNum)}
          className="h-8 w-8 p-0"
        >
          {pageNum}
        </Button>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0 flex items-center justify-center"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
});

Pagination.displayName = 'Pagination';

// Composant pour le statut de chargement
const LoadingState = memo(() => (
  <div className="flex justify-center items-center py-16">
    <div className="flex flex-col items-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vynal-accent-secondary"></div>
      <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Chargement des commandes...</p>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

// Composant pour l'état vide (aucune commande)
const EmptyState = memo(({ 
  searchQuery, 
  isFreelance 
}: { 
  searchQuery: string; 
  isFreelance: boolean;
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="rounded-full bg-vynal-purple-secondary/10 p-4 mb-4">
      {searchQuery ? (
        <Search className="h-6 w-6 text-vynal-purple-secondary" />
      ) : isFreelance ? (
        <Archive className="h-6 w-6 text-vynal-purple-secondary" />
      ) : (
        <ShoppingBag className="h-6 w-6 text-vynal-purple-secondary" />
      )}
    </div>
    <div className="text-center max-w-md mb-4">
      <h3 className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">
        {searchQuery 
          ? "Aucune commande trouvée" 
          : isFreelance 
            ? "Pas encore de commandes" 
            : "Vous n'avez pas encore passé de commande"}
      </h3>
      <p className="text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
        {searchQuery 
          ? "Essayez de modifier vos critères de recherche" 
          : isFreelance 
            ? "Vous n'avez pas encore reçu de commandes pour vos services" 
            : "Découvrez les services disponibles et passez votre première commande"}
      </p>
    </div>
    {!searchQuery && !isFreelance && (
      <Button asChild className="mt-2" size="sm">
        <Link href="/services">Explorer les services</Link>
      </Button>
    )}
  </div>
));

EmptyState.displayName = 'EmptyState';

// Composant pour la liste d'onglets de statuts
const StatusTabs = memo(({ 
  activeTab, 
  onValueChange,
  statusCounts
}: { 
  activeTab: string; 
  onValueChange: (value: string) => void;
  statusCounts: Record<string, number>;
}) => {
  // Configuration des onglets
  const tabs = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: 'En attente' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'revision_requested', label: 'Révision' },
    { value: 'delivered', label: 'Livrées' },
    { value: 'completed', label: 'Terminées' }
  ];

  return (
    <div className="flex justify-center w-full">
      <TabsList className="w-auto max-w-3xl overflow-x-auto scrollbar-hide mb-4 bg-white dark:bg-vynal-purple-dark/50 p-1">
        {tabs.map(tab => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value} 
            className="text-[10px] sm:text-xs font-medium px-3 py-1.5 relative text-vynal-purple-dark dark:text-vynal-text-primary data-[state=active]:text-vynal-accent-primary dark:data-[state=active]:text-vynal-accent-primary"
          >
            {tab.label}
            {statusCounts[tab.value] > 0 && tab.value !== 'all' && (
              <Badge 
                variant="secondary" 
                className="ml-1.5 h-4 min-w-4 text-[9px] bg-vynal-accent-primary text-white px-1 absolute -top-1 -right-1 rounded-full"
              >
                {statusCounts[tab.value]}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
});

StatusTabs.displayName = 'StatusTabs';

// Composant pour afficher la liste des commandes
const OrdersList = memo(({ 
  orders, 
  loading, 
  searchQuery, 
  isFreelance, 
  currentPage, 
  totalPages, 
  goToPage, 
  goToNextPage, 
  goToPreviousPage 
}: { 
  orders: any[]; 
  loading: boolean; 
  searchQuery: string; 
  isFreelance: boolean;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}) => {
  if (loading) {
    return <LoadingState />;
  }

  if (orders.length === 0) {
    return <EmptyState searchQuery={searchQuery} isFreelance={isFreelance} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        goToPage={goToPage} 
        goToNextPage={goToNextPage} 
        goToPreviousPage={goToPreviousPage} 
      />
    </div>
  );
});

OrdersList.displayName = 'OrdersList';

// Composant principal
export default function OrdersPage() {
  const { isFreelance } = useUser();
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  
  const { 
    orders,
    loading,
    isRefreshing,
    activeTab,
    searchQuery,
    currentPage,
    totalCount,
    itemsPerPage,
    stats,
    statusLabels,
    setTab,
    setSearch,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    refreshOrders,
    getLastRefreshText
  } = useOrders({
    initialTab: 'all',
    itemsPerPage: 9,
    useCache: true
  });

  // Écouter les événements d'invalidation du cache
  useEffect(() => {
    // Fonction pour rafraîchir les données en cas d'invalidation du cache
    const handleCacheInvalidated = () => {
      refreshOrders();
    };
    
    // S'abonner aux événements d'invalidation spécifiques aux commandes freelance
    window.addEventListener('vynal:freelance-orders-updated', handleCacheInvalidated);
    window.addEventListener('vynal:freelance-cache-invalidated', handleCacheInvalidated);
    
    // Nettoyer lors du démontage
    return () => {
      window.removeEventListener('vynal:freelance-orders-updated', handleCacheInvalidated);
      window.removeEventListener('vynal:freelance-cache-invalidated', handleCacheInvalidated);
    };
  }, [refreshOrders]);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Créer un objet avec le nombre de commandes par statut
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: totalCount };
    
    // Mappage sécurisé des statuts vers les propriétés de stats
    const statusToStatsMap: Record<string, keyof typeof stats> = {
      'pending': 'activeOrders',
      'in_progress': 'activeOrders',
      'revision_requested': 'activeOrders',
      'delivered': 'pendingDelivery',
      'completed': 'completedOrders',
      'cancelled': 'totalCount'
    };
    
    Object.keys(statusLabels).forEach(status => {
      counts[status] = status in statusToStatsMap ? stats[statusToStatsMap[status]] : 0;
    });
    
    return counts;
  }, [stats, statusLabels, totalCount]);

  // Effectuer une recherche
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(tempSearchQuery);
  }, [tempSearchQuery, setSearch]);

  // Display the skeleton loading state during initial loading
  if (loading && !isRefreshing) {
    return <OrdersPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* En-tête de la page */}
      <PageHeader 
        isFreelance={isFreelance}
        isRefreshing={isRefreshing}
        refreshOrders={refreshOrders}
        getLastRefreshText={getLastRefreshText}
      />

      {/* Vue d'ensemble des statistiques */}
      <StatsOverview stats={stats} loading={loading} />

      {/* Section principale des commandes */}
      <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-purple-secondary/10 before:via-vynal-purple-secondary/5 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/10 dark:before:from-vynal-purple-secondary/15 dark:before:via-vynal-purple-secondary/5 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
        <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6 relative z-10">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">Liste des commandes</CardTitle>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
                {isFreelance ? "Gérez les commandes de vos clients" : "Suivez l'état de vos commandes"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <SearchBar 
                tempQuery={tempSearchQuery} 
                setTempQuery={setTempSearchQuery}
                onSearch={handleSearch}
              />
              
              <Button variant="outline" size="icon" disabled className="h-8 w-8">
                <Filter className="h-3.5 w-3.5 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <Tabs 
          value={activeTab} 
          defaultValue={activeTab} 
          className="w-full"
          onValueChange={(value) => setTab(value as TabValue)}
        >
          <div className="px-3 sm:px-6">
            <StatusTabs 
              activeTab={activeTab} 
              onValueChange={(value) => setTab(value as TabValue)}
              statusCounts={statusCounts}
            />
          </div>
          <CardContent className="p-0 sm:p-0">
            <TabsContent value={activeTab} className="mt-0 p-3 sm:p-6">
              <OrdersList 
                orders={orders}
                loading={loading}
                searchQuery={searchQuery}
                isFreelance={isFreelance}
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
                goToNextPage={goToNextPage}
                goToPreviousPage={goToPreviousPage}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}