"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";
import { TransactionsList } from "@/components/payments/TransactionsList";
import { useTransactions } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowDown, ArrowUp, Wallet } from "lucide-react";

export function PaymentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = searchParams.get("tab") || "all";
  const searchQuery = searchParams.get("search") || "";
  
  const [search, setSearch] = useState(searchQuery);
  
  const { 
    transactions, 
    wallet, 
    stats, 
    loading, 
    refresh 
  } = useTransactions(currentTab);
  
  const safeWallet = useMemo(() => ({
    balance: wallet?.balance ?? 0,
    total_earnings: wallet?.total_earnings ?? 0,
    total_withdrawals: wallet?.total_withdrawals ?? 0,
  }), [wallet]);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Données PaymentsContent:', {
        wallet,
        safeWallet,
        stats,
        loading,
        transactionsCount: transactions?.length,
      });
    }
    
    refresh();
  }, []);
  
  const handleSearch = (value: string) => {
    setSearch(value);
    
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  };
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value === "all") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    
    if (search) {
      params.set("search", search);
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  };
  
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border border-vynal-purple-secondary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              Solde du portefeuille
            </CardTitle>
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 shadow-sm">
              <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-bold">{formatCurrency(safeWallet.balance)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border border-vynal-purple-secondary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              Total des gains
            </CardTitle>
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-green-200/80 to-green-100/80 shadow-sm dark:from-green-900/20 dark:to-green-800/20">
              <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(safeWallet.total_earnings)}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border border-vynal-purple-secondary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              Total des retraits
            </CardTitle>
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-red-200/80 to-red-100/80 shadow-sm dark:from-red-900/20 dark:to-red-800/20">
              <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(safeWallet.total_withdrawals)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-3">
        <Tabs defaultValue={currentTab} value={currentTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-3 py-1.5">Toutes les transactions</TabsTrigger>
              <TabsTrigger value="earnings" className="text-xs px-3 py-1.5">Gains</TabsTrigger>
              <TabsTrigger value="withdrawals" className="text-xs px-3 py-1.5">Retraits</TabsTrigger>
            </TabsList>
            
            <div className="w-full sm:w-auto sm:max-w-sm">
              <Input
                placeholder="Rechercher des transactions..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-8 text-xs"
              />
            </div>
          </div>
          
          <TabsContent value={currentTab} className="m-0">
            <TransactionsList 
              transactions={transactions || []}
              loading={loading} 
              searchTerm={search}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 