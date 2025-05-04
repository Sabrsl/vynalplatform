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
        icon: <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" strokeWidth={2.5} />,
        bgColor: "bg-indigo-100/50 dark:bg-indigo-900/20",
        textColor: "text-indigo-600 dark:text-indigo-400",
        subtitle: "Tous les litiges",
      },
      {
        title: "Litiges en cours",
        value: stats.openCount,
        icon: <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" strokeWidth={2.5} />,
        bgColor: "bg-amber-100/50 dark:bg-amber-900/20",
        textColor: "text-amber-600 dark:text-amber-400",
        subtitle: "En attente de résolution",
      },
      {
        title: "Litiges résolus",
        value: stats.resolvedCount,
        icon: <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" strokeWidth={2.5} />,
        bgColor: "bg-emerald-100/50 dark:bg-emerald-900/20",
        textColor: "text-emerald-600 dark:text-emerald-400",
        subtitle: "Traités avec succès",
      },
      {
        title: "Litiges fermés",
        value: stats.closedCount,
        icon: <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" strokeWidth={2.5} />,
        bgColor: "bg-slate-100/50 dark:bg-slate-900/20",
        textColor: "text-slate-600 dark:text-slate-400",
        subtitle: "Sans résolution",
      }
    ];
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-primary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 sm:px-4 sm:pt-4 relative z-10">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                  <div className="flex items-center">
                    <div className={`mr-1.5 p-0.5 sm:p-1.5 rounded-full ${card.bgColor} shadow-sm flex-shrink-0`}>
                      {card.icon}
                    </div>
                    <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">
                      {card.title}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2 sm:px-4 sm:pb-4 relative z-10">
                <div className="text-sm sm:text-base font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                  {loading ? "-" : card.value}
                </div>
                <div className="flex items-center mt-0.5">
                  <div className="text-[8px] sm:text-[9px] px-1 py-0.5 rounded-md truncate text-vynal-purple-secondary/80 dark:text-vynal-text-secondary/80">
                    {card.subtitle}
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

  // Mémoiser le contenu principal de la liste des litiges
  const DisputesList = useMemo(() => {
    if (loading && !initialLoadComplete) {
      return (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="w-10 h-10 text-vynal-accent-primary animate-spin" strokeWidth={1.5} />
        </div>
      );
    }
    
    if (currentDisputes.length === 0) {
      const emptyStateIcon = () => {
        if (activeTab === 'open') return <AlertTriangle className="h-12 w-12 text-amber-400" strokeWidth={1.5} />;
        if (activeTab === 'resolved') return <CheckCircle className="h-12 w-12 text-emerald-400" strokeWidth={1.5} />;
        if (activeTab === 'closed') return <XCircle className="h-12 w-12 text-slate-400" strokeWidth={1.5} />;
        return <AlertTriangle className="h-12 w-12 text-vynal-accent-primary/80" strokeWidth={1.5} />;
      };
      
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-vynal-purple-secondary/10 p-4 rounded-full mb-4">
            {emptyStateIcon()}
          </div>
          <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">
            Aucun litige {activeTab === 'all' ? '' : (tabLabels[activeTab as keyof typeof tabLabels] || '').toLowerCase()}
          </h3>
          <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80 max-w-md">
            {activeTab === 'all' 
              ? "Vous n'avez actuellement aucun litige en cours." 
              : activeTab === 'open' 
                ? "Vous n'avez actuellement aucun litige en attente de résolution." 
                : activeTab === 'resolved' 
                  ? "Aucun de vos litiges n'a été résolu pour le moment." 
                  : "Vous n'avez actuellement aucun litige fermé."}
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentDisputes.map((dispute) => (
          <AnimatePresence key={dispute.id} mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DisputeCard dispute={dispute} isClient={isClient} />
            </motion.div>
          </AnimatePresence>
        ))}
      </div>
    );
  }, [currentDisputes, loading, activeTab, initialLoadComplete, tabLabels, isClient]);
  
  // Mémoriser les contrôles supérieurs (tabs, tri, recherche)
  const ListControls = useMemo(() => (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDisputes}
            disabled={isRefreshing}
            className="h-8 text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            <span>Actualiser</span>
          </Button>
          <span className="text-[10px] text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">
            {getLastRefreshText()}
          </span>
        </div>
        
        <div className="flex gap-2 items-center">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-vynal-purple-secondary dark:text-vynal-text-secondary" strokeWidth={2.5} />
            <Input
              type="text"
              placeholder="Rechercher un litige..."
              className="pl-8 h-8 text-[10px] sm:text-xs w-full sm:w-[225px] border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 bg-white dark:bg-vynal-purple-dark/50"
              value={tempSearchQuery}
              onChange={handleSearchChange}
            />
            {tempSearchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-vynal-purple-secondary dark:text-vynal-text-secondary hover:text-vynal-accent-primary" strokeWidth={2.5} />
              </button>
            )}
          </form>
          
          <Select 
            value={sortOption} 
            onValueChange={(value) => changeSortOption(value as DisputeSortOption)}
          >
            <SelectTrigger className="w-[150px] h-8 text-[10px] sm:text-xs border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 bg-white dark:bg-vynal-purple-dark/50">
              <div className="flex items-center">
                <ArrowDownUp className="h-3 w-3 mr-2 text-vynal-purple-secondary dark:text-vynal-text-secondary" strokeWidth={2.5} />
                <SelectValue placeholder="Tri" className="text-[10px] sm:text-xs" />
              </div>
            </SelectTrigger>
            <SelectContent className="text-[10px] sm:text-xs">
              {Object.entries(sortOptionLabels).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-[10px] sm:text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        className="mb-6" 
        onValueChange={(value) => setTab(value as any)}
      >
        <TabsList className="w-full border-b border-vynal-purple-secondary/10 p-0 h-auto bg-transparent flex justify-start mb-3 dark:border-vynal-purple-secondary/20">
          {Object.entries(tabLabels).map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="text-[10px] sm:text-xs py-2 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-vynal-accent-primary data-[state=active]:text-vynal-accent-primary bg-transparent hover:bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent relative dark:text-vynal-text-secondary dark:data-[state=active]:text-vynal-accent-primary"
            >
              <span>{label}</span>
              {value !== 'all' && (
                <div className="absolute -top-1 -right-1 text-[8px] bg-vynal-accent-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {value === 'open' ? stats.openCount : value === 'resolved' ? stats.resolvedCount : stats.closedCount}
                </div>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {DisputesList}
        </TabsContent>
      </Tabs>
    </>
  ), [
    activeTab, sortOption, tempSearchQuery, isRefreshing, 
    handleSearch, handleSearchChange, handleClearSearch, refreshDisputes, 
    changeSortOption, setTab, getLastRefreshText, tabLabels, sortOptionLabels, stats, DisputesList
  ]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Cartes de statistiques */}
      {StatsCards}
      
      {/* Conteneur principal avec l'en-tête et les litiges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/10">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-0">
            <CardTitle className="text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">
              Liste des litiges
            </CardTitle>
            <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
              {isClient
                ? "Gérez vos demandes de litiges concernant vos commandes"
                : "Répondez aux litiges ouverts par vos clients"}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Contrôles de liste (recherche, tri, onglets) */}
            {ListControls}
            
            {/* Pagination */}
            {Pagination}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}