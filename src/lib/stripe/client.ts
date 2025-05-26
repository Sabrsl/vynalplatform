/**
 * Configuration du client Stripe pour le frontend
 * Ce fichier expose uniquement la clé publique et initialise le client Stripe
 */
import { loadStripe } from "@stripe/stripe-js";

// Récupération de la clé publique depuis les variables d'environnement
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Vérification de la présence de la clé
if (!stripePublicKey) {
  console.error(
    "ERREUR: Clé publique Stripe manquante dans les variables d'environnement",
  );
} else {
  // Déboguer la clé (première partie seulement pour la sécurité)
  console.log(
    `Stripe initialisé avec clé publique: ${stripePublicKey.substring(0, 8)}...`,
  );
}

// Singleton pour stocker l'instance Stripe
let stripePromise: Promise<any> | null = null;
// Variable pour détecter si un bloqueur de publicités a été détecté
let adBlockerDetected = false;

/**
 * Vérifie si un bloqueur de publicités est actif
 * Cette fonction utilise une technique simple de détection basée sur
 * l'échec du chargement d'un script Stripe qui est souvent bloqué
 */
export const checkForAdBlocker = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  try {
    // Tente de charger un script Stripe connu pour être bloqué par les bloqueurs de publicités
    const testScript = document.createElement("script");
    testScript.src = "https://m.stripe.network/out-4.5.44.js";
    testScript.async = true;

    const adBlockDetected = await new Promise<boolean>((resolve) => {
      testScript.onerror = () => {
        // Le script a été bloqué
        document.body.removeChild(testScript);
        resolve(true);
      };

      testScript.onload = () => {
        // Le script a chargé correctement
        document.body.removeChild(testScript);
        resolve(false);
      };

      document.body.appendChild(testScript);

      // Si après 2 secondes, rien ne s'est passé, on suppose qu'il y a un bloqueur
      setTimeout(() => resolve(true), 2000);
    });

    adBlockerDetected = adBlockDetected;
    return adBlockDetected;
  } catch (error) {
    console.warn(
      "Erreur lors de la détection du bloqueur de publicités",
      error,
    );
    return false;
  }
};

/**
 * Retourne l'instance Stripe initialisée
 * Si l'instance n'existe pas encore, elle est créée
 * Détecte également les bloqueurs de publicités qui peuvent interférer avec Stripe
 */
export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    stripePromise = loadStripe(stripePublicKey).catch((error) => {
      console.error("Erreur lors du chargement de Stripe:", error);
      // Vérifier si l'erreur est due à un bloqueur de publicités
      checkForAdBlocker().then((detected) => {
        if (detected) {
          console.warn(
            "Un bloqueur de publicités a été détecté, ce qui peut empêcher Stripe de fonctionner correctement.",
          );
          adBlockerDetected = true;
          // Déclencher un événement personnalisé pour informer l'interface utilisateur
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("stripeAdBlockerDetected"));
          }
        }
      });
      return null;
    });
  } else if (!stripePublicKey) {
    console.error("Tentative d'initialisation de Stripe sans clé publique");
  }
  return stripePromise;
};

/**
 * Indique si un bloqueur de publicités a été détecté
 */
export const isAdBlockerDetected = () => adBlockerDetected;
