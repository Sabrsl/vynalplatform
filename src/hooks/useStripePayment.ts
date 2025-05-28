"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { logSecurityEvent } from "@/lib/security/audit";

interface CreatePaymentIntentParams {
  amount: number;
  serviceId: string;
  freelanceId?: string;
  metadata?: Record<string, any>;
  bypassAuth?: boolean;
}

interface PaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  orderId?: string;
}

/**
 * Hook personnalisé pour gérer les paiements Stripe
 * Utilise RLS Supabase pour la sécurité
 */
export function useStripePayment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);

  /**
   * Crée un PaymentIntent côté serveur
   */
  const createPaymentIntent = useCallback(
    async (params: CreatePaymentIntentParams): Promise<PaymentResponse> => {
      setLoading(true);
      setError(null);

      try {
        // Vérifier si l'utilisateur est connecté
        if (!params.bypassAuth && !user) {
          throw new Error("Utilisateur non connecté");
        }

        // Générer un identifiant idempotent pour éviter les créations multiples
        const idempotencyKey = `payment_${params.serviceId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Appel à l'API pour créer un PaymentIntent
        const response = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            amount: params.amount,
            serviceId: params.serviceId,
            freelanceId: params.freelanceId,
            metadata: params.metadata,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de la création du PaymentIntent",
          );
        }

        const data = await response.json();
        setPaymentData(data);

        // Journaliser l'événement de sécurité
        logSecurityEvent({
          type: "payment_intent_created",
          severity: "info",
          details: {
            paymentIntentId: data.paymentIntentId,
            serviceId: params.serviceId,
            amount: params.amount,
          },
        });

        return data;
      } catch (err: any) {
        const errorMessage =
          err.message || "Erreur lors de la création du PaymentIntent";
        console.error("Erreur de création de PaymentIntent:", errorMessage);
        setError(errorMessage);

        // Journaliser l'événement de sécurité
        logSecurityEvent({
          type: "payment_intent_error",
          severity: "medium",
          details: {
            error: errorMessage,
            serviceId: params.serviceId,
            amount: params.amount,
          },
        });

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  /**
   * Gère le succès d'un paiement
   */
  const handlePaymentSuccess = useCallback(
    async (paymentIntentId: string, serviceId: string) => {
      console.log(`Paiement réussi - PaymentIntent: ${paymentIntentId}`);

      if (user) {
        try {
          // Déclencher le webhook manuel pour traiter le paiement
          const manualWebhookResponse = await fetch(
            "/api/stripe/manual-webhook",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentIntentId }),
            },
          );

          const webhookResult = await manualWebhookResponse.json();

          if (!manualWebhookResponse.ok) {
            console.error(
              "Erreur lors du traitement manuel du webhook:",
              webhookResult.error,
            );

            // Tentative de mise à jour directe comme fallback
            await supabase
              .from("payments")
              .update({ status: "paid" })
              .eq("payment_intent_id", paymentIntentId)
              .eq("client_id", user.id);

            // Chercher l'order_id associé au paiement pour mettre à jour la commande
            const { data: paymentData, error: paymentError } = await supabase
              .from("payments")
              .select("order_id")
              .eq("payment_intent_id", paymentIntentId)
              .eq("client_id", user.id)
              .limit(1);

            if (paymentError) {
              console.error(
                "Erreur lors de la récupération du paiement:",
                paymentError,
              );
            } else if (paymentData && paymentData.length > 0) {
              // Modifier pour accéder au premier élément du tableau
              const orderId = paymentData[0].order_id;

              // Mettre à jour le statut de la commande
              await supabase
                .from("orders")
                .update({ status: "paid" })
                .eq("id", orderId)
                .eq("client_id", user.id);
            }
          } else if (webhookResult.alreadyProcessed) {
            console.log(
              "Ce paiement a déjà été traité:",
              webhookResult.paymentId,
            );
          } else {
            console.log(
              "Paiement traité avec succès via webhook manuel:",
              webhookResult,
            );
          }

          // Journalisation du succès
          await logSecurityEvent({
            type: "payment_success",
            userId: user.id,
            severity: "info",
            details: {
              paymentIntentId,
              serviceId,
              orderId: webhookResult.orderId,
              orderNumber: webhookResult.orderNumber,
            },
          });
        } catch (err) {
          console.error(
            "Erreur lors de la mise à jour du statut de paiement:",
            err,
          );
        }
      }
    },
    [user],
  );

  /**
   * Gère l'échec d'un paiement
   */
  const handlePaymentFailure = useCallback(
    async (
      paymentIntentId: string,
      serviceId: string,
      errorMessage: string,
    ) => {
      console.log(
        `Paiement échoué - PaymentIntent: ${paymentIntentId}, Erreur: ${errorMessage}`,
      );

      if (user) {
        try {
          // Mise à jour du statut dans la table payments via RLS
          await supabase
            .from("payments")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("payment_intent_id", paymentIntentId)
            .eq("client_id", user.id);

          // Chercher l'order_id associé au paiement pour mettre à jour la commande
          const { data: paymentData, error: paymentError } = await supabase
            .from("payments")
            .select("order_id")
            .eq("payment_intent_id", paymentIntentId)
            .eq("client_id", user.id)
            .limit(1);

          if (paymentError) {
            console.error(
              "Erreur lors de la récupération du paiement:",
              paymentError,
            );
          } else if (paymentData && paymentData.length > 0) {
            // Modifier pour accéder au premier élément du tableau
            const orderId = paymentData[0].order_id;

            // Mettre à jour le statut de la commande
            await supabase
              .from("orders")
              .update({ status: "payment_failed" })
              .eq("id", orderId)
              .eq("client_id", user.id);
          }

          // Journalisation de l'échec
          await logSecurityEvent({
            type: "payment_failure",
            userId: user.id,
            severity: "medium",
            details: {
              paymentIntentId,
              serviceId,
              error: errorMessage,
              orderId:
                paymentData && paymentData.length > 0
                  ? paymentData[0].order_id
                  : undefined,
            },
          });
        } catch (err) {
          console.error(
            "Erreur lors de la mise à jour du statut de paiement:",
            err,
          );
        }
      }
    },
    [user],
  );

  return {
    loading,
    error,
    paymentData,
    createPaymentIntent,
    handlePaymentSuccess,
    handlePaymentFailure,
  };
}

/**
 * Vérifie si une activité suspecte a été détectée
 * @param userId ID de l'utilisateur
 * @param eventType Type d'événement
 * @returns true si l'activité est suspecte
 */
async function isSuspiciousActivity(
  userId: string,
  eventType: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/security/check-activity?userId=${userId}&eventType=${eventType}`,
    );

    // Si l'endpoint n'existe pas (404) ou autre erreur, retourner false
    if (!response.ok) {
      console.warn(
        "Vérification d'activité suspecte indisponible:",
        response.status,
      );
      return false;
    }

    const data = await response.json();
    return data.isSuspicious || false;
  } catch (error) {
    console.error("Erreur lors de la vérification d'activité suspecte:", error);
    return false;
  }
}
