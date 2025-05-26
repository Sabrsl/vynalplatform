"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentCurrencyNotice } from "@/components/payments/PaymentCurrencyNotice";
import {
  convertToEur,
  normalizeAmount,
  convertCurrency,
} from "@/lib/utils/currency-updater";
import useCurrency from "@/hooks/useCurrency";

interface StripeCardFormProps {
  amount: number;
  currency?: string;
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  loading: boolean;
  buttonText?: string;
  hideButton?: boolean;
  serviceId: string;
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
  hideButton = false,
  serviceId,
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
            Veuillez patienter pendant que nous préparons votre paiement
            sécurisé.
          </p>
        </div>
      );
    }

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Impossible d&apos;initialiser le paiement par carte. Veuillez
          réessayer ou contacter le support.
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
        serviceId={serviceId}
      />
    );
  } catch (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Le composant de paiement n&apos;est pas correctement initialisé.
          Veuillez vous assurer que le composant est entouré par le provider
          &lt;StripeElementsProvider&gt;.
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
  hideButton = false,
  serviceId,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Logging pour débogage
  console.log(
    `StripeCardForm - Montant reçu: ${amount} ${currency.toUpperCase()}`,
  );

  // CORRECTION: Considérer que le montant original est toujours en XOF
  // puis le normaliser et le convertir en EUR pour Stripe
  let displayAmount = amount;
  let originalCurrency = "XOF";
  let wasNormalized = false;

  // Si le montant semble anormal, le normaliser
  const normalizedAmount = normalizeAmount(amount, "XOF");
  if (normalizedAmount !== amount) {
    console.warn(
      `StripeCardForm - Montant anormal détecté: ${amount} XOF, normalisé à ${normalizedAmount} XOF`,
    );
    displayAmount = normalizedAmount;
    wasNormalized = true;
  } else {
    displayAmount = amount;
  }

  // Toujours convertir le montant en EUR pour Stripe
  const amountInEur = convertToEur(displayAmount, "XOF", false) as number;

  // Utilisation du hook useCurrency pour obtenir la devise de l'utilisateur
  const { currency: userCurrency } = useCurrency();

  // Calculer le montant dans la devise de l'utilisateur
  const amountInUserCurrency =
    userCurrency.code === "XOF"
      ? displayAmount
      : userCurrency.code === "EUR"
        ? amountInEur
        : (convertCurrency(
            displayAmount,
            "XOF",
            userCurrency.code,
            false,
          ) as number);

  // Formater les montants pour l'affichage
  const formattedUserCurrencyAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: userCurrency.code,
    minimumFractionDigits:
      userCurrency.code === "XOF" || userCurrency.code === "XAF" ? 0 : 2,
    maximumFractionDigits:
      userCurrency.code === "XOF" || userCurrency.code === "XAF" ? 0 : 2,
  }).format(amountInUserCurrency);

  const formattedEuroAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInEur);

  console.log(`StripeCardForm - Montant traité:`, {
    originalAmount: amount,
    currency: "XOF", // Tous les prix sont stockés en XOF dans la BD
    normalizedAmount: displayAmount,
    wasNormalized,
    amountInEur,
    userCurrency: userCurrency.code,
    amountInUserCurrency,
    conversionRate: amountInEur / displayAmount,
  });

  // Options de style pour le formulaire de carte
  const cardElementOptions = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
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
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        },
      );

      // Gestion des erreurs
      if (error) {
        console.error("Erreur de paiement Stripe:", error);
        setCardError(error.message || "Erreur lors du traitement du paiement");
        onError(error);
      } else if (paymentIntent) {
        console.log(
          "Paiement réussi - PaymentIntent:",
          paymentIntent.id,
          "Status:",
          paymentIntent.status,
        );

        // Ajout du serviceId et des informations de conversion pour cohérence avec PayPal
        const paymentData = {
          ...paymentIntent,
          serviceId, // Ajout du serviceId pour lier correctement le paiement au service
          provider: "stripe",
          amount: amountInEur, // Montant en EUR
          originalAmount: displayAmount, // Montant original en XOF
          originalCurrency: "XOF", // Devise originale toujours XOF
          userCurrency: userCurrency.code, // Devise affichée à l'utilisateur
          amountInUserCurrency: amountInUserCurrency, // Montant dans la devise de l'utilisateur
          wasNormalized: wasNormalized, // Indique si une normalisation a été appliquée
        };

        // Appel manuel au webhook pour s'assurer que le paiement est enregistré dans la base
        try {
          const manualWebhookResponse = await fetch(
            "/api/stripe/manual-webhook",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
              }),
            },
          );

          console.log(
            "Réponse du webhook manuel:",
            await manualWebhookResponse.json(),
          );
        } catch (webhookError) {
          console.warn(
            "Échec de la notification manuelle du webhook:",
            webhookError,
          );
          // On continue malgré l'erreur car le paiement a réussi
        }

        // Succès du paiement
        onSuccess(paymentData);
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
  if (typeof window !== "undefined") {
    // Utiliser une approche plus sûre avec un type déclaré
    (window as any).stripeSubmitHandler = handleSubmit;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Notification sur la devise utilisée pour le paiement */}
      <PaymentCurrencyNotice amount={amount} compact useFixedAmount={false} />

      <div className="p-3 border rounded-md bg-slate-50 dark:bg-vynal-purple-dark/20">
        <CardElement options={cardElementOptions} className="py-2" />
      </div>

      {cardError && (
        <div className="text-red-500 text-sm mt-2">{cardError}</div>
      )}

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Paiement sécurisé - Données bancaires non stockées
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
              {userCurrency.code === "EUR" ? (
                // Affichage pour EUR
                `${buttonText} ${formattedEuroAmount}`
              ) : (
                // Affichage pour les autres devises avec conversion
                <>
                  {buttonText} {formattedEuroAmount}
                  <span className="ml-1 text-xs text-gray-500">
                    ({formattedUserCurrencyAmount})
                  </span>
                </>
              )}
            </>
          )}
        </Button>
      )}
    </form>
  );
}
