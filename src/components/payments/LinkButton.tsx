"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { PaymentRequest, Appearance } from "@stripe/stripe-js";
import Image from "next/image";
import { getStripe } from "@/lib/stripe/client";

interface LinkButtonProps {
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
 * Bouton interne de paiement Stripe Link
 * Ce composant doit être utilisé à l'intérieur d'un fournisseur Elements
 */
function LinkButtonInternal({
  amount,
  currency = "eur",
  clientSecret,
  onSuccess,
  onError,
  loading = false,
  className,
  serviceId
}: LinkButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLinkAvailable, setIsLinkAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  // Vérifier si Link est disponible
  useEffect(() => {
    // Si Stripe n'est pas disponible, ne rien faire
    if (!stripe || !elements || !clientSecret) return;

    const pr = stripe.paymentRequest({
      country: 'FR',
      currency: currency.toLowerCase(),
      total: {
        label: 'Paiement Vynal',
        amount: Math.round(amount * 100), // Convertir en centimes
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Vérifier si l'appareil supporte Link
    pr.canMakePayment().then(result => {
      // Note: Link n'a pas de propriété spécifique comme applePay ou googlePay
      // On vérifie simplement si le paymentRequest est disponible
      if (result) {
        setPaymentRequest(pr);
        setIsLinkAvailable(true);
      } else {
        setIsLinkAvailable(false);
      }
    });

    // Configurer les gestionnaires d'événements
    pr.on('paymentmethod', async (ev) => {
      setIsProcessing(true);
      
      try {
        // Confirmer le paiement avec Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          // Informer que le paiement a échoué
          ev.complete('fail');
          onError(error);
        } else if (paymentIntent) {
          // Informer que le paiement a réussi
          ev.complete('success');
          
          // Enrichir les données de paiement
          const paymentData = {
            ...paymentIntent,
            serviceId,
            paymentMethod: 'link',
            provider: 'stripe'
          };
          
          onSuccess(paymentData);
        }
      } catch (err) {
        ev.complete('fail');
        onError(err);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [stripe, elements, amount, currency, clientSecret, onSuccess, onError, serviceId]);

  // Si Stripe n'est pas disponible ou si Link n'est pas disponible, ne pas afficher le bouton
  if (!stripe || !elements || !isLinkAvailable || !paymentRequest) {
    return null;
  }

  // Gérer le clic sur le bouton Link
  const handleLinkClick = async () => {
    if (!paymentRequest || isProcessing) return;
    
    // Déclencher la demande de paiement
    paymentRequest.show();
  };

  return (
    <Button
      onClick={handleLinkClick}
      disabled={loading || isProcessing}
      className={`w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white ${className}`}
      aria-label="Stripe Link"
    >
      {isProcessing ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          Traitement en cours...
        </>
      ) : (
        <>
          <Image 
            src="/images/payment/stripe-link-mark.svg" 
            alt="Stripe Link" 
            width={40} 
            height={24} 
            className="mr-2 h-6"
            onError={(e) => {
              // Fallback si l'image n'existe pas
              e.currentTarget.style.display = 'none';
            }}
          />
          Payer avec Link
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
 * Bouton de paiement Stripe Link
 * 
 * Ce composant n'est affiché que si Link est disponible
 * Il utilise l'API Stripe pour traiter les paiements rapides avec Link
 * S'encapsule automatiquement dans un fournisseur Elements si nécessaire
 */
export function LinkButton(props: LinkButtonProps) {
  // Initialiser les refs au début du composant
  const inElementsContextRef = useRef<boolean | null>(null);
  
  // Si le clientSecret n'est pas valide, ne rien afficher
  if (!isValidClientSecret(props.clientSecret)) {
    console.log("LinkButton: clientSecret invalide", props.clientSecret);
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
  
  // Si nous sommes déjà dans un contexte Elements, utiliser directement le composant interne
  if (inElementsContextRef.current === true) {
    return <LinkButtonInternal {...props} />;
  }
  
  // Sinon, créer un contexte Elements
  const appearance: Appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6667ab',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Poppins, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  };

  // Créer un objet d'options pour Elements
  // Note: TypeScript ne reconnaît pas correctement les options pour les méthodes de paiement express
  // comme Link, mais elles sont bien supportées par Stripe
  const elementsOptions: any = {
    clientSecret: props.clientSecret,
    appearance,
    locale: 'fr',
  };
  
  // Ajouter le support pour Link
  if (typeof window !== 'undefined') {
    elementsOptions.wallets = {
      link: 'auto'
    };
  }
  
  return (
    <Elements stripe={getStripe()} options={elementsOptions}>
      <LinkButtonInternal {...props} />
    </Elements>
  );
} 