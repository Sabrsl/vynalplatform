"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { PaymentRequest, Appearance } from "@stripe/stripe-js";
import Image from "next/image";
import { getStripe } from "@/lib/stripe/client";
import { StripeElements } from "@stripe/stripe-js";

interface GooglePayButtonProps {
  amount: number;
  currency?: string;
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  loading?: boolean;
  className?: string;
  serviceId?: string;
}

/**
 * Bouton interne de paiement Google Pay
 * Ce composant doit être utilisé à l'intérieur d'un fournisseur Elements
 */
function GooglePayButtonInternal({
  amount,
  currency = "eur",
  clientSecret,
  onSuccess,
  onError,
  loading = false,
  className,
  serviceId,
}: GooglePayButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );

  // Vérifier si Google Pay est disponible sur cet appareil
  useEffect(() => {
    // Si Stripe n'est pas disponible, ne rien faire
    if (!stripe || !elements || !clientSecret) return;

    // Convertir le montant XOF en EUR en utilisant le taux de conversion défini dans le projet
    // Tous les prix sont stockés en XOF dans la base de données
    const {
      convertToEur,
      normalizeAmount,
    } = require("@/lib/utils/currency-updater");

    // 1. Normaliser le montant XOF (permet de détecter et corriger les montants anormaux)
    const normalizedXofAmount = normalizeAmount(amount, "XOF");

    // 2. Convertir le montant XOF en EUR
    const amountInEuros = convertToEur(
      normalizedXofAmount,
      "XOF",
      false,
    ) as number;

    // 3. Convertir en centimes pour Stripe
    const amountInEuroCents = Math.round(amountInEuros * 100);

    const pr = stripe.paymentRequest({
      country: "FR",
      currency: "eur", // Forcer EUR pour les paiements Stripe
      total: {
        label: "Paiement Vynal",
        amount: amountInEuroCents, // Montant en centimes d'euro
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Vérifier si l'appareil supporte Google Pay
    pr.canMakePayment().then((result) => {
      if (result && result.googlePay) {
        setPaymentRequest(pr);
        setIsGooglePayAvailable(true);
      } else {
        setIsGooglePayAvailable(false);
      }
    });

    // Configurer les gestionnaires d'événements
    pr.on("paymentmethod", async (ev) => {
      setIsProcessing(true);

      try {
        // Confirmer le paiement avec Stripe
        const result = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
        );

        const { error, paymentIntent } = result;

        if (error) {
          // Informer Google Pay que le paiement a échoué
          ev.complete("fail");
          onError(error);
        } else if (paymentIntent) {
          // Informer Google Pay que le paiement a réussi
          ev.complete("success");

          // Enrichir les données de paiement
          const paymentData = {
            ...paymentIntent,
            serviceId,
            paymentMethod: "google_pay",
            provider: "stripe",
          };

          onSuccess(paymentData);
        }
      } catch (err) {
        ev.complete("fail");
        onError(err);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [
    stripe,
    elements,
    amount,
    currency,
    clientSecret,
    onSuccess,
    onError,
    serviceId,
  ]);

  // Si Stripe n'est pas disponible ou si Google Pay n'est pas disponible, ne pas afficher le bouton
  if (!stripe || !elements || !isGooglePayAvailable || !paymentRequest) {
    return null;
  }

  // Gérer le clic sur le bouton Google Pay
  const handleGooglePayClick = async () => {
    if (!paymentRequest || isProcessing) return;

    // Déclencher la demande de paiement
    paymentRequest.show();
  };

  return (
    <Button
      onClick={handleGooglePayClick}
      disabled={loading || isProcessing}
      className={`w-full flex items-center justify-center bg-white text-black hover:bg-gray-100 border border-gray-300 ${className}`}
      aria-label="Google Pay"
    >
      {isProcessing ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-black" />
          Traitement en cours...
        </>
      ) : (
        <>
          <Image
            src="/images/payment/google-pay-mark.svg"
            alt="Google Pay"
            width={40}
            height={24}
            className="mr-2 h-6"
            onError={(e) => {
              // Fallback si l'image n'existe pas
              e.currentTarget.style.display = "none";
            }}
          />
          Payer avec Google Pay
        </>
      )}
    </Button>
  );
}

/**
 * Vérifie si un clientSecret est valide
 * Les clientSecrets de Stripe ont généralement le format "pi_xxx_secret_xxx"
 */
function isValidClientSecret(secret: string | undefined): boolean {
  if (!secret) return false;

  // Format typique: pi_xxxxxxx_secret_xxxxxxx
  const secretPattern = /^[a-zA-Z0-9_]+_secret_[a-zA-Z0-9]+$/;
  return secretPattern.test(secret);
}

/**
 * Bouton de paiement Google Pay
 *
 * Ce composant n'est affiché que sur les appareils qui supportent Google Pay
 * Il utilise l'API Stripe pour traiter les paiements Google Pay
 * S'encapsule automatiquement dans un fournisseur Elements si nécessaire
 */
export function GooglePayButton(props: GooglePayButtonProps) {
  // Initialiser les refs au début du composant
  const inElementsContextRef = useRef<boolean | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);

  // Si le clientSecret n'est pas valide, ne rien afficher
  if (!isValidClientSecret(props.clientSecret)) {
    return null;
  }

  // Lors du premier rendu, essayez de détecter le contexte
  if (inElementsContextRef.current === null) {
    try {
      // Cela va échouer si nous ne sommes pas dans un contexte Elements
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useElements();
      inElementsContextRef.current = true;
    } catch (error) {
      inElementsContextRef.current = false;
    }
  }

  // Le reste du composant basé sur inElementsContextRef.current
  return inElementsContextRef.current ? (
    <GooglePayButtonInternal {...props} />
  ) : (
    <ElementsContextProvider clientSecret={props.clientSecret}>
      <GooglePayButtonInternal {...props} />
    </ElementsContextProvider>
  );
}

function InternalGooglePayButton({
  clientSecret,
  ...props
}: GooglePayButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );

  // Vérifier si Google Pay est disponible sur cet appareil
  useEffect(() => {
    // Si Stripe n'est pas disponible, ne rien faire
    if (!stripe || !elements || !clientSecret) return;

    // Convertir le montant XOF en EUR en utilisant le taux de conversion défini dans le projet
    // Tous les prix sont stockés en XOF dans la base de données
    const {
      convertToEur,
      normalizeAmount,
    } = require("@/lib/utils/currency-updater");

    // 1. Normaliser le montant XOF (permet de détecter et corriger les montants anormaux)
    const normalizedXofAmount = normalizeAmount(props.amount, "XOF");

    // 2. Convertir le montant XOF en EUR
    const amountInEuros = convertToEur(
      normalizedXofAmount,
      "XOF",
      false,
    ) as number;

    // 3. Convertir en centimes pour Stripe
    const amountInEuroCents = Math.round(amountInEuros * 100);

    const pr = stripe.paymentRequest({
      country: "FR",
      currency: props.currency?.toLowerCase() || "eur",
      total: {
        label: "Paiement Vynal",
        amount: amountInEuroCents, // Montant en centimes d'euro
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Vérifier si l'appareil supporte Google Pay
    pr.canMakePayment().then((result) => {
      if (result && result.googlePay) {
        setPaymentRequest(pr);
        setIsGooglePayAvailable(true);
      } else {
        setIsGooglePayAvailable(false);
      }
    });

    // Configurer les gestionnaires d'événements
    pr.on("paymentmethod", async (ev) => {
      setIsProcessing(true);

      try {
        // Confirmer le paiement avec Stripe
        const result = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
        );

        const { error, paymentIntent } = result;

        if (error) {
          // Informer Google Pay que le paiement a échoué
          ev.complete("fail");
          props.onError(error);
        } else if (paymentIntent) {
          // Informer Google Pay que le paiement a réussi
          ev.complete("success");

          // Enrichir les données de paiement
          const paymentData = {
            ...paymentIntent,
            serviceId: props.serviceId,
            paymentMethod: "google_pay",
            provider: "stripe",
          };

          props.onSuccess(paymentData);
        }
      } catch (err) {
        ev.complete("fail");
        props.onError(err);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [
    stripe,
    elements,
    props.amount,
    props.currency,
    clientSecret,
    props.onSuccess,
    props.onError,
    props.serviceId,
  ]);

  // Si Stripe n'est pas disponible ou si Google Pay n'est pas disponible, ne pas afficher le bouton
  if (!stripe || !elements || !isGooglePayAvailable || !paymentRequest) {
    return null;
  }

  // Gérer le clic sur le bouton Google Pay
  const handleGooglePayClick = async () => {
    if (!paymentRequest || isProcessing) return;

    // Déclencher la demande de paiement
    paymentRequest.show();
  };

  return (
    <Button
      onClick={handleGooglePayClick}
      disabled={props.loading || isProcessing}
      className={`w-full flex items-center justify-center bg-white text-black hover:bg-gray-100 border border-gray-300 ${props.className}`}
      aria-label="Google Pay"
    >
      {isProcessing ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-black" />
          Traitement en cours...
        </>
      ) : (
        <>
          <Image
            src="/images/payment/google-pay-mark.svg"
            alt="Google Pay"
            width={40}
            height={24}
            className="mr-2 h-6"
            onError={(e) => {
              // Fallback si l'image n'existe pas
              e.currentTarget.style.display = "none";
            }}
          />
          Payer avec Google Pay
        </>
      )}
    </Button>
  );
}

function ElementsContextProvider({
  clientSecret,
  children,
}: {
  clientSecret: string;
  children: React.ReactNode;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );

  // Vérifier si Google Pay est disponible sur cet appareil
  useEffect(() => {
    // Si Stripe n'est pas disponible, ne rien faire
    if (!stripe || !elements || !clientSecret) return;

    // Convertir le montant XOF en EUR en utilisant le taux de conversion défini dans le projet
    // Tous les prix sont stockés en XOF dans la base de données
    const {
      convertToEur,
      normalizeAmount,
    } = require("@/lib/utils/currency-updater");

    // 1. Normaliser le montant XOF (permet de détecter et corriger les montants anormaux)
    const normalizedXofAmount = normalizeAmount(100, "XOF");

    // 2. Convertir le montant XOF en EUR
    const amountInEuros = convertToEur(
      normalizedXofAmount,
      "XOF",
      false,
    ) as number;

    // 3. Convertir en centimes pour Stripe
    const amountInEuroCents = Math.round(amountInEuros * 100);

    const pr = stripe.paymentRequest({
      country: "FR",
      currency: "eur",
      total: {
        label: "Paiement Vynal",
        amount: amountInEuroCents, // Montant en centimes d'euro
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Vérifier si l'appareil supporte Google Pay
    pr.canMakePayment().then((result) => {
      if (result && result.googlePay) {
        setPaymentRequest(pr);
        setIsGooglePayAvailable(true);
      } else {
        setIsGooglePayAvailable(false);
      }
    });

    // Configurer les gestionnaires d'événements
    pr.on("paymentmethod", async (ev) => {
      setIsProcessing(true);

      try {
        // Confirmer le paiement avec Stripe
        const result = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
        );

        const { error, paymentIntent } = result;

        if (error) {
          // Informer Google Pay que le paiement a échoué
          ev.complete("fail");
          // Handle error
        } else if (paymentIntent) {
          // Informer Google Pay que le paiement a réussi
          ev.complete("success");
          // Handle success
        }
      } catch (err) {
        ev.complete("fail");
        // Handle error
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, elements, clientSecret]);

  // Si Stripe n'est pas disponible ou si Google Pay n'est pas disponible, ne pas afficher le bouton
  if (!stripe || !elements || !isGooglePayAvailable || !paymentRequest) {
    return null;
  }

  // Gérer le clic sur le bouton Google Pay
  const handleGooglePayClick = async () => {
    if (!paymentRequest || isProcessing) return;

    // Déclencher la demande de paiement
    paymentRequest.show();
  };

  return (
    <Elements
      stripe={stripe}
      options={
        {
          clientSecret: clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#6667ab",
              colorBackground: "#ffffff",
              colorText: "#30313d",
              colorDanger: "#df1b41",
              fontFamily: "Poppins, system-ui, sans-serif",
              spacingUnit: "4px",
              borderRadius: "4px",
            },
          },
          locale: "fr",
          // @ts-ignore - La propriété wallets existe mais n'est pas reconnue par TypeScript
          wallets: {
            googlePay: "auto",
          },
        } as any
      }
    >
      {children}
    </Elements>
  );
}
