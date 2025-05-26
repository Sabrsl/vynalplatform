"use client";

import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { isAdBlockerDetected, checkForAdBlocker } from "@/lib/stripe/client";

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
    checkForAdBlocker().then(detected => {
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