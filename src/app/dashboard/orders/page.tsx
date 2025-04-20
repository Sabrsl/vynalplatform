"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/orders/OrderCard";
import { useAuth } from "@/hooks/useAuth";
import { Search, Filter, ShoppingBag, Clock, CheckCircle, HistoryIcon, AlertCircle, BarChart, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Type definition for order status
type OrderStatus = "pending" | "in_progress" | "completed" | "delivered" | "revision_requested" | "cancelled";

// Type for tab values
type TabValue = OrderStatus | "all";

// Type definition for order objects
type Order = {
  id: string;
  created_at: string;
  status: OrderStatus;
  service: {
    id: string;
    title: string;
    price: number;
  };
  freelance: {
    id: string;
    username: string;
    full_name: string;
  };
  client: {
    id: string;
    username: string;
    full_name: string;
  };
  is_client_view: boolean;
};

// Données fictives pour la démo
const MOCK_ORDERS_CLIENT: Order[] = [
  {
    id: "order-1",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_progress" as const,
    service: {
      id: "service-1",
      title: "Création d'un logo professionnel",
      price: 150,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
    },
    is_client_view: true,
  },
  {
    id: "order-2",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "delivered" as const,
    service: {
      id: "service-2",
      title: "Rédaction d'un article SEO optimisé",
      price: 85,
    },
    freelance: {
      id: "freelance-2",
      username: "contentwizard",
      full_name: "Lucas Bernard",
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
    },
    is_client_view: true,
  },
  {
    id: "order-3",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed" as const,
    service: {
      id: "service-3",
      title: "Développement d'une landing page responsive",
      price: 350,
    },
    freelance: {
      id: "freelance-3",
      username: "webdev",
      full_name: "Sophie Moreau",
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
    },
    is_client_view: true,
  },
];

const MOCK_ORDERS_FREELANCE: Order[] = [
  {
    id: "order-4",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending" as const,
    service: {
      id: "service-4",
      title: "Design d'interface pour application mobile",
      price: 250,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-2",
      username: "entreprise_xyz",
      full_name: "Entreprise XYZ",
    },
    is_client_view: false,
  },
  {
    id: "order-5",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_progress" as const,
    service: {
      id: "service-5",
      title: "Création d'identité visuelle complète",
      price: 500,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-3",
      username: "startup_abc",
      full_name: "Startup ABC",
    },
    is_client_view: false,
  },
  {
    id: "order-6",
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: "revision_requested" as const,
    service: {
      id: "service-6",
      title: "Conception de mascotte de marque",
      price: 300,
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
    },
    client: {
      id: "client-4",
      username: "boutique_locale",
      full_name: "Boutique Locale",
    },
    is_client_view: false,
  },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 9;
  
  const isFreelance = user?.user_metadata?.role === "freelance";
  
  // Utiliser les données appropriées selon le rôle de l'utilisateur
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(
    isFreelance ? MOCK_ORDERS_FREELANCE : MOCK_ORDERS_CLIENT
  );

  // Pour la démo, ajoutons plus de commandes fictives
  const generateMoreMockOrders = (baseOrders: Order[], count: number): Order[] => {
    const result = [...baseOrders];
    
    for (let i = 0; i < count; i++) {
      const baseOrder = baseOrders[i % baseOrders.length];
      result.push({
        ...baseOrder,
        id: `${baseOrder.id}-${i + baseOrders.length}`,
        created_at: new Date(Date.now() - (i * 3 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }
    
    return result;
  };
  
  // Générer plus de commandes pour la démonstration de la pagination
  const extendedOrdersClient = generateMoreMockOrders(MOCK_ORDERS_CLIENT, 20);
  const extendedOrdersFreelance = generateMoreMockOrders(MOCK_ORDERS_FREELANCE, 15);
  
  // Statistiques des commandes
  const allOrders = isFreelance ? extendedOrdersFreelance : extendedOrdersClient;
  const activeOrders = allOrders.filter(o => o.status === 'in_progress' || o.status === 'pending' || o.status === 'revision_requested').length;
  const completedOrders = allOrders.filter(o => o.status === 'completed').length;
  const pendingDelivery = allOrders.filter(o => o.status === 'delivered').length;

  // Calculer le montant total des commandes
  const totalOrdersValue = allOrders.reduce((sum, order) => sum + order.service.price, 0);

  // Dans une vraie application, vous récupéreriez les commandes depuis l'API
  useEffect(() => {
    // Filtrer par statut
    let filtered: Order[] = isFreelance ? extendedOrdersFreelance : extendedOrdersClient;
    
    if (activeTab !== "all") {
      filtered = filtered.filter((order) => order.status === activeTab) as Order[];
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => 
        order.service.title.toLowerCase().includes(query) ||
        (isFreelance ? 
          order.client.full_name?.toLowerCase().includes(query) : 
          order.freelance.full_name?.toLowerCase().includes(query))
      ) as Order[];
    }
    
    setFilteredOrders(filtered);
    setCurrentPage(1); // Réinitialiser à la première page lors d'un changement de filtre
  }, [activeTab, searchQuery, isFreelance]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    in_progress: "bg-vynal-accent-secondary/10 text-vynal-accent-secondary border-vynal-accent-secondary/20",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    delivered: "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20",
    revision_requested: "bg-vynal-purple-secondary/10 text-vynal-purple-secondary border-vynal-purple-secondary/20",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  
  const statusLabels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    delivered: "Livrée",
    revision_requested: "Révision demandée",
    cancelled: "Annulée",
  };

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-8 pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary sm:hidden">
              {isFreelance ? "Commandes reçues" : "Mes commandes"}
            </h1>
            {!isFreelance && (
              <Button 
                size="sm" 
                className="text-xs sm:text-sm bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 text-white sm:ml-auto"
              >
                Découvrir des services
              </Button>
            )}
          </div>
          {isFreelance && (
            <p className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
              Gérez les commandes de vos clients et suivez leur progression
            </p>
          )}
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-primary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Commandes actives</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {activeOrders}
              </div>
              <div className="flex items-center mt-1">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary mr-1"></div>
                <p className="text-[10px] sm:text-xs text-vynal-accent-secondary dark:text-vynal-accent-primary truncate">
                  En cours
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border border-vynal-accent-secondary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-secondary/20 before:via-vynal-accent-secondary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-secondary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-secondary/40 to-vynal-accent-secondary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-secondary dark:text-vynal-accent-secondary" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Commandes terminées</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {completedOrders}
              </div>
              <div className="flex items-center mt-1">
                <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-accent-secondary/30 to-vynal-accent-secondary/20 text-vynal-accent-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-vynal-accent-secondary truncate">
                  Finalisées
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border border-vynal-purple-secondary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-purple-secondary/20 before:via-vynal-purple-secondary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-amber-400/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/40 to-vynal-purple-secondary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-amber-400" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">En attente de validation</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {pendingDelivery}
              </div>
              <div className="flex items-center mt-1">
                <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 text-vynal-purple-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-amber-400 truncate">
                  À valider
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-emerald-400/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <BarChart className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Montant total</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {totalOrdersValue}€
              </div>
              <div className="flex items-center mt-1">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary mr-1"></div>
                <p className="text-[10px] sm:text-xs text-vynal-accent-secondary dark:text-vynal-accent-primary truncate">
                  Commandes totales
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <Card className="md:col-span-2 border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/10">
            <CardContent className="p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-vynal-purple-secondary dark:text-vynal-accent-secondary/80" />
                <Input
                  placeholder="Rechercher une commande..."
                  className="pl-9 text-xs sm:text-sm h-9 sm:h-10 border-vynal-purple-secondary/20 focus-visible:ring-vynal-accent-primary dark:bg-vynal-purple-dark/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/10">
            <CardContent className="p-3 sm:p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-vynal-purple-secondary dark:text-vynal-accent-secondary/80" />
                <span className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Filtrer</span>
              </div>
              <Button 
                size="sm" 
                className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-secondary hover:border-vynal-accent-secondary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-accent-secondary"
                variant="outline"
              >
                Appliquer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="space-y-4"
        >
          <div className="overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="bg-white/80 dark:bg-vynal-purple-dark/20 border border-vynal-purple-secondary/10 p-1 rounded-lg inline-flex whitespace-nowrap w-max min-w-full">
              <TabsTrigger 
                value="all" 
                className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
              >
                Toutes
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
              >
                En attente
              </TabsTrigger>
              <TabsTrigger 
                value="in_progress"
                className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
              >
                En cours
              </TabsTrigger>
              <TabsTrigger 
                value="delivered"
                className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
              >
                Livrées
              </TabsTrigger>
              <TabsTrigger 
                value="revision_requested"
                className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
              >
                Révision
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
              >
                Terminées
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="space-y-4 m-0">
            {filteredOrders.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {currentOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={{
                        ...order,
                        is_client_view: !isFreelance
                      }}
                    />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 flex items-center justify-center border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Afficher seulement les pages proches de la page actuelle
                          const range = 1; // +/- 1 page
                          return (
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - range && page <= currentPage + range)
                          );
                        })
                        .map((page, index, array) => {
                          // Ajouter des points de suspension si nécessaire
                          if (index > 0 && array[index - 1] !== page - 1) {
                            return (
                              <React.Fragment key={`ellipsis-${page}`}>
                                <span className="text-vynal-purple-secondary/60 dark:text-vynal-text-secondary/60 text-xs px-1">...</span>
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => goToPage(page)}
                                  className={`h-8 w-8 p-0 text-xs ${
                                    currentPage === page 
                                      ? "bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white"
                                      : "border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                                  }`}
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            );
                          }
                          
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={`h-8 w-8 p-0 text-xs ${
                                currentPage === page 
                                  ? "bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white"
                                  : "border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                              }`}
                            >
                              {page}
                            </Button>
                          );
                        })
                      }
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 flex items-center justify-center border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
                <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 px-4 text-center">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 bg-vynal-accent-primary/10 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8 text-vynal-accent-primary dark:text-vynal-accent-secondary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-vynal-purple-light mb-1 dark:text-vynal-text-primary">Aucune commande trouvée</h3>
                  <p className="text-sm text-vynal-purple-secondary max-w-md mb-4 sm:mb-6 dark:text-vynal-text-secondary">
                    {isFreelance 
                      ? "Vous n'avez pas encore reçu de commandes correspondant à ces critères."
                      : "Vous n'avez pas encore passé de commandes correspondant à ces critères."}
                  </p>
                  {!isFreelance && (
                    <Button className="text-xs sm:text-sm h-8 sm:h-9 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 text-white">
                      Découvrir des services
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Les autres TabsContent pour chaque statut */}
          {["pending", "in_progress", "delivered", "revision_requested", "completed"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4 m-0">
              {filteredOrders.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {currentOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={{
                          ...order,
                          is_client_view: !isFreelance
                        }}
                      />
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 flex items-center justify-center border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Afficher seulement les pages proches de la page actuelle
                            const range = 1; // +/- 1 page
                            return (
                              page === 1 || 
                              page === totalPages || 
                              (page >= currentPage - range && page <= currentPage + range)
                            );
                          })
                          .map((page, index, array) => {
                            // Ajouter des points de suspension si nécessaire
                            if (index > 0 && array[index - 1] !== page - 1) {
                              return (
                                <React.Fragment key={`ellipsis-${page}`}>
                                  <span className="text-vynal-purple-secondary/60 dark:text-vynal-text-secondary/60 text-xs px-1">...</span>
                                  <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(page)}
                                    className={`h-8 w-8 p-0 text-xs ${
                                      currentPage === page 
                                        ? "bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white"
                                        : "border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                                    }`}
                                  >
                                    {page}
                                  </Button>
                                </React.Fragment>
                              );
                            }
                            
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(page)}
                                className={`h-8 w-8 p-0 text-xs ${
                                  currentPage === page 
                                    ? "bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white"
                                    : "border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                                }`}
                              >
                                {page}
                              </Button>
                            );
                          })
                        }
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 flex items-center justify-center border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:text-vynal-accent-primary hover:border-vynal-accent-primary/30 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-secondary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
                  <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 px-4 text-center">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-vynal-accent-primary/10 dark:bg-vynal-purple-secondary/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8 text-vynal-accent-primary dark:text-vynal-accent-secondary" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-vynal-purple-light mb-1 dark:text-vynal-text-primary">Aucune commande {statusLabels[status as OrderStatus].toLowerCase()}</h3>
                    <p className="text-sm text-vynal-purple-secondary max-w-md mb-4 sm:mb-6 dark:text-vynal-text-secondary">
                      Vous n'avez pas de commandes avec le statut "{statusLabels[status as OrderStatus].toLowerCase()}" pour le moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
} 