"use client";

import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

/**
 * Variables locales pour la détection du bloqueur de publicités
 */
let adBlockerDetected = false;

/**
 * Vérifier si un bloqueur de publicités est actif
 * Cette fonction utilise une technique simple de détection basée sur
 * l'échec du chargement d'un script Stripe qui est souvent bloqué
 */
const checkForAdBlocker = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Tente de charger un script Stripe connu pour être bloqué par les bloqueurs de publicités
    const testScript = document.createElement('script');
    testScript.src = 'https://m.stripe.network/out-4.5.44.js';
    testScript.async = true;
    
    const result = await new Promise<boolean>((resolve) => {
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
    
    adBlockerDetected = result;
    return result;
  } catch (error) {
    console.warn('Erreur lors de la détection du bloqueur de publicités', error);
    return false;
  }
};

/**
 * Indique si un bloqueur de publicités a été détecté
 */
const isAdBlockerDetected = (): boolean => adBlockerDetected;

/**
 * Composant qui affiche un avertissement lorsqu'un bloqueur de publicités est détecté
 * Ce composant doit être utilisé dans les pages de paiement pour informer les utilisateurs
 * que les bloqueurs de publicités peuvent interférer avec le processus de paiement
 */
export function AdBlockerWarning() {
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);

  useEffect(() => {
    // Vérifier immédiatement si un bloqueur de publicités a déjà été détecté
    setAdBlockerDetected(isAdBlockerDetected());

    // Effectuer une vérification active
    checkForAdBlocker().then((detected: boolean) => {
      setAdBlockerDetected(detected);
    });

    // Écouter l'événement personnalisé de détection de bloqueur
    const handleAdBlockerDetected = () => {
      setAdBlockerDetected(true);
    };

    window.addEventListener('stripeAdBlockerDetected', handleAdBlockerDetected);

    return () => {
      window.removeEventListener('stripeAdBlockerDetected', handleAdBlockerDetected);
    };
  }, []);

  if (!adBlockerDetected) {
    return null;
  }

  return (
    <Alert className="mb-4 text-sm bg-orange-100/90 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/20 backdrop-blur-sm">
      <AlertTriangle className="h-3 w-3 text-slate-600 dark:text-vynal-text-secondary" />
      <AlertTitle className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
        Bloqueur de publicités détecté
      </AlertTitle>
      <AlertDescription className="text-xs text-slate-600 dark:text-vynal-text-secondary">
        Si vous rencontrez des difficultés avec le paiement, cela peut être lié à votre bloqueur de publicités.
        Désactivez-le temporairement pour cette page si besoin.
      </AlertDescription>
    </Alert>
  );
}