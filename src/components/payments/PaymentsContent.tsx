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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solde du portefeuille
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(safeWallet.balance)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total des gains
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(safeWallet.total_earnings)}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total des retraits
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(safeWallet.total_withdrawals)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <Tabs defaultValue={currentTab} value={currentTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">Toutes les transactions</TabsTrigger>
              <TabsTrigger value="earnings">Gains</TabsTrigger>
              <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
            </TabsList>
            
            <div className="w-full sm:w-auto sm:max-w-sm">
              <Input
                placeholder="Rechercher des transactions..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
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