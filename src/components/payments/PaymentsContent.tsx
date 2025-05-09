"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";
import { TransactionsList } from "@/components/payments/TransactionsList";
import { useTransactions } from "@/hooks/useTransactions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { WalletStatCard } from "@/components/wallet/WalletStatCard";

export function PaymentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = searchParams?.get("tab") || "all";
  const searchQuery = searchParams?.get("search") || "";
  
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
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSearch = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set("search", value);
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);
  
  const handleSearchChange = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set("search", term);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);
  
  return (
    <div className="space-y-4" data-content="loaded">
      <div className="grid gap-3 md:grid-cols-3">
        <WalletStatCard
          title="Solde du portefeuille"
          value={formatCurrency(safeWallet.balance)}
          icon={Wallet}
          isLoading={loading}
          variant="default"
        />
        
        <WalletStatCard
          title="Total des gains"
          value={formatCurrency(safeWallet.total_earnings)}
          icon={ArrowDown}
          isLoading={loading}
          variant="green"
        />
        
        <WalletStatCard
          title="Total des retraits"
          value={formatCurrency(safeWallet.total_withdrawals)}
          icon={ArrowUp}
          isLoading={loading}
          variant="red"
        />
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
                onChange={(e) => handleSearchChange(e.target.value)}
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