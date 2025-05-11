/**
 * Configuration du serveur Stripe
 * Ce fichier contient toutes les fonctions pour interagir avec l'API Stripe côté serveur
 */
import Stripe from 'stripe';

// Détermination de l'environnement
const isProduction = process.env.STRIPE_MODE === 'production';

// Récupération de la clé secrète depuis les variables d'environnement
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Vérification de la présence de la clé
if (!stripeSecretKey) {
  throw new Error('ERREUR CRITIQUE: Clé secrète Stripe manquante dans les variables d\'environnement');
}

// Initialisation de l'instance Stripe
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
  appInfo: {
    name: 'Vynal Platform',
    version: '1.0.0',
  },
});

/**
 * Récupère la clé restreinte appropriée en fonction de l'opération
 * @param operation Type d'opération ('payments', 'checkout', 'customers')
 * @returns La clé restreinte ou undefined si en mode test
 */
export function getRestrictedKey(operation: 'payments' | 'checkout' | 'customers'): string | undefined {
  if (!isProduction) {
    return undefined; // En mode test, on utilise la clé standard
  }
  
  switch (operation) {
    case 'payments':
      return process.env.STRIPE_RESTRICTED_KEY_PAYMENTS;
    case 'checkout':
      return process.env.STRIPE_RESTRICTED_KEY_CHECKOUT;
    case 'customers':
      return process.env.STRIPE_RESTRICTED_KEY_CUSTOMERS;
    default:
      return undefined;
  }
}

/**
 * Crée une session Stripe Checkout
 */
export async function createCheckoutSession(params: {
  customerId?: string;
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: params.lineItems,
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });
}

/**
 * Crée un client Stripe
 */
export async function createCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  });
}

/**
 * Crée un intent de paiement
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency,
    customer: params.customerId,
    metadata: params.metadata,
    payment_method_types: ['card'],
  });
}

/**
 * Récupère un intent de paiement par son ID
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Récupère un client Stripe par son ID
 */
export async function getCustomer(customerId: string) {
  return stripe.customers.retrieve(customerId);
}

/**
 * Crée une clé éphémère pour un client
 * Utile pour les paiements mobiles
 */
export async function createEphemeralKey(customerId: string) {
  return stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: '2025-04-30.basil' }
  );
}