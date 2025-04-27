"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertCircle, CheckCircle, Loader, Wallet, BanknoteIcon } from "lucide-react";
import { PaymentMethodCard } from "@/components/orders/PaymentMethodCard";
import { CURRENCY } from "@/lib/constants";
import { useUser } from "@/hooks/useUser";

// Données fictives pour la démo
const MOCK_WALLET = {
  balance: 875.50,
  pending: 350.00,
  fee_percentage: 5,
  min_withdrawal: 2000,
  withdrawal_methods: [
    {
      id: "bank",
      name: "Virement bancaire",
      description: "3-5 jours ouvrés",
      fee: "0%",
      processing_time: "3-5 jours ouvrés",
      logo: "/assets/payment/bank.svg"
    },
    {
      id: "orange-money",
      name: "Orange Money",
      description: "Instantané",
      fee: "1.5%",
      processing_time: "Instantané",
      logo: "/assets/payment/orange-money.svg"
    },
    {
      id: "free-money",
      name: "Free Money",
      description: "Instantané",
      fee: "1.5%",
      processing_time: "Instantané",
      logo: "/assets/payment/free-money.svg"
    },
    {
      id: "wave",
      name: "Wave",
      description: "Instantané",
      fee: "1%",
      processing_time: "Sous 24h",
      logo: "/assets/payment/wave.svg"
    }
  ],
  saved_methods: [
    {
      id: "bank-1",
      type: "bank",
      name: "Compte bancaire principal",
      details: "BNP Paribas ****1234",
      is_default: true
    }
  ]
};

const WITHDRAWAL_METHODS = [
  {
    id: "bank",
    name: "Virement bancaire",
    description: "3-5 jours ouvrés",
    logo: "/assets/payment/bank.svg"
  },
  {
    id: "orange-money",
    name: "Orange Money",
    description: "Sous 24h",
    logo: "/assets/payment/orange-money.svg"
  },
  {
    id: "free-money",
    name: "Free Money",
    description: "Sous 24h",
    logo: "/assets/payment/free-money.svg"
  },
  {
    id: "wave",
    name: "Wave",
    description: "Sous 24h",
    logo: "/assets/payment/wave.svg"
  }
];

export default function WithdrawPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [withdrawalProcessing, setWithdrawalProcessing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [feeAmount, setFeeAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  
  const { isFreelance } = useUser();
  
  // Combinaison des états de chargement
  const isLoading = loading || authLoading;
  
  // Fonction de récupération des données du wallet
  const fetchWallet = async () => {
    setLoading(true);
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Utilisez les données fictives pour la démo
      setWallet(MOCK_WALLET);
      
      // Sélectionner la méthode par défaut si elle existe
      const defaultMethod = MOCK_WALLET.saved_methods.find((m: { is_default: boolean; type: string }) => m.is_default);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod.type);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du portefeuille", err);
      setError("Une erreur s'est produite lors du chargement de votre portefeuille");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Attendre que les données d'authentification soient chargées
    if (authLoading) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Vérifier le rôle de l'utilisateur
    if (!isFreelance) {
      router.push("/dashboard");
      setError("Seuls les freelances peuvent effectuer des retraits");
      return;
    }

    fetchWallet();
  }, [user, authLoading, router, isFreelance]);

  // Calculer les frais et le montant net à chaque changement de montant ou de méthode
  useEffect(() => {
    if (!amount || !selectedMethod || !wallet) return;
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) return;
    
    // Application d'un taux fixe de 20%
    const feePercentage = 20; // Taux fixe de 20%
    const calculatedFee = (amountValue * feePercentage) / 100;
    const calculatedNet = amountValue - calculatedFee;
    
    setFeeAmount(calculatedFee);
    setNetAmount(calculatedNet);
  }, [amount, selectedMethod, wallet]);

  // Une fonction pour formater les montants avec la devise FCFA
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${CURRENCY.symbol}`;
  };

  // Vérifier si le montant est valide
  const isAmountValid = () => {
    if (!amount || amount === "") return false;
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) return false;
    if (amountValue > wallet.balance) return false;
    if (amountValue < wallet.min_withdrawal) return false;
    
    return true;
  };
  
  // Fonction pour valider l'utilisateur et ses droits
  const validateUserAccess = () => {
    if (!user) {
      router.push("/auth/login");
      return false;
    }
    
    if (!isFreelance) {
      router.push("/dashboard");
      setError("Seuls les freelances peuvent effectuer des retraits");
      return false;
    }
    
    return true;
  };

  // Sécurité côté client - vérification à chaque étape critique
  useEffect(() => {
    if (!authLoading) {
      validateUserAccess();
    }
  }, [user, authLoading]);

  const handleWithdraw = async () => {
    // Validation
    setError(null);
    
    try {
      // Vérification de sécurité supplémentaire avant le traitement
      if (!validateUserAccess()) {
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setError("Veuillez entrer un montant valide");
        return;
      }
      
      if (parseFloat(amount) > wallet.balance) {
        setError(`Le montant demandé dépasse votre solde disponible de ${formatAmount(wallet.balance)}`);
        return;
      }
      
      if (parseFloat(amount) < wallet.min_withdrawal) {
        setError(`Le montant minimum de retrait est de ${formatAmount(wallet.min_withdrawal)}`);
        return;
      }
      
      if (!selectedMethod) {
        setError("Veuillez sélectionner une méthode de retrait");
        return;
      }
      
      // Dernière vérification de sécurité avant le traitement
      if (!isAmountValid()) {
        setError("Le montant saisi n'est pas valide. Veuillez vérifier votre solde.");
        return;
      }
      
      setWithdrawalProcessing(true);
      
      // Simulation du traitement (remplacer par l'intégration réelle avec l'API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler un retrait réussi
      setWithdrawalSuccess(true);
    } catch (err) {
      console.error("Erreur lors du retrait", err);
      setError("Une erreur s'est produite lors du traitement de votre demande de retrait. Veuillez réessayer plus tard.");
    } finally {
      setWithdrawalProcessing(false);
    }
  };

  // Fonction pour gérer la redirection vers la page de paiements
  const goToWalletPage = () => {
    try {
      // Vérification de sécurité avant la redirection
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      if (!isFreelance) {
        router.push('/dashboard');
        return;
      }
      
      // Assurer que la redirection se fait vers la page wallet et non vers le dashboard principal
      router.push('/dashboard/wallet');
    } catch (error) {
      console.error("Erreur lors de la redirection:", error);
    }
  };

  // Fonction pour gérer le clic sur le bouton retour
  const handleRetour = (e: React.MouseEvent) => {
    // Empêcher tout comportement par défaut qui pourrait interférer
    if (e) e.preventDefault();
    
    // Vérification de sécurité avant la redirection
    if (validateUserAccess()) {
      goToWalletPage();
    }
  };

  // Pour gérer la redirection et son nettoyage
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout | null = null;
    
    if (withdrawalSuccess) {
      // Vérification de sécurité avant la redirection
      if (validateUserAccess()) {
        redirectTimer = setTimeout(() => {
          goToWalletPage();
        }, 3000);
      }
    }
    
    // Nettoyer le timer si le composant est démonté
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [withdrawalSuccess, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm animate-pulse">Chargement de votre portefeuille...</p>
        </div>
      </div>
    );
  }

  if (withdrawalSuccess) {
    return (
      <div className="container max-w-xl px-4 py-4 mx-auto sm:py-6">
        <Card className="border border-slate-200 shadow-sm dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-dark">
          <CardContent className="pt-5 pb-6 flex flex-col items-center text-center sm:pt-6 sm:pb-8">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-3 mb-3 sm:mb-4">
              <CheckCircle className="h-7 w-7 sm:h-10 sm:w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-vynal-text-primary mb-2">Demande de retrait confirmée !</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-vynal-text-secondary mb-5 sm:mb-6">
              Votre demande de retrait a été transmise avec succès.
              Vous allez être redirigé vers votre page de paiements.
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 items-center">
              <div className="animate-pulse">
                <Loader className="h-5 w-5 text-slate-600 dark:text-vynal-text-secondary" />
              </div>
              <Button 
                variant="link" 
                onClick={(e) => handleRetour(e)}
                className="text-slate-700 hover:text-slate-900 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary font-medium"
              >
                Retour immédiat aux paiements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="container max-w-4xl mx-auto py-6 sm:py-8 px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            {error || "Portefeuille indisponible"}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Impossible de charger les données de votre portefeuille pour le moment.
          </p>
          <Button onClick={(e) => handleRetour(e)}>
            Retour aux paiements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-4 mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl sm:py-6">
      <div className="mb-5 sm:mb-6">
        <Button variant="ghost" size="sm" onClick={(e) => handleRetour(e)} className="mb-3 hover:bg-slate-100 dark:hover:bg-vynal-purple-secondary/20 text-slate-700 dark:text-vynal-text-secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux paiements
        </Button>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-vynal-text-primary">Retirer des fonds</h1>
        <p className="text-sm text-slate-600 dark:text-vynal-text-secondary mt-1">
          Transférez vos revenus vers votre compte bancaire ou votre portefeuille mobile. Des frais de service de 20% s'appliquent à tous les retraits.
        </p>
      </div>

      <Card className="mb-5 sm:mb-6 shadow-sm border-slate-200 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-dark">
        <CardContent className="pt-5 pb-5 sm:pt-6 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-vynal-purple-secondary/20 flex items-center justify-center mr-3">
                <Wallet className="h-5 w-5 text-slate-600 dark:text-vynal-accent-primary" />
              </div>
              <div>
                <h2 className="text-base font-medium text-slate-800 dark:text-vynal-text-primary">Solde disponible</h2>
                <p className="text-xs text-slate-500 dark:text-vynal-text-secondary">Votre solde actuel pour retrait</p>
              </div>
            </div>
            <div className="pl-12 sm:pl-0">
              <div className="text-xl sm:text-3xl font-bold text-yellow-600 dark:text-vynal-status-warning">{formatAmount(wallet.balance)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-dark">
        <CardHeader className="px-5 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-base sm:text-lg text-slate-800 dark:text-vynal-text-primary">Demande de retrait</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-vynal-text-secondary mt-1">
            Choisissez le montant et la méthode de retrait. Vous verrez le montant net qui vous sera versé après déduction des frais de 20%.
            <p className="mt-1 text-xs italic text-slate-500 dark:text-vynal-text-secondary/80">
              Ces frais comprennent les frais de transfert selon le mode de paiement choisi, les frais de traitement et les frais de service tiers.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6 space-y-5 sm:space-y-6">
          <div className="space-y-5 sm:space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-vynal-purple-secondary/20 border border-red-200 dark:border-red-800/30 rounded-md text-red-600 dark:text-red-400 text-sm">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="amount" className="flex items-center gap-1 text-slate-700 dark:text-vynal-text-secondary mb-1.5">
                Montant à retirer
              </Label>
              <div className="relative mt-1">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  min={wallet.min_withdrawal}
                  max={wallet.balance}
                  step="1" // Pas de décimales pour le FCFA
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`pl-16 pr-4 py-2 h-11 sm:h-10 text-base sm:text-sm bg-white dark:bg-vynal-purple-secondary/20 border-slate-200 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-primary dark:placeholder-vynal-text-secondary/50 transition-all duration-200 ${
                    parseFloat(amount) > wallet.balance || (parseFloat(amount) < wallet.min_withdrawal && amount !== "") 
                      ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-700 dark:focus:border-red-700" 
                      : "focus:ring-slate-500 focus:border-slate-500 dark:focus:ring-vynal-accent-primary dark:focus:border-vynal-accent-primary"
                  }`}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-slate-500 dark:text-vynal-text-secondary">{CURRENCY.symbol}</span>
                </div>
              </div>
              <div className="min-h-[1.5rem] mt-1.5">
                {parseFloat(amount) > wallet.balance && (
                  <p className="text-xs text-red-500 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    Le montant dépasse votre solde de {formatAmount(wallet.balance)}
                  </p>
                )}
                {parseFloat(amount) < wallet.min_withdrawal && amount !== "" && (
                  <p className="text-xs text-red-500 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    Le minimum de retrait est {formatAmount(wallet.min_withdrawal)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1 mb-2 text-slate-700 dark:text-vynal-text-secondary">
                Méthode de retrait
              </Label>
              
              <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2 sm:gap-3">
                {WITHDRAWAL_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${
                      selectedMethod === method.id
                        ? "border-slate-500 bg-slate-50 dark:bg-vynal-purple-secondary/40 dark:border-vynal-accent-primary/70 shadow-sm"
                        : "border-slate-200 dark:border-vynal-purple-secondary/30 hover:border-slate-300 dark:hover:border-vynal-accent-primary/30 hover:bg-slate-50/50 dark:hover:bg-vynal-purple-secondary/30 bg-white dark:bg-vynal-purple-secondary/20"
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 transition-colors duration-200 ${
                        selectedMethod === method.id 
                          ? "bg-slate-100 dark:bg-vynal-purple-dark/60" 
                          : "bg-slate-100 dark:bg-vynal-purple-dark/40"
                      }`}>
                        <img 
                          src={method.logo} 
                          alt={method.name} 
                          className="h-6 w-6"
                        />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-sm text-slate-800 dark:text-vynal-text-primary">{method.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-vynal-text-secondary">{method.description}</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ml-2 transition-all duration-200 ${
                      selectedMethod === method.id 
                        ? "bg-slate-600 dark:bg-vynal-accent-primary scale-100" 
                        : "bg-transparent scale-0"
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            {amount && parseFloat(amount) > 0 && selectedMethod && (
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-vynal-purple-secondary/30 sm:mt-6">
                <h3 className="font-medium text-slate-800 dark:text-vynal-text-primary mb-3">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-vynal-text-secondary">Montant</span>
                    <span className="font-medium text-slate-800 dark:text-vynal-text-primary">{formatAmount(parseFloat(amount))}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-vynal-text-secondary">Frais de service (20%)</span>
                    <span className="font-medium text-slate-800 dark:text-vynal-text-primary">{formatAmount(feeAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-vynal-purple-secondary/30 mt-2">
                    <span className="font-medium text-slate-700 dark:text-vynal-text-secondary">Montant net reçu</span>
                    <span className="font-bold text-emerald-600 dark:text-vynal-status-success">{formatAmount(netAmount)}</span>
                  </div>
                </div>
                
                {selectedMethod && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-vynal-purple-secondary/20 rounded-md border border-amber-100 dark:border-amber-800/40">
                    <p className="text-xs text-amber-700 dark:text-vynal-status-warning flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Délai de traitement : </strong> 
                        {selectedMethod === 'bank' 
                          ? '3-5 jours ouvrés pour les virements bancaires.' 
                          : 'Sous 24h pour les méthodes de paiement mobile.'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-3 pt-2 pb-5 px-5 sm:px-6 sm:pb-6">
          <Button 
            type="button" 
            className="w-full py-2.5 sm:py-2 text-base sm:text-sm bg-slate-700 hover:bg-slate-800 dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary text-white"
            disabled={withdrawalProcessing || !isAmountValid() || !selectedMethod}
            onClick={handleWithdraw}
          >
            {withdrawalProcessing ? (
              <div className="flex items-center justify-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Traitement en cours...
              </div>
            ) : (
              "Confirmer le retrait"
            )}
          </Button>
          
          <p className="text-xs text-slate-500 dark:text-vynal-text-secondary text-center">
            En confirmant, vous acceptez les <Link href="/withdrawal-terms" className="text-pink-600 dark:text-vynal-accent-primary hover:text-pink-700 dark:hover:text-vynal-accent-secondary hover:underline">conditions de retrait</Link> et la déduction de 20% de frais de service.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 