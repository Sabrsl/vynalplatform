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
    <div className="container max-w-xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/wallet">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au portefeuille
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Retirer des fonds</h1>
        <p className="text-slate-600 flex items-center mt-1">
          <BanknoteIcon className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Transférez vos gains vers le compte de votre choix
          </span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demande de retrait</CardTitle>
          <CardDescription>
            Solde disponible: <span className="font-medium">{wallet.balance.toFixed(2)} €</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 text-red-700 text-sm mb-4">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à retirer (€)</Label>
            <div className="relative">
              <BanknoteIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="amount"
                type="number"
                min="1"
                max={wallet.balance}
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Minimum: {wallet.min_withdrawal.toFixed(2)} €</span>
              <button 
                type="button"
                className="text-indigo-600 hover:underline"
                onClick={() => setAmount(wallet.balance.toString())}
              >
                Retirer tout ({wallet.balance.toFixed(2)} €)
              </button>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label>Méthode de retrait</Label>
            <div className="space-y-3">
              {wallet.withdrawal_methods.map((method: { id: string; name: string; processing_time: string; fee: string; logo: string }) => (
                <PaymentMethodCard
                  key={method.id}
                  id={method.id}
                  name={method.name}
                  description={`${method.processing_time} • Frais: ${method.fee}`}
                  logo={method.logo}
                  selected={selectedMethod === method.id}
                  onSelect={setSelectedMethod}
                />
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