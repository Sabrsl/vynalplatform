/**
 * Configuration du serveur PayPal
 * Ce fichier contient toutes les fonctions pour interagir avec l'API PayPal côté serveur
 */

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

// Vérifier la présence des clés requises
if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.error('ERREUR: Les clés PayPal sont manquantes dans les variables d\'environnement');
}

/**
 * Récupère un token d'accès pour l'API PayPal
 */
async function getPayPalAccessToken(): Promise<string> {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      throw new Error('Configuration PayPal incomplète: Client ID ou Secret manquant');
    }
    
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur PayPal: ${errorData.error_description || 'Impossible de récupérer le token d\'accès'}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erreur lors de la récupération du token PayPal:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'une transaction PayPal
 */
export async function verifyPayPalTransaction(orderId: string): Promise<any> {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur PayPal: ${errorData.message || 'Impossible de vérifier la transaction'}`);
    }
    
    const orderData = await response.json();
    return orderData;
  } catch (error) {
    console.error('Erreur lors de la vérification de la transaction PayPal:', error);
    throw error;
  }
}

/**
 * Capture un paiement PayPal (finalise la transaction)
 */
export async function capturePayPalPayment(orderId: string): Promise<any> {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur PayPal: ${errorData.message || 'Impossible de capturer le paiement'}`);
    }
    
    const captureData = await response.json();
    return captureData;
  } catch (error) {
    console.error('Erreur lors de la capture du paiement PayPal:', error);
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
}): Promise<{id: string; status: string}> {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const { amount, currency = 'EUR', description = 'Commande sur Vynal Platform', itemName = 'Service', userEmail, metadata = {} } = params;
    
    // Construction de la requête pour l'API PayPal
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        },
        description,
        custom_id: metadata.serviceId || undefined,
        soft_descriptor: 'VYNALPLATFORM',
        items: [{
          name: itemName,
          unit_amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          },
          quantity: '1'
        }]
      }],
      application_context: {
        brand_name: 'Vynal Platform',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: process.env.NEXT_PUBLIC_PAYPAL_SUCCESS_URL || 'https://vynal.vercel.app/payment/success',
        cancel_url: process.env.NEXT_PUBLIC_PAYPAL_CANCEL_URL || 'https://vynal.vercel.app/payment/cancel'
      }
    };
    
    // Si un email est fourni, ajouter les informations de payer
    if (userEmail) {
      Object.assign(orderPayload, {
        payer: {
          email_address: userEmail
        }
      });
    }
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderPayload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur PayPal: ${errorData.message || 'Impossible de créer la commande'}`);
    }
    
    const orderData = await response.json();
    return {
      id: orderData.id,
      status: orderData.status
    };
  } catch (error) {
    console.error('Erreur lors de la création de la commande PayPal:', error);
    throw error;
  }
}

/**
 * Enregistre les détails d'un paiement PayPal réussi
 */
export async function recordPayPalPayment(paymentDetails: any, userId: string, serviceId: string): Promise<boolean> {
  // Cette fonction est à implémenter en fonction de votre système de stockage
  // (par exemple, enregistrer la transaction dans votre base de données)
  console.log(`Enregistrement du paiement PayPal pour l'utilisateur ${userId}, service ${serviceId}:`, paymentDetails);
  return true;
} 