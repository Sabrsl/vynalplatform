"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsList } from "@/components/payments/TransactionsList";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { debounce } from "lodash";

export default function FinancesPage() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get transactions data and state management
  const {
    transactions,
    loading,
    stats,
    activeTab,
    setActiveTab,
    searchQuery,
    refreshTransactions
  } = useTransactions();

  // Handle search input with debouncing
  const handleSearchChange = debounce((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">{t("finances")}</h1>
        <div className="relative w-full md:w-64">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder={t("search")}
            className="pl-8"
            defaultValue={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("balance")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(stats.balance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("incoming")}</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              +{formatCurrency(stats.incoming)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("outgoing")}</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              -{formatCurrency(stats.outgoing)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "deposit" | "withdrawal")}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            {t("all")}
            <Badge variant="outline" className="ml-2">
              {transactions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deposit">
            {t("deposits")}
          </TabsTrigger>
          <TabsTrigger value="withdrawal">
            {t("withdrawals")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="m-0">
          <TransactionsList 
            transactions={transactions}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 