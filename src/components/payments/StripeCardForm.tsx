"use client";

import { useState } from "react";
import { 
  CardElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentCurrencyNotice } from "@/components/payments/PaymentCurrencyNotice";

interface StripeCardFormProps {
  amount: number;
  currency?: string;
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  loading: boolean;
  buttonText?: string;
  hideButton?: boolean;
}

/**
 * Formulaire de carte bancaire Stripe
 * 
 * Ce composant gère le formulaire de saisie de la carte et la soumission du paiement
 * Il doit être utilisé à l'intérieur d'un composant StripeElementsProvider
 */
export function StripeCardForm({
  amount,
  currency = "eur",
  clientSecret,
  onSuccess,
  onError,
  loading,
  buttonText = "Payer",
  hideButton = false
}: StripeCardFormProps) {
  // Si pas de clientSecret, on affiche un message d'attente ou d'erreur
  if (!clientSecret) {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="p-3 border rounded-md bg-slate-50 dark:bg-vynal-purple-dark/20">
            <div className="flex items-center justify-center py-2">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-sm text-slate-600 dark:text-vynal-text-secondary">
                Initialisation du paiement...
              </span>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-vynal-text-secondary text-center">
            Veuillez patienter pendant que nous préparons votre paiement sécurisé.
          </p>
        </div>
      );
    }
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Impossible d&apos;initialiser le paiement par carte. Veuillez réessayer ou contacter le support.
        </AlertDescription>
      </Alert>
    );
  }

  // Wrapper pour gérer le cas où le contexte Elements est manquant
  try {
    return (
      <StripeCardFormContent
        amount={amount}
        currency={currency}
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
        loading={loading}
        buttonText={buttonText}
        hideButton={hideButton}
      />
    );
  } catch (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Le composant de paiement n&apos;est pas correctement initialisé. Veuillez vous assurer que le composant est entouré par le provider &lt;StripeElementsProvider&gt;.
        </AlertDescription>
      </Alert>
    );
  }
}

/**
 * Contenu du formulaire carte - composant interne
 */
function StripeCardFormContent({
  amount,
  currency = "eur",
  clientSecret,
  onSuccess,
  onError,
  loading,
  buttonText = "Payer",
  hideButton = false
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

  // Exposer la fonction de soumission pour usage externe
  if (typeof window !== 'undefined') {
    // Utiliser une approche plus sûre avec un type déclaré
    (window as any).stripeSubmitHandler = handleSubmit;
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Notification sur la devise utilisée pour le paiement */}
      <PaymentCurrencyNotice compact />
      
      <div className="p-3 border rounded-md bg-slate-50 dark:bg-vynal-purple-dark/20">
        <CardElement 
          options={cardElementOptions} 
          className="py-2"
        />
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
      
      {/* Afficher le bouton uniquement si hideButton est false */}
      {!hideButton && (
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
      )}
    </form>
  );
}