"use client";

import React, { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { StripeElementsOptions, StripeElementsOptionsClientSecret } from "@stripe/stripe-js";

type StripeLocale = 
  'auto' | 'ar' | 'bg' | 'cs' | 'da' | 'de' | 'el' | 'en' | 'es' | 'et' | 
  'fi' | 'fr' | 'he' | 'hr' | 'hu' | 'id' | 'it' | 'ja' | 'ko' | 'lt' | 
  'lv' | 'ms' | 'mt' | 'nb' | 'nl' | 'pl' | 'pt' | 'pt-BR' | 'ro' | 'ru' | 
  'sk' | 'sl' | 'sv' | 'th' | 'tr' | 'vi' | 'zh';

interface StripeElementsProviderProps {
  children: ReactNode;
  clientSecret?: string;
  options?: Partial<StripeElementsOptions>;
}

/**
 * Fournit le contexte Stripe Elements pour les composants enfants
 * 
 * Ce composant doit envelopper tous les composants qui utilisent les fonctionnalités Stripe
 * Il nécessite un clientSecret qui est fourni par le serveur après création d'un PaymentIntent
 */
export function StripeElementsProvider({
  children,
  clientSecret,
  options = {},
}: StripeElementsProviderProps) {
  
  // Ne fournir les éléments que s'il y a un clientSecret
  // Sinon, renvoyer directement les enfants
  if (!clientSecret) {
    return <>{children}</>;
  }
  
  // Configuration des options avec le clientSecret
  const elementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6667ab', // Couleur principale Vynal
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Poppins, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
    },
    locale: 'fr' as StripeLocale,
    ...options
  } as StripeElementsOptionsClientSecret;
  
  return (
    <Elements
      stripe={getStripe()}
      options={elementsOptions}
    >
      {children}
    </Elements>
  );
}