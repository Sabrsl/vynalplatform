/**
 * Configuration du client Stripe pour le frontend
 * Ce fichier expose uniquement la clé publique et initialise le client Stripe
 */
import { loadStripe } from '@stripe/stripe-js';

// Récupération de la clé publique depuis les variables d'environnement
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Vérification de la présence de la clé
if (!stripePublicKey) {
  console.error('ERREUR: Clé publique Stripe manquante dans les variables d\'environnement');
} else {
  // Déboguer la clé (première partie seulement pour la sécurité)
  console.log(`Stripe initialisé avec clé publique: ${stripePublicKey.substring(0, 8)}...`);
}

// Singleton pour stocker l'instance Stripe
let stripePromise: Promise<any> | null = null;

/**
 * Retourne l'instance Stripe initialisée
 * Si l'instance n'existe pas encore, elle est créée
 */
export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    stripePromise = loadStripe(stripePublicKey);
  } else if (!stripePublicKey) {
    console.error('Tentative d\'initialisation de Stripe sans clé publique');
  }
  return stripePromise;
};