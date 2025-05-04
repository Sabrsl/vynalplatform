"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { useAuth } from "@/hooks/useAuth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast as hotToast } from "react-hot-toast";
import { Shield, AlertCircle, CheckCircle, ChevronLeft } from "lucide-react";
import { useOrderData } from "@/hooks/useOrderData";

export default function SummaryPage({ params }: { params: { serviceId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const serviceId = params.serviceId;

  const {
    service,
    loadingService,
    isLoading,
    error,
    orderData,
    setOrderData,
    setIsLoading
  } = useOrderData(serviceId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in?callbackUrl=" + encodeURIComponent(`/order/${serviceId}/summary`));
    }
  }, [user, authLoading, router, serviceId]);

  const handleBack = () => {
    // Redirection vers la page de paiement unifiée
    router.push(`/order/${serviceId}/unified-checkout`);
  };

  const handleComplete = async () => {
    if (!user?.id || !orderData.orderId) return;
    
    setIsLoading(true);
    try {
      // Rediriger vers le tableau de bord avec l'ID de la commande
      router.push(`/dashboard/orders/${orderData.orderId}`);
    } catch (err) {
      console.error("Erreur lors de la navigation:", err);
      setOrderData({ 
        ...orderData,
        error: "Une erreur est survenue lors de la navigation"
      });
      setIsLoading(false);
    }
  };

  if (authLoading || loadingService) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin text-vynal-accent-primary mx-auto mb-2 border-4 border-current border-t-transparent rounded-full"></div>
          <p className="text-vynal-text-primary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest">
      {/* En-tête de la page */}
      <div className="max-w-5xl mx-auto pt-6 px-4 sm:px-6">
        <button 
          onClick={handleBack}
          className="flex items-center text-vynal-text-secondary hover:text-vynal-accent-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Retour au paiement</span>
        </button>
        
        <div className="mt-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-vynal-text-primary">Confirmation de commande</h1>
          <div className="flex items-center text-green-500">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">Commande confirmée</span>
          </div>
        </div>
        
        {/* Indicateur de progression simplifié */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-secondary flex items-center justify-center text-sm">1</div>
            <span className="text-xs mt-1 text-vynal-text-secondary">Commande</span>
          </div>
          <div className="h-[2px] w-16 bg-vynal-accent-primary"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-vynal-accent-primary text-vynal-purple-dark flex items-center justify-center text-sm font-medium">2</div>
            <span className="text-xs mt-1 text-vynal-accent-primary font-medium">Confirmation</span>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Résumé de commande - 3 colonnes */}
          <div className="md:col-span-3 bg-vynal-purple-dark/60 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
            <OrderSummary
              service={service}
              requirements={orderData.requirements}
              files={orderData.files ? Array.from(orderData.files) : []}
              paymentMethod={orderData.selectedPaymentMethod}
              onBack={handleBack}
              onNext={handleComplete}
              loading={isLoading}
              error={error}
              isTestMode={orderData.isTestMode}
              orderId={orderData.orderId || ""}
              onClose={() => router.push("/dashboard/orders")}
            />
          </div>
          
          {/* Informations supplémentaires - 2 colonnes */}
          <div className="md:col-span-2 space-y-4">
            {/* Carte de confirmation */}
            <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-xl shadow-lg">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-500 mb-2">Commande confirmée</h3>
                  <p className="text-sm text-green-400/80">
                    Votre commande a été traitée avec succès. Le prestataire a été notifié et commencera à travailler sur votre projet.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Carte de numéro de commande */}
            <div className="bg-vynal-purple-dark/60 backdrop-blur-sm p-5 rounded-xl shadow-lg">
              <h3 className="font-medium text-vynal-text-primary mb-3">Détails de la commande</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs text-vynal-text-secondary">Numéro de commande</h4>
                  <p className="text-sm font-mono font-medium text-vynal-accent-primary">
                    {orderData.orderId || ""}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs text-vynal-text-secondary">Date de commande</h4>
                  <p className="text-sm text-vynal-text-primary">
                    {new Date().toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs text-vynal-text-secondary">Mode de paiement</h4>
                  <p className="text-sm text-vynal-text-primary">
                    {orderData.isTestMode ? 'Paiement fictif (TEST)' : (
                      orderData.selectedPaymentMethod === 'card' ? 'Carte bancaire' :
                      orderData.selectedPaymentMethod === 'paypal' ? 'PayPal' :
                      orderData.selectedPaymentMethod === 'orange-money' ? 'Orange Money' :
                      orderData.selectedPaymentMethod === 'wave' ? 'Wave' :
                      orderData.selectedPaymentMethod === 'free-money' ? 'Free Money' :
                      'Méthode inconnue'
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Prochaines étapes */}
            <div className="bg-vynal-purple-dark/60 backdrop-blur-sm p-5 rounded-xl shadow-lg">
              <h3 className="font-medium text-vynal-text-primary mb-3">Prochaines étapes</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-secondary flex items-center justify-center text-xs mr-3 mt-0.5">1</div>
                  <p className="text-sm text-vynal-text-primary">Le prestataire confirmera la prise en charge de votre commande</p>
                </div>
                <div className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-secondary flex items-center justify-center text-xs mr-3 mt-0.5">2</div>
                  <p className="text-sm text-vynal-text-primary">Vous pouvez suivre l'avancement dans votre tableau de bord</p>
                </div>
                <div className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-secondary flex items-center justify-center text-xs mr-3 mt-0.5">3</div>
                  <p className="text-sm text-vynal-text-primary">Vous recevrez des notifications à chaque étape importante</p>
                </div>
              </div>
              <button
                onClick={handleComplete}
                className="w-full mt-4 p-2 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark rounded-md font-medium transition-colors"
              >
                Accéder à mon tableau de bord
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 