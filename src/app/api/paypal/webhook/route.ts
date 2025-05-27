import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logSecurityEvent } from "@/lib/security/audit";

// Création d'une instance Supabase pour les opérations serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "ERREUR CRITIQUE: Variables d'environnement Supabase manquantes",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Génère un numéro de commande unique
function generateOrderNumber(): string {
  const prefix = "VNL-PP";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Webhook PayPal pour traiter les événements de paiement
 *
 * Route: POST /api/paypal/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Récupérer le payload du webhook PayPal
    const payload = await req.json();

    console.log("📥 Webhook PayPal reçu:", {
      event_type: payload.event_type,
      resource_type: payload.resource_type,
      summary: payload.summary,
    });

    // Vérification de la signature PayPal (à implémenter si nécessaire)
    // const signature = req.headers.get('paypal-transmission-sig');

    // Traitement des différents types d'événements PayPal
    switch (payload.event_type) {
      // 💳 PAIEMENTS (Transactions uniques)
      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCaptureCompleted(payload.resource);
        break;

      case "PAYMENT.CAPTURE.DENIED":
        await handlePaymentCaptureDenied(payload.resource);
        break;

      case "PAYMENT.CAPTURE.PENDING":
        await handlePaymentCapturePending(payload.resource);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        await handlePaymentCaptureRefunded(payload.resource);
        break;

      case "PAYMENT.CAPTURE.REVERSED":
        await handlePaymentCaptureReversed(payload.resource);
        break;

      // 🧾 COMMANDES (Checkout API)
      case "CHECKOUT.ORDER.APPROVED":
        await handleOrderApproved(payload.resource);
        break;

      case "CHECKOUT.ORDER.COMPLETED":
        await handleOrderCompleted(payload.resource);
        break;

      // 💰 PAIEMENTS CLASSIQUES (Ancienne API REST)
      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentSaleCompleted(payload.resource);
        break;

      // 🔐 AUTORISATIONS
      case "PAYMENT.AUTHORIZATION.CREATED":
        await handlePaymentAuthorizationCreated(payload.resource);
        break;

      case "PAYMENT.AUTHORIZATION.VOIDED":
        await handlePaymentAuthorizationVoided(payload.resource);
        break;

      // 💬 LITIGES (Très important pour la sécurité)
      case "CUSTOMER.DISPUTE.CREATED":
        await handleCustomerDisputeCreated(payload.resource);
        break;

      case "CUSTOMER.DISPUTE.RESOLVED":
        await handleCustomerDisputeResolved(payload.resource);
        break;

      case "CUSTOMER.DISPUTE.UPDATED":
        await handleCustomerDisputeUpdated(payload.resource);
        break;

      // 🔁 ABONNEMENTS (Si vous avez des services récurrents)
      case "BILLING.SUBSCRIPTION.CREATED":
        await handleSubscriptionCreated(payload.resource);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(payload.resource);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(payload.resource);
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionSuspended(payload.resource);
        break;

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        await handleSubscriptionPaymentFailed(payload.resource);
        break;

      case "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED":
        await handleSubscriptionPaymentCompleted(payload.resource);
        break;

      default:
        console.log(`❓ Événement PayPal non géré: ${payload.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Erreur lors du traitement du webhook PayPal:", error);

    // Journalisation de l'erreur
    await logSecurityEvent({
      type: "stripe_webhook_processing_error",
      ipAddress: req.ip as string,
      userAgent: req.headers.get("user-agent") as string,
      severity: "high",
      details: {
        error: error.message,
        provider: "paypal",
      },
    });

    return NextResponse.json(
      {
        error: error.message || "Une erreur est survenue",
      },
      { status: 500 },
    );
  }
}

/**
 * Gère un paiement PayPal capturé avec succès (COMPLETED)
 */
async function handlePaymentCaptureCompleted(resource: any) {
  console.log("✅ PayPal: Paiement capturé avec succès:", resource.id);

  try {
    // VÉRIFICATION CRITIQUE : S'assurer que le paiement est bien COMPLETED
    if (resource.status !== "COMPLETED") {
      console.error(
        `🚫 SÉCURITÉ: handlePaymentCaptureCompleted appelé avec status: ${resource.status}`,
      );
      return;
    }

    console.log(
      `✅ SÉCURITÉ: Statut PayPal vérifié (${resource.status}) - Traitement autorisé`,
    );

    const captureId = resource.id;
    const amount = parseFloat(resource.amount.value);
    const currency = resource.amount.currency_code;

    // Récupérer les métadonnées de la commande PayPal originale
    // Note: PayPal utilise custom_id dans purchase_units pour stocker nos métadonnées
    const serviceId = resource.custom_id;

    if (!serviceId) {
      console.error("❌ Aucun serviceId trouvé dans les métadonnées PayPal");
      return;
    }

    // Vérifier si ce paiement a déjà été traité
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("payment_intent_id", captureId)
      .maybeSingle();

    if (existingPayment) {
      console.log("ℹ️ Paiement PayPal déjà traité:", existingPayment.id);
      return;
    }

    // Créer une commande et un paiement si le statut est COMPLETED
    await createOrderAndPayment({
      captureId,
      amount,
      currency,
      serviceId,
      status: "paid",
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement du paiement PayPal réussi:",
      error,
    );
  }
}

/**
 * Gère un paiement PayPal refusé (DENIED)
 */
async function handlePaymentCaptureDenied(resource: any) {
  console.log("❌ PayPal: Paiement refusé:", resource.id);

  try {
    const captureId = resource.id;

    // Mettre à jour le statut du paiement s'il existe
    await supabase
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", captureId);

    // Journaliser l'échec
    await logSecurityEvent({
      type: "payment_failure",
      severity: "medium",
      details: {
        captureId,
        reason: resource.reason_code || "Paiement refusé",
        status: resource.status,
        provider: "paypal",
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement du paiement PayPal échoué:",
      error,
    );
  }
}

/**
 * Gère un paiement PayPal en attente (PENDING)
 */
async function handlePaymentCapturePending(resource: any) {
  console.log("⏳ PayPal: Paiement en attente:", resource.id);

  try {
    // Mettre à jour le statut si le paiement existe déjà
    await supabase
      .from("payments")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", resource.id);

    console.log(
      `⏳ Paiement PayPal en attente: ${resource.id} - Raison: ${resource.reason_code || "Non spécifiée"}`,
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement du paiement PayPal en attente:",
      error,
    );
  }
}

/**
 * Gère un remboursement PayPal
 */
async function handlePaymentCaptureRefunded(resource: any) {
  console.log("🔄 PayPal: Remboursement traité:", resource.id);

  try {
    // Mettre à jour le statut du paiement
    await supabase
      .from("payments")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", resource.id);
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement du remboursement PayPal:",
      error,
    );
  }
}

/**
 * Gère un paiement PayPal inversé (REVERSED)
 */
async function handlePaymentCaptureReversed(resource: any) {
  console.log("🔄 PayPal: Paiement inversé:", resource.id);

  try {
    // Mettre à jour le statut du paiement
    await supabase
      .from("payments")
      .update({
        status: "reversed",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", resource.id);

    // Journaliser l'inversion (important pour la sécurité)
    await logSecurityEvent({
      type: "payment_failure",
      severity: "high",
      details: {
        transactionId: resource.id,
        reason: resource.reason_code || "Paiement inversé",
        amount: resource.amount?.value,
        currency: resource.amount?.currency_code,
        provider: "paypal",
        eventType: "PAYMENT_REVERSED",
      },
    });

    console.log(
      `🚨 ALERTE: Paiement PayPal inversé ${resource.id} - Raison: ${resource.reason_code || "Non spécifiée"}`,
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement du paiement PayPal inversé:",
      error,
    );
  }
}

/**
 * Gère une commande PayPal approuvée (mais pas encore capturée)
 */
async function handleOrderApproved(resource: any) {
  console.log(
    "⏳ PayPal: Commande approuvée (en attente de capture):",
    resource.id,
  );

  // Ne rien faire - attendre la capture pour créer la commande
  // Cela évite de créer des commandes pour des paiements non finalisés
}

/**
 * Gère une commande PayPal complètement finalisée
 */
async function handleOrderCompleted(resource: any) {
  console.log("✅ PayPal: Commande finalisée:", resource.id);

  // Cette fonction peut être utilisée pour des actions post-paiement
  // comme l'envoi d'emails de confirmation
}

/**
 * Gère un paiement PayPal complet (PAYMENT.SALE.COMPLETED)
 */
async function handlePaymentSaleCompleted(resource: any) {
  console.log("✅ PayPal: Paiement complet:", resource.id);

  // Cette fonction peut être utilisée pour des actions post-paiement
  // comme l'envoi d'emails de confirmation
}

/**
 * Gère une autorisation PayPal créée
 */
async function handlePaymentAuthorizationCreated(resource: any) {
  console.log("✅ PayPal: Autorisation créée:", resource.id);

  // Cette fonction peut être utilisée pour des actions post-autorisation
  // comme l'envoi d'emails de confirmation
}

/**
 * Gère une autorisation PayPal annulée
 */
async function handlePaymentAuthorizationVoided(resource: any) {
  console.log("❌ PayPal: Autorisation annulée:", resource.id);

  // Cette fonction peut être utilisée pour annuler des autorisations
  // comme annuler des commandes associées
}

/**
 * Gère une réclamation client créée (CRITIQUE pour la sécurité)
 */
async function handleCustomerDisputeCreated(resource: any) {
  console.log("🚨 PayPal: Réclamation client créée:", resource.dispute_id);

  try {
    const disputeId = resource.dispute_id;
    const transactionId =
      resource.disputed_transactions?.[0]?.seller_transaction_id;

    // Mettre à jour le statut du paiement concerné
    if (transactionId) {
      await supabase
        .from("payments")
        .update({
          status: "disputed",
          updated_at: new Date().toISOString(),
        })
        .eq("payment_intent_id", transactionId);
    }

    // Journaliser l'événement critique
    await logSecurityEvent({
      type: "payment_failure",
      severity: "high",
      details: {
        disputeId,
        transactionId,
        reason: resource.reason || "Réclamation PayPal",
        amount: resource.dispute_amount?.value,
        currency: resource.dispute_amount?.currency_code,
        provider: "paypal",
        eventType: "DISPUTE_CREATED",
      },
    });

    console.log(
      `🚨 ALERTE: Réclamation PayPal créée pour transaction ${transactionId}`,
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de la réclamation PayPal:",
      error,
    );
  }
}

/**
 * Gère une réclamation client résolue
 */
async function handleCustomerDisputeResolved(resource: any) {
  console.log("✅ PayPal: Réclamation client résolue:", resource.dispute_id);

  try {
    const disputeId = resource.dispute_id;
    const transactionId =
      resource.disputed_transactions?.[0]?.seller_transaction_id;
    const outcome = resource.dispute_outcome?.outcome_code; // RESOLVED_BUYER_FAVOUR, RESOLVED_SELLER_FAVOUR, etc.

    // Mettre à jour le statut du paiement selon la résolution
    if (transactionId) {
      let newStatus = "paid"; // Par défaut si résolu en faveur du vendeur

      if (outcome === "RESOLVED_BUYER_FAVOUR") {
        newStatus = "refunded"; // Client a gagné
      } else if (outcome === "RESOLVED_SELLER_FAVOUR") {
        newStatus = "paid"; // Vendeur a gagné
      }

      await supabase
        .from("payments")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("payment_intent_id", transactionId);
    }

    // Journaliser la résolution
    await logSecurityEvent({
      type: "payment_success",
      severity: "medium",
      details: {
        disputeId,
        transactionId,
        outcome,
        resolution: resource.dispute_outcome?.outcome_code,
        provider: "paypal",
        eventType: "DISPUTE_RESOLVED",
      },
    });

    console.log(
      `✅ Réclamation PayPal résolue: ${outcome} pour transaction ${transactionId}`,
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de la résolution PayPal:",
      error,
    );
  }
}

/**
 * Gère une réclamation client mise à jour
 */
async function handleCustomerDisputeUpdated(resource: any) {
  console.log(
    "🔄 PayPal: Réclamation client mise à jour:",
    resource.dispute_id,
  );

  try {
    const disputeId = resource.dispute_id;
    const transactionId =
      resource.disputed_transactions?.[0]?.seller_transaction_id;
    const status = resource.dispute_life_cycle_stage; // INQUIRY, CHARGEBACK, PRE_ARBITRATION, ARBITRATION

    // Journaliser la mise à jour
    await logSecurityEvent({
      type: "payment_failure",
      severity: "medium",
      details: {
        disputeId,
        transactionId,
        status,
        stage: resource.dispute_life_cycle_stage,
        provider: "paypal",
        eventType: "DISPUTE_UPDATED",
      },
    });

    console.log(
      `🔄 Réclamation PayPal mise à jour: ${status} pour transaction ${transactionId}`,
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de la mise à jour PayPal:",
      error,
    );
  }
}

/**
 * Gère une création d'abonnement
 */
async function handleSubscriptionCreated(resource: any) {
  console.log("✅ PayPal: Abonnement créé:", resource.id);

  // Cette fonction peut être utilisée pour gérer la création d'un abonnement
}

/**
 * Gère un abonnement activé
 */
async function handleSubscriptionActivated(resource: any) {
  console.log("✅ PayPal: Abonnement activé:", resource.id);

  // Cette fonction peut être utilisée pour gérer l'activation d'un abonnement
}

/**
 * Gère un abonnement annulé
 */
async function handleSubscriptionCancelled(resource: any) {
  console.log("❌ PayPal: Abonnement annulé:", resource.id);

  // Cette fonction peut être utilisée pour gérer l'annulation d'un abonnement
}

/**
 * Gère un abonnement suspendu
 */
async function handleSubscriptionSuspended(resource: any) {
  console.log("❌ PayPal: Abonnement suspendu:", resource.id);

  // Cette fonction peut être utilisée pour gérer la suspension d'un abonnement
}

/**
 * Gère un paiement d'abonnement échoué
 */
async function handleSubscriptionPaymentFailed(resource: any) {
  console.log("❌ PayPal: Paiement d'abonnement échoué:", resource.id);

  // Cette fonction peut être utilisée pour gérer un paiement d'abonnement échoué
}

/**
 * Gère un paiement d'abonnement complet
 */
async function handleSubscriptionPaymentCompleted(resource: any) {
  console.log("✅ PayPal: Paiement d'abonnement complet:", resource.id);

  // Cette fonction peut être utilisée pour gérer un paiement d'abonnement complet
}

/**
 * Crée une commande et un paiement pour PayPal
 */
async function createOrderAndPayment(params: {
  captureId: string;
  amount: number;
  currency: string;
  serviceId: string;
  status: string;
}) {
  const { captureId, amount, currency, serviceId, status } = params;

  // VÉRIFICATION FINALE : Ne créer une commande que si le statut est 'paid'
  if (status !== "paid") {
    console.error(
      `🚫 SÉCURITÉ: Tentative de création de commande PayPal avec status: ${status}`,
    );
    return;
  }

  console.log(
    `✅ SÉCURITÉ: Création de commande PayPal autorisée - Status: ${status}`,
  );

  try {
    // Récupérer les informations du service
    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .select("price, currency_code, freelance_id, title")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError) {
      console.error(
        "❌ Erreur lors de la récupération du service:",
        serviceError,
      );
      return;
    }

    if (!serviceData) {
      console.error("❌ Service non trouvé:", serviceId);
      return;
    }

    // Utiliser le prix du service en XOF
    const servicePrice = parseFloat(serviceData.price.toFixed(2));
    const serviceCurrency = serviceData.currency_code || "XOF";
    const freelanceId = serviceData.freelance_id;

    // Générer un numéro de commande
    const orderNumber = generateOrderNumber();

    // Rechercher une commande existante avec statut pre_payment
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from("orders")
      .select("id, order_number, client_id")
      .eq("service_id", serviceId)
      .eq("freelance_id", freelanceId)
      .eq("status", "pre_payment")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let orderId: string;
    let clientId: string;
    let finalOrderNumber: string;

    if (existingOrder && !existingOrderError) {
      // Utiliser la commande existante
      orderId = existingOrder.id;
      clientId = existingOrder.client_id;
      finalOrderNumber = existingOrder.order_number;

      // Mettre à jour le statut de la commande existante
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateOrderError) {
        console.error(
          "❌ Erreur lors de la mise à jour de la commande:",
          updateOrderError,
        );
        return;
      }

      console.log(`✅ Commande existante mise à jour: ${orderId}`);
    } else {
      // Pour PayPal, nous devons gérer le cas où nous n'avons pas de commande pré-existante
      console.warn(
        "⚠️ Aucune commande pre_payment trouvée pour ce service PayPal",
      );

      // Enregistrer juste le paiement sans commande
      await createPayPalPaymentOnly({
        captureId,
        amount: servicePrice,
        currency: serviceCurrency,
        serviceId,
        freelanceId,
      });

      return;
    }

    // Créer l'enregistrement de paiement
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        client_id: clientId,
        freelance_id: freelanceId,
        order_id: orderId,
        payment_intent_id: captureId,
        amount: servicePrice,
        currency: serviceCurrency,
        status: "paid",
        payment_method: "paypal",
        payment_details: JSON.stringify({
          provider: "paypal",
          capture_id: captureId,
          amount_eur: amount,
          amount_xof: servicePrice,
          currency_eur: currency,
          currency_xof: serviceCurrency,
          payment_date: new Date().toISOString(),
          webhook_processed: true,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (paymentError) {
      console.error("❌ Erreur lors de la création du paiement:", paymentError);
      return;
    }

    console.log(`✅ Paiement PayPal créé avec succès:`, {
      paymentId: paymentData?.id,
      orderId,
      captureId,
      amount: servicePrice,
    });

    // Créer les transactions de wallet
    await createWalletTransactions({
      clientId,
      freelanceId,
      serviceId,
      orderId,
      orderNumber: finalOrderNumber,
      amount: servicePrice,
      currency: serviceCurrency,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de commande PayPal:", error);
  }
}

/**
 * Crée uniquement un paiement PayPal (sans commande associée)
 */
async function createPayPalPaymentOnly(params: {
  captureId: string;
  amount: number;
  currency: string;
  serviceId: string;
  freelanceId: string;
}) {
  const { captureId, amount, currency, serviceId, freelanceId } = params;

  try {
    // Enregistrer le paiement sans commande associée
    const { error: paymentError } = await supabase.from("payments").insert({
      freelance_id: freelanceId,
      payment_intent_id: captureId,
      amount: amount,
      currency: currency,
      status: "paid",
      payment_method: "paypal",
      payment_details: JSON.stringify({
        provider: "paypal",
        capture_id: captureId,
        service_id: serviceId,
        note: "Paiement PayPal direct sans commande pre_payment",
        payment_date: new Date().toISOString(),
        webhook_processed: true,
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error(
        "❌ Erreur lors de la création du paiement PayPal:",
        paymentError,
      );
    } else {
      console.log(`✅ Paiement PayPal direct enregistré: ${captureId}`);
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création du paiement PayPal direct:",
      error,
    );
  }
}

/**
 * Crée les transactions de wallet pour PayPal
 */
async function createWalletTransactions(params: {
  clientId: string;
  freelanceId: string;
  serviceId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
}) {
  const {
    clientId,
    freelanceId,
    serviceId,
    orderId,
    orderNumber,
    amount,
    currency,
  } = params;

  try {
    // Formater le montant
    const formattedAmount = parseFloat(amount.toFixed(2));

    // Transaction pour le freelance
    const { data: freelanceWallet, error: freelanceWalletError } =
      await supabase
        .from("wallets")
        .select("id, pending_balance, total_earnings")
        .eq("user_id", freelanceId)
        .maybeSingle();

    if (freelanceWalletError && freelanceWalletError.code !== "PGRST116") {
      console.error(
        "❌ Erreur lors de la récupération du wallet freelance:",
        freelanceWalletError,
      );
    } else if (freelanceWallet) {
      // Wallet existe, créer la transaction
      await supabase.from("transactions").insert({
        wallet_id: freelanceWallet.id,
        amount: formattedAmount,
        type: "earning",
        status: "pending",
        description: `Paiement PayPal pour la commande ${orderNumber}`,
        reference_id: orderId,
        client_id: clientId,
        freelance_id: freelanceId,
        service_id: serviceId,
        order_id: orderId,
        currency: currency,
        currency_symbol: currency === "XOF" ? "FCFA" : "€",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Mettre à jour le wallet freelance
      const newPendingBalance =
        Number(freelanceWallet.pending_balance || 0) + formattedAmount;
      const newTotalEarnings =
        Number(freelanceWallet.total_earnings || 0) + formattedAmount;

      await supabase
        .from("wallets")
        .update({
          pending_balance: parseFloat(newPendingBalance.toFixed(2)),
          total_earnings: parseFloat(newTotalEarnings.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", freelanceWallet.id);
    }

    // Transaction pour le client
    const { data: clientWallet, error: clientWalletError } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", clientId)
      .maybeSingle();

    if (clientWalletError && clientWalletError.code !== "PGRST116") {
      console.error(
        "❌ Erreur lors de la récupération du wallet client:",
        clientWalletError,
      );
    } else if (clientWallet) {
      // Wallet existe, créer la transaction de paiement
      await supabase.from("transactions").insert({
        wallet_id: clientWallet.id,
        amount: -formattedAmount,
        type: "payment",
        status: "completed",
        description: `Paiement PayPal pour la commande ${orderNumber}`,
        reference_id: orderId,
        client_id: clientId,
        freelance_id: freelanceId,
        service_id: serviceId,
        order_id: orderId,
        currency: currency,
        currency_symbol: currency === "XOF" ? "FCFA" : "€",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Mettre à jour le solde du client
      const newClientBalance = Math.max(
        0,
        Number(clientWallet.balance || 0) - formattedAmount,
      );

      await supabase
        .from("wallets")
        .update({
          balance: parseFloat(newClientBalance.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientWallet.id);
    }

    console.log("✅ Transactions de wallet PayPal créées avec succès");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création des transactions de wallet:",
      error,
    );
  }
}
