"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowDown, ArrowUp, CreditCard, ExternalLink, Filter, 
  History, Loader2, Wallet
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function ClientPaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = searchParams.get("tab") || "all";
  const searchQuery = searchParams.get("search") || "";
  
  const [search, setSearch] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  
  // Données fictives pour la démo (simulées)
  const transactions = [
    { 
      id: "txn-1", 
      created_at: "2023-12-15", 
      description: "Paiement pour site web e-commerce", 
      amount: 450, 
      status: "completed", 
      type: "payment",
      reference_id: "ord-e3f89a"
    },
    { 
      id: "txn-2", 
      created_at: "2023-12-10", 
      description: "Paiement pour design de logo", 
      amount: 120, 
      status: "completed", 
      type: "payment",
      reference_id: "ord-a7c23f"
    },
    { 
      id: "txn-3", 
      created_at: "2023-11-28", 
      description: "Paiement pour consultation SEO", 
      amount: 200, 
      status: "completed", 
      type: "payment",
      reference_id: "ord-b6d12e"
    },
    { 
      id: "txn-4",
      created_at: "2023-11-15", 
      description: "Remboursement partiel - projet annulé", 
      amount: 75, 
      status: "completed", 
      type: "refund",
      reference_id: "ref-f9e34d"
    },
  ];
  
  const wallet = {
    balance: 150,
    total_payments: 770,
    total_refunds: 75
  };
  
  // Charger les données (simulé)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  
  // Formater le montant avec le signe €
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
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
  
  // Filtrer les transactions selon la recherche
  const filteredTransactions = useMemo(() => {
    if (!search) return transactions || [];
    
    const searchLower = search.toLowerCase();
    return transactions.filter((transaction) => {
      return (
        transaction.id.toLowerCase().includes(searchLower) ||
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.reference_id.toLowerCase().includes(searchLower) ||
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.status.toLowerCase().includes(searchLower)
      );
    });
  }, [transactions, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm animate-pulse">
            Chargement de vos paiements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Mes paiements</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solde du portefeuille
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total des paiements
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(wallet.total_payments)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total des remboursements
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(wallet.total_refunds)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <Tabs defaultValue={currentTab} value={currentTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">Toutes les transactions</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="refunds">Remboursements</TabsTrigger>
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
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {search ? `Aucun résultat pour "${search}"` : "Aucune transaction à afficher"}
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold leading-none tracking-tight">
                              {transaction.description}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)} · Réf: {transaction.reference_id}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`font-medium ${
                              transaction.type === 'refund' 
                                ? 'text-green-600 dark:text-green-500' 
                                : 'text-red-600 dark:text-red-500'
                            }`}>
                              {transaction.type === 'refund' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {transaction.status === 'completed' 
                                ? 'Terminé' 
                                : transaction.status === 'pending' 
                                ? 'En attente' 
                                : 'Échoué'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Moyens de paiement</CardTitle>
          <CardDescription>Gérez vos méthodes de paiement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center p-3 border rounded-lg">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">Carte Visa ••••4242</p>
                <p className="text-xs text-muted-foreground">Exp: 12/25</p>
              </div>
              <div className="text-xs px-2 py-1 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded">
                Par défaut
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" size="sm">
            Ajouter un moyen de paiement
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 