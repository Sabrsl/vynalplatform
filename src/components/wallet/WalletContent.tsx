"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ArrowDown, ArrowUp, Wallet, Calendar, SearchIcon } from "lucide-react";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { debounce } from "lodash";

export default function WalletContent() {
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const {
    transactions,
    wallet,
    stats,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    refresh: fetchTransactionsData
  } = useTransactions();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Handle search input with debouncing
  const handleSearchChange = useCallback((term: string) => {
    const debouncedSearch = debounce((searchTerm: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    
    debouncedSearch(term);
  }, [pathname, router, searchParams]);
  
  // Trigger a manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactionsData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800); // Minimum delay for animation
  };
  
  // Handle withdrawal navigation
  const handleWithdrawalNavigation = () => {
    if (!profile) return;
    setIsNavigating(true);
    router.push("/dashboard/wallet/withdraw");
  };
  
  // Trigger a refresh when the component mounts
  useEffect(() => {
    // Forcer un refresh au chargement uniquement si le profil existe
    const initData = async () => {
      if (profile) {
        await fetchTransactionsData();
      }
    };
    
    // Exécuter uniquement si le profil est chargé
    if (profile) {
      initData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]); // Dépendre uniquement du profile, pas de fetchTransactionsData
  
  if (!profile) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold dark:text-vynal-text-primary">Wallet</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:text-vynal-text-secondary dark:border-vynal-purple-secondary/40 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation' : 'Actualiser'}
          </Button>
          <Button 
            onClick={handleWithdrawalNavigation} 
            disabled={isNavigating || !wallet || wallet.balance < 2000}
            className="bg-slate-700 hover:bg-slate-800 dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary text-white"
          >
            {isNavigating ? "Redirection..." : "Retirer des fonds"}
          </Button>
        </div>
      </div>
      
      {/* Wallet Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="dark:border-vynal-purple-secondary/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-vynal-text-secondary flex items-center text-sm">
              <Wallet className="h-4 w-4 mr-1.5" />Solde disponible
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center">
              {isRefreshing || !wallet ? (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-vynal-purple-secondary/40 rounded-md animate-pulse"></div>
                </div>
              ) : (
                <>{formatCurrency(wallet.balance)}</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-slate-500 dark:text-vynal-text-secondary">
              Fonds disponibles pour retrait
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleWithdrawalNavigation} 
              disabled={isNavigating || !wallet || wallet.balance < 2000}
              className="w-full text-sm bg-slate-700 hover:bg-slate-800 dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary text-white"
            >
              {isNavigating ? "Redirection..." : "Effectuer un retrait"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="dark:border-vynal-purple-secondary/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-vynal-text-secondary flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1.5" />En attente
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center">
              {isRefreshing || !wallet ? (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-vynal-purple-secondary/40 rounded-md animate-pulse"></div>
                </div>
              ) : (
                <>{formatCurrency(wallet.pending_balance)}</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-slate-500 dark:text-vynal-text-secondary">
              Sommes en attente de validation
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-vynal-purple-secondary/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-vynal-text-secondary flex items-center text-sm">
              <ArrowDown className="h-4 w-4 mr-1.5" />Total des gains
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center text-emerald-600 dark:text-emerald-500">
              {isRefreshing || !wallet ? (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-vynal-purple-secondary/40 rounded-md animate-pulse"></div>
                </div>
              ) : (
                <>{formatCurrency(wallet.total_earnings)}</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-slate-500 dark:text-vynal-text-secondary">
              Cumul de vos revenus sur la plateforme
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-vynal-purple-secondary/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-vynal-text-secondary flex items-center text-sm">
              <ArrowUp className="h-4 w-4 mr-1.5" />Total des retraits
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center text-amber-600 dark:text-amber-500">
              {isRefreshing || !wallet ? (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-vynal-purple-secondary/40 rounded-md animate-pulse"></div>
                </div>
              ) : (
                <>{formatCurrency(wallet.total_withdrawals)}</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-slate-500 dark:text-vynal-text-secondary">
              Montant total retiré sur votre compte
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions List */}
      <Card className="dark:border-vynal-purple-secondary/40">
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>Consultez l'historique de vos transactions, paiements et retraits</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab} 
            onValueChange={(value) => {
              if (value !== activeTab) {
                setActiveTab(value);
              }
            }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="deposit">Dépôts</TabsTrigger>
                <TabsTrigger value="payment">Paiements</TabsTrigger>
                <TabsTrigger value="earning">Gains</TabsTrigger>
                <TabsTrigger value="withdrawal">Retraits</TabsTrigger>
              </TabsList>
              <div className="relative w-full md:w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="w-full pl-8"
                  defaultValue={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value={activeTab} className="m-0">
              <TransactionsList
                transactions={transactions}
                isLoading={loading || isRefreshing}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 