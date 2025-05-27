/**
 * Configuration du serveur PayPal
 * Ce fichier contient toutes les fonctions pour interagir avec l'API PayPal côté serveur
 */

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

// Vérifier la présence des clés requises
if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.error(
    "ERREUR: Les clés PayPal sont manquantes dans les variables d'environnement",
  );
}

/**
 * Récupère un token d'accès pour l'API PayPal
 */
async function getPayPalAccessToken(): Promise<string> {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      throw new Error(
        "Configuration PayPal incomplète: Client ID ou Secret manquant",
      );
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString(
      "base64",
    );

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Erreur PayPal: ${errorData.error_description || "Impossible de récupérer le token d'accès"}`,
      );
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token PayPal:", error);
    throw error;
  }
}

/**
 * Vérifie le statut d'une transaction PayPal
 */
export async function verifyPayPalTransaction(orderId: string): Promise<any> {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Erreur PayPal: ${errorData.message || "Impossible de vérifier la transaction"}`,
      );
    }

    const orderData = await response.json();
    return orderData;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification de la transaction PayPal:",
      error,
    );
    throw error;
  }
}

/**
 * Capture un paiement PayPal (finalise la transaction)
 */
export async function capturePayPalPayment(orderId: string): Promise<any> {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Erreur PayPal: ${errorData.message || "Impossible de capturer le paiement"}`,
      );
    }

    const captureData = await response.json();
    return captureData;
  } catch (error) {
    console.error("Erreur lors de la capture du paiement PayPal:", error);
    throw error;
  }
}

/**
 * Crée une commande PayPal côté serveur
 */
export async function createPayPalOrder(params: {
  amount: number;
  currency?: string;
  description?: string;
  itemName?: string;
  userEmail?: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; status: string }> {
  try {
    const accessToken = await getPayPalAccessToken();

    // Le montant est toujours considéré comme étant en XOF, la devise de la base de données
    // La devise transmise est ignorée car on sait que les prix sont en XOF
    const {
      amount,
      description = "Commande sur Vynal Platform",
      itemName = "Service",
      userEmail,
      metadata = {},
    } = params;

    // Ajouter une fonction de normalisation des montants anormalement élevés
    const normalizeAmount = (value: number, currencyCode: string): number => {
      // Valeurs attendues par devise
      const expectedRanges = {
        EUR: { max: 10000 }, // La plupart des services coûtent moins de 10 000 €
        XOF: { max: 6000000 }, // La plupart des services coûtent moins de 6 000 000 FCFA
        USD: { max: 10000 },
        default: { max: 10000 },
      };

      // Obtenir la plage pour cette devise
      const range =
        expectedRanges[currencyCode as keyof typeof expectedRanges] ||
        expectedRanges.default;

      // Si le montant est anormalement élevé pour un service
      if (value > range.max) {
        console.warn(
          `Server: Montant anormalement élevé détecté: ${value} ${currencyCode}. Normalisation appliquée.`,
        );
        // Si c'est en FCFA et que le montant est beaucoup trop grand, diviser par 1000
        if (currencyCode === "XOF" && value > 1000000) {
          return value / 1000;
        }
        // Si c'est en EUR et que le montant est beaucoup trop grand, diviser par 1000
        if (currencyCode === "EUR" && value > 10000) {
          return value / 1000;
        }
      }

      return value;
    };

    // Normaliser le montant avant conversion (toujours en XOF)
    const normalizedAmount = normalizeAmount(amount, "XOF");

    // Convertir le montant en EUR (les prix sont toujours en XOF dans la base)
    let finalAmount;
    try {
      // Importer dynamiquement pour éviter les erreurs côté serveur
      const { convertToEur } = require("@/lib/utils/currency-updater");
      finalAmount = convertToEur(normalizedAmount, "XOF", false) as number;
      console.log(
        `PayPal Server: conversion de ${normalizedAmount} XOF en ${finalAmount} EUR (utilisant les taux définis dans le projet)`,
      );
    } catch (error: any) {
      console.error(
        "Erreur lors de la conversion du montant pour PayPal:",
        error,
      );
      // En cas d'erreur, on bloque la transaction plutôt que de risquer un montant incorrect
      throw new Error(
        `Impossible de convertir le montant de XOF vers EUR pour le paiement PayPal: ${error.message}`,
      );
    }

    // Formatter le montant avec précision pour PayPal
    const formattedAmount = (Math.round(finalAmount * 100) / 100).toFixed(2);
    console.log(
      `Création commande PayPal: ${formattedAmount} EUR (originalement ${normalizedAmount} XOF)`,
    );

    // Journaliser le montant original et le montant converti pour le débogage
    console.log({
      originalAmount: amount,
      normalizedAmount,
      originalCurrency: "XOF",
      convertedAmount: finalAmount,
      formattedAmount,
      conversionFactor: finalAmount / normalizedAmount,
      wasNormalized: normalizedAmount !== amount,
    });

    // Construction de la requête pour l'API PayPal
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR", // Toujours utiliser EUR
            value: formattedAmount,
          },
          description,
          custom_id: metadata.serviceId || undefined,
          soft_descriptor: "VYNALPLATFORM",
          items: [
            {
              name: itemName,
              unit_amount: {
                currency_code: "EUR", // Toujours utiliser EUR
                value: formattedAmount,
              },
              quantity: "1",
            },
          ],
        },
      ],
      application_context: {
        brand_name: "Vynal Platform",
        landing_page: "BILLING",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url:
          process.env.NEXT_PUBLIC_PAYPAL_SUCCESS_URL ||
          process.env.NEXT_PUBLIC_SITE_URL + "/payment/success",
        cancel_url:
          process.env.NEXT_PUBLIC_PAYPAL_CANCEL_URL ||
          process.env.NEXT_PUBLIC_SITE_URL + "/payment/cancel",
      },
    };

    // Si un email est fourni, ajouter les informations de payer
    if (userEmail) {
      Object.assign(orderPayload, {
        payer: {
          email_address: userEmail,
        },
      });
    }

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Erreur PayPal: ${errorData.message || "Impossible de créer la commande"}`,
      );
    }

    const orderData = await response.json();
    return {
      id: orderData.id,
      status: orderData.status,
    };
  } catch (error) {
    console.error("Erreur lors de la création de la commande PayPal:", error);
    throw error;
  }
}

/**
 * Enregistre les détails d'un paiement PayPal réussi
 */
export async function recordPayPalPayment(
  paymentDetails: any,
  userId: string,
  serviceId: string,
): Promise<boolean> {
  // Cette fonction est à implémenter en fonction de votre système de stockage
  // (par exemple, enregistrer la transaction dans votre base de données)
  console.log(
    `Enregistrement du paiement PayPal pour l'utilisateur ${userId}, service ${serviceId}:`,
    paymentDetails,
  );
  return true;
}
