"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PaymentMethodSelection } from "@/components/orders/PaymentMethodSelection";
import { PaymentDetails } from "@/components/orders/PaymentDetails";
import { OrderRequirementsForm } from "@/components/orders/OrderRequirementsForm";
import { service } from "@/data/service";
import { generateOrderId } from "@/lib/utils";
import { OrderSummary } from "./OrderSummary";

interface OrderButtonProps {
  serviceId?: string;
  price?: number;
  showIcon?: boolean;
  variant?: "default" | "outline" | "secondary";
  fullWidth?: boolean;
  customLabel?: string;
  className?: string;
}

// Types d'étapes du processus de commande
type OrderStep = "requirements" | "selection" | "payment" | "summary";

export function OrderButton({
  serviceId,
  price,
  showIcon = true,
  variant = "default",
  fullWidth = false,
  customLabel,
  className,
}: OrderButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrderStep>("requirements");
  const [orderId, setOrderId] = useState("");
  
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
  
  // Pour cette démo, on utilise un service fictif
  const currentService = service;
  
  // Valider les instructions et passer à l'étape suivante
  const handleRequirementsComplete = () => {
    if (requirements.length < 10) {
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
    
    try {
      // Simulation d'un appel API pour créer la commande
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Génération d'un ID de commande
      const newOrderId = generateOrderId();
      setOrderId(newOrderId);
      
      // Passer à l'étape de résumé
      setCurrentStep("summary");
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      setError("Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.");
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
    // Réinitialisation après fermeture
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
      setError(null);
    }, 300);
  };
  
  // Label personnalisé pour le bouton
  const getLabel = () => {
    if (customLabel) return customLabel;
    
    const baseLabel = "Commander";
    
    if (!price) return baseLabel;
    return `${baseLabel} (${price?.toLocaleString()} F CFA)`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={`${fullWidth ? "w-full" : ""} ${
            variant === "default" ? "bg-gradient-to-r from-indigo-600 to-indigo-700" : ""
          } ${className || ''}`}
        >
          {showIcon && <ShoppingBag className="mr-2 h-4 w-4" />}
          {getLabel()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {currentStep === "requirements" && (
          <OrderRequirementsForm
            service={currentService}
            requirements={requirements}
            setRequirements={setRequirements}
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
            files={files}
            setFiles={setFiles}
            error={error}
            onBack={handleClose}
            onNext={handleRequirementsComplete}
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
          />
        )}
        
        {currentStep === "payment" && (
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
            onNext={handlePaymentComplete}
          />
        )}
        
        {currentStep === "summary" && (
          <OrderSummary
            service={currentService}
            orderId={orderId}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 