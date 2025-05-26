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
    `[DEBUG CONVERSION] StripeCardForm - Montant reçu: ${amount} ${currency.toUpperCase()}`,
  );

  // CORRECTION: Considérer que le montant est en XOF (devise de la base de données)
  // et s'assurer que la conversion est correcte pour Stripe

  // 1. S'assurer que nous travaillons avec des unités monétaires, pas des centimes
  const amountInUnits = amount;

  // 2. Normaliser le montant XOF si nécessaire
  const normalizedAmount = normalizeAmount(amountInUnits, "XOF");
  const wasNormalized = normalizedAmount !== amountInUnits;

  if (wasNormalized) {
    console.warn(
      `[DEBUG CONVERSION] StripeCardForm - Montant anormal détecté: ${amountInUnits} XOF, normalisé à ${normalizedAmount} XOF`,
    );
  }

  // 3. Convertir le montant XOF en EUR pour Stripe (qui accepte uniquement EUR)
  const amountInEur = convertToEur(normalizedAmount, "XOF", false) as number;
  console.log(
    `[DEBUG CONVERSION] StripeCardForm - Conversion en EUR: ${normalizedAmount} XOF → ${amountInEur} EUR`,
  );

  // NOUVEAU: Traçage complet du flux de conversion pour débogage
  console.log(`[DEBUG CONVERSION] FLUX COMPLET STRIPE CARD FORM:
  1. Montant original reçu: ${amount} XOF (unités)
  2. Montant normalisé si nécessaire: ${normalizedAmount} XOF
  3. Conversion XOF → EUR: ${normalizedAmount} XOF → ${amountInEur} EUR
  4. MONTANT EUR pour affichage et paiement: ${amountInEur} EUR
  `);

  // Utilisation du hook useCurrency pour obtenir la devise de l'utilisateur
  const { currency: userCurrency } = useCurrency();

  // Calculer le montant dans la devise de l'utilisateur
  const amountInUserCurrency =
    userCurrency.code === "XOF"
      ? normalizedAmount
      : userCurrency.code === "EUR"
        ? amountInEur
        : (convertCurrency(
            normalizedAmount,
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

  console.log(`[DEBUG CONVERSION] StripeCardForm - Montant traité:`, {
    originalAmount: amount,
    currency: "XOF", // Tous les prix sont stockés en XOF dans la BD
    normalizedAmount: normalizedAmount,
    wasNormalized,
    amountInEur,
    userCurrency: userCurrency.code,
    amountInUserCurrency,
    conversionRate: amountInEur / normalizedAmount,
    clientSecret: clientSecret ? "Présent" : "Absent", // Ne pas afficher le secret complet
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
          originalAmount: normalizedAmount, // Montant original en XOF
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
