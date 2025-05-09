"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/orders/FileUpload";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Loader, FileType, MessagesSquare } from "lucide-react";
import Link from "next/link";

// Données fictives pour la démo
const MOCK_ORDER = {
  id: "order-1",
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  status: "delivered" as const,
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
  delivery: {
    message: "Voici la première version de votre logo selon vos instructions. J'ai créé plusieurs variantes pour vous donner des options. N'hésitez pas à me faire part de vos retours !",
    files: [
      { name: "logo_techsolutions_v1.pdf", size: 2.5 },
      { name: "logo_techsolutions_v1.png", size: 0.8 },
      { name: "logo_variations.jpg", size: 1.2 },
    ]
  }
};

export default function RevisionPage() {
  const { user } = useAuth();
  const { isFreelance } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [revisionRequest, setRevisionRequest] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [revisionProcessing, setRevisionProcessing] = useState(false);
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (isFreelance) {
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
  }, [user, router, orderId, isFreelance]);

  const handleRevisionRequest = async () => {
    // Validation
    setError(null);
    
    if (!revisionRequest.trim()) {
      setError("Veuillez expliquer les modifications souhaitées");
      return;
    }
    
    setRevisionProcessing(true);
    
    try {
      // Simulation du traitement (remplacer par l'intégration réelle avec l'API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler une demande réussie
      setRevisionSuccess(true);
      
      // Après quelques secondes, rediriger vers les commandes
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la demande de révision", err);
      setError("Une erreur s'est produite lors de l'envoi de votre demande de révision");
    } finally {
      setRevisionProcessing(false);
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

  if (revisionSuccess) {
    return (
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card className="border-green-100">
          <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Demande de révision envoyée !</h2>
            <p className="text-slate-600 mb-6">
              Votre demande de révision a été transmise au freelance.
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
        <h1 className="text-2xl font-bold">Demander une révision</h1>
        <p className="text-slate-600 flex items-center mt-1">
          <RefreshCw className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Précisez les modifications que vous souhaitez obtenir
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Livraison actuelle</CardTitle>
              <CardDescription>
                Reçue le {new Date(order.created_at).toLocaleDateString('fr-FR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{order.service.title}</h3>
                <p className="text-sm text-slate-500">
                  Freelance: {order.freelance.full_name || order.freelance.username}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Message du freelance:</h4>
                <div className="text-sm text-slate-600 border p-3 rounded-md bg-slate-50">
                  {order.delivery.message}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Fichiers livrés:</h4>
                <div className="space-y-2">
                  {order.delivery.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center p-2 border rounded-md bg-slate-50">
                      <FileType className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {file.size} Mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la révision</CardTitle>
              <CardDescription>
                Expliquez clairement les modifications souhaitées
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
                <Label htmlFor="revisionRequest">Modifications demandées</Label>
                <Textarea
                  id="revisionRequest"
                  placeholder="Expliquez précisément ce que vous souhaitez modifier dans la livraison actuelle..."
                  rows={6}
                  value={revisionRequest}
                  onChange={(e) => setRevisionRequest(e.target.value)}
                />
              </div>
              
              <FileUpload
                onChange={handleFilesChange}
                label="Documents de référence (optionnel)"
                description="Ajoutez des fichiers pour illustrer vos demandes"
                maxFiles={5}
                maxSize={10}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                onClick={handleRevisionRequest} 
                className="w-full" 
                disabled={revisionProcessing || !revisionRequest.trim()}
              >
                {revisionProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Demander la révision
                  </>
                )}
              </Button>
              <div className="flex justify-between w-full text-xs text-slate-500 mt-2">
                <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:text-indigo-800">
                  <Link href={`/dashboard/messages?orderId=${order.id}`}>
                    <MessagesSquare className="h-3.5 w-3.5 mr-1.5" />
                    Discuter avec le freelance
                  </Link>
                </Button>
                <p>
                  Vous pouvez demander jusqu'à 3 révisions gratuites
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 