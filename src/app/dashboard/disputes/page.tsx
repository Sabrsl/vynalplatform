"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DisputeCard } from "@/components/disputes/DisputeCard";
import { useAuth } from "@/hooks/useAuth";
import { Search, AlertTriangle, Loader2, ArrowDownUp, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserDisputes, DisputeWithDetails } from "@/lib/supabase/disputes";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

// Type pour les onglets
type TabValue = "all" | "open" | "resolved" | "closed";

// Type pour les options de tri
type SortOption = "newest" | "oldest" | "status";

export default function DisputesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<DisputeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const isClient = user?.user_metadata?.role === "client";
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const disputesPerPage = 9; // 9 litiges par page
  const totalPages = Math.ceil(filteredDisputes.length / disputesPerPage);
  const indexOfLastDispute = currentPage * disputesPerPage;
  const indexOfFirstDispute = indexOfLastDispute - disputesPerPage;
  const currentDisputes = filteredDisputes.slice(indexOfFirstDispute, indexOfLastDispute);
  
  // Navigation de pagination
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
  
  // Charger les disputes
  useEffect(() => {
    const loadDisputes = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const userDisputes = await getUserDisputes(user.id);
          setDisputes(userDisputes);
        } catch (error) {
          console.error("Error loading disputes:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les litiges. Veuillez réessayer.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadDisputes();
  }, [user?.id, toast]);
  
  // Rafraîchir les disputes
  const refreshDisputes = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const userDisputes = await getUserDisputes(user.id);
      setDisputes(userDisputes);
      toast({
        title: "Actualisé",
        description: "La liste des litiges a été mise à jour.",
      });
    } catch (error) {
      console.error("Error refreshing disputes:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les litiges.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrer et trier les disputes
  useEffect(() => {
    let filtered = [...disputes];
    
    // Filtrer par statut
    if (activeTab !== "all") {
      filtered = filtered.filter((dispute) => dispute.status === activeTab);
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((dispute) => 
        dispute.reason.toLowerCase().includes(query) ||
        (isClient ? 
          dispute.freelance.full_name?.toLowerCase().includes(query) || 
          dispute.freelance.username?.toLowerCase().includes(query) 
          : 
          dispute.client.full_name?.toLowerCase().includes(query) || 
          dispute.client.username?.toLowerCase().includes(query)
        )
      );
    }
    
    // Trier les disputes
    switch (sortOption) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "status":
        // Trier par priorité: open, resolved, closed
        filtered.sort((a, b) => {
          const statusPriority: Record<string, number> = { open: 0, resolved: 1, closed: 2 };
          return statusPriority[a.status] - statusPriority[b.status];
        });
        break;
    }
    
    setFilteredDisputes(filtered);
    // Réinitialiser à la première page lors du changement des filtres
    setCurrentPage(1);
  }, [activeTab, searchQuery, disputes, isClient, sortOption]);
  
  // Générer des Skeletons pour le chargement
  const LoadingSkeletons = () => (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(9)].map((_, index) => (
        <Card key={index} className="overflow-hidden border-slate-200 dark:border-vynal-purple-secondary/20">
          <CardContent className="p-0">
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
              <div className="flex justify-between items-start mb-1 sm:mb-3">
                <Skeleton className="h-4 w-24 bg-white dark:bg-vynal-purple-secondary/20" />
                <Skeleton className="h-5 w-20 bg-white dark:bg-vynal-purple-secondary/20" />
              </div>
              <Skeleton className="h-4 w-full mb-2 sm:mb-3 bg-white dark:bg-vynal-purple-secondary/20" />
              <Skeleton className="h-3 w-3/4 mb-2 bg-white dark:bg-vynal-purple-secondary/20" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 bg-white dark:bg-vynal-purple-secondary/20" />
                <Skeleton className="h-3 w-16 bg-white dark:bg-vynal-purple-secondary/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  // Formater les statistiques
  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    closed: disputes.filter(d => d.status === 'closed').length
  };
  
  return (
    <div className="w-full -ml-0 p-0">
      <div className="p-4 md:p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-vynal-text-primary md:hidden">
              {isClient ? "Vos litiges" : "Litiges reçus"}
            </h2>
            <p className="text-muted-foreground text-slate-500 mt-1 md:hidden">
              Gérez les litiges concernant vos commandes
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <div className="flex items-center space-x-3 bg-white border border-slate-200 dark:bg-vynal-purple-dark/20 dark:border-vynal-purple-secondary/20 px-3 py-1.5 rounded-md mr-2">
              <span className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                <Badge variant="outline" className="mr-1 bg-white text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
                  {stats.open}
                </Badge>
                Ouverts
              </span>
              
              <span className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                <Badge variant="outline" className="mr-1 bg-white text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30">
                  {stats.resolved}
                </Badge>
                Résolus
              </span>
              
              <span className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                <Badge variant="outline" className="mr-1 bg-white text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30">
                  {stats.closed}
                </Badge>
                Fermés
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshDisputes}
              disabled={loading}
              className="flex items-center border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-vynal-purple-secondary/50 dark:bg-transparent dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Actualiser
            </Button>
          </div>
        </div>
        
        {/* Filtres */}
        <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-vynal-text-secondary" />
            <Input
              placeholder="Rechercher par raison ou utilisateur..."
              className="pl-9 h-9 border-slate-200 bg-white dark:border-vynal-purple-secondary/30 dark:bg-transparent focus-visible:ring-vynal-accent-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Select 
              value={sortOption} 
              onValueChange={(value: string) => setSortOption(value as SortOption)}
            >
              <SelectTrigger className="w-full sm:w-[160px] h-9 border-slate-200 bg-white text-slate-700 dark:border-vynal-purple-secondary/40 dark:bg-transparent dark:text-vynal-text-secondary">
                <div className="flex items-center">
                  <ArrowDownUp className="mr-2 h-3.5 w-3.5 text-slate-500 dark:text-vynal-text-secondary" />
                  <span className="text-xs">Trier par</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-vynal-purple-dark border-slate-200 dark:border-vynal-purple-secondary/30">
                <SelectItem value="newest" className="text-slate-700 dark:text-vynal-text-primary focus:bg-slate-50 dark:focus:bg-vynal-purple-secondary/20">Plus récents</SelectItem>
                <SelectItem value="oldest" className="text-slate-700 dark:text-vynal-text-primary focus:bg-slate-50 dark:focus:bg-vynal-purple-secondary/20">Plus anciens</SelectItem>
                <SelectItem value="status" className="text-slate-700 dark:text-vynal-text-primary focus:bg-slate-50 dark:focus:bg-vynal-purple-secondary/20">Statut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Onglets */}
        <div className="mb-4">
          <Tabs 
            value={activeTab} 
            onValueChange={(value: string) => setActiveTab(value as TabValue)}
            className="w-full"
          >
            <div className="overflow-x-auto pb-1 scrollbar-hide">
              <TabsList className="bg-white/80 dark:bg-vynal-purple-dark/20 border border-vynal-purple-secondary/10 p-1 rounded-lg inline-flex whitespace-nowrap w-max min-w-full">
                <TabsTrigger 
                  value="all" 
                  className="text-[10px] sm:text-xs px-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
                >
                  Tous
                </TabsTrigger>
                <TabsTrigger 
                  value="open" 
                  className="text-[10px] sm:text-xs px-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
                >
                  Ouverts
                </TabsTrigger>
                <TabsTrigger 
                  value="resolved" 
                  className="text-[10px] sm:text-xs px-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
                >
                  Résolus
                </TabsTrigger>
                <TabsTrigger 
                  value="closed" 
                  className="text-[10px] sm:text-xs px-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
                >
                  Fermés
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
        
        {/* Liste des disputes */}
        {loading ? (
          <LoadingSkeletons />
        ) : filteredDisputes.length > 0 ? (
          <>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentDisputes.map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} isClient={isClient} />
              ))}
            </div>
            
            {/* Pagination */}
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
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 rounded-full bg-white border border-slate-200 p-3 dark:bg-vynal-purple-secondary/20 dark:border-transparent">
              <AlertTriangle className="h-6 w-6 text-slate-400 dark:text-vynal-text-secondary" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-slate-800 dark:text-vynal-text-primary">
              Aucun litige trouvé
            </h3>
            <p className="mb-6 max-w-md text-sm text-slate-500 dark:text-vynal-text-secondary">
              {searchQuery || activeTab !== "all" 
                ? "Aucun litige ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de litiges. Si vous rencontrez un problème avec une commande, n'hésitez pas à ouvrir un litige."}
            </p>
            
            {isClient && (
              <Link href="/dashboard/orders">
                <Button 
                  variant="outline"
                  className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-transparent dark:border-vynal-purple-secondary/50 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                >
                  Voir mes commandes
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 