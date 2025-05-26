import { NextRequest, NextResponse } from "next/server";
import { stripe, retrievePaymentIntent } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";
import { logSecurityEvent } from "@/lib/security/audit";

// Création d'une instance Supabase pour les opérations serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "ERREUR CRITIQUE: Variables d'environnement Supabase manquantes",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Génère un numéro de commande unique
function generateOrderNumber(): string {
  const prefix = "VNL";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Webhook Stripe pour traiter les événements de paiement
 *
 * Route: POST /api/stripe/webhook
 */
export async function POST(req: NextRequest) {
  // Récupérer le corps brut de la requête pour vérification de signature
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  // Récupération de la clé secrète webhook
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("ERREUR CRITIQUE: Secret du webhook Stripe manquant");
    return NextResponse.json(
      { error: "Configuration incorrecte" },
      { status: 500 },
    );
  }

  let event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Erreur de signature du webhook: ${err.message}`);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  // Traitement des différents types d'événements
  try {
    const eventType = event.type;
    console.log(`Traitement de l'événement Stripe: ${eventType}`);

    switch (eventType) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        console.log(`Événement non géré: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Erreur lors du traitement du webhook: ${error.message}`);
    return NextResponse.json(
      { error: "Erreur lors du traitement de l'événement" },
      { status: 500 },
    );
  }
}

/**
 * Gère un paiement réussi
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log(`PaymentIntent réussi: ${paymentIntent.id}`);

  // Extraire les métadonnées utiles
  const {
    clientId,
    freelanceId,
    serviceId,
    orderId: existingOrderId,
    originalCurrency,
    originalAmount,
    userCurrency,
    conversionDetails,
  } = paymentIntent.metadata || {};

  if (!clientId || !freelanceId || !serviceId) {
    console.error(
      "Métadonnées incomplètes dans le PaymentIntent",
      paymentIntent.id,
    );
    return;
  }

  try {
    // Récupérer le montant original en XOF (tous les prix sont stockés en XOF dans la base)
    let amount = parseFloat(originalAmount || "0");

    // Si le montant est 0 ou n'est pas disponible, utiliser le montant du PaymentIntent
    // et enregistrer un avertissement
    if (!amount || amount <= 0) {
      console.warn(
        `Montant original non trouvé, utilisation du montant EUR converti: ${paymentIntent.id}`,
      );
      // Considérer que le montant du PaymentIntent est en centimes d'euros
      amount = paymentIntent.amount / 100;

      // Convertir en XOF pour la cohérence dans la base de données
      try {
        const { convertCurrency } = require("@/lib/utils/currency-updater");
        amount = convertCurrency(amount, "EUR", "XOF", false) as number;
        console.log(
          `Conversion inverse EUR → XOF pour cohérence: ${paymentIntent.amount / 100} EUR = ${amount} XOF`,
        );
      } catch (convError) {
        console.error("Erreur lors de la conversion EUR → XOF:", convError);
        // En cas d'erreur, utiliser un taux de conversion fixe approximatif
        amount = (paymentIntent.amount / 100) * 655.957;
      }
    }

    console.log(
      `Montant final pour enregistrement: ${amount} XOF (originalCurrency: ${originalCurrency || "non spécifiée"})`,
    );

    // Traitement des détails de conversion pour le journalisation
    let conversionInfo = {};
    try {
      if (conversionDetails) {
        conversionInfo = JSON.parse(conversionDetails);
        console.log("Détails de conversion:", conversionInfo);
      }
    } catch (jsonError) {
      console.warn(
        "Impossible de parser les détails de conversion:",
        jsonError,
      );
    }

    // Vérifier si le paiement existe déjà dans la base de données
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status, order_id")
      .eq("payment_intent_id", paymentIntent.id)
      .single();

    let orderId = existingPayment?.order_id || existingOrderId;
    let orderNumber = "";

    // Si le paiement existe, mettre à jour son statut et la commande associée
    if (existingPayment) {
      if (existingPayment.status !== "paid") {
        // Mettre à jour le statut du paiement avec informations supplémentaires
        await supabase
          .from("payments")
          .update({
            status: "paid",
            amount: amount, // S'assurer que le montant est bien en XOF
            currency: "XOF", // Toujours XOF pour la cohérence
            payment_details: JSON.stringify({
              provider: "stripe",
              amount_xof: amount,
              amount_eur: paymentIntent.amount / 100,
              original_currency: originalCurrency || "XOF",
              user_currency: userCurrency || originalCurrency || "XOF",
              conversion_details: conversionInfo,
              payment_intent_id: paymentIntent.id,
              payment_date: new Date().toISOString(),
            }),
          })
          .eq("id", existingPayment.id);

        // Mettre à jour le statut de la commande si elle existe
        if (orderId) {
          const { data: orderData } = await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId)
            .select("order_number")
            .single();

          if (orderData) {
            orderNumber = orderData.order_number;
          }
        }
      }
    } else {
      // Le paiement n'existe pas encore, vérifier si la commande existe
      if (!orderId) {
        // Rechercher une commande existante pour ce client et ce service
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id, order_number")
          .eq("client_id", clientId)
          .eq("service_id", serviceId)
          .eq("freelance_id", freelanceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existingOrder) {
          orderId = existingOrder.id;
          orderNumber = existingOrder.order_number;
        } else {
          // Créer une nouvelle commande si nécessaire
          orderNumber = generateOrderNumber();
          const { data: newOrder, error: orderError } = await supabase
            .from("orders")
            .insert({
              client_id: clientId,
              freelance_id: freelanceId,
              service_id: serviceId,
              status: "paid",
              price: amount,
              order_number: orderNumber,
            })
            .select("id")
            .single();

          if (orderError) {
            console.error(
              "Erreur lors de la création de la commande:",
              orderError,
            );
            throw new Error("Erreur lors de la création de la commande");
          }

          orderId = newOrder?.id;
        }
      } else {
        // Récupérer le numéro de commande si l'ID de commande existe déjà
        const { data: orderData } = await supabase
          .from("orders")
          .select("order_number")
          .eq("id", orderId)
          .single();

        if (orderData) {
          orderNumber = orderData.order_number;
        }
      }

      // Créer un enregistrement de paiement
      if (orderId) {
        await supabase.from("payments").insert({
          client_id: clientId,
          freelance_id: freelanceId,
          order_id: orderId,
          amount: amount,
          currency: "XOF", // Toujours stocker en XOF pour la cohérence
          payment_intent_id: paymentIntent.id,
          status: "paid",
          payment_method: "stripe",
          payment_details: JSON.stringify({
            provider: "stripe",
            amount_xof: amount,
            amount_eur: paymentIntent.amount / 100,
            original_currency: originalCurrency || "XOF",
            user_currency: userCurrency || originalCurrency || "XOF",
            conversion_details: conversionInfo,
            payment_intent_id: paymentIntent.id,
            payment_date: new Date().toISOString(),
          }),
        });

        // Mettre à jour le statut de la commande
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", orderId);

        // Créer une transaction dans le wallet du freelance
        await createTransaction(
          freelanceId,
          clientId,
          serviceId,
          orderId,
          amount,
        );

        // Créer également une transaction côté client
        await createClientTransaction(
          clientId,
          freelanceId,
          serviceId,
          orderId,
          amount,
          orderNumber,
        );
      }
    }

    // Journaliser l'événement de paiement réussi
    await logSecurityEvent({
      type: "payment_success",
      userId: clientId,
      severity: "info",
      details: {
        paymentIntentId: paymentIntent.id,
        serviceId,
      },
    });
  } catch (error) {
    console.error("Erreur lors du traitement du paiement réussi:", error);
  }
}

/**
 * Gère un paiement échoué
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log(`PaymentIntent échoué: ${paymentIntent.id}`);

  // Extraire les métadonnées
  const { clientId, serviceId } = paymentIntent.metadata || {};

  try {
    // Mettre à jour le statut du paiement s'il existe
    await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("payment_intent_id", paymentIntent.id);

    // Journaliser l'événement d'échec
    if (clientId && serviceId) {
      await logSecurityEvent({
        type: "payment_failure",
        userId: clientId,
        severity: "medium",
        details: {
          paymentIntentId: paymentIntent.id,
          serviceId,
          error: paymentIntent.last_payment_error?.message || "Paiement refusé",
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors du traitement du paiement échoué:", error);
  }
}

/**
 * Gère une session checkout complétée
 */
async function handleCheckoutSessionCompleted(session: any) {
  console.log(`Session checkout complétée: ${session.id}`);

  // Récupérer le PaymentIntent associé à la session
  if (session.payment_intent) {
    const paymentIntent = await retrievePaymentIntent(session.payment_intent);
    await handlePaymentIntentSucceeded(paymentIntent);
  }
}

/**
 * Crée une transaction dans le wallet du freelance
 */
async function createTransaction(
  freelanceId: string,
  clientId: string,
  serviceId: string,
  orderId: string,
  amount: number,
) {
  try {
    // Récupérer le wallet du freelance
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, pending_balance, total_earnings")
      .eq("user_id", freelanceId)
      .single();

    if (walletError) {
      // Si le wallet n'existe pas, le créer
      if (walletError.code === "PGRST116") {
        const { data: newWallet, error: createWalletError } = await supabase
          .from("wallets")
          .insert({
            user_id: freelanceId,
            balance: 0,
            pending_balance: amount,
            total_earnings: amount,
          })
          .select("id")
          .single();

        if (createWalletError) {
          throw createWalletError;
        }

        // Créer la transaction
        await supabase.from("transactions").insert({
          wallet_id: newWallet?.id,
          amount,
          type: "payment",
          status: "pending",
          description: `Paiement pour la commande liée au service ${serviceId}`,
          metadata: {
            serviceId,
            clientId,
            orderId,
          },
        });
      } else {
        throw walletError;
      }
    } else if (walletData) {
      // Mettre à jour le wallet existant
      const newPendingBalance = (walletData.pending_balance || 0) + amount;
      const newTotalEarnings = (walletData.total_earnings || 0) + amount;

      await supabase
        .from("wallets")
        .update({
          pending_balance: newPendingBalance,
          total_earnings: newTotalEarnings,
        })
        .eq("id", walletData.id);

      // Créer la transaction
      await supabase.from("transactions").insert({
        wallet_id: walletData.id,
        amount,
        type: "payment",
        status: "pending",
        description: `Paiement pour la commande liée au service ${serviceId}`,
        metadata: {
          serviceId,
          clientId,
          orderId,
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la création de la transaction:", error);
  }
}

/**
 * Crée une transaction dans le wallet du client pour un paiement
 */
async function createClientTransaction(
  clientId: string,
  freelanceId: string,
  serviceId: string,
  orderId: string,
  amount: number,
  orderNumber: string,
) {
  try {
    // Récupérer le wallet du client
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", clientId)
      .single();

    if (walletError) {
      // Si le wallet n'existe pas, le créer
      if (walletError.code === "PGRST116") {
        const { data: newWallet, error: createWalletError } = await supabase
          .from("wallets")
          .insert({
            user_id: clientId,
            balance: 0,
            pending_balance: 0,
            total_earnings: 0,
          })
          .select("id")
          .single();

        if (createWalletError) {
          throw createWalletError;
        }

        // Créer la transaction pour le client (montant négatif pour indiquer un paiement)
        await supabase.from("transactions").insert({
          wallet_id: newWallet?.id,
          amount: -amount, // Montant négatif pour indiquer un paiement
          type: "payment",
          status: "completed",
          description: `Paiement pour la commande ${orderNumber || orderId}`,
          reference_id: orderId,
          client_id: clientId,
          freelance_id: freelanceId,
          service_id: serviceId,
          order_id: orderId,
          currency: "XOF",
          currency_symbol: "FCFA",
          completed_at: new Date().toISOString(),
        });
      } else {
        throw walletError;
      }
    } else if (walletData) {
      // Créer la transaction pour le client (montant négatif pour indiquer un paiement)
      await supabase.from("transactions").insert({
        wallet_id: walletData.id,
        amount: -amount, // Montant négatif pour indiquer un paiement
        type: "payment",
        status: "completed",
        description: `Paiement pour la commande ${orderNumber || orderId}`,
        reference_id: orderId,
        client_id: clientId,
        freelance_id: freelanceId,
        service_id: serviceId,
        order_id: orderId,
        currency: "XOF",
        currency_symbol: "FCFA",
        completed_at: new Date().toISOString(),
      });

      // Mettre à jour le solde du wallet du client
      const newClientBalance = Math.max(
        0,
        Number(walletData.balance || 0) - amount,
      );

      await supabase
        .from("wallets")
        .update({
          balance: newClientBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletData.id);
    }
  } catch (error) {
    console.error(
      "Erreur lors de la création de la transaction client:",
      error,
    );
  }
}
