"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PaymentMethodSelection } from "@/components/orders/PaymentMethodSelection";
import { PaymentDetails } from "@/components/orders/PaymentDetails";
import { OrderRequirementsForm } from "@/components/orders/OrderRequirementsForm";
import { service as demoService } from "@/data/service";
import { generateOrderId } from "@/lib/utils";
import { OrderSummary } from "./OrderSummary";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast as hotToast } from "react-hot-toast";
import { processMockPayment } from "@/lib/payment/mockPayment";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useVynalPayment } from "@/lib/hooks/use-vynal-payment";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { OrderForm } from "./OrderForm";

interface OrderButtonProps {
  serviceId?: string;
  price?: number;
  showIcon?: boolean;
  variant?: "default" | "outline" | "secondary";
  fullWidth?: boolean;
  customLabel?: string;
  className?: string;
  disabled?: boolean;
  testMode?: boolean;
}

// Types d'étapes du processus de commande
type OrderStep = "requirements" | "selection" | "payment" | "summary";

// Mapping des titres pour chaque étape
const orderStepTitles: Record<OrderStep, string> = {
  requirements: "Détails de la commande",
  selection: "Méthode de paiement",
  payment: "Détails du paiement",
  summary: "Résumé de la commande"
};

export function OrderButton({
  serviceId,
  price,
  showIcon = true,
  variant = "default",
  fullWidth = false,
  customLabel,
  className,
  disabled,
  testMode = false,
}: OrderButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrderStep>("requirements");
  const [orderId, setOrderId] = useState("");
  const [serviceData, setServiceData] = useState<any>(null);
  const [loadingService, setLoadingService] = useState(false);
  
  // États pour les instructions et fichiers
  const [requirements, setRequirements] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  
  // États pour le traitement du paiement
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileOperator, setMobileOperator] = useState<"orange-money" | "free-money" | "wave">("orange-money");
  const [error, setError] = useState<string | null>(null);
  
  // Mode test/fictif
  const [isTestMode, setIsTestMode] = useState(false);
  const [testPaymentSuccess, setTestPaymentSuccess] = useState<boolean | null>(null);
  
  const supabase = createClientComponentClient();
  const { initiatePayment } = useVynalPayment();

  // Fonction pour récupérer les données du service
  const fetchServiceData = async () => {
    if (!serviceId) return false;
    
    setLoadingService(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          profiles(*),
          categories(*)
        `)
        .eq('id', serviceId)
        .single();
      
      if (error) {
        console.error("Erreur lors de la récupération du service:", error);
        setError("Impossible de récupérer les détails du service.");
        hotToast.error("Impossible de récupérer les détails du service");
        return false;
      } else if (data) {
        setServiceData(data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erreur inattendue:", err);
      setError("Une erreur est survenue lors du chargement des détails du service.");
      hotToast.error("Une erreur est survenue lors du chargement du service");
      return false;
    } finally {
      setLoadingService(false);
    }
  };

  // Charger les données du service lorsque le modal s'ouvre ou qu'on appuie sur le bouton de test
  useEffect(() => {
    if (serviceId && !serviceData && !loadingService) {
      fetchServiceData();
    }
  }, [serviceId, serviceData, loadingService, fetchServiceData]);

  // Réinitialiser les états lorsque le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      // Ne pas réinitialiser serviceData pour éviter des rechargements inutiles
    }
  }, [isOpen]);

  // Vérifier l'authentification à chaque rendu
  useEffect(() => {
    if (isOpen && !user && !authLoading) {
      setIsOpen(false);
      hotToast.error("Vous devez être connecté pour commander");
      router.push("/sign-in");
    }
  }, [isOpen, user, authLoading, router]);

  // Obtenir le service actuel (réel ou démo)
  const currentService = serviceData || demoService;

  // Fonction de traitement de paiement réelle (bouton principal)
  const handleOrderButtonClick = async () => {
    try {
      if (isLoading) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        hotToast.error("Vous devez être connecté pour commander");
        router.push("/sign-in");
        return;
      }
      
      // Vérifier si l'utilisateur est un client et non un freelance
      if (user.user_metadata?.role === "freelance") {
        toast({
          title: "Action non autorisée",
          description: "En tant que freelance, vous ne pouvez pas commander de services",
          variant: "destructive",
        });
        return;
      }
      
      // Charger les données du service si nécessaire
      let serviceReady = true;
      if (serviceId && !serviceData) {
        serviceReady = await fetchServiceData();
      }
      
      if (!serviceReady) {
        hotToast.error("Impossible de charger les informations du service");
        return;
      }
      
      // Vérifier que les données du service sont disponibles
      const serviceDetails = serviceData || demoService;
      if (!serviceDetails) {
        hotToast.error("Données de service manquantes");
        return;
      }
      
      // Ouvrir le modal avec les bonnes étapes
      setIsTestMode(false);
      setCurrentStep("requirements");
      setIsOpen(true);
    } catch (error) {
      console.error("Exception lors du démarrage de la commande:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      hotToast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour le paiement fictif direct (bouton test)
  const runTestPayment = async () => {
    try {
      if (isTestLoading) {
        return false;
      }
      
      setIsTestLoading(true);
      setError(null);
      setTestPaymentSuccess(null);
      
      // Vérifications préliminaires
      if (!user) {
        hotToast.error("Vous devez être connecté pour effectuer un test");
        router.push("/sign-in");
        return false;
      }
      
      if (user.user_metadata?.role === "freelance") {
        toast({
          title: "Action non autorisée",
          description: "En tant que freelance, vous ne pouvez pas effectuer de test",
          variant: "destructive",
        });
        return false;
      }
      
      // Récupération des données du service
      let currentServiceData = serviceData;
      if (serviceId && !currentServiceData) {
        const serviceSuccess = await fetchServiceData();
        
        if (serviceSuccess) {
          currentServiceData = serviceData;
        } else {
          hotToast.error("Impossible de récupérer les informations du service");
          return false;
        }
      }
      
      // Utiliser les données disponibles
      const serviceDetails = currentServiceData || demoService;
      
      if (!serviceDetails) {
        hotToast.error("Données de service manquantes");
        return false;
      }
      
      // Vérification des identifiants essentiels
      const effectiveServiceId = serviceId || (serviceDetails ? serviceDetails.id : null);
      if (!effectiveServiceId) {
        hotToast.error("Identifiant de service manquant");
        return false;
      }
      
      const effectiveFreelanceId = serviceDetails.freelance_id || 
        (serviceDetails.profiles ? serviceDetails.profiles.id : null);
      if (!effectiveFreelanceId) {
        hotToast.error("Identifiant de freelance manquant");
        return false;
      }
      
      // Préparer les paramètres pour le paiement fictif
      const testPaymentRequest = {
        serviceId: effectiveServiceId,
        clientId: user.id,
        freelanceId: effectiveFreelanceId,
        amount: serviceDetails.price || (price || 0),
        requirements: "Commande de test - Aucune exigence spécifique",
        deliveryTime: serviceDetails.delivery_time || 3
      };
      
      // Traiter le paiement fictif via le service dédié
      const paymentResult = await processMockPayment(testPaymentRequest);
      
      if (paymentResult.success && paymentResult.orderId) {
        // Mettre à jour les états
        setOrderId(paymentResult.orderId);
        setTestPaymentSuccess(true);
        setIsTestMode(true);
        
        // Ouvrir le modal avec le résumé
        setCurrentStep("summary");
        setIsOpen(true);
        
        // Notification de succès
        setTimeout(() => {
          hotToast.success("Test de paiement réussi!");
        }, 100);
        
        return true;
      } else {
        console.log("Échec: Paiement test échoué:", paymentResult.error);
        setTestPaymentSuccess(false);
        hotToast.error(paymentResult.error || "Échec du test de paiement");
        return false;
      }
    } catch (error) {
      console.error("Exception lors du paiement test:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Message d'erreur détaillé:", errorMessage);
      
      setTestPaymentSuccess(false);
      hotToast.error(`Erreur: ${errorMessage}`);
      return false;
    } finally {
      setIsTestLoading(false);
    }
  };
  
  // Valider les instructions et passer à l'étape suivante
  const handleRequirementsComplete = () => {
    if (!isTestMode && requirements.length < 10) {
      setError("Veuillez fournir des instructions détaillées (minimum 10 caractères).");
      return;
    }
    
    setError(null);
    setCurrentStep("selection");
  };
  
  // Passer à l'étape de saisie des détails de paiement
  const handleMethodSelected = () => {
    setCurrentStep("payment");
  };
  
  // Finaliser le paiement et passer au résumé
  const handlePaymentComplete = async () => {
    setIsLoading(true);
    setError(null);
    setTestPaymentSuccess(null);
    
    try {
      let success = false;
      
      if (isTestMode) {
        // Pour le mode test, utiliser le processus de test
        // mais sans appeler la fonction complète pour éviter de réouvrir le modal
        if (!user) {
          setError("Vous devez être connecté pour commander.");
          setIsLoading(false);
          return;
        }
        
        const serviceDetails = serviceData || demoService;
        
        if (!serviceDetails) {
          setError("Données du service manquantes.");
          setIsLoading(false);
          return;
        }
        
        // Préparer les données pour le paiement fictif
        const mockPaymentRequest = {
          serviceId: serviceId || serviceDetails.id,
          clientId: user.id,
          freelanceId: serviceDetails.freelance_id || serviceDetails.profiles?.id,
          amount: serviceDetails.price || (price || 0),
          requirements: requirements || "Commande de test - Aucune exigence spécifique",
          deliveryTime: serviceDetails.delivery_time || 3
        };
        
        // Traiter le paiement fictif
        const paymentResult = await processMockPayment(mockPaymentRequest);
        
        if (paymentResult.success && paymentResult.orderId) {
          setOrderId(paymentResult.orderId);
          success = true;
          setTestPaymentSuccess(true);
          hotToast.success("Paiement test effectué avec succès");
        } else {
          setError(paymentResult.error || "Une erreur est survenue lors du traitement du paiement fictif.");
          setTestPaymentSuccess(false);
          hotToast.error("Échec du paiement test");
          setIsLoading(false);
          return;
        }
      } else {
        // Utilisation du hook useVynalPayment pour traiter le paiement
        if (!user) {
          setError("Vous devez être connecté pour commander.");
          setIsLoading(false);
          return;
        }
        
        const serviceDetails = serviceData || demoService;
        
        if (!serviceDetails) {
          setError("Données du service manquantes.");
          setIsLoading(false);
          return;
        }
        
        // Préparation des données pour le paiement - respecter l'interface PaymentProps
        const paymentData = {
          serviceId: serviceId || serviceDetails.id,
          freelanceId: serviceDetails.freelance_id || serviceDetails.profiles?.id,
          amount: serviceDetails.price || (price || 0),
          requirements: requirements || "Aucune exigence spécifique",
          deliveryTime: serviceDetails.delivery_time || 3
        };
        
        // Traitement du paiement via le hook
        const paymentResult = await initiatePayment(paymentData);
        
        if (paymentResult && paymentResult.success && paymentResult.orderId) {
          setOrderId(paymentResult.orderId);
          success = true;
          hotToast.success("Paiement effectué avec succès");
        } else {
          setError(paymentResult?.error ? String(paymentResult.error) : "Une erreur est survenue lors du traitement du paiement.");
          setIsLoading(false);
          return;
        }
      }
      
      if (success) {
        // Passer à l'étape de résumé
        setCurrentStep("summary");
      }
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      setError("Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.");
      setTestPaymentSuccess(false);
      hotToast.error("Une erreur est survenue lors du paiement");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Retour à l'étape précédente
  const handleBack = () => {
    if (currentStep === "payment") {
      setCurrentStep("selection");
    } else if (currentStep === "selection") {
      setCurrentStep("requirements");
    } else {
      // Si on est à la première étape, on ferme la modale
      handleClose();
    }
  };
  
  // Fermer la modale et réinitialiser l'état
  const handleClose = () => {
    setIsOpen(false);
    setIsLoading(false);
    
    // Réinitialisation immédiate de certains états critiques
    setError(null);
    setTestPaymentSuccess(null);
    
    // Réinitialisation après fermeture pour les animations
    setTimeout(() => {
      setCurrentStep("requirements");
      setRequirements("");
      setDeliveryDate("");
      setFiles(null);
      setSelectedPaymentMethod("card");
      setCardNumber("");
      setCardHolder("");
      setExpiryDate("");
      setCvv("");
      setPaypalEmail("");
      setPhoneNumber("");
      setMobileOperator("orange-money");
      setOrderId("");
      // On ne réinitialise pas serviceData ici pour éviter de recharger à chaque fois
      setIsSummaryVisible(false);
      setIsTestMode(false);
    }, 300);
  };
  
  // Label personnalisé pour le bouton
  const getLabel = () => {
    if (customLabel) return customLabel;
    
    const baseLabel = "Commander";
    
    if (!price) return baseLabel;
    return `${baseLabel} (${price?.toLocaleString()} F CFA)`;
  };

  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  const closeOrderModal = () => {
    handleClose();
  };

  return (
    <div className={fullWidth ? "w-full" : "w-auto"}>
      {/* Bouton de commande principal */}
      <button
        className={cn(
          buttonVariants({
            variant,
            size: "default",
          }),
          "w-full relative group",
          className
        )}
        disabled={disabled || authLoading || isLoading || isTestLoading}
        onClick={(e) => {
          e.preventDefault(); 
          console.log("Bouton commander cliqué");
          handleOrderButtonClick();
        }}
        type="button"
        aria-label="Commander ce service"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Chargement...
          </span>
        ) : (
          <>
            {showIcon && <ShoppingBag className="mr-2 h-4 w-4" />}
            {getLabel()}
          </>
        )}
      </button>

      {/* Bouton de test séparé */}
      <button
        className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs py-1.5 px-3 rounded-md flex items-center justify-center transition-all duration-200 relative active:scale-95"
        disabled={disabled || authLoading || isLoading || isTestLoading}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Bouton de test cliqué");
          runTestPayment();
        }}
        type="button"
        aria-label="Tester un paiement fictif"
      >
        {isTestLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Test en cours...
          </span>
        ) : (
          <>
            <span className="bg-white text-amber-500 text-[10px] px-1 rounded-full mr-1 inline-flex items-center justify-center">TEST</span>
            Tester un paiement
          </>
        )}
      </button>

      {/* Modal de commande */}
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[500px] bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm text-vynal-text-primary" 
          aria-labelledby="order-dialog-title"
          aria-describedby="order-description"
        >
          <DialogHeader className="pb-2">
            <DialogTitle id="order-dialog-title" className="text-lg font-semibold text-vynal-accent-primary">
              {orderStepTitles[currentStep]}
            </DialogTitle>
            <DialogDescription id="order-description" className="text-vynal-text-secondary">
              Formulaire de commande et de paiement
            </DialogDescription>
          </DialogHeader>
          
          {loadingService && (
            <div className="absolute inset-0 bg-vynal-purple-dark/90 flex items-center justify-center rounded-xl z-50">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-vynal-accent-primary mx-auto mb-2" />
                <p className="text-vynal-text-primary">Chargement du service...</p>
              </div>
            </div>
          )}
          
          {/* Switch pour activer le mode test */}
          {currentStep === "requirements" && (
            <div className="absolute top-4 right-14 flex items-center gap-2">
              <Switch 
                id="test-mode" 
                checked={isTestMode} 
                onCheckedChange={setIsTestMode}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label htmlFor="test-mode" className="text-xs font-medium text-amber-400">
                Mode Test
              </Label>
            </div>
          )}
          
          {currentStep === "requirements" && (
            <OrderRequirementsForm
              service={currentService}
              requirements={requirements}
              setRequirements={setRequirements}
              deliveryDate={deliveryDate}
              setDeliveryDate={setDeliveryDate}
              files={files}
              setFiles={setFiles}
              onBack={handleClose}
              onNext={handleRequirementsComplete}
              error={error}
              isTestMode={isTestMode}
            />
          )}
          
          {currentStep === "selection" && (
            <PaymentMethodSelection 
              service={currentService}
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
              error={error}
              onBack={handleBack}
              onNext={handleMethodSelected}
              requirements={requirements}
              deliveryDate={deliveryDate}
              files={files}
              loading={isLoading}
              isTestMode={isTestMode}
            />
          )}
          
          {currentStep === "payment" && (
            <>
              {isTestMode && (
                <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-500">Mode Test activé</h3>
                      <p className="text-xs text-amber-400/80 mt-1">
                        Ce paiement est fictif et sera marqué comme un TEST dans le système.
                        Aucune transaction réelle ne sera effectuée.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <PaymentDetails 
                service={currentService}
                selectedPaymentMethod={selectedPaymentMethod}
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
                cardHolder={cardHolder}
                setCardHolder={setCardHolder}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                cvv={cvv}
                setCvv={setCvv}
                paypalEmail={paypalEmail}
                setPaypalEmail={setPaypalEmail}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                mobileOperator={mobileOperator}
                setMobileOperator={setMobileOperator}
                loading={isLoading}
                error={error}
                onBack={handleBack}
                onNext={() => handlePaymentComplete()}
                isTestMode={isTestMode}
                testPaymentSuccess={testPaymentSuccess}
              />
            </>
          )}
          
          {currentStep === "summary" && (
            <OrderSummary
              service={currentService}
              orderId={orderId}
              onClose={closeOrderModal}
              isTestMode={isTestMode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 