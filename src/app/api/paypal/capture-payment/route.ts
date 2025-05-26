import { NextRequest, NextResponse } from "next/server";
import {
  capturePayPalPayment,
  verifyPayPalTransaction,
} from "@/lib/paypal/server";
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
 * API pour capturer un paiement PayPal
 *
 * Route: POST /api/paypal/capture-payment
 * Cette API requiert une authentification
 */
export async function POST(req: NextRequest) {
  try {
    // Récupérer les données de la requête
    const {
      orderID,
      serviceId,
      orderId,
      clientId,
      freelanceId,
      orderNumber,
      amount,
    } = await req.json();

    // Journaliser la tentative de capture
    console.log(`🔵 Tentative de capture de paiement PayPal:`, {
      orderID,
      serviceId,
      orderId,
      clientId,
      freelanceId,
      orderNumber,
      amount,
    });

    if (!orderID) {
      return NextResponse.json(
        { error: "ID de commande PayPal manquant" },
        { status: 400 },
      );
    }

    // Capture du paiement via l'API PayPal
    const paypalResponse = await capturePayPalPayment(orderID);

    // Vérifier si la capture a réussi
    if (paypalResponse.status !== "COMPLETED") {
      console.error("❌ Échec de la capture PayPal:", paypalResponse);
      return NextResponse.json(
        {
          error: "Échec de la capture du paiement",
          details: paypalResponse,
        },
        { status: 400 },
      );
    }

    // Vérifier la transaction pour s'assurer qu'elle est valide
    const verificationResult = await verifyPayPalTransaction(paypalResponse);

    if (!verificationResult.valid) {
      console.error(
        "❌ Vérification de transaction PayPal échouée:",
        verificationResult.reason,
      );
      return NextResponse.json(
        {
          error: "Vérification de transaction échouée",
          reason: verificationResult.reason,
        },
        { status: 400 },
      );
    }

    // Extraire les données importantes de la réponse PayPal
    const captureId = paypalResponse.purchase_units[0].payments.captures[0].id;
    const paypalAmount = parseFloat(
      paypalResponse.purchase_units[0].payments.captures[0].amount.value,
    );
    const paypalCurrency =
      paypalResponse.purchase_units[0].payments.captures[0].amount
        .currency_code;

    console.log(`✅ Paiement PayPal capturé avec succès:`, {
      captureId,
      amount: paypalAmount,
      currency: paypalCurrency,
      status: paypalResponse.status,
    });

    // Si nous avons un orderId existant, créer juste le paiement
    // Sinon, l'ordre sera créé par le client
    if (orderId) {
      // Enregistrer le paiement dans la base de données
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          client_id: clientId,
          freelance_id: freelanceId,
          amount: amount,
          status: "paid",
          payment_method: "paypal",
          payment_intent_id: captureId,
          payment_details: JSON.stringify({
            provider: "paypal",
            capture_id: captureId,
            paypal_order_id: orderID,
            amount: paypalAmount,
            currency: paypalCurrency,
            status: paypalResponse.status,
            capture_time: new Date().toISOString(),
            order_details: {
              service_id: serviceId,
              order_id: orderId,
              order_number: orderNumber,
            },
          }),
        })
        .select("id")
        .single();

      if (paymentError) {
        console.error(
          "❌ Erreur lors de l'enregistrement du paiement:",
          paymentError,
        );
        return NextResponse.json(
          {
            error: `Erreur lors de l'enregistrement du paiement: ${paymentError.message}`,
          },
          { status: 500 },
        );
      }

      // Créer les transactions associées au paiement
      await createTransactions(
        clientId,
        freelanceId,
        serviceId,
        orderId,
        amount,
        orderNumber || `PayPal-${Date.now()}`,
      );

      return NextResponse.json({
        success: true,
        captureId,
        paymentId: paymentData?.id,
      });
    }

    // Si nous n'avons pas d'orderId, retourner simplement la confirmation de capture
    return NextResponse.json({
      success: true,
      captureId,
      transactionDetails: {
        amount: paypalAmount,
        currency: paypalCurrency,
        status: paypalResponse.status,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la capture du paiement PayPal:", error);

    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la capture du paiement",
      },
      { status: 500 },
    );
  }
}

/**
 * Crée les transactions pour le client et le freelance après un paiement réussi
 */
async function createTransactions(
  clientId: string,
  freelanceId: string,
  serviceId: string,
  orderId: string,
  amount: number,
  orderNumber: string,
) {
  try {
    // 1. Créer la transaction côté client (paiement)
    await createClientTransaction(
      clientId,
      freelanceId,
      serviceId,
      orderId,
      amount,
      orderNumber,
    );

    // 2. Créer la transaction côté freelance (earning)
    await createFreelanceTransaction(
      freelanceId,
      clientId,
      serviceId,
      orderId,
      amount,
      orderNumber,
    );
  } catch (error) {
    console.error("Erreur lors de la création des transactions:", error);
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
          description: `Paiement PayPal pour la commande ${orderNumber}`,
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
        description: `Paiement PayPal pour la commande ${orderNumber}`,
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

/**
 * Crée une transaction dans le wallet du freelance
 */
async function createFreelanceTransaction(
  freelanceId: string,
  clientId: string,
  serviceId: string,
  orderId: string,
  amount: number,
  orderNumber: string,
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
          type: "earning",
          status: "pending",
          description: `Paiement PayPal reçu pour la commande ${orderNumber}`,
          reference_id: orderId,
          client_id: clientId,
          freelance_id: freelanceId,
          service_id: serviceId,
          order_id: orderId,
          currency: "XOF",
          currency_symbol: "FCFA",
        });
      } else {
        throw walletError;
      }
    } else if (walletData) {
      // Mettre à jour le wallet existant
      const newPendingBalance =
        Number(walletData.pending_balance || 0) + amount;
      const newTotalEarnings = Number(walletData.total_earnings || 0) + amount;

      await supabase
        .from("wallets")
        .update({
          pending_balance: newPendingBalance,
          total_earnings: newTotalEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletData.id);

      // Créer la transaction
      await supabase.from("transactions").insert({
        wallet_id: walletData.id,
        amount,
        type: "earning",
        status: "pending",
        description: `Paiement PayPal reçu pour la commande ${orderNumber}`,
        reference_id: orderId,
        client_id: clientId,
        freelance_id: freelanceId,
        service_id: serviceId,
        order_id: orderId,
        currency: "XOF",
        currency_symbol: "FCFA",
      });
    }

    console.log(
      `Transaction freelance créée avec succès pour le paiement de ${amount} XOF`,
    );
    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la création de la transaction freelance:",
      error,
    );
    return false;
  }
}
