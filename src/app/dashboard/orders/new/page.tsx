"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ServiceSummary } from "@/components/orders/ServiceSummary";
import { OrderForm } from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Loader } from "lucide-react";
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

export default function NewOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (user?.user_metadata?.role === "freelance") {
      router.push("/dashboard");
      return;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
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
            Impossible de charger les détails du service demandé.
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
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Commander un service</h1>
        <p className="text-slate-600 flex items-center mt-1">
          <Clock className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Délai de traitement estimé: 24-48h après la validation de votre commande
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ServiceSummary service={service} />
        </div>
        
        <div className="lg:col-span-2">
          <OrderForm serviceId={service.id} price={service.price} />
        </div>
      </div>
    </div>
  );
} 