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
 * Endpoint pour traiter manuellement les paiements par carte qui pourraient ne pas avoir déclenché le webhook
 * Cette route est appelée côté client lorsqu'un paiement par carte est confirmé
 *
 * Route: POST /api/stripe/manual-webhook
 */
export async function POST(req: NextRequest) {
  try {
    // Récupérer les informations sur le client
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Extraire le paymentIntentId du corps de la requête
    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "PaymentIntent ID manquant" },
        { status: 400 },
      );
    }

    console.log(`Traitement manuel du paiement ${paymentIntentId}`);

    // Récupérer les détails du PaymentIntent depuis Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    // Vérifier que le paiement est bien réussi
    if (paymentIntent.status !== "succeeded") {
      // Extraire les métadonnées même en cas d'échec pour la journalisation
      const { clientId, freelanceId, serviceId } = paymentIntent.metadata || {};

      // Vérifier s'il existe une commande associée à ce paiement qui a échoué
      let existingOrder = null;
      if (clientId && serviceId) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("id, order_number")
          .eq("service_id", serviceId)
          .eq("client_id", clientId)
          .or(`status.eq.pending,status.eq.pre_payment`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        existingOrder = orderData;
      }

      // Journaliser l'échec du paiement
      try {
        if (clientId) {
          await logSecurityEvent({
            type: "payment_failure",
            userId: clientId,
            ipAddress: clientIp as string,
            userAgent: userAgent as string,
            severity: "medium",
            details: {
              paymentIntentId: paymentIntent.id,
              serviceId,
              orderId: existingOrder?.id,
              status: paymentIntent.status,
              manual: true,
            },
          });
        }
      } catch (logError) {
        console.warn("Erreur lors de la journalisation de l'échec:", logError);
      }

      return NextResponse.json(
        {
          error: "Le paiement n'est pas dans l'état \"succeeded\"",
          status: paymentIntent.status,
        },
        { status: 400 },
      );
    }

    // Extraire les métadonnées
    const {
      clientId,
      freelanceId,
      serviceId,
      deliveryTime = 7,
    } = paymentIntent.metadata || {};

    if (!clientId || !freelanceId || !serviceId) {
      console.error(
        "Métadonnées manquantes dans le payment intent",
        paymentIntent.metadata,
      );
      return NextResponse.json(
        {
          error: "Métadonnées incomplètes",
        },
        { status: 400 },
      );
    }

    // Vérifier si ce paiement a déjà été traité
    const { data: existingPayment, error: existingPaymentError } =
      await supabase
        .from("payments")
        .select("id, status, order_id")
        .eq("payment_intent_id", paymentIntentId)
        .limit(1);

    if (existingPaymentError) {
      console.error(
        "Erreur lors de la vérification du paiement existant:",
        existingPaymentError,
      );
      return NextResponse.json(
        {
          error: `Erreur base de données: ${existingPaymentError.message}`,
        },
        { status: 500 },
      );
    }

    if (existingPayment && existingPayment.length > 0) {
      console.log("Paiement déjà traité:", existingPayment[0]);

      // Si le paiement existe déjà et a un ordre associé, on retourne les informations
      // pour éviter de créer un doublon
      if (existingPayment[0].order_id) {
        // Récupérer les informations de commande associées à ce paiement
        const { data: orderData } = await supabase
          .from("orders")
          .select("id, order_number")
          .eq("id", existingPayment[0].order_id)
          .single();

        return NextResponse.json({
          message: "Ce paiement a déjà été traité",
          paymentId: existingPayment[0].id,
          orderId: existingPayment[0].order_id,
          orderNumber: orderData?.order_number,
          alreadyProcessed: true,
        });
      }

      // Si pas d'ordre associé, on continue avec un statut déjà traité
      return NextResponse.json({
        message: "Ce paiement a déjà été traité mais sans commande associée",
        paymentId: existingPayment[0].id,
        alreadyProcessed: true,
      });
    }

    // Récupérer les informations de service pour obtenir le prix correct
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
      return NextResponse.json(
        {
          error: `Erreur récupération service: ${serviceError.message}`,
        },
        { status: 500 },
      );
    }

    // Si le service n'existe pas, utiliser le montant du PaymentIntent
    const servicePrice = serviceData?.price || paymentIntent.amount / 100;
    const serviceCurrency = serviceData?.currency_code || "XOF";

    // DOUBLE VÉRIFICATION CRITIQUE : S'assurer que le paiement est bien réussi avant de créer la commande
    if (paymentIntent.status !== "succeeded") {
      console.error(
        `🚫 SÉCURITÉ: Tentative de création de commande avec paiement non réussi. Status: ${paymentIntent.status}`,
      );
      return NextResponse.json(
        {
          error: "Création de commande refusée - paiement non confirmé",
          status: paymentIntent.status,
        },
        { status: 400 },
      );
    }

    console.log(
      `✅ SÉCURITÉ: Paiement confirmé réussi (${paymentIntent.status}) - Création de commande autorisée`,
    );

    // Création de la commande UNIQUEMENT si le paiement est confirmé réussi
    const orderNumber = generateOrderNumber();

    // Création de la commande
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        client_id: clientId,
        freelance_id: freelanceId,
        service_id: serviceId,
        status: "paid", // Directement marquer comme 'paid' puisque le paiement est réussi
        price: servicePrice,
        delivery_time: parseInt(deliveryTime as string) || 7,
        order_number: orderNumber,
        currency: serviceCurrency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (orderError) {
      console.error("Erreur lors de la création de la commande:", orderError);
      return NextResponse.json(
        {
          error: `Erreur création commande: ${orderError.message}`,
        },
        { status: 500 },
      );
    }

    // Récupération de l'ID de la commande créée
    let orderId = null;
    let orderNumberToUse = orderNumber;
    if (orderData) {
      orderId = orderData.id;
      orderNumberToUse = orderData.order_number;
    } else {
      return NextResponse.json(
        {
          error: "Impossible de récupérer l'ID de la commande créée",
        },
        { status: 500 },
      );
    }

    // Enregistrement du paiement avec l'ID de commande
    const paymentDataObj = {
      client_id: clientId,
      freelance_id: freelanceId,
      order_id: orderId,
      payment_intent_id: paymentIntent.id,
      amount: servicePrice,
      status: "paid",
      payment_method: "card",
      currency: serviceCurrency,
      original_amount: paymentIntent.amount / 100,
      original_currency: "EUR",
      conversion_rate: 655.957, // Taux de conversion EUR -> XOF approximatif
      payment_details: JSON.stringify({
        provider: "stripe",
        amount_eur: servicePrice,
        payment_intent_id: paymentIntent.id,
        payment_date: new Date().toISOString(),
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentDataObj)
      .select()
      .maybeSingle();

    if (paymentError) {
      console.error("Erreur détaillée lors de l'enregistrement du paiement:", {
        error: paymentError,
        code: paymentError.code,
        details: paymentError.details,
        hint: paymentError.hint,
        message: paymentError.message,
      });
      return NextResponse.json(
        {
          error: `Erreur base de données: ${paymentError.message}`,
        },
        { status: 500 },
      );
    }

    // Récupérer le wallet du freelance
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, pending_balance, total_earnings")
      .eq("user_id", freelanceId)
      .maybeSingle();

    // Traitement du wallet et enregistrement de la transaction si le wallet existe
    if (walletError) {
      console.error(
        "❌ Erreur lors de la récupération du wallet:",
        walletError,
      );

      // Si le wallet n'existe pas, on le crée
      if (walletError.code === "PGRST116") {
        console.log(
          `Wallet non trouvé pour ${freelanceId}, création d'un nouveau wallet`,
        );

        // Formater les montants comme numeric(10,2)
        const formattedAmount = parseFloat(servicePrice.toFixed(2));

        const { data: newWallet, error: createWalletError } = await supabase
          .from("wallets")
          .insert({
            user_id: freelanceId,
            balance: 0.0,
            pending_balance: formattedAmount,
            total_earnings: formattedAmount,
          })
          .select("id")
          .maybeSingle();

        if (createWalletError) {
          console.error(
            "❌ Erreur lors de la création du wallet:",
            createWalletError,
          );
        } else if (newWallet) {
          // Enregistrer la transaction
          await createTransaction(
            newWallet.id,
            freelanceId,
            clientId,
            serviceId,
            orderId,
            orderNumberToUse,
            formattedAmount,
            serviceCurrency,
          );
        }
      }
    } else if (walletData) {
      // Formater les montants comme numeric(10,2)
      const formattedAmount = parseFloat(servicePrice.toFixed(2));

      // Enregistrer la transaction
      await createTransaction(
        walletData.id,
        freelanceId,
        clientId,
        serviceId,
        orderId,
        orderNumberToUse,
        formattedAmount,
        serviceCurrency,
      );

      // Mettre à jour le wallet avec le nouveau solde et les gains totaux
      const newPendingBalance =
        Number(walletData.pending_balance || 0) + formattedAmount;
      const newTotalEarnings =
        Number(walletData.total_earnings || 0) + formattedAmount;

      await updateWalletBalance(
        walletData.id,
        newPendingBalance,
        newTotalEarnings,
      );
    }

    // Mise à jour du wallet du client (déduire le montant payé)
    try {
      // Formater le montant comme numeric(10,2)
      const formattedAmount = parseFloat(servicePrice.toFixed(2));

      // Vérifier si le client a un wallet
      const { data: clientWallet, error: clientWalletError } = await supabase
        .from("wallets")
        .select("id, balance, pending_balance")
        .eq("user_id", clientId)
        .maybeSingle();

      if (clientWalletError) {
        if (clientWalletError.code === "PGRST116") {
          console.log(
            `Wallet non trouvé pour le client ${clientId}, création d'un nouveau wallet`,
          );

          // Créer un wallet pour le client
          const { data: newClientWallet, error: createClientWalletError } =
            await supabase
              .from("wallets")
              .insert({
                user_id: clientId,
                balance: 0.0,
                pending_balance: 0.0,
                total_earnings: 0.0,
              })
              .select("id")
              .maybeSingle();

          if (createClientWalletError) {
            console.error(
              "❌ Erreur lors de la création du wallet client:",
              createClientWalletError,
            );
          } else if (newClientWallet) {
            // Créer une transaction pour le paiement
            const { error: clientTransactionError } = await supabase
              .from("transactions")
              .insert({
                wallet_id: newClientWallet.id,
                amount: -formattedAmount, // Montant négatif pour indiquer un paiement
                type: "payment",
                description: `Paiement pour la commande ${orderNumberToUse}`,
                reference_id: orderId,
                client_id: clientId,
                freelance_id: freelanceId,
                service_id: serviceId,
                order_id: orderId,
                status: "completed",
                completed_at: new Date().toISOString(),
                currency: serviceCurrency,
                currency_symbol: "FCFA",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (clientTransactionError) {
              console.error(
                "❌ Erreur lors de l'enregistrement de la transaction client:",
                clientTransactionError,
              );
            } else {
              console.log("💸 Transaction client enregistrée avec succès");
            }
          }
        } else {
          console.error(
            "❌ Erreur lors de la récupération du wallet client:",
            clientWalletError,
          );
        }
      } else if (clientWallet) {
        // Créer une transaction pour le paiement
        const { error: clientTransactionError } = await supabase
          .from("transactions")
          .insert({
            wallet_id: clientWallet.id,
            amount: -formattedAmount, // Montant négatif pour indiquer un paiement
            type: "payment",
            description: `Paiement pour la commande ${orderNumberToUse}`,
            reference_id: orderId,
            client_id: clientId,
            freelance_id: freelanceId,
            service_id: serviceId,
            order_id: orderId,
            status: "completed",
            completed_at: new Date().toISOString(),
            currency: serviceCurrency,
            currency_symbol: "FCFA",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (clientTransactionError) {
          console.error(
            "❌ Erreur lors de l'enregistrement de la transaction client:",
            clientTransactionError,
          );
        } else {
          // Mettre à jour le solde du wallet du client
          const newClientBalance = Math.max(
            0,
            Number(clientWallet.balance || 0) - formattedAmount,
          );
          const formattedBalance = parseFloat(newClientBalance.toFixed(2));

          const { error: updateClientWalletError } = await supabase
            .from("wallets")
            .update({
              balance: formattedBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", clientWallet.id);

          if (updateClientWalletError) {
            console.error(
              "❌ Erreur lors de la mise à jour du wallet client:",
              updateClientWalletError,
            );
          } else {
            console.log(
              `💰 Wallet client mis à jour: nouveau solde=${formattedBalance}`,
            );
          }
        }
      }
    } catch (clientError) {
      console.error(
        "❌ Exception lors du traitement du wallet client:",
        clientError,
      );
    }

    // Journalisation du paiement réussi pour l'audit
    try {
      await logSecurityEvent({
        type: "payment_success",
        userId: clientId,
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: "info",
        details: {
          paymentIntentId: paymentIntent.id,
          serviceId,
          orderId,
          orderNumber: orderNumberToUse,
          amount: servicePrice,
          manual: true,
        },
      });
    } catch (auditError) {
      console.warn("Échec de la journalisation de l'événement:", auditError);
    }

    // Confirmer la réussite avec des détails
    console.log("💲 Paiement manuel enregistré avec succès:", {
      clientId,
      freelanceId,
      orderId,
      amount: servicePrice,
      orderNumber: orderNumberToUse,
    });

    return NextResponse.json({
      success: true,
      paymentId: paymentData[0].id,
      orderId,
      orderNumber: orderNumberToUse,
    });
  } catch (error: any) {
    console.error("Erreur lors du traitement manuel du webhook:", error);

    // Journalisation de l'erreur
    await logSecurityEvent({
      type: "stripe_webhook_processing_error",
      ipAddress: req.ip as string,
      userAgent: req.headers.get("user-agent") as string,
      severity: "high",
      details: {
        error: error.message,
        isManualWebhook: true,
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
 * Fonction utilitaire pour créer une transaction
 */
async function createTransaction(
  walletId: string,
  freelanceId: string,
  clientId: string,
  serviceId: string,
  orderId: string,
  orderNumber: string,
  amount: number,
  currency: string = "XOF",
) {
  try {
    console.log(
      `📝 Tentative d'enregistrement d'une transaction - wallet_id: ${walletId}, amount: ${amount}, order_id: ${orderId}`,
    );

    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        wallet_id: walletId,
        amount: amount,
        type: "earning",
        description: `Paiement pour la commande ${orderNumber}`,
        reference_id: orderId,
        client_id: clientId,
        freelance_id: freelanceId,
        service_id: serviceId,
        order_id: orderId,
        status: "pending",
        completed_at: null,
        currency: currency,
        currency_symbol: currency === "XOF" ? "FCFA" : "€",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (transactionError) {
      console.error(
        "❌ Erreur lors de l'enregistrement de la transaction:",
        transactionError,
      );
      throw new Error(`Erreur transaction: ${transactionError.message}`);
    }

    console.log("💸 Transaction enregistrée avec succès", transactionData);
    return true;
  } catch (error: any) {
    console.error("❌ Exception lors de la création de la transaction:", error);
    return false;
  }
}

/**
 * Fonction utilitaire pour mettre à jour le solde du wallet
 */
async function updateWalletBalance(
  walletId: string,
  newPendingAmount: number,
  newTotalEarnings: number,
) {
  try {
    // S'assurer que les valeurs sont formatées correctement comme numeric(10,2)
    const formattedPendingAmount = parseFloat(newPendingAmount.toFixed(2));
    const formattedTotalEarnings = parseFloat(newTotalEarnings.toFixed(2));

    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        pending_balance: formattedPendingAmount,
        total_earnings: formattedTotalEarnings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", walletId);

    if (updateError) {
      console.error("❌ Erreur lors de la mise à jour du wallet:", updateError);
      throw new Error(`Erreur mise à jour wallet: ${updateError.message}`);
    }

    console.log(
      `💰 Wallet mis à jour avec succès: pending_balance=${formattedPendingAmount}, gains=${formattedTotalEarnings}`,
    );
    return true;
  } catch (error: any) {
    console.error("❌ Exception lors de la mise à jour du wallet:", error);
    return false;
  }
}
