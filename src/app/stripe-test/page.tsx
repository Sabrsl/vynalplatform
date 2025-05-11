"use client";

import { useState, useEffect } from "react";
import { StripeTestPayment } from "@/components/payments/StripeTestPayment";
import { CartesTest } from "./cartes-test";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CreditCard, Webhook as WebhookIcon, CheckCircle2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Icône webhook personnalisée
const WebhookIconCustom = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M18 20a2 2 0 0 0 0-4h-2a2 2 0 0 0 0 4" />
    <path d="M14 10a2 2 0 0 0-2 2" />
    <circle cx="6" cy="12" r="2" />
    <path d="M22 12c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2s10 4.5 10 10z" />
    <path d="M14 12H9" />
  </svg>
);

export default function StripeTestPage() {
  const [debugInfo, setDebugInfo] = useState<{mode: string, bypassAuth: boolean}>({ 
    mode: "inconnu", 
    bypassAuth: false 
  });

  const [webhookType, setWebhookType] = useState<string>("payment_intent.succeeded");
  const [webhookAmount, setWebhookAmount] = useState<string>("1500");
  const [webhookClientId, setWebhookClientId] = useState<string>("0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a");
  const [webhookFreelanceId, setWebhookFreelanceId] = useState<string>("2fde948c-91d8-4ae7-9a04-77c363680106");
  const [webhookServiceId, setWebhookServiceId] = useState<string>("baa01d07-b860-4423-ac58-5392bae6a9c6");
  const [webhookLoading, setWebhookLoading] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Vérifier les variables d'environnement en mode client
    setDebugInfo({
      mode: process.env.STRIPE_MODE || process.env.NODE_ENV || "inconnu",
      bypassAuth: process.env.NODE_ENV === 'development'
    });
  }, []);

  const testWebhook = async () => {
    if (webhookLoading) return;
    
    setWebhookLoading(true);
    setWebhookResult(null);
    
    try {
      const response = await fetch('/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: webhookType,
          data: {
            amount: parseInt(webhookAmount, 10),
            clientId: webhookClientId,
            freelanceId: webhookFreelanceId,
            serviceId: webhookServiceId
          }
        }),
      });
      
      const result = await response.json();
      setWebhookResult(result);
      
      if (result.success) {
        toast({
          title: "Test de webhook réussi",
          description: `L'événement ${webhookType} a été correctement traité`,
          variant: "default",
        });
      } else {
        toast({
          title: "Échec du test de webhook",
          description: result.error || "Une erreur est survenue lors du traitement du webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du test webhook:", error);
      toast({
        title: "Erreur",
        description: "Impossible de tester le webhook",
        variant: "destructive",
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Test du système de paiement Vynal Platform</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Cette page permet de tester le système de paiement Stripe intégré à la plateforme. 
            Utilisez les cartes de test fournies pour simuler différents scénarios.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded-md text-sm inline-block">
              Mode: {debugInfo.mode} | Bypass Auth: {debugInfo.bypassAuth ? "Activé" : "Désactivé"}
            </div>
          )}
        </div>

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Paiement Client
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <WebhookIconCustom />
              Test Webhooks
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Cartes de Test
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="payment" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <StripeTestPayment 
                  title="Paiement standard" 
                  description="Testez un paiement réussi avec une carte valide" 
                  amount={2.99}
                />
              </div>
              
              <div className="flex flex-col justify-between">
                <Card>
                  <CardHeader>
                    <CardTitle>Mode d'emploi</CardTitle>
                    <CardDescription>
                      Suivez ces étapes pour tester un paiement par carte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Cliquez sur "Démarrer le test" pour initialiser un paiement</li>
                      <li>Utilisez une carte de test Stripe (ex: 4242 4242 4242 4242)</li>
                      <li>Entrez une date d'expiration future (ex: 12/30)</li>
                      <li>Utilisez n'importe quel CVC à 3 chiffres (ex: 123)</li>
                      <li>Confirmez le paiement</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="webhook" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Test des Webhooks</CardTitle>
                  <CardDescription>
                    Simulez des événements Stripe pour tester votre intégration webhook
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhookType">Type d'événement</Label>
                      <Select
                        value={webhookType}
                        onValueChange={setWebhookType}
                      >
                        <SelectTrigger id="webhookType">
                          <SelectValue placeholder="Sélectionnez un type d'événement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment_intent.succeeded">
                            payment_intent.succeeded (Paiement réussi)
                          </SelectItem>
                          <SelectItem value="payment_intent.payment_failed">
                            payment_intent.payment_failed (Paiement échoué)
                          </SelectItem>
                          <SelectItem value="charge.refunded">
                            charge.refunded (Remboursement)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant (en centimes)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="1000"
                        value={webhookAmount}
                        onChange={(e) => setWebhookAmount(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        {parseInt(webhookAmount || "0", 10) / 100} {debugInfo.mode === "production" ? "€" : "€ (test)"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        type="text"
                        placeholder="0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a"
                        value={webhookClientId}
                        onChange={(e) => setWebhookClientId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="freelanceId">Freelance ID</Label>
                      <Input
                        id="freelanceId"
                        type="text"
                        placeholder="2fde948c-91d8-4ae7-9a04-77c363680106"
                        value={webhookFreelanceId}
                        onChange={(e) => setWebhookFreelanceId(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="serviceId">Service ID (test)</Label>
                      <Input
                        id="serviceId"
                        type="text"
                        placeholder="baa01d07-b860-4423-ac58-5392bae6a9c6"
                        value={webhookServiceId}
                        onChange={(e) => setWebhookServiceId(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={testWebhook} 
                      className="w-full"
                      disabled={webhookLoading}
                    >
                      {webhookLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <WebhookIcon className="h-4 w-4 mr-2" />
                          Tester le webhook
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Résultat du test</CardTitle>
                  <CardDescription>
                    État du traitement de l'événement webhook
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {webhookResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className={webhookResult.success ? 
                          "text-green-500 bg-green-50 p-1 rounded-full" : 
                          "text-red-500 bg-red-50 p-1 rounded-full"
                        }>
                          {webhookResult.success ? 
                            <CheckCircle2 className="h-5 w-5" /> : 
                            <AlertCircle className="h-5 w-5" />
                          }
                        </div>
                        <div className="font-medium">
                          {webhookResult.success ? 
                            "Événement traité avec succès" : 
                            "Échec du traitement"
                          }
                        </div>
                      </div>
                      
                      {webhookResult.dbCheck && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Données enregistrées :</h4>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md text-xs overflow-auto max-h-64">
                            <pre>{JSON.stringify(webhookResult.dbCheck, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      
                      {webhookResult.error && (
                        <div className="text-red-500 text-sm">
                          <span className="font-medium">Erreur :</span> {webhookResult.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <WebhookIcon className="h-12 w-12 mb-2" />
                      <p className="text-center">
                        Lancez un test pour voir les résultats
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="cards">
            <CartesTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 