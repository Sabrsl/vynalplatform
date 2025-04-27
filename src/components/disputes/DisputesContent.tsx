"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisputeCard } from "@/components/disputes/DisputeCard";
import { useUser } from "@/hooks/useUser";
import { Search, AlertTriangle, Loader2, ArrowDownUp, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDisputes, DisputeSortOption } from "@/hooks/useDisputes";

export function DisputesContent() {
  const { isClient } = useUser();
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  
  const {
    disputes: currentDisputes,
    loading,
    isRefreshing,
    initialLoadComplete,
    error,
    activeTab,
    sortOption,
    currentPage,
    totalPages,
    stats,
    setTab,
    setSearch,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    changeSortOption,
    refreshDisputes,
    getLastRefreshText
  } = useDisputes({
    initialTab: 'all',
    itemsPerPage: 12,
    useCache: true,
    initialSortOption: 'newest'
  });

  // Effectuer une recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(tempSearchQuery);
  };
  
  // Tableau de correspondance pour les libellés des onglets
  const tabLabels = {
    all: "Tous",
    open: "En cours",
    resolved: "Résolus",
    closed: "Fermés"
  };
  
  // Tableau de correspondance pour les libellés des options de tri
  const sortOptionLabels = {
    newest: "Plus récent d'abord",
    oldest: "Plus ancien d'abord",
    status: "Par statut"
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button
          onClick={refreshDisputes}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="flex gap-1 items-center text-xs text-vynal-purple-secondary hover:text-vynal-accent-secondary dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </Button>
        
        <div className="text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">
          {getLastRefreshText()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="bg-white dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-vynal-purple-secondary dark:text-vynal-text-secondary">Total des litiges</p>
                <h2 className="text-xl sm:text-2xl font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
                  {loading ? "..." : stats.totalCount}
                </h2>
              </div>
              <div className="h-10 w-10 rounded-lg bg-vynal-purple-light/10 flex items-center justify-center dark:bg-vynal-purple-secondary/20">
                <AlertTriangle className="h-5 w-5 text-vynal-purple-light dark:text-vynal-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-vynal-purple-secondary dark:text-vynal-text-secondary">Litiges en cours</p>
                <h2 className="text-xl sm:text-2xl font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
                  {loading ? "..." : stats.openCount}
                </h2>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center dark:bg-orange-900/20">
                <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-vynal-purple-secondary dark:text-vynal-text-secondary">Litiges résolus</p>
                <h2 className="text-xl sm:text-2xl font-bold text-vynal-purple-dark dark:text-vynal-text-primary">
                  {loading ? "..." : stats.resolvedCount + stats.closedCount}
                </h2>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center dark:bg-green-900/20">
                <AlertTriangle className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-gray-100 dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <CardTitle className="text-lg sm:text-xl text-vynal-purple-light dark:text-vynal-text-primary">
              Liste des litiges
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
              
              <Select
                value={sortOption}
                onValueChange={(value) => changeSortOption(value as DisputeSortOption)}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-vynal-purple-dark/50 border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30">
                  <div className="flex items-center">
                    <ArrowDownUp className="mr-2 h-3.5 w-3.5 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                    <SelectValue placeholder="Trier par" className="text-sm" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-sm">{sortOptionLabels.newest}</SelectItem>
                  <SelectItem value="oldest" className="text-sm">{sortOptionLabels.oldest}</SelectItem>
                  <SelectItem value="status" className="text-sm">{sortOptionLabels.status}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={(value) => setTab(value as any)}>
          <div className="px-4 sm:px-6">
            <TabsList className="w-full max-w-3xl overflow-x-auto scrollbar-hide mb-4 bg-white dark:bg-vynal-purple-dark/50">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                {tabLabels.all}
              </TabsTrigger>
              <TabsTrigger value="open" className="text-xs sm:text-sm">
                {tabLabels.open}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="text-xs sm:text-sm">
                {tabLabels.resolved}
              </TabsTrigger>
              <TabsTrigger value="closed" className="text-xs sm:text-sm">
                {tabLabels.closed}
              </TabsTrigger>
            </TabsList>
          </div>
          <CardContent>
            <TabsContent value={activeTab} className="mt-0">
              {loading && !initialLoadComplete ? (
                <div className="flex justify-center items-center py-20">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vynal-accent-secondary"></div>
                    <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Chargement des litiges...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                  <div className="text-vynal-purple-secondary dark:text-vynal-text-secondary text-center">
                    {error}
                  </div>
                  <Button onClick={refreshDisputes} className="mt-4">
                    Réessayer
                  </Button>
                </div>
              ) : currentDisputes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {currentDisputes.map((dispute) => (
                    <DisputeCard key={dispute.id} dispute={dispute} isClient={!!isClient} />
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
                    {tempSearchQuery 
                      ? "Aucun litige trouvé correspondant à votre recherche" 
                      : "Vous n'avez pas de litiges pour le moment"}
                  </div>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard">Retour au tableau de bord</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </>
  );
} 