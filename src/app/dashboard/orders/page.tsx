"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/orders/OrderCard";
import { Search, Filter, ShoppingBag, Clock, CheckCircle, BarChart, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useOrders } from "@/hooks/useOrders";
import { OrdersPageSkeleton } from "@/components/skeletons/OrdersPageSkeleton";

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

  // Display the skeleton loading state
  if (loading && !isRefreshing) {
    return <OrdersPageSkeleton />;
  }

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Effectuer une recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(tempSearchQuery);
  };

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 pb-8 sm:pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
              Mes commandes
            </h1>
            <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
              {isFreelance 
                ? "Gérez les commandes de vos services" 
                : "Suivez les commandes de services que vous avez passées"}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={refreshOrders}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex gap-1 items-center text-xs text-vynal-purple-secondary hover:text-vynal-accent-secondary dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            
            <div className="text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">
              {getLastRefreshText()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-white dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-vynal-purple-secondary dark:text-vynal-text-secondary">Total des commandes</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
                    {loading ? "..." : stats.totalCount}
                  </h2>
                </div>
                <div className="h-10 w-10 rounded-lg bg-vynal-purple-light/10 flex items-center justify-center dark:bg-vynal-purple-secondary/20">
                  <ShoppingBag className="h-5 w-5 text-vynal-purple-light dark:text-vynal-accent-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-vynal-purple-secondary dark:text-vynal-text-secondary">Commandes actives</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
                    {loading ? "..." : stats.activeOrders}
                  </h2>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center dark:bg-blue-900/20">
                  <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-vynal-purple-secondary dark:text-vynal-text-secondary">Commandes terminées</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
                    {loading ? "..." : stats.completedOrders}
                  </h2>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center dark:bg-green-900/20">
                  <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-vynal-purple-secondary dark:text-vynal-text-secondary">Valeur totale</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
                    {loading ? "..." : formatPrice(stats.totalValue)}
                  </h2>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center dark:bg-vynal-purple-secondary/20">
                  <BarChart className="h-5 w-5 text-vynal-accent-secondary dark:text-vynal-accent-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border border-gray-100 dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <CardTitle className="text-lg sm:text-xl text-vynal-purple-light dark:text-vynal-text-primary">
                Liste des commandes
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-8 bg-white dark:bg-vynal-purple-dark/50 border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 w-full sm:w-[200px] text-sm text-vynal-purple-dark dark:text-vynal-text-primary"
                    value={tempSearchQuery}
                    onChange={(e) => setTempSearchQuery(e.target.value)}
                  />
                </form>
                
                <Button variant="outline" size="icon" disabled>
                  <Filter className="h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={(value) => setTab(value as typeof activeTab)}>
            <div className="px-4 sm:px-6">
              <TabsList className="w-full max-w-3xl overflow-x-auto scrollbar-hide mb-4 bg-white dark:bg-vynal-purple-dark/50">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  Toutes
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm">
                  En attente
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
                  En cours
                </TabsTrigger>
                <TabsTrigger value="revision_requested" className="text-xs sm:text-sm">
                  Révision
                </TabsTrigger>
                <TabsTrigger value="delivered" className="text-xs sm:text-sm">
                  Livrées
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm">
                  Terminées
                </TabsTrigger>
              </TabsList>
            </div>
            <CardContent>
              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vynal-accent-secondary"></div>
                      <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Chargement des commandes...</p>
                    </div>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
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
                        
                        {/* Page buttons */}
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          // Calculate which page numbers to show
                          let pageNum = i + 1;
                          if (totalPages > 5 && currentPage > 3) {
                            pageNum = Math.min(currentPage - 3 + i, totalPages);
                            if (pageNum > totalPages - 4 && i < 4) {
                              pageNum = totalPages - 4 + i;
                            }
                          }
                          
                          return (
                            <Button
                              key={`page-${pageNum}`}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
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
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-vynal-purple-secondary dark:text-vynal-text-secondary">
                      {searchQuery 
                        ? "Aucune commande trouvée correspondant à votre recherche" 
                        : isFreelance 
                          ? "Vous n'avez pas encore de commandes pour vos services" 
                          : "Vous n'avez pas encore passé de commande"}
                    </div>
                    {!searchQuery && !isFreelance && (
                      <Button asChild className="mt-4">
                        <Link href="/services">Explorer les services</Link>
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 