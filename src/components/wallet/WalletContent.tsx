"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ArrowDown, ArrowUp, Wallet, Calendar, SearchIcon } from "lucide-react";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { debounce } from "lodash";
import { WalletStatCard } from "./WalletStatCard";
import { FREELANCE_ROUTES } from "@/config/routes";

// Minimum de solde requis pour retirer des fonds
const MIN_WITHDRAWAL_AMOUNT = 2000;

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
  
  // Vérifier si le retrait est possible
  const canWithdraw = Boolean(wallet && wallet.balance >= MIN_WITHDRAWAL_AMOUNT);
  
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
    router.push(FREELANCE_ROUTES.WITHDRAW);
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
    <div className="space-y-4" data-content="loaded">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">Portefeuille</h1>
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
            disabled={isNavigating || !canWithdraw}
            className="text-[10px] bg-slate-700 hover:bg-slate-800 dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary text-white"
          >
            {isNavigating ? "Redirection..." : "Retirer des fonds"}
          </Button>
        </div>
      </div>
      
      {/* Wallet Info Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-4">
        {/* Solde disponible */}
        <div className="col-span-1">
          <WalletStatCard
            title="Solde disponible"
            value={wallet ? formatCurrency(wallet.balance) : 0}
            icon={Wallet}
            isLoading={isRefreshing || !wallet}
            variant="blue"
          />
        </div>

        {/* En attente */}
        <div className="col-span-1">
          <WalletStatCard
            title="En attente"
            value={wallet ? formatCurrency(wallet.pending_balance) : 0}
            icon={Calendar}
            isLoading={isRefreshing || !wallet}
            variant="amber"
          />
        </div>

        {/* Total des gains */}
        <div className="col-span-1">
          <WalletStatCard
            title="Total des gains"
            value={wallet ? formatCurrency(wallet.total_earnings) : 0}
            icon={ArrowDown}
            isLoading={isRefreshing || !wallet}
            variant="green"
          />
        </div>

        {/* Total des retraits */}
        <div className="col-span-1">
          <WalletStatCard
            title="Total des retraits"
            value={wallet ? formatCurrency(wallet.total_withdrawals) : 0}
            icon={ArrowUp}
            isLoading={isRefreshing || !wallet}
            variant="red"
          />
        </div>
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
      
      {/* Message d'information sur les retraits */}
      {!canWithdraw && wallet && (
        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-vynal-text-secondary/80 text-center">
          Vous devez avoir un solde minimum de {formatCurrency(MIN_WITHDRAWAL_AMOUNT)} pour effectuer un retrait. 
          Votre solde actuel est de {formatCurrency(wallet.balance)}.
        </div>
      )}
    </div>
  );
} 