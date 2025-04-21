"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, CreditCard, Clock, AlertCircle, Wallet, Loader, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

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
      type: "earning" as const,
      description: "Paiement reçu pour 'Création d'un logo professionnel'",
      status: "completed" as const,
      from: "Entreprise XYZ",
      order_id: "CMD-2023-0568"
    },
    {
      id: "tx-2",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 85.50,
      type: "earning" as const,
      description: "Paiement reçu pour 'Rédaction d'un article SEO'",
      status: "completed" as const,
      from: "Startup ABC",
      order_id: "CMD-2023-0742"
    },
    {
      id: "tx-3",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      amount: -100.00,
      type: "withdrawal" as const,
      description: "Retrait vers compte bancaire",
      status: "completed" as const,
      to: "Compte Bancaire ***1234"
    },
    {
      id: "tx-4",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 350.00,
      type: "earning" as const,
      description: "Paiement reçu pour 'Développement d'une landing page'",
      status: "pending" as const,
      from: "Boutique Locale",
      order_id: "CMD-2023-0954"
    },
    {
      id: "tx-5",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 390.00,
      type: "earning" as const,
      description: "Paiement reçu pour 'Conception graphique de flyer'",
      status: "completed" as const,
      from: "Restaurant Gourmet",
      order_id: "CMD-2023-0389"
    }
  ]
};

type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
  from?: string; // For earning transactions
  to?: string; // For withdrawal transactions
  order_id?: string; // ID de la commande pour les transactions de type earning
};

type WalletData = {
  balance: number;
  pending: number;
  transactions: Transaction[];
  lastUpdated?: number; // Horodatage de la dernière mise à jour
};

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const { isFreelance, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"all" | "earnings" | "withdrawals">("all");
  const transactionsPerPage = 10;
  
  // Combinaison des états de chargement pour éviter des redirections prématurées
  const isLoading = loading || authLoading || userLoading || isNavigating || isRefreshing;
  
  // Fonction pour gérer la navigation vers la page de retrait
  const handleWithdrawalNavigation = () => {
    setIsNavigating(true);
    router.push('/dashboard/wallet/withdraw');
  };
  
  // Fonction pour obtenir les données du wallet depuis le cache
  const getCachedWalletData = (): WalletData | null => {
    if (typeof window === 'undefined') return null;
    
    const cachedData = localStorage.getItem('walletData');
    if (!cachedData) return null;
    
    try {
      const parsedData = JSON.parse(cachedData);
      const timestamp = parsedData.lastUpdated || 0;
      const now = Date.now();
      
      // Vérifier si les données ont moins de 5 minutes
      if (now - timestamp < 5 * 60 * 1000) {
        return parsedData;
      }
    } catch (err) {
      console.error('Erreur lors de la lecture du cache:', err);
    }
    
    return null;
  };
  
  // Fonction pour rafraîchir les données en arrière-plan
  const refreshDataInBackground = async () => {
    setIsRefreshing(true);
    
    try {
      // Simuler un délai court pour l'API en dev, aucun délai en prod
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // TODO: Remplacer par l'appel API réel
      const newData: WalletData = {
        balance: Math.floor(Math.random() * 1500) + 500,
        pending: Math.floor(Math.random() * 300) + 100,
        transactions: MOCK_WALLET.transactions,
        lastUpdated: Date.now()
      };
      
      // Mettre à jour l'état et le cache
      setWallet(newData);
      localStorage.setItem('walletData', JSON.stringify(newData));
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      // Ne pas afficher d'erreur à l'utilisateur pendant un rafraîchissement en arrière-plan
    } finally {
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    // Attendre que les données d'authentification et de profil soient chargées
    if (authLoading || userLoading) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Vérifier le rôle de l'utilisateur
    if (!isFreelance) {
      router.push("/dashboard");
      setError("Le portefeuille est uniquement disponible pour les freelances");
      return;
    }

    // Récupérer les données du wallet
    fetchWallet();
  }, [user, isFreelance, authLoading, userLoading, router]);

  // Fonction pour rafraîchir les données du wallet
  const refreshWallet = () => {
    fetchWallet();
  };

  // Fonction pour formater le temps écoulé depuis la dernière mise à jour
  const getLastUpdatedText = () => {
    if (!wallet?.lastUpdated) return 'Jamais mis à jour';
    
    const now = Date.now();
    const diff = now - wallet.lastUpdated;
    
    if (diff < 60000) return 'Mis à jour il y a quelques secondes';
    if (diff < 3600000) return `Mis à jour il y a ${Math.floor(diff / 60000)} minute(s)`;
    return `Mis à jour il y a ${Math.floor(diff / 3600000)} heure(s)`;
  };

  // Modifier la fonction fetchWallet pour utiliser le cache
  const fetchWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier le cache d'abord
      const cachedData = getCachedWalletData();
      if (cachedData) {
        setWallet(cachedData);
        setLoading(false);
        
        // Rafraîchir en arrière-plan pour obtenir de nouvelles données
        refreshDataInBackground();
        return;
      }
      
      // Si pas de données en cache, simuler un délai pour l'API en dev
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // TODO: Remplacer par l'appel API réel
      const data: WalletData = {
        balance: 1250.75,
        pending: 350.25,
        transactions: MOCK_WALLET.transactions,
        lastUpdated: Date.now()
      };
      
      setWallet(data);
      
      // Stocker dans le cache
      localStorage.setItem('walletData', JSON.stringify(data));
    } catch (err) {
      console.error('Erreur fetchWallet:', err);
      setError("Impossible de charger les données du portefeuille");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild>
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
            <Button variant="outline" onClick={refreshWallet}>
              Réessayer
            </Button>
          </div>
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

  // Pagination functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Filter transactions based on active tab
  const getFilteredTransactions = () => {
    if (!wallet) return [];
    
    let filteredTransactions = [...wallet.transactions];
    
    if (activeTab === "earnings") {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === "earning");
    } else if (activeTab === "withdrawals") {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === "withdrawal");
    }
    
    return filteredTransactions;
  };

  // Get current page transactions
  const getCurrentPageTransactions = () => {
    const filteredTransactions = getFilteredTransactions();
    const startIndex = (currentPage - 1) * transactionsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + transactionsPerPage);
  };

  // Calculate total pages
  const filteredTransactions = getFilteredTransactions();
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / transactionsPerPage));
  
  // Reset to page 1 when changing tabs
  const handleTabChange = (value: "all" | "earnings" | "withdrawals") => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  // Afficher un indicateur de chargement plus subtil si les données sont déjà disponibles
  const renderCardContent = () => {
    if (loading && !wallet) {
      // Squelette de chargement pour le premier rendu
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-pulse">
          <div className="bg-gradient-to-br from-indigo-500/50 to-purple-500/50 rounded-lg h-[200px]"></div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-[200px]"></div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Wallet className="h-6 w-6 mr-2" />
              <h2 className="text-lg font-bold">Solde disponible</h2>
              {loading && (
                <div className="ml-2 h-4 w-4">
                  <Loader className="h-4 w-4 animate-spin text-white/70" />
                </div>
              )}
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
              onClick={handleWithdrawalNavigation}
              disabled={isNavigating}
            >
              {isNavigating ? "Redirection..." : "Retirer des fonds"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              <h2 className="text-lg font-bold">En attente</h2>
              {loading && (
                <div className="ml-2 h-4 w-4">
                  <Loader className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}
              <div className="ml-1">
                <InfoTooltip 
                  text="Les montants en attente correspondent aux paiements qui vous ont été envoyés mais qui ne sont pas encore disponibles pour retrait. Ils seront automatiquement débloqués 14 jours après validation de votre livraison par le client."
                  position="top"
                  size="sm"
                />
              </div>
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
    );
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold dark:text-vynal-text-primary">Paiements</h1>
        <div className="flex gap-2">
          {wallet && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDataInBackground}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:text-vynal-text-secondary dark:border-vynal-purple-secondary/40 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-text-primary"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation' : 'Actualiser'}
            </Button>
          )}
          <Button 
            onClick={handleWithdrawalNavigation} 
            disabled={isNavigating}
            className="bg-slate-700 hover:bg-slate-800 dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary text-white"
          >
            {isNavigating ? "Redirection..." : "Retirer des fonds"}
          </Button>
        </div>
      </div>

      {renderCardContent()}
      
      {wallet?.lastUpdated && (
        <div className="text-xs text-slate-400 dark:text-vynal-text-secondary text-right mb-4">
          {getLastUpdatedText()}
        </div>
      )}

      <Card className="border-slate-200 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-secondary/10">
        <CardHeader className="sm:px-6 sm:py-5">
          <CardTitle className="dark:text-vynal-text-primary">Historique des transactions</CardTitle>
          <CardDescription className="dark:text-vynal-text-secondary">
            Consultez toutes vos transactions passées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => handleTabChange(value as "all" | "earnings" | "withdrawals")}>
            <div className="overflow-x-auto pb-1 scrollbar-hide">
              <TabsList className="bg-pink-50 dark:bg-pink-500/10 border border-pink-200/50 dark:border-pink-500/20 p-1 rounded-lg inline-flex whitespace-nowrap w-auto mb-4">
                <TabsTrigger 
                  value="all" 
                  className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-400 data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
                >
                  Toutes
                </TabsTrigger>
                <TabsTrigger 
                  value="earnings" 
                  className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-400 data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
                >
                  Gains
                </TabsTrigger>
                <TabsTrigger 
                  value="withdrawals" 
                  className="text-[10px] sm:text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-400 data-[state=active]:text-white dark:data-[state=active]:text-vynal-text-primary"
                >
                  Retraits
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="m-0">
              <div className="space-y-4">
                {getCurrentPageTransactions().map((transaction: any) => (
                  <div 
                    key={transaction.id} 
                    className="border border-slate-200 dark:border-vynal-purple-secondary/30 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-vynal-purple-secondary/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <div className="flex items-center">
                          {transaction.type === 'earning' ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-500 dark:text-vynal-status-success mr-1.5" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-500 dark:text-vynal-status-error mr-1.5" />
                          )}
                          <h3 className="font-medium dark:text-vynal-text-primary">
                            {transaction.type === 'earning' ? 'Paiement reçu' : 'Retrait'}
                          </h3>
                          {transaction.type === 'earning' && transaction.order_id && (
                            <span className="ml-2 text-xs bg-slate-100 dark:bg-vynal-purple-secondary/30 text-slate-600 dark:text-vynal-text-secondary px-2 py-0.5 rounded">
                              {transaction.order_id}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-vynal-text-secondary mt-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-vynal-text-secondary/70 mt-1">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <div className={`font-medium ${
                          transaction.type === 'earning' ? 'text-green-600 dark:text-vynal-status-success' : 'text-red-600 dark:text-vynal-status-error'
                        }`}>
                          {transaction.type === 'earning' ? '+' : ''}
                          {transaction.amount.toFixed(2)} €
                        </div>
                        <div className="mt-1">
                          {transaction.status === 'pending' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-vynal-purple-secondary/20 dark:text-vynal-status-warning">
                              En attente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-vynal-purple-secondary/20 dark:text-vynal-status-success">
                              Complété
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 flex items-center justify-center border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200 dark:hover:text-pink-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Afficher seulement les pages proches de la page actuelle
                        const range = 1; // +/- 1 page
                        return (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - range && page <= currentPage + range)
                        );
                      })
                      .map((page, index, array) => {
                        // Ajouter des points de suspension si nécessaire
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <span className="text-pink-300/60 dark:text-pink-300/60 text-xs px-1">...</span>
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(page)}
                                className={`h-8 w-8 p-0 text-xs ${
                                  currentPage === page 
                                    ? "bg-gradient-to-r from-pink-500 to-pink-400 text-white"
                                    : "border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200"
                                }`}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        }
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={`h-8 w-8 p-0 text-xs ${
                              currentPage === page 
                                ? "bg-gradient-to-r from-pink-500 to-pink-400 text-white"
                                : "border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200"
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })
                    }
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 flex items-center justify-center border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200 dark:hover:text-pink-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="earnings" className="m-0">
              <div className="space-y-4">
                {getCurrentPageTransactions().map((transaction: any) => (
                  <div 
                    key={transaction.id} 
                    className="border border-slate-200 dark:border-vynal-purple-secondary/30 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-vynal-purple-secondary/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <div className="flex items-center flex-wrap">
                          <ArrowDownLeft className="h-4 w-4 text-green-500 dark:text-vynal-status-success mr-1.5" />
                          <h3 className="font-medium dark:text-vynal-text-primary">Paiement reçu</h3>
                          {transaction.order_id && (
                            <span className="ml-2 text-xs bg-slate-100 dark:bg-vynal-purple-secondary/30 text-slate-600 dark:text-vynal-text-secondary px-2 py-0.5 rounded">
                              {transaction.order_id}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-vynal-text-secondary mt-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-vynal-text-secondary/70 mt-1">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <div className="font-medium text-green-600 dark:text-vynal-status-success">
                          +{transaction.amount.toFixed(2)} €
                        </div>
                        <div className="mt-1">
                          {transaction.status === 'pending' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-vynal-purple-secondary/20 dark:text-vynal-status-warning">
                              En attente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-vynal-purple-secondary/20 dark:text-vynal-status-success">
                              Complété
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 flex items-center justify-center border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200 dark:hover:text-pink-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const range = 1;
                        return (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - range && page <= currentPage + range)
                        );
                      })
                      .map((page, index, array) => {
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <span className="text-pink-300/60 dark:text-pink-300/60 text-xs px-1">...</span>
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(page)}
                                className={`h-8 w-8 p-0 text-xs ${
                                  currentPage === page 
                                    ? "bg-gradient-to-r from-pink-500 to-pink-400 text-white"
                                    : "border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200"
                                }`}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        }
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={`h-8 w-8 p-0 text-xs ${
                              currentPage === page 
                                ? "bg-gradient-to-r from-pink-500 to-pink-400 text-white"
                                : "border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200"
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })
                    }
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 flex items-center justify-center border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200 dark:hover:text-pink-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="withdrawals" className="m-0">
              <div className="space-y-4">
                {getCurrentPageTransactions().map((transaction: any) => (
                  <div 
                    key={transaction.id} 
                    className="border border-slate-200 dark:border-vynal-purple-secondary/30 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-vynal-purple-secondary/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <div className="flex items-center">
                          <ArrowUpRight className="h-4 w-4 text-red-500 dark:text-vynal-status-error mr-1.5" />
                          <h3 className="font-medium dark:text-vynal-text-primary">Retrait</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-vynal-text-secondary mt-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-vynal-text-secondary/70 mt-1">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <div className="font-medium text-red-600 dark:text-vynal-status-error">
                          {transaction.amount.toFixed(2)} €
                        </div>
                        <div className="mt-1">
                          {transaction.status === 'pending' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-vynal-purple-secondary/20 dark:text-vynal-status-warning">
                              En attente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-vynal-purple-secondary/20 dark:text-vynal-status-success">
                              Complété
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 flex items-center justify-center border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200 dark:hover:text-pink-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const range = 1;
                        return (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - range && page <= currentPage + range)
                        );
                      })
                      .map((page, index, array) => {
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <span className="text-pink-300/60 dark:text-pink-300/60 text-xs px-1">...</span>
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(page)}
                                className={`h-8 w-8 p-0 text-xs ${
                                  currentPage === page 
                                    ? "bg-gradient-to-r from-pink-500 to-pink-400 text-white"
                                    : "border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200"
                                }`}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        }
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={`h-8 w-8 p-0 text-xs ${
                              currentPage === page 
                                ? "bg-gradient-to-r from-pink-500 to-pink-400 text-white"
                                : "border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200"
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })
                    }
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 flex items-center justify-center border-pink-200 text-pink-700 hover:text-pink-800 hover:border-pink-300 dark:border-pink-500/30 dark:text-pink-200 dark:hover:text-pink-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 