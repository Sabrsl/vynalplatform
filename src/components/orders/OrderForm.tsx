"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Calendar, Clock, FileText, Upload, AlertCircle } from "lucide-react";

interface OrderFormProps {
  serviceId: string;
  price: number;
}

export function OrderForm({ serviceId, price }: OrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!requirements.trim()) {
      setError("Veuillez fournir des instructions pour cette commande");
      return;
    }

    if (!deliveryDate) {
      setError("Veuillez sélectionner une date de livraison souhaitée");
      return;
    }

    setLoading(true);

    try {
      // Simuler l'envoi des données (à remplacer par une vraie API)
      const orderData = {
        serviceId,
        requirements,
        deliveryDate,
        hasFiles: files && files.length > 0
      };
      
      // Stockage des données temporaire dans le sessionStorage
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
      
      // Redirection vers la page de paiement
      router.push(`/dashboard/orders/payment?serviceId=${serviceId}`);
    } catch (err) {
      console.error("Erreur lors de la création de la commande", err);
      setError("Une erreur s'est produite lors de la création de la commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Détails de votre commande</CardTitle>
          <CardDescription>
            Veuillez fournir toutes les informations nécessaires pour votre projet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="requirements" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Instructions du projet
            </Label>
            <Textarea
              id="requirements"
              placeholder="Décrivez précisément ce que vous attendez du freelance..."
              rows={5}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="files" className="flex items-center gap-1.5">
              <Upload className="h-4 w-4" />
              Documents & Ressources
            </Label>
            <div className="border border-input rounded-md">
              <Input
                id="files"
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-500">
              Ajoutez tout document qui pourrait aider le freelance (images, briefs, exemples...)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery-date" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Date de livraison souhaitée
            </Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-slate-600">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">Temps de réponse estimé: 24h</span>
            </div>
            <div className="font-medium">
              Total: {price.toFixed(2)} €
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Traitement en cours..." : "Valider la commande"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 