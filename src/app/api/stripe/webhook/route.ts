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
      // 💳 PAIEMENTS (PaymentIntent & charges)
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "payment_intent.processing":
        await handlePaymentIntentProcessing(event.data.object);
        break;

      case "payment_intent.requires_action":
        await handlePaymentIntentRequiresAction(event.data.object);
        break;

      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object);
        break;

      case "charge.failed":
        await handleChargeFailed(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      // 💬 LITIGES (Très important pour la sécurité)
      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object);
        break;

      case "charge.dispute.closed":
        await handleChargeDisputeClosed(event.data.object);
        break;

      // 🔄 ABONNEMENTS (Si vous avez des services récurrents)
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case "customer.subscription.created":
        await handleCustomerSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleCustomerSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleCustomerSubscriptionDeleted(event.data.object);
        break;

      // 🛒 CHECKOUT
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        console.log(`❓ Événement Stripe non géré: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Erreur lors du traitement du webhook: ${error.message}`);

    // Journalisation de l'erreur
    await logSecurityEvent({
      type: "stripe_webhook_processing_error",
      severity: "high",
      details: {
        error: error.message,
        eventType: event?.type,
        provider: "stripe",
      },
    });

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

  try {
    // VÉRIFICATION CRITIQUE DE SÉCURITÉ : S'assurer que le paiement est bien réussi
    if (paymentIntent.status !== "succeeded") {
      console.error(
        `🚫 SÉCURITÉ: handlePaymentIntentSucceeded appelé avec un paiement non réussi. Status: ${paymentIntent.status}`,
      );
      return;
    }

    console.log(
      `✅ SÉCURITÉ: Statut de paiement vérifié (${paymentIntent.status}) - Traitement autorisé`,
    );

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

    // Récupérer les informations du service pour obtenir le prix correct
    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .select("price, currency_code")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError) {
      console.error(
        "Erreur lors de la récupération des informations du service:",
        serviceError,
      );
      return;
    }

    // Déterminer le montant et la devise à utiliser
    let amount = parseFloat(originalAmount || "0");
    const serviceCurrency = serviceData?.currency_code || "XOF";

    // Si le montant est 0 ou n'est pas disponible, utiliser le prix du service
    if (!amount || amount <= 0) {
      if (serviceData?.price) {
        amount = serviceData.price;
        console.log(
          `Utilisation du prix du service: ${amount} ${serviceCurrency}`,
        );
      } else {
        // Fallback: utiliser le montant du PaymentIntent converti
        amount = paymentIntent.amount / 100;
        console.warn(
          `Fallback: utilisation du montant PaymentIntent: ${amount} EUR`,
        );
      }
    }

    console.log(
      `Montant final pour enregistrement: ${amount} ${serviceCurrency || "XOF"}`,
    );

    // Traitement des détails de conversion pour la journalisation
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
    const { data: existingPayment, error: existingPaymentError } =
      await supabase
        .from("payments")
        .select("id, status, order_id")
        .eq("payment_intent_id", paymentIntent.id)
        .limit(1);

    if (existingPaymentError) {
      console.error(
        "Erreur lors de la vérification du paiement existant:",
        existingPaymentError,
      );
      return;
    }

    let orderId =
      existingPayment && existingPayment.length > 0
        ? existingPayment[0].order_id
        : existingOrderId;
    let orderNumber = "";

    // Si le paiement existe, mettre à jour son statut et la commande associée
    if (existingPayment && existingPayment.length > 0) {
      if (existingPayment[0].status !== "paid") {
        // Mettre à jour le statut du paiement avec informations supplémentaires
        await supabase
          .from("payments")
          .update({
            status: "paid",
            amount: amount,
            currency: serviceCurrency,
            payment_details: JSON.stringify({
              provider: "stripe",
              amount: amount,
              original_currency: originalCurrency || serviceCurrency,
              user_currency:
                userCurrency || originalCurrency || serviceCurrency,
              conversion_details: conversionInfo,
              payment_intent_id: paymentIntent.id,
              payment_date: new Date().toISOString(),
            }),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment[0].id);

        // Mettre à jour le statut de la commande si elle existe
        if (orderId) {
          const { data: orderData, error: orderUpdateError } = await supabase
            .from("orders")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .select("order_number")
            .maybeSingle();

          if (orderUpdateError) {
            console.error(
              "Erreur lors de la mise à jour de la commande:",
              orderUpdateError,
            );
          } else if (orderData) {
            orderNumber = orderData.order_number;
          }
        }
      }
    } else {
      // Le paiement n'existe pas encore, vérifier si la commande existe
      if (!orderId) {
        // Rechercher une commande existante pour ce client et ce service avec statut "pre_payment"
        const { data: existingOrder, error: existingOrderError } =
          await supabase
            .from("orders")
            .select("id, order_number, status")
            .eq("client_id", clientId)
            .eq("service_id", serviceId)
            .eq("freelance_id", freelanceId)
            .eq("status", "pre_payment")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingOrderError && existingOrderError.code !== "PGRST116") {
          console.error(
            "Erreur lors de la recherche de commande existante:",
            existingOrderError,
          );
        }

        if (existingOrder) {
          orderId = existingOrder.id;
          orderNumber = existingOrder.order_number;

          // Mettre à jour la commande existante à "paid"
          await supabase
            .from("orders")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        } else {
          // Créer une nouvelle commande
          orderNumber = generateOrderNumber();

          // VÉRIFICATION FINALE AVANT CRÉATION : Le paiement doit être 'succeeded'
          if (paymentIntent.status !== "succeeded") {
            console.error(
              `🚫 SÉCURITÉ: Tentative de création de commande avec paiement status: ${paymentIntent.status}`,
            );
            throw new Error(
              `Création de commande refusée - paiement non confirmé: ${paymentIntent.status}`,
            );
          }

          console.log(
            `✅ SÉCURITÉ: Création de nouvelle commande autorisée - Paiement confirmé (${paymentIntent.status})`,
          );

          const { data: newOrder, error: orderError } = await supabase
            .from("orders")
            .insert({
              client_id: clientId,
              freelance_id: freelanceId,
              service_id: serviceId,
              status: "paid",
              price: amount,
              currency: serviceCurrency,
              order_number: orderNumber,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .maybeSingle();

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
        const { data: orderData, error: orderFetchError } = await supabase
          .from("orders")
          .select("order_number")
          .eq("id", orderId)
          .maybeSingle();

        if (orderFetchError && orderFetchError.code !== "PGRST116") {
          console.error(
            "Erreur lors de la récupération de la commande:",
            orderFetchError,
          );
        } else if (orderData) {
          orderNumber = orderData.order_number;

          // Mettre à jour le statut de la commande
          await supabase
            .from("orders")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        }
      }

      // Créer un enregistrement de paiement
      if (orderId) {
        // VÉRIFICATION CRITIQUE : Ne créer un paiement 'paid' que si le PaymentIntent est 'succeeded'
        if (paymentIntent.status !== "succeeded") {
          console.error(
            `🚫 SÉCURITÉ: Tentative de création de paiement 'paid' avec status: ${paymentIntent.status}`,
          );
          throw new Error(
            `Création de paiement refusée - status non valide: ${paymentIntent.status}`,
          );
        }

        console.log(
          `✅ SÉCURITÉ: Création de paiement 'paid' autorisée - PaymentIntent status: ${paymentIntent.status}`,
        );

        const { error: paymentInsertError } = await supabase
          .from("payments")
          .insert({
            client_id: clientId,
            freelance_id: freelanceId,
            order_id: orderId,
            amount: amount,
            currency: serviceCurrency,
            payment_intent_id: paymentIntent.id,
            status: "paid",
            payment_method: "stripe",
            payment_details: JSON.stringify({
              provider: "stripe",
              amount: amount,
              original_currency: originalCurrency || serviceCurrency,
              user_currency:
                userCurrency || originalCurrency || serviceCurrency,
              conversion_details: conversionInfo,
              payment_intent_id: paymentIntent.id,
              payment_date: new Date().toISOString(),
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (paymentInsertError) {
          console.error(
            "Erreur lors de la création du paiement:",
            paymentInsertError,
          );
          return;
        }

        // Créer une transaction dans le wallet du freelance
        await createTransaction(
          freelanceId,
          clientId,
          serviceId,
          orderId,
          amount,
          orderNumber,
          serviceCurrency,
        );

        // Créer également une transaction côté client
        await createClientTransaction(
          clientId,
          freelanceId,
          serviceId,
          orderId,
          amount,
          orderNumber,
          serviceCurrency,
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
        orderId,
        orderNumber,
        amount,
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
  const {
    clientId,
    serviceId,
    orderId: existingOrderId,
  } = paymentIntent.metadata || {};

  try {
    // Mettre à jour le statut du paiement s'il existe
    await supabase
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    // Chercher l'ID de la commande associée au paiement échoué
    let orderId = existingOrderId;
    if (!orderId && clientId && serviceId) {
      // Si pas d'ID de commande fourni, chercher une commande récente pour ce client et ce service
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("order_id")
        .eq("payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (paymentError && paymentError.code !== "PGRST116") {
        console.error("Erreur lors de la recherche du paiement:", paymentError);
      }

      if (paymentData?.order_id) {
        orderId = paymentData.order_id;
      } else {
        // Si pas de commande trouvée dans les paiements, chercher dans les commandes
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id")
          .eq("client_id", clientId)
          .eq("service_id", serviceId)
          .or("status.eq.pending,status.eq.pre_payment")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (orderError && orderError.code !== "PGRST116") {
          console.error(
            "Erreur lors de la recherche de la commande:",
            orderError,
          );
        }

        if (orderData) {
          orderId = orderData.id;
        }
      }
    }

    // Mettre à jour le statut de la commande si elle existe
    if (orderId) {
      await supabase
        .from("orders")
        .update({
          status: "payment_failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      console.log(
        `Commande ${orderId} mise à jour avec statut 'payment_failed'`,
      );
    }

    // Journaliser l'événement d'échec
    if (clientId && serviceId) {
      await logSecurityEvent({
        type: "payment_failure",
        userId: clientId,
        severity: "medium",
        details: {
          paymentIntentId: paymentIntent.id,
          serviceId,
          orderId,
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
  orderNumber: string,
  currency: string = "XOF",
) {
  try {
    // Formater le montant comme numeric(10,2)
    const formattedAmount = parseFloat(amount.toFixed(2));

    // Récupérer le wallet du freelance
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, pending_balance, total_earnings")
      .eq("user_id", freelanceId)
      .maybeSingle();

    if (walletError) {
      // Si le wallet n'existe pas, le créer
      if (walletError.code === "PGRST116") {
        const { data: newWallet, error: createWalletError } = await supabase
          .from("wallets")
          .insert({
            user_id: freelanceId,
            balance: 0.0,
            pending_balance: formattedAmount,
            total_earnings: formattedAmount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();

        if (createWalletError) {
          console.error(
            "Erreur lors de la création du wallet:",
            createWalletError,
          );
          return;
        }

        if (newWallet) {
          // Créer la transaction
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              wallet_id: newWallet.id,
              amount: formattedAmount,
              type: "earning",
              status: "pending",
              description: `Paiement pour la commande ${orderNumber}`,
              reference_id: orderId,
              client_id: clientId,
              freelance_id: freelanceId,
              service_id: serviceId,
              order_id: orderId,
              currency,
              currency_symbol: currency === "XOF" ? "FCFA" : "€",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (transactionError) {
            console.error(
              "Erreur lors de la création de la transaction:",
              transactionError,
            );
          }
        }
      } else {
        console.error("Erreur lors de la récupération du wallet:", walletError);
      }
    } else if (walletData) {
      // Mettre à jour le wallet existant
      const newPendingBalance =
        Number(walletData.pending_balance || 0) + formattedAmount;
      const newTotalEarnings =
        Number(walletData.total_earnings || 0) + formattedAmount;

      // Formater les montants comme numeric(10,2)
      const formattedPendingBalance = parseFloat(newPendingBalance.toFixed(2));
      const formattedTotalEarnings = parseFloat(newTotalEarnings.toFixed(2));

      const { error: updateWalletError } = await supabase
        .from("wallets")
        .update({
          pending_balance: formattedPendingBalance,
          total_earnings: formattedTotalEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletData.id);

      if (updateWalletError) {
        console.error(
          "Erreur lors de la mise à jour du wallet:",
          updateWalletError,
        );
        return;
      }

      // Créer la transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          wallet_id: walletData.id,
          amount: formattedAmount,
          type: "earning",
          status: "pending",
          description: `Paiement pour la commande ${orderNumber}`,
          reference_id: orderId,
          client_id: clientId,
          freelance_id: freelanceId,
          service_id: serviceId,
          order_id: orderId,
          currency,
          currency_symbol: currency === "XOF" ? "FCFA" : "€",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (transactionError) {
        console.error(
          "Erreur lors de la création de la transaction:",
          transactionError,
        );
      }
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
  currency: string = "XOF",
) {
  try {
    // Formater le montant comme numeric(10,2)
    const formattedAmount = parseFloat(amount.toFixed(2));

    // Récupérer le wallet du client
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", clientId)
      .maybeSingle();

    if (walletError) {
      // Si le wallet n'existe pas, le créer
      if (walletError.code === "PGRST116") {
        const { data: newWallet, error: createWalletError } = await supabase
          .from("wallets")
          .insert({
            user_id: clientId,
            balance: 0.0,
            pending_balance: 0.0,
            total_earnings: 0.0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();

        if (createWalletError) {
          console.error(
            "Erreur lors de la création du wallet client:",
            createWalletError,
          );
          return;
        }

        if (newWallet) {
          // Créer la transaction pour le client (montant négatif pour indiquer un paiement)
          const { error: clientTransactionError } = await supabase
            .from("transactions")
            .insert({
              wallet_id: newWallet.id,
              amount: -formattedAmount, // Montant négatif pour indiquer un paiement
              type: "payment",
              status: "completed",
              description: `Paiement pour la commande ${orderNumber || orderId}`,
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

          if (clientTransactionError) {
            console.error(
              "Erreur lors de la création de la transaction client:",
              clientTransactionError,
            );
          }
        }
      } else {
        console.error(
          "Erreur lors de la récupération du wallet client:",
          walletError,
        );
      }
    } else if (walletData) {
      // Créer la transaction pour le client (montant négatif pour indiquer un paiement)
      const { error: clientTransactionError } = await supabase
        .from("transactions")
        .insert({
          wallet_id: walletData.id,
          amount: -formattedAmount, // Montant négatif pour indiquer un paiement
          type: "payment",
          status: "completed",
          description: `Paiement pour la commande ${orderNumber || orderId}`,
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

      if (clientTransactionError) {
        console.error(
          "Erreur lors de la création de la transaction client:",
          clientTransactionError,
        );
        return;
      }

      // Mettre à jour le solde du wallet du client
      const newClientBalance = Math.max(
        0,
        Number(walletData.balance || 0) - formattedAmount,
      );

      // Formater le solde comme numeric(10,2)
      const formattedBalance = parseFloat(newClientBalance.toFixed(2));

      const { error: updateClientWalletError } = await supabase
        .from("wallets")
        .update({
          balance: formattedBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletData.id);

      if (updateClientWalletError) {
        console.error(
          "Erreur lors de la mise à jour du wallet client:",
          updateClientWalletError,
        );
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la création de la transaction client:",
      error,
    );
  }
}

/**
 * Gère un paiement en cours de traitement
 */
async function handlePaymentIntentProcessing(paymentIntent: any) {
  console.log("⏳ Stripe: Paiement en cours de traitement:", paymentIntent.id);

  try {
    // Mettre à jour le statut si le paiement existe déjà
    await supabase
      .from("payments")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    console.log(`⏳ Paiement Stripe en traitement: ${paymentIntent.id}`);
  } catch (error) {
    console.error("❌ Erreur lors du traitement du paiement en cours:", error);
  }
}

/**
 * Gère un paiement nécessitant une action (ex: 3D Secure)
 */
async function handlePaymentIntentRequiresAction(paymentIntent: any) {
  console.log("🚧 Stripe: Action requise pour le paiement:", paymentIntent.id);

  try {
    // Mettre à jour le statut si le paiement existe déjà
    await supabase
      .from("payments")
      .update({
        status: "requires_action",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    const { clientId } = paymentIntent.metadata || {};

    // Journaliser l'événement nécessitant une action
    if (clientId) {
      await logSecurityEvent({
        type: "payment_attempt",
        userId: clientId,
        severity: "medium",
        details: {
          paymentIntentId: paymentIntent.id,
          action_required: paymentIntent.next_action?.type || "unknown",
          provider: "stripe",
          eventType: "REQUIRES_ACTION",
        },
      });
    }

    console.log(`🚧 Paiement Stripe nécessite une action: ${paymentIntent.id}`);
  } catch (error) {
    console.error("❌ Erreur lors du traitement de l'action requise:", error);
  }
}

/**
 * Gère une charge réussie
 */
async function handleChargeSucceeded(charge: any) {
  console.log("✅ Stripe: Charge réussie:", charge.id);

  try {
    // Récupérer le PaymentIntent associé pour traiter comme un paiement normal
    if (charge.payment_intent) {
      const paymentIntent = await retrievePaymentIntent(charge.payment_intent);

      // Si le PaymentIntent n'a pas encore été traité, le traiter maintenant
      if (paymentIntent && paymentIntent.status === "succeeded") {
        await handlePaymentIntentSucceeded(paymentIntent);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors du traitement de la charge réussie:", error);
  }
}

/**
 * Gère une charge échouée
 */
async function handleChargeFailed(charge: any) {
  console.log("❌ Stripe: Charge échouée:", charge.id);

  try {
    // Récupérer le PaymentIntent associé pour traiter comme un paiement échoué
    if (charge.payment_intent) {
      const paymentIntent = await retrievePaymentIntent(charge.payment_intent);

      if (paymentIntent) {
        await handlePaymentIntentFailed(paymentIntent);
      }
    }

    // Journaliser l'échec spécifique de la charge
    await logSecurityEvent({
      type: "payment_failure",
      severity: "medium",
      details: {
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent,
        failure_code: charge.failure_code,
        failure_message: charge.failure_message,
        provider: "stripe",
        eventType: "CHARGE_FAILED",
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors du traitement de la charge échouée:", error);
  }
}

/**
 * Gère un remboursement de charge
 */
async function handleChargeRefunded(charge: any) {
  console.log("🔄 Stripe: Charge remboursée:", charge.id);

  try {
    const paymentIntentId = charge.payment_intent;
    const refundAmount = charge.amount_refunded / 100; // Convertir en euros

    // Mettre à jour le statut du paiement
    await supabase
      .from("payments")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntentId);

    // Journaliser le remboursement
    await logSecurityEvent({
      type: "payment_success", // Remboursement réussi
      severity: "medium",
      details: {
        chargeId: charge.id,
        paymentIntentId,
        refundAmount,
        totalRefunded: charge.amount_refunded / 100,
        provider: "stripe",
        eventType: "CHARGE_REFUNDED",
      },
    });

    console.log(
      `🔄 Remboursement Stripe traité: ${charge.id} - Montant: ${refundAmount}€`,
    );
  } catch (error) {
    console.error("❌ Erreur lors du traitement du remboursement:", error);
  }
}

/**
 * Gère une réclamation/litige créé (CRITIQUE pour la sécurité)
 */
async function handleChargeDisputeCreated(dispute: any) {
  console.log("🚨 Stripe: Litige créé:", dispute.id);

  try {
    const chargeId = dispute.charge;
    const paymentIntentId = dispute.payment_intent;

    // Mettre à jour le statut du paiement concerné
    await supabase
      .from("payments")
      .update({
        status: "disputed",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntentId);

    // Journaliser l'événement critique
    await logSecurityEvent({
      type: "payment_failure",
      severity: "high",
      details: {
        disputeId: dispute.id,
        chargeId,
        paymentIntentId,
        reason: dispute.reason || "Litige Stripe",
        amount: dispute.amount / 100,
        currency: dispute.currency,
        status: dispute.status,
        provider: "stripe",
        eventType: "DISPUTE_CREATED",
      },
    });

    console.log(
      `🚨 ALERTE: Litige Stripe créé pour charge ${chargeId} - Raison: ${dispute.reason}`,
    );
  } catch (error) {
    console.error("❌ Erreur lors du traitement du litige créé:", error);
  }
}

/**
 * Gère un litige fermé/résolu
 */
async function handleChargeDisputeClosed(dispute: any) {
  console.log("✅ Stripe: Litige fermé:", dispute.id);

  try {
    const chargeId = dispute.charge;
    const paymentIntentId = dispute.payment_intent;
    const status = dispute.status; // lost, warning_closed, won, etc.

    // Déterminer le nouveau statut du paiement selon la résolution
    let newStatus = "paid"; // Par défaut si dispute fermé en faveur du vendeur

    if (status === "lost") {
      newStatus = "refunded"; // Litige perdu, argent remboursé au client
    } else if (status === "won") {
      newStatus = "paid"; // Litige gagné, paiement conservé
    } else if (status === "warning_closed") {
      newStatus = "paid"; // Avertissement fermé, pas de remboursement
    }

    // Mettre à jour le statut du paiement
    await supabase
      .from("payments")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntentId);

    // Journaliser la résolution
    await logSecurityEvent({
      type: status === "lost" ? "payment_failure" : "payment_success",
      severity: "medium",
      details: {
        disputeId: dispute.id,
        chargeId,
        paymentIntentId,
        status,
        resolution: dispute.status,
        provider: "stripe",
        eventType: "DISPUTE_CLOSED",
      },
    });

    console.log(`✅ Litige Stripe fermé: ${status} pour charge ${chargeId}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de la fermeture du litige:",
      error,
    );
  }
}

/**
 * Gère un paiement d'abonnement réussi
 */
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log("✅ Stripe: Paiement d'abonnement réussi:", invoice.id);

  try {
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;
    const amount = invoice.amount_paid / 100;

    // Journaliser le paiement d'abonnement
    await logSecurityEvent({
      type: "payment_success",
      severity: "info",
      details: {
        invoiceId: invoice.id,
        subscriptionId,
        customerId,
        amount,
        currency: invoice.currency,
        provider: "stripe",
        eventType: "SUBSCRIPTION_PAYMENT_SUCCESS",
      },
    });

    // TODO: Implémenter la logique métier pour les abonnements si nécessaire
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement du paiement d'abonnement réussi:",
      error,
    );
  }
}

/**
 * Gère un échec de paiement d'abonnement
 */
async function handleInvoicePaymentFailed(invoice: any) {
  console.log("❌ Stripe: Échec du paiement d'abonnement:", invoice.id);

  try {
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;

    // Journaliser l'échec du paiement d'abonnement
    await logSecurityEvent({
      type: "payment_failure",
      severity: "medium",
      details: {
        invoiceId: invoice.id,
        subscriptionId,
        customerId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count,
        provider: "stripe",
        eventType: "SUBSCRIPTION_PAYMENT_FAILED",
      },
    });

    // TODO: Implémenter la logique pour gérer les échecs d'abonnement (notifications, suspension, etc.)
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de l'échec de paiement d'abonnement:",
      error,
    );
  }
}

/**
 * Gère un abonnement créé
 */
async function handleCustomerSubscriptionCreated(subscription: any) {
  console.log("✅ Stripe: Abonnement créé:", subscription.id);

  try {
    const customerId = subscription.customer;

    // Journaliser la création d'abonnement
    await logSecurityEvent({
      type: "payment_success",
      severity: "info",
      details: {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
        provider: "stripe",
        eventType: "SUBSCRIPTION_CREATED",
      },
    });

    // TODO: Implémenter la logique métier pour la création d'abonnement
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de la création d'abonnement:",
      error,
    );
  }
}

/**
 * Gère un abonnement mis à jour
 */
async function handleCustomerSubscriptionUpdated(subscription: any) {
  console.log("🔄 Stripe: Abonnement mis à jour:", subscription.id);

  try {
    const customerId = subscription.customer;

    // Journaliser la mise à jour d'abonnement
    await logSecurityEvent({
      type: "payment_success",
      severity: "info",
      details: {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
        provider: "stripe",
        eventType: "SUBSCRIPTION_UPDATED",
      },
    });

    // TODO: Implémenter la logique pour les mises à jour d'abonnement
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de la mise à jour d'abonnement:",
      error,
    );
  }
}

/**
 * Gère un abonnement supprimé/annulé
 */
async function handleCustomerSubscriptionDeleted(subscription: any) {
  console.log("❌ Stripe: Abonnement supprimé:", subscription.id);

  try {
    const customerId = subscription.customer;

    // Journaliser la suppression d'abonnement
    await logSecurityEvent({
      type: "payment_success", // Suppression réussie
      severity: "info",
      details: {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
        canceledAt: subscription.canceled_at,
        provider: "stripe",
        eventType: "SUBSCRIPTION_DELETED",
      },
    });

    // TODO: Implémenter la logique pour la suppression d'abonnement
  } catch (error) {
    console.error(
      "❌ Erreur lors du traitement de la suppression d'abonnement:",
      error,
    );
  }
}
