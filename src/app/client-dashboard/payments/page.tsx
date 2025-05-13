"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination";
import { 
  ArrowDown, ArrowUp, CreditCard, ExternalLink, Filter, 
  History, Loader2, Wallet, Search, CheckCircle, AlertCircle, Clock, X, RefreshCw
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClientPayments, Payment } from "@/hooks/useClientPayments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientPaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = searchParams?.get("tab") || "all";
  const searchQuery = searchParams?.get("search") || "";
  
  const [search, setSearch] = useState(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Utiliser le hook pour récupérer les données de paiement
  const { 
    payments, 
    summary,
    loading, 
    error, 
    isRefreshing, 
    refresh 
  } = useClientPayments({
    limit: 0, // Pas de limite, nous gérons la pagination côté client
    useCache: true
  });
  
  // Optimisation: Formater la date avec useCallback
  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return dateString;
    }
  }, []);
  
  // Optimisation: Formater le montant avec useCallback
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }, []);
  
  // Optimisation: Gestion de la recherche avec useCallback
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1); // Réinitialiser la pagination lors d'une recherche
    
    const params = new URLSearchParams();
    if (searchParams) {
      searchParams?.forEach((value, key) => {
        params.set(key, value);
      });
    }
    
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);
  
  // Optimisation: Gestion du changement d'onglet avec useCallback
  const handleTabChange = useCallback((value: string) => {
    setCurrentPage(1); // Réinitialiser la pagination lors d'un changement d'onglet
    const params = new URLSearchParams();
    if (searchParams) {
      searchParams?.forEach((value, key) => {
        params.set(key, value);
      });
    }
    
    if (value === "all") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    
    if (search) {
      params.set("search", search);
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname, search]);
  
  // Optimisation: Filtrer les transactions avec useMemo
  const filteredTransactions = useMemo(() => {
    if (!payments) return [];
    
    let filtered = [...payments];
    
    // Filtrer par type selon l'onglet actif
    if (currentTab === "payments") {
      filtered = filtered.filter(payment => payment.status === "paid");
    } else if (currentTab === "refunds") {
      filtered = filtered.filter(payment => payment.status === "refunded");
    }
    
    // Filtrer par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((payment) => {
        return (
          payment.id.toLowerCase().includes(searchLower) ||
          payment.order?.service?.title?.toLowerCase().includes(searchLower) ||
          payment.freelance?.full_name?.toLowerCase().includes(searchLower) ||
          payment.order_id.toLowerCase().includes(searchLower) ||
          payment.status.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filtered;
  }, [payments, currentTab, search]);

  // Obtenir la classe CSS pour le badge de statut
  const getStatusBadgeClasses = useCallback((status: Payment['status']) => {
    const baseClasses = "text-[8px] sm:text-[8px] border px-2 py-1 rounded-full";
    
    switch(status) {
      case "paid":
        return cn(baseClasses, "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30");
      case "pending":
        return cn(baseClasses, "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30");
      case "refunded":
        return cn(baseClasses, "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/30");
      default:
        return baseClasses;
    }
  }, []);

  // Obtenir le texte du statut
  const getStatusText = useCallback((status: Payment['status']) => {
    switch(status) {
      case "paid":
        return "Payé";
      case "pending":
        return "En attente";
      case "refunded":
        return "Remboursé";
      default:
        return status;
    }
  }, []);

  // Classes de style harmonisées avec les autres pages
  const mainCardClasses = "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-sm rounded-lg transition-all duration-200";
  const innerCardClasses = "bg-white/25 dark:bg-slate-800/25 backdrop-blur-sm border border-slate-200/15 dark:border-slate-700/15 rounded-lg transition-all duration-200";
  const titleClasses = "text-slate-800 dark:text-vynal-text-primary";
  const subtitleClasses = "text-slate-600 dark:text-vynal-text-secondary";
  const buttonClasses = "text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100/40 dark:hover:bg-slate-700/40 transition-colors";

  // Calculer les transactions paginées
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / itemsPerPage);
  }, [filteredTransactions]);

  // Gérer le changement de page
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Loader optimisé avec les couleurs harmonisées
  if (loading && !isRefreshing) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-vynal-accent-primary mx-auto mb-4" />
            <p className={`${subtitleClasses} text-sm animate-pulse`}>
              Chargement de vos paiements...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className={`text-base sm:text-lg md:text-xl font-bold ${titleClasses} flex items-center`}>
              <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
              Mes Paiements
            </h1>
            <p className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
              Gérez vos paiements et transactions
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => refresh()}
            className="text-gray-600 dark:text-gray-400 hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary flex items-center gap-1 text-xs"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-3 w-3 animate-spin text-vynal-accent-primary" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </Button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className={`${mainCardClasses} col-span-2 sm:col-span-1`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className={`text-xs font-medium ${titleClasses}`}>
              Total des transactions
            </CardTitle>
            <Wallet className="h-4 w-4 text-vynal-accent-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-xl font-bold ${titleClasses}`}>
              {summary?.total_transactions || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className={mainCardClasses}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className={`text-xs font-medium ${titleClasses}`}>
              Total des paiements
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary?.total_paid || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className={mainCardClasses}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className={`text-xs font-medium ${titleClasses}`}>
              Total des remboursements
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary?.total_refunded || 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Section Transactions */}
      <Card className={mainCardClasses}>
        <CardHeader className="p-4 border-b border-slate-200/10 dark:border-slate-700/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-sm sm:text-sm md:text-base flex items-center ${titleClasses}`}>
                <History className="mr-2 h-3 w-3 sm:h-3 sm:w-3 text-vynal-accent-primary" />
                Historique des transactions
              </CardTitle>
              <CardDescription className={`text-[10px] sm:text-[10px] ${subtitleClasses}`}>
                Consultez l'historique de vos paiements et remboursements
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => refresh()}
              className="text-gray-600 dark:text-gray-400 hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary flex items-center gap-1 text-xs"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-3 w-3 animate-spin text-vynal-accent-primary" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Tabs defaultValue={currentTab} value={currentTab} onValueChange={handleTabChange}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <TabsList className="bg-slate-100/70 dark:bg-slate-800/20 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/20">
                  <TabsTrigger 
                    value="all"
                    className="text-[10px] sm:text-xs data-[state=active]:bg-vynal-accent-primary/30 data-[state=active]:text-vynal-accent-primary dark:data-[state=active]:bg-vynal-accent-primary/5 dark:data-[state=active]:text-vynal-accent-primary/40 data-[state=active]:shadow-sm text-slate-700 dark:text-slate-300 hover:bg-vynal-accent-primary/10"
                  >
                    Toutes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="payments"
                    className="text-[10px] sm:text-xs data-[state=active]:bg-emerald-500/30 data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-emerald-500/5 dark:data-[state=active]:text-emerald-500/40 data-[state=active]:shadow-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10"
                  >
                    Paiements
                  </TabsTrigger>
                  <TabsTrigger 
                    value="refunds"
                    className="text-[10px] sm:text-xs data-[state=active]:bg-amber-500/30 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-500/5 dark:data-[state=active]:text-amber-500/40 data-[state=active]:shadow-sm text-slate-700 dark:text-slate-300 hover:bg-amber-500/10"
                  >
                    Remboursements
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative w-full sm:w-auto sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher des transactions..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 w-full text-[10px] sm:text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30 text-slate-800 dark:text-vynal-text-primary focus:ring-1 focus:ring-slate-300/50 dark:focus:ring-slate-600/50"
                  />
                  {search && (
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
                      onClick={() => handleSearch("")}
                      aria-label="Effacer la recherche"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <TabsContent value={currentTab} className="m-0">
                <div className="space-y-3">
                  {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="rounded-full bg-slate-100/50 dark:bg-slate-800/20 p-3 mb-2 border border-slate-200/50 dark:border-transparent">
                        <History className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className={`text-[10px] sm:text-xs font-medium ${titleClasses}`}>
                        Aucune transaction trouvée
                      </p>
                      <p className={`text-[8px] sm:text-[10px] max-w-xs ${subtitleClasses}`}>
                        {search ? `Aucun résultat pour "${search}"` : "Aucune transaction à afficher"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {paginatedTransactions.map((payment) => (
                        <div
                          key={payment.id}
                          className={`p-3 ${innerCardClasses}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className={`text-[10px] sm:text-[10px] font-medium ${titleClasses}`}>
                                {payment.order?.service?.title || `Paiement #${payment.id.slice(0, 8)}`}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                                  <Clock className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                                  <span className={`text-[8px] sm:text-[8px] text-slate-500 dark:text-vynal-text-secondary`}>
                                    {formatDate(payment.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                                  <CreditCard className="h-2 w-2 text-slate-500 dark:text-vynal-text-secondary" />
                                  <span className={`text-[8px] sm:text-[8px] text-slate-500 dark:text-vynal-text-secondary`}>
                                    Réf: {payment.order_id.slice(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`text-[10px] sm:text-xs font-medium ${
                                payment.status === 'refunded'
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {payment.status === 'refunded' ? '+' : '-'}
                                {formatCurrency(payment.amount)}
                              </span>
                              <Badge className={getStatusBadgeClasses(payment.status)}>
                                {getStatusText(payment.status)}
                              </Badge>
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
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}