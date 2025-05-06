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
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-vynal-purple-dark dark:to-vynal-purple-darkest flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-vynal-purple-dark dark:to-vynal-purple-darkest font-poppins">
      {/* En-tête de la page */}
      <div className="max-w-5xl mx-auto pt-6 px-4 sm:px-6">
        <div className="mt-4 flex justify-between items-center">
          <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-vynal-text-primary">Confirmation de commande</h1>
          <div className="flex items-center text-[8px] sm:text-[10px] text-green-500">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span>Commande confirmée</span>
          </div>
        </div>
        
        {/* Indicateur de progression simplifié */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-secondary flex items-center justify-center text-xs sm:text-sm">1</div>
            <span className="text-[7px] sm:text-[9px] mt-1 text-vynal-text-secondary">Commande</span>
          </div>
          <div className="h-[2px] w-12 sm:w-16 bg-vynal-accent-primary"></div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-vynal-accent-primary text-vynal-purple-dark flex items-center justify-center text-xs sm:text-sm font-medium">2</div>
            <span className="text-[7px] sm:text-[9px] mt-1 text-vynal-accent-primary font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Message de confirmation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl shadow-lg">
          <div className="flex items-start">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-[10px] sm:text-xs font-medium text-green-500 mb-1">Commande confirmée</h3>
              <p className="text-[7px] sm:text-[9px] text-green-400/80">
                Le prestataire a été notifié de votre commande
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Résumé de commande - 3 colonnes */}
          <div className="md:col-span-3 bg-white dark:bg-vynal-purple-dark/60 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
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
              orderNumber={orderData.orderNumber}
              onClose={() => router.push("/dashboard/orders")}
            />
          </div>
          
          {/* Informations supplémentaires - 2 colonnes */}
          <div className="md:col-span-2 space-y-4">
            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                className="w-full p-1.5 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark rounded-md font-medium transition-colors text-[8px] sm:text-[10px]"
              >
                Aller au tableau de bord
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 