"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DisputeCard from "@/components/disputes/DisputeCard";
import { useUser } from "@/hooks/useUser";
import { 
  Search, AlertTriangle, Loader2, ArrowDownUp, RefreshCw, 
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Filter, X 
} from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDisputes, DisputeSortOption } from "@/hooks/useDisputes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

  // Effectuer une recherche (optimisé)
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(tempSearchQuery);
  }, [tempSearchQuery, setSearch]);
  
  // Gestion de la modification du champ de recherche
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempSearchQuery(e.target.value);
  }, []);
  
  // Effacer la recherche
  const handleClearSearch = useCallback(() => {
    setTempSearchQuery("");
    setSearch("");
  }, [setSearch]);

  // Optimisation : mémoriser les tableaux de correspondance pour éviter les re-rendus inutiles
  const tabLabels = useMemo(() => ({
    all: "Tous",
    open: "En cours",
    resolved: "Résolus",
    closed: "Fermés"
  }), []);
  
  const sortOptionLabels = useMemo(() => ({
    newest: "Plus récent d'abord",
    oldest: "Plus ancien d'abord",
    status: "Par statut"
  }), []);
  
  // Mémoiser le contenu des cartes de statistiques
  const StatsCards = useMemo(() => {
    const statCards = [
      {
        title: "Total des litiges",
        value: stats.totalCount,
        icon: <AlertTriangle className="h-5 w-5 text-indigo-500" strokeWidth={2.5} />,
        bgColor: "bg-indigo-50",
        className: "border-indigo-100"
      },
      {
        title: "Litiges en cours",
        value: stats.openCount,
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={2.5} />,
        bgColor: "bg-amber-50",
        className: "border-amber-100"
      },
      {
        title: "Litiges résolus",
        value: stats.resolvedCount,
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />,
        bgColor: "bg-emerald-50",
        className: "border-emerald-100"
      },
      {
        title: "Litiges fermés",
        value: stats.closedCount,
        icon: <XCircle className="h-5 w-5 text-slate-500" strokeWidth={2.5} />,
        bgColor: "bg-slate-50",
        className: "border-slate-100"
      }
    ];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={cn("bg-white shadow-sm hover:shadow-md transition-shadow dark:bg-vynal-purple-dark/30 dark:border-vynal-purple-secondary/30", card.className)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-vynal-text-secondary">{card.title}</p>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-vynal-text-primary mt-1">
                      {loading ? (
                        <div className="animate-pulse w-8 h-6 bg-vynal-purple-secondary/30 rounded"></div>
                      ) : (
                        card.value
                      )}
                    </h2>
                  </div>
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", card.bgColor, {
                    "dark:bg-vynal-accent-secondary/20": card.bgColor.includes("emerald") || card.bgColor.includes("amber"),
                    "dark:bg-vynal-purple-secondary/20": card.bgColor.includes("slate") || card.bgColor.includes("indigo")
                  })}>
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }, [stats, loading]);
  
  // Pagination mémorisée
  const Pagination = useMemo(() => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center mt-6 space-x-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 flex items-center justify-center rounded-md"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </Button>
        
        {/* Page buttons - optimisé pour afficher un nombre limité de pages */}
        {(() => {
          const pageButtons = [];
          const maxVisiblePages = 5;
          
          let startPage = 1;
          let endPage = totalPages;
          
          if (totalPages > maxVisiblePages) {
            const halfMax = Math.floor(maxVisiblePages / 2);
            
            if (currentPage <= halfMax + 1) {
              // Début de la pagination
              endPage = maxVisiblePages;
            } else if (currentPage >= totalPages - halfMax) {
              // Fin de la pagination
              startPage = totalPages - maxVisiblePages + 1;
            } else {
              // Milieu de la pagination
              startPage = currentPage - halfMax;
              endPage = currentPage + halfMax;
            }
          }
          
          // Ajouter la première page si nécessaire
          if (startPage > 1) {
            pageButtons.push(
              <Button
                key="page-1"
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(1)}
                className="h-8 w-8 p-0 text-xs"
              >
                1
              </Button>
            );
            
            // Ajouter des pointillés si nécessaire
            if (startPage > 2) {
              pageButtons.push(
                <span key="ellipsis-start" className="text-slate-400">...</span>
              );
            }
          }
          
          // Ajouter les pages principales
          for (let i = startPage; i <= endPage; i++) {
            pageButtons.push(
              <Button
                key={`page-${i}`}
                variant={currentPage === i ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(i)}
                className="h-8 w-8 p-0 text-xs"
              >
                {i}
              </Button>
            );
          }
          
          // Ajouter la dernière page si nécessaire
          if (endPage < totalPages) {
            // Ajouter des pointillés si nécessaire
            if (endPage < totalPages - 1) {
              pageButtons.push(
                <span key="ellipsis-end" className="text-slate-400">...</span>
              );
            }
            
            pageButtons.push(
              <Button
                key={`page-${totalPages}`}
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(totalPages)}
                className="h-8 w-8 p-0 text-xs"
              >
                {totalPages}
              </Button>
            );
          }
          
          return pageButtons;
        })()}
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 flex items-center justify-center rounded-md"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </Button>
      </div>
    );
  }, [currentPage, totalPages, goToPage, goToPreviousPage, goToNextPage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <motion.h1 
          className="text-xl font-bold text-slate-800 hidden sm:block"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Gestion des litiges
        </motion.h1>
        
        <motion.div 
          className="flex items-center gap-2 ml-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={refreshDisputes}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex gap-1 items-center text-xs text-slate-600 hover:text-indigo-600 border-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          
          <div className="text-xs text-slate-400">
            {getLastRefreshText()}
          </div>
        </motion.div>
      </div>

      {StatsCards}

      <Card className="bg-white border border-slate-200 shadow-sm dark:bg-vynal-purple-dark/30 dark:border-vynal-purple-secondary/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-vynal-text-primary">
              Liste des litiges
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-vynal-text-secondary/70" strokeWidth={2.5} />
                <Input
                  type="text"
                  placeholder="Rechercher un litige..."
                  className="pl-9 pr-9 bg-white border-slate-200 w-full sm:w-[200px] text-sm text-slate-800 dark:bg-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-primary dark:placeholder:text-vynal-text-secondary/50"
                  value={tempSearchQuery}
                  onChange={handleSearchChange}
                />
                {tempSearchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-vynal-text-secondary/70 dark:hover:text-vynal-text-primary"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                )}
              </form>
              
              <Select
                value={sortOption}
                onValueChange={(value) => changeSortOption(value as DisputeSortOption)}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 dark:bg-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-primary">
                  <div className="flex items-center">
                    <ArrowDownUp className="mr-2 h-3.5 w-3.5 text-slate-500 dark:text-vynal-text-secondary" strokeWidth={2.5} />
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
            <TabsList className="w-full max-w-3xl overflow-x-auto scrollbar-hide mb-4 bg-slate-50 dark:bg-vynal-purple-secondary/10">
              {Object.entries(tabLabels).map(([value, label]) => (
                <TabsTrigger 
                  key={value} 
                  value={value} 
                  className="text-xs sm:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm 
                    data-[state=active]:text-vynal-accent-primary dark:data-[state=active]:text-vynal-accent-primary
                    data-[state=active]:border-b-2 data-[state=active]:border-vynal-accent-primary
                    dark:data-[state=active]:bg-vynal-purple-dark dark:text-vynal-text-secondary"
                >
                  {label}
                  {value !== "all" && (
                    <span className="ml-1.5 bg-slate-100 text-slate-700 py-0.5 px-1.5 rounded-full text-[10px] dark:bg-vynal-purple-secondary/20 dark:text-vynal-text-secondary">
                      {value === "open" 
                        ? stats.openCount 
                        : value === "resolved" 
                          ? stats.resolvedCount 
                          : stats.closedCount}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <CardContent>
            <AnimatePresence mode="wait">
              <TabsContent value={activeTab} className="mt-0">
                {loading && !initialLoadComplete ? (
                  <motion.div 
                    className="flex justify-center items-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full absolute inset-0 bg-indigo-100 animate-ping opacity-25"></div>
                        <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin"></div>
                      </div>
                      <p className="text-sm text-slate-500">Chargement des litiges...</p>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    className="flex flex-col items-center justify-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="h-8 w-8 text-red-500" strokeWidth={2} />
                    </div>
                    <div className="text-slate-600 text-center max-w-md">
                      <p className="font-medium mb-2">{error}</p>
                      <p className="text-sm text-slate-500 mb-4">
                        Nous n'avons pas pu charger vos litiges. Veuillez réessayer.
                      </p>
                    </div>
                    <Button 
                      onClick={refreshDisputes} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" strokeWidth={2.5} /> Réessayer
                    </Button>
                  </motion.div>
                ) : currentDisputes.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {currentDisputes.map((dispute, index) => (
                        <motion.div 
                          key={dispute.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <DisputeCard dispute={dispute} isClient={!!isClient} />
                        </motion.div>
                      ))}
                    </div>
                    
                    {Pagination}
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center justify-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 dark:bg-vynal-purple-secondary/20">
                      <Filter className="h-8 w-8 text-slate-400 dark:text-vynal-text-secondary" strokeWidth={2} />
                    </div>
                    <div className="text-slate-600 text-center dark:text-vynal-text-primary">
                      <p className="font-medium text-sm mb-1">
                        {tempSearchQuery 
                          ? "Aucun litige trouvé correspondant à votre recherche" 
                          : "Vous n'avez pas de litiges pour le moment"}
                      </p>
                      <p className="text-xs text-slate-500 mb-4 dark:text-vynal-text-secondary">
                        {tempSearchQuery 
                          ? "Essayez avec d'autres termes ou effacez votre recherche" 
                          : "Les litiges apparaîtront ici lorsque vous en aurez"}
                      </p>
                    </div>
                    {tempSearchQuery ? (
                      <Button 
                        onClick={handleClearSearch} 
                        variant="outline"
                        className="border-slate-200 dark:border-vynal-purple-secondary/30"
                      >
                        <X className="h-4 w-4 mr-2" strokeWidth={2.5} /> Effacer la recherche
                      </Button>
                    ) : (
                      <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/dashboard">Retour au tableau de bord</Link>
                      </Button>
                    )}
                  </motion.div>
                )}
              </TabsContent>
            </AnimatePresence>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}