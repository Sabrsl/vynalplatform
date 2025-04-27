"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, DollarSign, Download, ExternalLink, FileText, 
  Filter, History, Info, Loader2, Wallet, AlertCircle
} from "lucide-react";

export default function ClientPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Charger les données (simulé)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Données fictives pour la démo
  const transactions = [
    { 
      id: "txn-1", 
      date: "2023-12-15", 
      description: "Paiement pour site web e-commerce", 
      amount: -450, 
      status: "completed", 
      type: "payment" 
    },
    { 
      id: "txn-2", 
      date: "2023-12-10", 
      description: "Paiement pour design de logo", 
      amount: -120, 
      status: "completed", 
      type: "payment" 
    },
    { 
      id: "txn-3", 
      date: "2023-11-28", 
      description: "Paiement pour consultation SEO", 
      amount: -200, 
      status: "completed", 
      type: "payment" 
    },
    { 
      id: "txn-4", 
      date: "2023-11-15", 
      description: "Remboursement partiel - projet annulé", 
      amount: 75, 
      status: "completed", 
      type: "refund" 
    },
  ];
  
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
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm animate-pulse">
            Chargement de vos paiements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Paiements
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez vos paiements et suivez vos transactions
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={() => setLoading(true)}
        >
          <History className="h-4 w-4 mr-1" /> 
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="overview" className="flex-1">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Historique</TabsTrigger>
          <TabsTrigger value="methods" className="flex-1">Moyens de paiement</TabsTrigger>
        </TabsList>
        
        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Transactions récentes</CardTitle>
                <CardDescription>Vos derniers paiements et remboursements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length > 0 ? (
                    transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'payment' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {transaction.type === 'payment' ? 
                              <CreditCard className="h-4 w-4" /> : 
                              <Download className="h-4 w-4" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                          </div>
                        </div>
                        <div className={`font-medium ${
                          transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.amount < 0 ? '-' : '+'}{formatAmount(transaction.amount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-slate-400">Aucune transaction récente</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("history")} className="w-full">
                  Voir tout l'historique <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Moyens de paiement</CardTitle>
                <CardDescription>Gérez vos méthodes de paiement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center p-3 border rounded-lg">
                    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-sm">Carte Visa ••••4242</p>
                      <p className="text-xs text-slate-500">Exp: 12/25</p>
                    </div>
                    <div className="text-xs px-2 py-1 bg-emerald-100 text-emerald-600 rounded">
                      Par défaut
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("methods")} className="w-full">
                  Gérer les moyens de paiement <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Historique des transactions */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Historique des transactions</CardTitle>
                  <CardDescription>Toutes vos transactions sur la plateforme</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="h-4 w-4 mr-1" /> Filtrer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === 'payment' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type === 'payment' ? 'Paiement' : 'Remboursement'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.amount < 0 ? '-' : '+'}{formatAmount(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full items-center">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" /> Exporter
                </Button>
                <div className="text-sm text-slate-500">
                  Affichage de {transactions.length} transactions
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Moyens de paiement */}
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Vos moyens de paiement</CardTitle>
                  <CardDescription>Gérez vos cartes et méthodes de paiement</CardDescription>
                </div>
                <Button variant="outline">
                  <CreditCard className="h-4 w-4 mr-1" /> Ajouter une carte
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Carte Visa ••••4242</p>
                      <p className="text-sm text-slate-500">Exp: 12/25</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-600 rounded mr-3">
                      Par défaut
                    </span>
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="bg-amber-50 p-4 w-full rounded-lg border border-amber-200 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Informations de sécurité</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Vos informations de paiement sont sécurisées par notre partenaire de paiement.
                    Nous ne stockons pas directement vos données de carte.
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 