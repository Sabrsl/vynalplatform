"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, CreditCard, Clock, AlertCircle, Wallet, Loader } from "lucide-react";
import Link from "next/link";

// Données fictives pour la démo
const MOCK_WALLET = {
  balance: 875.50,
  pending: 350.00,
  total_earnings: 1225.50,
  total_withdrawals: 100.00,
  transactions: [
    {
      id: "tx-1",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 150.00,
      type: "earning",
      description: "Paiement reçu pour 'Création d'un logo professionnel'",
      status: "completed",
      from: "Entreprise XYZ"
    },
    {
      id: "tx-2",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 85.50,
      type: "earning",
      description: "Paiement reçu pour 'Rédaction d'un article SEO'",
      status: "completed",
      from: "Startup ABC"
    },
    {
      id: "tx-3",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      amount: -100.00,
      type: "withdrawal",
      description: "Retrait vers compte bancaire",
      status: "completed",
      to: "Compte Bancaire ***1234"
    },
    {
      id: "tx-4",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 350.00,
      type: "earning",
      description: "Paiement reçu pour 'Développement d'une landing page'",
      status: "pending",
      from: "Boutique Locale"
    },
    {
      id: "tx-5",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 390.00,
      type: "earning",
      description: "Paiement reçu pour 'Conception graphique de flyer'",
      status: "completed",
      from: "Restaurant Gourmet"
    }
  ]
};

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (user?.user_metadata?.role !== "freelance") {
      router.push("/dashboard");
      setError("Le portefeuille est uniquement disponible pour les freelances");
      return;
    }

    // Dans une vraie application, récupérez les données du wallet depuis l'API
    const fetchWallet = async () => {
      setLoading(true);
      try {
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Utilisez les données fictives pour la démo
        setWallet(MOCK_WALLET);
      } catch (err) {
        console.error("Erreur lors de la récupération du portefeuille", err);
        setError("Une erreur s'est produite lors du chargement de votre portefeuille");
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Portefeuille indisponible"}
          </h2>
          <p className="text-slate-600 mb-6">
            Impossible de charger les données de votre portefeuille pour le moment.
          </p>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  return (
    <div className="container max-w-5xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mon portefeuille</h1>
        <Button asChild>
          <Link href="/dashboard/wallet/withdraw">
            Retirer des fonds
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Wallet className="h-6 w-6 mr-2" />
              <h2 className="text-lg font-bold">Solde disponible</h2>
            </div>
            <div className="text-3xl font-bold mb-1">
              {wallet.balance.toFixed(2)} €
            </div>
            <p className="text-sm text-indigo-100">
              Disponible pour retrait
            </p>
            <Button 
              variant="outline" 
              className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20"
              asChild
            >
              <Link href="/dashboard/wallet/withdraw">
                Retirer des fonds
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              <h2 className="text-lg font-bold">En attente</h2>
            </div>
            <div className="text-3xl font-bold mb-1 text-yellow-600">
              {wallet.pending.toFixed(2)} €
            </div>
            <p className="text-sm text-slate-500">
              Sera disponible après livraison des commandes
            </p>
            <div className="mt-4 flex items-center">
              <AlertCircle className="h-4 w-4 text-slate-400 mr-1.5" />
              <span className="text-xs text-slate-500">
                Les fonds en attente sont libérés 14 jours après l'acceptation de la livraison
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            Consultez toutes vos transactions passées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="earnings">Gains</TabsTrigger>
              <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="m-0">
              <div className="space-y-4">
                {wallet.transactions.map((transaction: any) => (
                  <div 
                    key={transaction.id} 
                    className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          {transaction.type === 'earning' ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-500 mr-1.5" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-500 mr-1.5" />
                          )}
                          <h3 className="font-medium">
                            {transaction.type === 'earning' ? 'Paiement reçu' : 'Retrait'}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          transaction.type === 'earning' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earning' ? '+' : ''}
                          {transaction.amount.toFixed(2)} €
                        </div>
                        <div className="mt-1">
                          {transaction.status === 'pending' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              En attente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Complété
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="earnings" className="m-0">
              <div className="space-y-4">
                {wallet.transactions
                  .filter((tx: any) => tx.type === 'earning')
                  .map((transaction: any) => (
                    <div 
                      key={transaction.id} 
                      className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <ArrowDownLeft className="h-4 w-4 text-green-500 mr-1.5" />
                            <h3 className="font-medium">Paiement reçu</h3>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            +{transaction.amount.toFixed(2)} €
                          </div>
                          <div className="mt-1">
                            {transaction.status === 'pending' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                En attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Complété
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="withdrawals" className="m-0">
              <div className="space-y-4">
                {wallet.transactions
                  .filter((tx: any) => tx.type === 'withdrawal')
                  .map((transaction: any) => (
                    <div 
                      key={transaction.id} 
                      className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <ArrowUpRight className="h-4 w-4 text-red-500 mr-1.5" />
                            <h3 className="font-medium">Retrait</h3>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            {transaction.amount.toFixed(2)} €
                          </div>
                          <div className="mt-1">
                            {transaction.status === 'pending' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                En attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Complété
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 