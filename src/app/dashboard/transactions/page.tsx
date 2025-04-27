"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatCurrency } from "@/lib/utils/format";
import { debounce } from "lodash";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

// Force dynamic rendering pour éviter erreurs de static generation
export const dynamic = 'force-dynamic';

export interface Transaction {
  id: string;
  created_at: string;
  wallet_id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "payment" | "earning";
  description: string;
  reference_id: string | null;
  currency: string;
  currency_symbol: string;
  status: "pending" | "completed" | "failed";
  service_id: string | null;
  client_id: string | null;
  freelance_id: string | null;
  commission_amount: number | null;
  order_id: string | null;
  from_details: string | null;
  to_details: string | null;
  completed_at: string | null;
  withdrawal_method: string | null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const {
    transactions,
    loading,
    stats,
    activeTab,
    setActiveTab,
    searchQuery,
    refresh
  } = useTransactions();

  // Handle search input with debouncing
  const handleSearchChange = useCallback(
    (term: string) => {
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
    },
    [pathname, router, searchParams]
  );

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Mes Transactions</h1>
        <div className="relative w-full md:w-64">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-8"
            defaultValue={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total transactions</CardDescription>
            <CardTitle className="text-2xl">
              {stats.totalTransactions}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entrées</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              +{formatCurrency(stats.incoming)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sorties</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              -{formatCurrency(stats.outgoing)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Balance</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(stats.balance)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            Consultez l'historique de vos transactions, paiements et retraits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="deposit">Dépôts</TabsTrigger>
              <TabsTrigger value="withdrawal">Retraits</TabsTrigger>
              <TabsTrigger value="payment">Paiements</TabsTrigger>
              <TabsTrigger value="earning">Gains</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <TransactionsList 
                transactions={transactions} 
                isLoading={loading} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => refresh()}>
          Actualiser
        </Button>
      </div>
    </div>
  );
} 