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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">Wallet</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-[10px] text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:text-vynal-text-secondary dark:border-vynal-purple-secondary/40 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-text-primary"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation' : 'Actualiser'}
          </Button>
          <Button 
            onClick={handleWithdrawalNavigation} 
            disabled={isNavigating || !wallet || wallet.balance < 2000}
            className="text-[10px] bg-slate-700 hover:bg-slate-800 dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary text-white"
          >
            {isNavigating ? "Redirection..." : "Retirer des fonds"}
          </Button>
        </div>
      </div>
      
      {/* Wallet Info Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-4">
        <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-blue-50/50 dark:from-vynal-purple-dark/50 dark:to-blue-900/20 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              Solde disponible
            </CardDescription>
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-blue-200/80 to-blue-100/80 shadow-sm dark:from-blue-900/20 dark:to-blue-800/20">
              <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {isRefreshing || !wallet ? (
              <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
            ) : (
              <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(wallet.balance)}</div>
            )}
          </CardContent>
          <CardFooter className="px-3 pb-3 sm:px-4 sm:pb-4">
            <Button 
              onClick={handleWithdrawalNavigation} 
              disabled={isNavigating || !wallet || wallet.balance < 2000}
              className="hidden sm:block w-full h-7 text-[10px] bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-secondary hover:to-vynal-accent-primary text-white rounded-xl"
            >
              {isNavigating ? "Redirection..." : "Effectuer un retrait"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-amber-50/50 dark:from-vynal-purple-dark/50 dark:to-amber-900/20 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              En attente
            </CardDescription>
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-amber-200/80 to-amber-100/80 shadow-sm dark:from-amber-900/20 dark:to-amber-800/20">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {isRefreshing || !wallet ? (
              <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
            ) : (
              <div className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(wallet.pending_balance)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-green-50/50 dark:from-vynal-purple-dark/50 dark:to-green-900/20 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              Total des gains
            </CardDescription>
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-green-200/80 to-green-100/80 shadow-sm dark:from-green-900/20 dark:to-green-800/20">
              <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {isRefreshing || !wallet ? (
              <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
            ) : (
              <div className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                {formatCurrency(wallet.total_earnings)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-red-50/50 dark:from-vynal-purple-dark/50 dark:to-red-900/20 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              Total des retraits
            </CardDescription>
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-red-200/80 to-red-100/80 shadow-sm dark:from-red-900/20 dark:to-red-800/20">
              <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {isRefreshing || !wallet ? (
              <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
            ) : (
              <div className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400">
                {formatCurrency(wallet.total_withdrawals)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions List */}
      <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-vynal-purple-secondary/5 dark:from-vynal-purple-dark/50 dark:to-vynal-purple-dark/30 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="px-3 pt-3 sm:px-4 sm:pt-4">
          <CardTitle className="text-sm sm:text-base font-semibold">Historique des transactions</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Consultez l'historique de vos transactions, paiements et retraits</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab} 
            onValueChange={(value) => {
              if (value !== activeTab) {
                setActiveTab(value);
              }
            }}
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 py-1.5">Toutes</TabsTrigger>
                <TabsTrigger value="deposit" className="text-xs px-3 py-1.5">Dépôts</TabsTrigger>
                <TabsTrigger value="payment" className="text-xs px-3 py-1.5">Paiements</TabsTrigger>
                <TabsTrigger value="earning" className="text-xs px-3 py-1.5">Gains</TabsTrigger>
                <TabsTrigger value="withdrawal" className="text-xs px-3 py-1.5">Retraits</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="w-full h-8 text-xs pl-8"
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