"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ServiceSummary } from "@/components/orders/ServiceSummary";
import { PaymentMethodCard } from "@/components/orders/PaymentMethodCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, AlertCircle, CheckCircle, Loader, FileCheck } from "lucide-react";
import Link from "next/link";

// Données fictives pour la démo
const MOCK_SERVICE = {
  id: "service-1",
  title: "Création d'un logo professionnel avec identité visuelle complète",
  description: "Je vais concevoir un logo professionnel unique pour votre entreprise ou projet. Le processus comprend 3 propositions initiales, puis des révisions illimitées sur le design choisi jusqu'à votre satisfaction totale. Livraison de tous les fichiers sources (AI, EPS, PDF, PNG, JPG) prêts à l'emploi.",
  price: 150,
  delivery_time: 3,
  category: "Design & Graphisme",
  freelance: {
    id: "freelance-1",
    username: "designpro",
    full_name: "Marie Dupont",
    avatar_url: "https://i.pravatar.cc/150?img=32",
    rating: 4.9
  },
  image_url: "https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?q=80&w=2000&auto=format&fit=crop"
};

const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Carte bancaire",
    description: "Visa, Mastercard, CB",
    logo: "/assets/payment/cards.svg"
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Paiement sécurisé via PayPal",
    logo: "/assets/payment/paypal.svg"
  },
  {
    id: "orange-money",
    name: "Orange Money",
    description: "Paiement mobile via Orange Money",
    logo: "/assets/payment/orange-money.svg"
  },
  {
    id: "free-money",
    name: "Free Money",
    description: "Paiement mobile via Free Money",
    logo: "/assets/payment/free-money.svg"
  },
  {
    id: "wave",
    name: "Wave",
    description: "Paiement mobile via Wave",
    logo: "/assets/payment/wave.svg"
  }
];

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Récupérer les détails de la commande du sessionStorage
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (user?.user_metadata?.role === "freelance") {
      router.push("/dashboard");
      setError("Les freelances ne peuvent pas effectuer de paiements");
      return;
    }

    // Récupérer les détails de la commande du sessionStorage
    const savedOrder = sessionStorage.getItem('pendingOrder');
    if (savedOrder) {
      setOrderDetails(JSON.parse(savedOrder));
    } else {
      setError("Aucune commande en attente n'a été trouvée");
    }

    // Dans une vraie application, récupérez les données du service depuis l'API
    const fetchService = async () => {
      setLoading(true);
      try {
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!serviceId) {
          setError("Aucun service n'a été spécifié");
          return;
        }
        
        // Utilisez les données fictives pour la démo
        setService(MOCK_SERVICE);
      } catch (err) {
        console.error("Erreur lors de la récupération du service", err);
        setError("Une erreur s'est produite lors du chargement du service");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [user, router, serviceId]);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    setError(null);
    setPaymentProcessing(true);

    try {
      // Simulation d'un paiement (remplacer par l'intégration réelle avec le fournisseur de paiement)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler une commande réussie
      setPaymentSuccess(true);
      
      // Effacer les données de commande temporaires
      sessionStorage.removeItem('pendingOrder');
      
      // Après quelques secondes, rediriger vers le tableau de bord
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 3000);
    } catch (err) {
      console.error("Erreur lors du traitement du paiement", err);
      setError("Une erreur s'est produite lors du traitement du paiement");
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card className="border-green-100">
          <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Paiement réussi !</h2>
            <p className="text-slate-600 mb-6">
              Votre commande a été confirmée et le freelance a été notifié.
              Vous allez être redirigé vers vos commandes.
            </p>
            <div className="mt-2 animate-pulse">
              <Loader className="h-5 w-5 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Service introuvable"}
          </h2>
          <p className="text-slate-600 mb-6">
            Impossible de traiter votre paiement pour le moment.
          </p>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/dashboard/orders/new?serviceId=${serviceId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux détails de la commande
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Finaliser votre commande</h1>
        <p className="text-slate-600 flex items-center mt-1">
          <CreditCard className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Sélectionnez votre méthode de paiement préférée pour confirmer la commande
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ServiceSummary service={service} />
          {orderDetails && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Détails de la commande</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4 space-y-2 text-sm">
                {orderDetails.requirements && (
                  <div>
                    <p className="font-medium text-slate-700">Instructions:</p>
                    <p className="text-slate-600 line-clamp-2">{orderDetails.requirements}</p>
                  </div>
                )}
                {orderDetails.deliveryDate && (
                  <div>
                    <p className="font-medium text-slate-700">Livraison souhaitée:</p>
                    <p className="text-slate-600">{new Date(orderDetails.deliveryDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {orderDetails.hasFiles && (
                  <div className="flex items-center text-slate-600">
                    <FileCheck className="h-4 w-4 mr-1.5 text-green-500" />
                    <span>Fichiers joints</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Méthode de paiement</CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez payer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 text-red-700 text-sm mb-4">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    id={method.id}
                    name={method.name}
                    description={method.description}
                    logo={method.logo}
                    selected={selectedPaymentMethod === method.id}
                    onSelect={setSelectedPaymentMethod}
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-slate-500">
                  Prix total (TTC)
                </div>
                <div className="font-medium text-lg">
                  {service.price.toFixed(2)} €
                </div>
              </div>
              <Button 
                onClick={handlePayment} 
                className="w-full" 
                disabled={paymentProcessing || !selectedPaymentMethod}
              >
                {paymentProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : "Payer maintenant"}
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">
                En cliquant sur "Payer maintenant", vous acceptez nos conditions générales de vente et notre politique de confidentialité.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 