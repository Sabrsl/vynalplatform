"use client";

import { useState, useEffect } from "react";
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
          <div className="p-4 border-2 border-slate-300 dark:border-vynal-purple-secondary/40 rounded-lg bg-white dark:bg-vynal-purple-dark/20 shadow-sm">
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Détecter le mode dark avec un état React stable
  useEffect(() => {
    const checkDarkMode = () => {
      if (typeof window !== "undefined") {
        const isDark = document.documentElement.classList.contains("dark");
        setIsDarkMode(isDark);
      }
    };

    // Vérifier initialement (après un court délai pour s'assurer que le DOM est prêt)
    setTimeout(checkDarkMode, 100);

    // Observer les changements de classe sur le document
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // CORRECTION: Considérer que le montant est en XOF (devise de la base de données)
  // et s'assurer que la conversion est correcte pour Stripe

  // 1. Normaliser le montant XOF (permet de détecter et corriger les montants anormaux)
  const normalizedAmount = normalizeAmount(amount, "XOF");
  const wasNormalized = normalizedAmount !== amount;

  // 2. Convertir le montant XOF en EUR pour Stripe (qui accepte uniquement EUR)
  const amountInEur = convertToEur(normalizedAmount, "XOF", false) as number;

  // 3. Calculer le montant en centimes pour Stripe
  const amountInEuroCents = Math.round(amountInEur * 100);

  // Utilisation du hook useCurrency pour obtenir la devise de l'utilisateur
  const { currency: userCurrency } = useCurrency();

  // Calculer le montant dans la devise de l'utilisateur
  const amountInUserCurrency =
    userCurrency.code === "XOF"
      ? amount
      : userCurrency.code === "EUR"
        ? amountInEur
        : (convertCurrency(amount, "XOF", userCurrency.code, false) as number);

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

  // Options de style pour le formulaire de carte - dynamiques selon le thème
  const cardElementOptions = {
    style: {
      base: {
        color: isDarkMode ? "#f1f5f9" : "#1e293b",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "14px",
        backgroundColor: "transparent",
        "::placeholder": {
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
      invalid: {
        color: isDarkMode ? "#f87171" : "#dc2626",
        iconColor: isDarkMode ? "#f87171" : "#dc2626",
      },
    },
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setCardError(null);
    setIsProcessing(true);

    try {
      // Récupération de l'élément de carte
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Élément de carte non disponible");
      }

      // Confirmation du paiement avec Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      const { error, paymentIntent } = result;

      // Gestion des erreurs
      if (error) {
        setCardError(error.message || "Erreur lors du traitement du paiement");
        onError(error);
      } else if (paymentIntent) {
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
        } catch (webhookError) {
          // On continue malgré l'erreur car le paiement a réussi
        }

        // Succès du paiement
        onSuccess(paymentData);
      }
    } catch (err: any) {
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

    // Ajouter un timeout pour s'assurer que le DOM est prêt
    setTimeout(() => {
      // Exposer la fonction de soumission via un attribut de données
      const form = document.getElementById("stripe-payment-form");
      if (form) {
        console.log(
          "Formulaire Stripe initialisé avec gestionnaire de soumission",
        );

        // Créer une fonction globale pour soumettre le formulaire
        (window as any).submitStripeForm = () => {
          console.log("Fonction submitStripeForm appelée");
          try {
            if (stripe && elements) {
              handleSubmit(new Event("submit") as any);
              return true;
            } else {
              console.warn("Stripe ou Elements non initialisés");
              return false;
            }
          } catch (error) {
            console.error(
              "Erreur lors de la soumission du formulaire Stripe",
              error,
            );
            return false;
          }
        };
      }
    }, 1000);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      id="stripe-payment-form"
    >
      {/* Notification sur la devise utilisée pour le paiement */}
      <PaymentCurrencyNotice amount={amount} compact useFixedAmount={false} />

      <div className="p-3 border-2 border-slate-300 dark:border-vynal-purple-secondary/40 rounded-lg bg-white dark:bg-vynal-purple-dark/20 shadow-sm">
        <h3 className="text-base font-medium mb-2 text-slate-800 dark:text-slate-200">
          Carte bancaire
        </h3>
        <CardElement options={cardElementOptions} className="py-1" />
      </div>

      {cardError && (
        <div className="text-red-500 text-sm mt-2">{cardError}</div>
      )}

      <div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-vynal-text-secondary mb-2 text-center">
          Paiement sécurisé - Données bancaires non stockées
        </p>
      </div>

      {/* Bouton caché pour permettre une soumission facile depuis l'extérieur */}
      <button
        type="submit"
        id="stripe-hidden-submit"
        className="hidden"
        aria-hidden="true"
      />

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
                  <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
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
