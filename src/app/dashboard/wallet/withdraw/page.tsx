"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertCircle, CheckCircle, Loader, Wallet, BanknoteIcon } from "lucide-react";
import Link from "next/link";
import { PaymentMethodCard } from "@/components/orders/PaymentMethodCard";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

// Données fictives pour la démo
const MOCK_WALLET = {
  balance: 875.50,
  pending: 350.00,
  fee_percentage: 5,
  min_withdrawal: 10.00,
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
    description: "Instantané",
    logo: "/assets/payment/orange-money.svg"
  },
  {
    id: "free-money",
    name: "Free Money",
    description: "Instantané",
    logo: "/assets/payment/free-money.svg"
  },
  {
    id: "wave",
    name: "Wave",
    description: "Instantané",
    logo: "/assets/payment/wave.svg"
  }
];

export default function WithdrawPage() {
  const { user } = useAuth();
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
  
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (user?.user_metadata?.role !== "freelance") {
      router.push("/dashboard");
      setError("Seuls les freelances peuvent effectuer des retraits");
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

    fetchWallet();
  }, [user, router]);

  // Calculer les frais et le montant net à chaque changement de montant ou de méthode
  useEffect(() => {
    if (!amount || !selectedMethod || !wallet) return;
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) return;
    
    const selectedMethodDetails = wallet.withdrawal_methods.find((m: { id: string; fee: string }) => m.id === selectedMethod);
    if (!selectedMethodDetails) return;
    
    const feePercentage = parseFloat(selectedMethodDetails.fee) || 0;
    const calculatedFee = (amountValue * feePercentage) / 100;
    const calculatedNet = amountValue - calculatedFee;
    
    setFeeAmount(calculatedFee);
    setNetAmount(calculatedNet);
  }, [amount, selectedMethod, wallet]);

  const handleWithdraw = async () => {
    // Validation
    setError(null);
    
    if (!amount || parseFloat(amount) <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }
    
    if (parseFloat(amount) > wallet.balance) {
      setError("Le montant demandé dépasse votre solde disponible");
      return;
    }
    
    if (parseFloat(amount) < wallet.min_withdrawal) {
      setError(`Le montant minimum de retrait est de ${wallet.min_withdrawal.toFixed(2)} €`);
      return;
    }
    
    if (!selectedMethod) {
      setError("Veuillez sélectionner une méthode de retrait");
      return;
    }
    
    setWithdrawalProcessing(true);
    
    try {
      // Simulation du traitement (remplacer par l'intégration réelle avec l'API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler un retrait réussi
      setWithdrawalSuccess(true);
      
      // Après quelques secondes, rediriger vers le portefeuille
      setTimeout(() => {
        router.push('/dashboard/wallet');
      }, 3000);
    } catch (err) {
      console.error("Erreur lors du retrait", err);
      setError("Une erreur s'est produite lors du traitement de votre demande de retrait");
    } finally {
      setWithdrawalProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (withdrawalSuccess) {
    return (
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card className="border-green-100">
          <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Demande de retrait confirmée !</h2>
            <p className="text-slate-600 mb-6">
              Votre demande de retrait a été transmise avec succès.
              Vous allez être redirigé vers votre portefeuille.
            </p>
            <div className="mt-2 animate-pulse">
              <Loader className="h-5 w-5 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !wallet) {
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
            <Link href="/dashboard/wallet">Retour au portefeuille</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-xl mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard/wallet">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Retirer des fonds</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-indigo-600" />
              <h2 className="text-lg font-medium">Solde disponible</h2>
            </div>
            <div className="text-xl font-bold">{wallet.balance.toFixed(2)} €</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demande de retrait</CardTitle>
          <CardDescription>
            Choisissez le montant et la méthode de retrait
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="flex items-center gap-1">
                Montant à retirer
                <InfoTooltip 
                  text={`Montant minimum de retrait: ${wallet.min_withdrawal.toFixed(2)} €. Des frais peuvent s'appliquer selon la méthode de paiement choisie.`}
                  position="right"
                  size="xs"
                />
              </Label>
              <div className="relative mt-1">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  min={wallet.min_withdrawal}
                  max={wallet.balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-slate-500">€</span>
                </div>
              </div>
              {parseFloat(amount) > wallet.balance && (
                <p className="text-xs text-red-500 mt-1">
                  Le montant dépasse votre solde disponible
                </p>
              )}
              {parseFloat(amount) < wallet.min_withdrawal && amount !== "" && (
                <p className="text-xs text-red-500 mt-1">
                  Le montant minimum de retrait est de {wallet.min_withdrawal.toFixed(2)} €
                </p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1 mb-1">
                Méthode de retrait
                <InfoTooltip 
                  text="Chaque méthode de paiement a des délais et des frais différents. Les virements bancaires sont gratuits mais prennent plus de temps. Les méthodes mobiles sont plus rapides mais ont des frais entre 1% et 1.5%."
                  position="top"
                  size="xs"
                />
              </Label>
              
              <div className="grid grid-cols-1 gap-2 mt-2">
                {WITHDRAWAL_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      selectedMethod === method.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center mr-3">
                        {/* <img src={method.logo} alt={method.name} className="w-6 h-6" /> */}
                        <BanknoteIcon className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{method.name}</h3>
                        <p className="text-xs text-slate-500">{method.description}</p>
                      </div>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="w-4 h-4 bg-indigo-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {amount && parseFloat(amount) > 0 && selectedMethod && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="font-medium text-slate-900 mb-3">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Montant</span>
                    <span className="font-medium">{parseFloat(amount).toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600">Frais de traitement</span>
                    <span className="font-medium">{feeAmount.toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 mt-2">
                    <span className="font-medium">Montant net reçu</span>
                    <span className="font-bold text-green-600">{netAmount.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <Button 
            type="button" 
            className="w-full" 
            disabled={withdrawalProcessing || parseFloat(amount || "0") <= 0 || !selectedMethod}
            onClick={handleWithdraw}
          >
            {withdrawalProcessing ? (
              <div className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Traitement en cours...
              </div>
            ) : (
              "Confirmer le retrait"
            )}
          </Button>
          
          <p className="text-xs text-slate-500 text-center">
            En confirmant, vous acceptez les <a href="#" className="text-indigo-600 hover:underline">conditions de retrait</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 