"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/orders/FileUpload";
import { ArrowLeft, PackageOpen, AlertCircle, CheckCircle, Loader, SendHorizontal } from "lucide-react";
import Link from "next/link";

// Données fictives pour la démo
const MOCK_ORDER = {
  id: "order-1",
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  status: "in_progress" as const,
  service: {
    id: "service-1",
    title: "Création d'un logo professionnel",
    price: 150,
  },
  freelance: {
    id: "freelance-1",
    username: "designpro",
    full_name: "Marie Dupont",
  },
  client: {
    id: "client-1",
    username: "clientuser",
    full_name: "Jean Martin",
  },
  requirements: "Je souhaite un logo moderne et épuré pour ma société de conseil en informatique nommée 'TechSolutions'. Les couleurs préférées sont le bleu et le gris. Le logo doit être professionnel et refléter l'innovation.",
};

export default function DeliveryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "order-1"; // ID de l'ordre par défaut pour la démo
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [deliveryProcessing, setDeliveryProcessing] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (user?.user_metadata?.role !== "freelance") {
      router.push("/dashboard");
      return;
    }

    // Dans une vraie application, récupérez les données de la commande depuis l'API
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Utilisez les données fictives pour la démo
        setOrder(MOCK_ORDER);
      } catch (err) {
        console.error("Erreur lors de la récupération de la commande", err);
        setError("Une erreur s'est produite lors du chargement de la commande");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, router, orderId]);

  const handleDelivery = async () => {
    // Validation
    setError(null);
    
    if (!message.trim()) {
      setError("Veuillez ajouter un message pour le client");
      return;
    }
    
    if (!files || files.length === 0) {
      setError("Veuillez téléverser au moins un fichier");
      return;
    }
    
    setDeliveryProcessing(true);
    
    try {
      // Simulation du traitement (remplacer par l'intégration réelle avec l'API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler une livraison réussie
      setDeliverySuccess(true);
      
      // Après quelques secondes, rediriger vers les commandes
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la livraison", err);
      setError("Une erreur s'est produite lors de l'envoi de votre livraison");
    } finally {
      setDeliveryProcessing(false);
    }
  };

  const handleFilesChange = (newFiles: FileList | null) => {
    setFiles(newFiles);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (deliverySuccess) {
    return (
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card className="border-green-100">
          <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Livraison envoyée !</h2>
            <p className="text-slate-600 mb-6">
              Votre livraison a été envoyée avec succès au client.
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

  if (error || !order) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Commande introuvable"}
          </h2>
          <p className="text-slate-600 mb-6">
            Impossible de charger les détails de la commande pour le moment.
          </p>
          <Button asChild>
            <Link href="/dashboard/orders">Retour aux commandes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Livrer la commande</h1>
        <p className="text-slate-600 flex items-center mt-1">
          <PackageOpen className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Envoyez vos fichiers finaux au client
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la commande</CardTitle>
              <CardDescription>
                Commande #{order.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{order.service.title}</h3>
                <p className="text-sm text-slate-500">
                  Client: {order.client.full_name || order.client.username}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Instructions du client:</h4>
                <div className="text-sm text-slate-600 border p-3 rounded-md bg-slate-50">
                  {order.requirements || "Aucune instruction spécifique"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Livraison</CardTitle>
              <CardDescription>
                Préparez et envoyez votre travail final
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 text-red-700 text-sm mb-4">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="message">Message pour le client</Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez ce que vous avez réalisé, comment utiliser les fichiers, etc."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              
              <FileUpload
                onChange={handleFilesChange}
                label="Fichiers à livrer"
                description="Téléversez tous les fichiers finaux pour le client"
                maxFiles={10}
                maxSize={50} // 50 Mo
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                onClick={handleDelivery} 
                className="w-full" 
                disabled={deliveryProcessing || !message.trim() || !files || files.length === 0}
              >
                {deliveryProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4 mr-2" />
                    Envoyer la livraison
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Une fois la livraison envoyée, le client pourra accepter votre travail ou demander des révisions si nécessaire.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 