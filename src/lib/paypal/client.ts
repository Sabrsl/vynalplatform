"use client";

import { useEffect, useState } from "react";

interface PayPalButtonsProps {
  amount: number;
  currency?: string;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}

// Typages pour les fonctions du SDK PayPal
declare global {
  interface Window {
    paypal?: {
      Buttons: (options: any) => {
        render: (element: string | HTMLElement) => void;
      };
    };
  }
}

// Configuration client de PayPal
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// Environnement PayPal (sandbox ou production)
export const PAYPAL_ENV = process.env.NEXT_PUBLIC_PAYPAL_ENV || "sandbox";

/**
 * Charge le SDK PayPal avec les options pour permettre la connexion directe avec PayPal
 */
export function loadPayPalScript(callback: () => void): void {
  // Si le SDK est déjà chargé
  if (window.paypal) {
    callback();
    return;
  }

  // Vérifie si le script est déjà en cours de chargement
  const existingScript = document.getElementById("paypal-sdk");
  if (existingScript) {
    // Ajouter un événement sur le script existant
    existingScript.addEventListener("load", callback);
    return;
  }

  // Créer et charger le script avec les paramètres pour forcer uniquement "Log in with PayPal"
  const script = document.createElement("script");
  script.id = "paypal-sdk";
  script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR&intent=capture&commit=true&vault=true&disable-funding=card,credit,venmo,sepa,bancontact,eps,giropay,ideal,mybank,p24,sofort&enable-funding=paypal`;
  script.async = true;
  script.onload = callback;
  script.onerror = () => {
    console.error("Erreur lors du chargement du SDK PayPal");
  };
  document.body.appendChild(script);

  console.log(
    'SDK PayPal en cours de chargement avec uniquement l\'option "Log in with PayPal"...',
  );
}

/**
 * Hook pour utiliser les boutons PayPal qui permettent la connexion directe avec PayPal
 */
export function usePayPalButtons({
  amount,
  currency = "EUR",
  onSuccess,
  onError,
}: PayPalButtonsProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [buttonLoaded, setButtonLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Charger le SDK PayPal
  useEffect(() => {
    try {
      loadPayPalScript(() => {
        setIsLoaded(true);
        console.log("SDK PayPal chargé avec succès");
      });
    } catch (error) {
      console.error("Erreur lors du chargement du SDK PayPal:", error);
      onError(error);
    }
  }, [onError]);

  // Fonction pour initialiser et rendre les boutons PayPal
  const initializePayPalButtons = (containerId: string) => {
    if (!isLoaded || !window.paypal || buttonLoaded || isInitializing) return;

    try {
      setIsInitializing(true);
      console.log(
        'Initialisation des boutons PayPal avec uniquement "Log in with PayPal"...',
      );

      // Vérifier si nous devons convertir le montant en EUR
      let paymentAmount = amount;

      // Important: On suppose que le montant est déjà converti en EUR si la devise est EUR
      // Sinon, on applique la conversion
      if (currency.toUpperCase() !== "EUR") {
        // Si la devise n'est pas l'EUR, convertir le montant en EUR avant de l'envoyer à PayPal
        try {
          // Cette partie ne devrait plus être nécessaire si le composant envoie déjà le montant en EUR
          // mais on la garde comme sécurité
          const { convertToEur } = require("@/lib/utils/currency-updater");
          paymentAmount = convertToEur(amount, currency, false) as number;
          console.log(
            `PayPal: conversion de ${amount} ${currency} en ${paymentAmount} EUR (utilisant les taux définis dans le projet)`,
          );
        } catch (error) {
          console.error(
            "Erreur lors de la conversion du montant pour PayPal:",
            error,
          );
          // En cas d'erreur, on bloque la transaction plutôt que de risquer un montant incorrect
          throw new Error(
            `Impossible de convertir le montant de ${currency} vers EUR pour le paiement PayPal`,
          );
        }
      } else {
        console.log(
          `PayPal: utilisation directe du montant ${amount} EUR (déjà en EUR)`,
        );
        // Assurer que c'est bien un nombre
        paymentAmount = Number(amount);
      }

      // Formater le montant correctement pour PayPal
      const finalAmount = formatPayPalAmount(paymentAmount);
      console.log(
        `PayPal: montant final formaté pour l'API: ${finalAmount} EUR (originalement ${amount} ${currency})`,
      );

      // Toujours utiliser EUR comme devise pour PayPal
      const buttons = window.paypal.Buttons({
        // Style des boutons pour montrer uniquement l'option de connexion PayPal
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 35,
          tagline: false,
          fundingicons: false,
        },

        // Création de la transaction avec les options pour la connexion PayPal
        createOrder: (_data: any, actions: any) => {
          console.log(
            "PayPal: création de la commande avec connexion PayPal...",
          );
          return actions.order.create({
            intent: "CAPTURE",
            application_context: {
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              brand_name: "Vynal Platform",
              landing_page: "LOGIN", // Force l'utilisation de la page de connexion PayPal
            },
            purchase_units: [
              {
                amount: {
                  value: finalAmount,
                  currency_code: "EUR", // Toujours utiliser EUR
                },
              },
            ],
          });
        },

        // Approbation de la transaction
        onApprove: (data: any, actions: any) => {
          console.log(
            "PayPal: transaction approuvée via connexion PayPal, capture en cours...",
          );
          return actions.order.capture().then((details: any) => {
            console.log(
              "PayPal: capture réussie via connexion PayPal:",
              details,
            );
            onSuccess({
              transactionId: details.id,
              status: details.status,
              details,
              payerInfo: details.payer, // Informations de l'utilisateur connecté via PayPal
            });
          });
        },

        // Gestion des erreurs
        onError: (err: any) => {
          console.error("Erreur PayPal lors de la transaction:", err);
          onError(err);
        },

        // Annulation
        onCancel: () => {
          console.log("PayPal: transaction annulée par l'utilisateur");
        },
      });

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Conteneur PayPal non trouvé: #${containerId}`);
      }

      buttons.render(`#${containerId}`);
      console.log("Boutons PayPal avec connexion rendus avec succès");
      setButtonLoaded(true);
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation des boutons PayPal:",
        error,
      );
      onError(error);
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    isLoaded,
    buttonLoaded,
    initializePayPalButtons,
  };
}

/**
 * Formate un montant pour l'afficher au format PayPal
 * Assure que le montant est bien formaté avec 2 décimales
 */
export function formatPayPalAmount(amount: number): string {
  // Arrondir à 2 décimales pour éviter les problèmes de précision
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/**
 * Valide un email PayPal
 */
export function validatePayPalEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
