"use client";

import { useState } from "react";
import { 
  CardElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface StripeCardFormProps {
  amount: number;
  currency?: string;
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  loading: boolean;
  buttonText?: string;
}

/**
 * Formulaire de carte bancaire Stripe
 * 
 * Ce composant gère le formulaire de saisie de la carte et la soumission du paiement
 */
export function StripeCardForm({
  amount,
  currency = "eur",
  clientSecret,
  onSuccess,
  onError,
  loading,
  buttonText = "Payer"
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Options de style pour le formulaire de carte
  const cardElementOptions = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4"
        }
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    }
  };
  
  // Gestion de la soumission du formulaire
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      console.error("Stripe ou Elements n'est pas encore initialisé.");
      return;
    }
    
    setCardError(null);
    setIsProcessing(true);
    
    try {
      console.log("Début du processus de paiement avec Stripe Elements");
      
      // Récupération de l'élément de carte
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error("Élément de carte non disponible");
      }
      
      // Confirmation du paiement avec Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
      
      // Gestion des erreurs
      if (error) {
        console.error("Erreur de paiement Stripe:", error);
        setCardError(error.message || "Erreur lors du traitement du paiement");
        onError(error);
      } else if (paymentIntent) {
        console.log("Paiement réussi - PaymentIntent:", paymentIntent.id, "Status:", paymentIntent.status);
        
        // Appel manuel au webhook pour s'assurer que le paiement est enregistré dans la base
        try {
          const manualWebhookResponse = await fetch('/api/stripe/manual-webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id
            })
          });
          
          console.log('Réponse du webhook manuel:', await manualWebhookResponse.json());
        } catch (webhookError) {
          console.warn('Échec de la notification manuelle du webhook:', webhookError);
          // On continue malgré l'erreur car le paiement a réussi
        }
        
        // Succès du paiement
        onSuccess(paymentIntent);
      }
    } catch (err: any) {
      console.error("Exception lors du paiement:", err);
      setCardError(err.message || "Une erreur inattendue est survenue");
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded-md bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      
      {cardError && (
        <div className="text-red-500 text-sm mt-2">
          {cardError}
        </div>
      )}
      
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Votre paiement est sécurisé. Vos informations de carte bancaire ne sont jamais stockées sur nos serveurs.
        </p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || loading || isProcessing}
      >
        {loading || isProcessing ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            Traitement en cours...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            {buttonText} {amount.toFixed(2)} {currency.toUpperCase()}
          </>
        )}
      </Button>
    </form>
  );
}