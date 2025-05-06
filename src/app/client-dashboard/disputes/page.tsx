"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, Clock, CheckCircle, X, MessageSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { PaginationControls } from "@/components/ui/pagination";
import { useClientDisputes } from "@/hooks/useClientDisputes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientDisputesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'open' | 'resolved' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Utiliser le hook avec les filtres
  const { 
    disputes, 
    summary, 
    loading, 
    error, 
    isRefreshing, 
    refresh 
  } = useClientDisputes({
    status: activeTab,
    search: searchQuery,
    limit: 0, // Pas de limite, nous gérons la pagination côté client
    useCache: true
  });

  // Optimisation: Pagination côté client
  const paginatedDisputes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return disputes.slice(startIndex, endIndex);
  }, [disputes, currentPage, itemsPerPage]);

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(disputes.length / itemsPerPage);
  }, [disputes, itemsPerPage]);

  // Gérer le changement de page
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Gestion du changement d'onglet
  const handleTabChange = useCallback((value: 'open' | 'resolved' | 'all') => {
    setActiveTab(value);
    setCurrentPage(1); // Réinitialiser la pagination lors d'un changement d'onglet
  }, []);

  // Optimisation: fonction de gestion des recherches
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Réinitialiser la pagination lors d'une recherche
  }, []);

  // Optimisation: fonction pour effacer la recherche
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(1); // Réinitialiser la pagination
  }, []);

  // Optimisation : Helper pour les classes de badge selon le statut
  const getStatusBadgeClasses = useCallback((status: 'open' | 'resolved' | 'closed') => {
    const baseClasses = "text-[8px] sm:text-[8px] border hover:text-white dark:hover:text-white transition-colors";
    
    switch(status) {
      case 'open':
        return cn(baseClasses, "bg-amber-500/10 text-amber-500 border-amber-500/20");
      case 'resolved':
        return cn(baseClasses, "bg-emerald-500/10 text-emerald-500 border-emerald-500/20");
      case 'closed':
        return cn(baseClasses, "bg-slate-500/10 text-slate-500 border-slate-500/20");
      default:
        return baseClasses;
    }
  }, []);

  // Optimisation : Helper pour le texte du statut
  const getStatusText = useCallback((status: 'open' | 'resolved' | 'closed') => {
    switch(status) {
      case 'open':
        return "En cours";
      case 'resolved':
        return "Résolu";
      case 'closed':
        return "Fermé";
      default:
        return status;
    }
  }, []);

  // Format de date optimisé
  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return dateString;
    }
  }, []);

  // Classes de style unifiées pour une UI cohérente
  const mainCardClasses = "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-sm rounded-lg transition-all duration-200";
  const innerCardClasses = "bg-white/25 dark:bg-slate-800/25 backdrop-blur-sm border border-slate-200/15 dark:border-slate-700/15 rounded-lg transition-all duration-200";
  const titleClasses = "text-slate-800 dark:text-vynal-text-primary";
  const subtitleClasses = "text-slate-600 dark:text-vynal-text-secondary";
  const buttonClasses = "text-[8px] sm:text-[8px] text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100/40 dark:hover:bg-slate-700/40 transition-colors";

  if (loading && !isRefreshing) {
    return <ClientDashboardPageSkeleton />;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className={`text-base sm:text-lg md:text-xl font-bold ${titleClasses} flex items-center`}>
            <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
            Mes Litiges
          </h1>
          <p className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
            Gérez et suivez vos litiges
          </p>
        </div>
        {isRefreshing && (
          <div className="flex items-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Rafraîchissement...
          </div>
        )}
      </div>

      {/* Barre de recherche optimisée */}
      <Card className={`${mainCardClasses} mb-6`}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-auto flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Rechercher un litige..."
                className="pl-9 w-full md:w-80 text-[10px] sm:text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30 text-slate-800 dark:text-vynal-text-primary focus:ring-1 focus:ring-slate-300/50 dark:focus:ring-slate-600/50"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
                  onClick={clearSearch}
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refresh()}
              className="text-xs bg-white/20 dark:bg-slate-800/20 border-slate-200/20 dark:border-slate-700/20"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Actualisation...
                </>
              ) : (
                <>Actualiser</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs optimisés et stylisés */}
      <Tabs 
        defaultValue="open" 
        value={activeTab} 
        onValueChange={(value) => handleTabChange(value as 'open' | 'resolved' | 'all')} 
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 gap-2 bg-white/20 dark:bg-slate-800/20 p-1 rounded-lg border border-slate-200/20 dark:border-slate-700/20">
          <TabsTrigger 
            value="open" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-500/5 dark:data-[state=active]:text-amber-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300"
          >
            En cours
            <Badge className="ml-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[8px]">
              {summary.total_open}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="resolved"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-600 dark:data-[state=active]:bg-green-500/5 dark:data-[state=active]:text-green-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300"
          >
            Résolus
            <Badge className="ml-2 bg-green-500/20 text-green-500 border border-green-500/30 text-[8px]">
              {summary.total_resolved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-500/5 dark:data-[state=active]:text-blue-500/40 data-[state=active]:shadow-sm text-[10px] sm:text-xs text-slate-700 dark:text-slate-300"
          >
            Tous
            <Badge className="ml-2 bg-blue-500/20 text-blue-500 border border-blue-500/30 text-[8px]">
              {summary.total_disputes}
            </Badge>
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value={activeTab} className="space-y-4">
          {/* Contenu des litiges */}
          <Card className={mainCardClasses}>
            <CardHeader className="p-3 sm:p-4 border-b border-slate-200/10 dark:border-slate-700/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-sm sm:text-sm md:text-base flex items-center ${titleClasses}`}>
                    {activeTab === 'open' && (
                      <Clock className="mr-2 h-3 w-3 sm:h-3 sm:w-3 text-amber-500" />
                    )}
                    {activeTab === 'resolved' && (
                      <CheckCircle className="mr-2 h-3 w-3 sm:h-3 sm:w-3 text-green-500" />
                    )}
                    {activeTab === 'all' && (
                      <AlertTriangle className="mr-2 h-3 w-3 sm:h-3 sm:w-3 text-blue-500" />
                    )}
                    {activeTab === 'open' && 'Litiges en cours'}
                    {activeTab === 'resolved' && 'Litiges résolus'}
                    {activeTab === 'all' && 'Tous les litiges'}
                  </CardTitle>
                  <CardDescription className={`text-[10px] sm:text-[10px] ${subtitleClasses}`}>
                    {activeTab === 'open' && `${summary.total_open} litige(s) en attente de résolution`}
                    {activeTab === 'resolved' && `${summary.total_resolved} litige(s) résolu(s)`}
                    {activeTab === 'all' && `${summary.total_disputes} litige(s) au total`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {disputes.length > 0 ? (
                <div className="space-y-3">
                  {paginatedDisputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className={`p-3 ${innerCardClasses}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="space-y-1">
                          <p className={`text-[10px] sm:text-[10px] font-medium ${titleClasses}`}>
                            {dispute.order?.service?.title || "Service non disponible"}
                          </p>
                          <p className={`text-[8px] sm:text-[8px] ${subtitleClasses}`}>
                            Freelance: {dispute.freelance?.full_name || dispute.freelance_id}
                          </p>
                        </div>
                        <Badge
                          className={getStatusBadgeClasses(dispute.status)}
                        >
                          {getStatusText(dispute.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-slate-100/30 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <FileText className="h-2 w-2 text-slate-600 dark:text-vynal-text-secondary" />
                            <span className={`text-[8px] sm:text-[8px] ${subtitleClasses}`}>
                              Commande #{dispute.order_id}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-100/30 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                            <Clock className="h-2 w-2 text-slate-600 dark:text-vynal-text-secondary" />
                            <span className={`text-[8px] sm:text-[8px] ${subtitleClasses}`}>
                              {formatDate(dispute.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {dispute.status === 'open' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`${buttonClasses} h-5 border-slate-200/20 dark:border-slate-700/20`}
                            >
                              <MessageSquare className="h-2 w-2 mr-1" />
                              Répondre
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className={`${buttonClasses} h-5 border-slate-200/20 dark:border-slate-700/20`}
                          >
                            Détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100/20 dark:bg-slate-800/20 p-3 mb-2">
                    {activeTab === 'open' && <AlertTriangle className="h-5 w-5 text-amber-500/60" />}
                    {activeTab === 'resolved' && <CheckCircle className="h-5 w-5 text-green-500/60" />}
                    {activeTab === 'all' && <AlertTriangle className="h-5 w-5 text-blue-500/60" />}
                  </div>
                  <p className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>
                    {activeTab === 'open' && 'Aucun litige en cours'}
                    {activeTab === 'resolved' && 'Aucun litige résolu'}
                    {activeTab === 'all' && 'Aucun litige trouvé'}
                  </p>
                  <p className={`text-[8px] sm:text-[10px] max-w-xs ${subtitleClasses}`}>
                    {searchQuery 
                      ? `Aucun résultat pour "${searchQuery}"`
                      : activeTab === 'open' 
                        ? "Vous n'avez actuellement aucun litige en cours. Bonne nouvelle !" 
                        : activeTab === 'resolved'
                          ? "Vous n'avez aucun litige résolu dans votre historique."
                          : "Vous n'avez aucun litige à afficher."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}