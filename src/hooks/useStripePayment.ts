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
    async ({
      amount,
      serviceId,
      freelanceId,
      metadata = {},
      bypassAuth = false,
    }: CreatePaymentIntentParams) => {
      // Vérification de l'authentification
      if (!user) {
        setError("Vous devez être connecté pour effectuer un paiement");
        return null;
      }

      // Mise à jour de l'état local
      setLoading(true);
      setError(null);

      try {
        // Le montant reçu est déjà en XOF (pas de centimes pour XOF)
        // Note: le serveur gèrera la conversion en EUR si nécessaire
        // Tous les prix sont stockés en XOF dans la base de données
        const amountInXof = amount; // Le montant est déjà en XOF (pas de centimes)
        console.log(`Montant pour paiement: ${amount} XOF`);

        // Journalisation de la tentative de paiement pour l'audit
        try {
          await logSecurityEvent({
            type: "payment_attempt",
            userId: user.id,
            severity: "medium",
            details: {
              amount: amountInXof,
              serviceId,
            },
          });
        } catch (logError) {
          console.warn("Erreur de journalisation, on continue", logError);
          // On continue même si la journalisation échoue
        }

        // Vérifier d'abord si le freelance_id existe pour ce service
        let actualFreelanceId = freelanceId;

        if (!actualFreelanceId) {
          const { data: serviceData, error: serviceError } = await supabase
            .from("services")
            .select("freelance_id")
            .eq("id", serviceId)
            .maybeSingle();

          if (serviceError && serviceError.code !== "PGRST116") {
            console.error(
              "Erreur lors de la récupération des données du service:",
              serviceError,
            );
            throw new Error(
              `Erreur récupération service: ${serviceError.message}`,
            );
          } else if (serviceData) {
            actualFreelanceId = serviceData.freelance_id;
          }
        }

        if (!actualFreelanceId) {
          throw new Error("ID du freelance requis pour le paiement");
        }

        // Appel à l'API pour créer un PaymentIntent et une commande si nécessaire
        // Note: L'API convertira automatiquement le montant en euros pour le traitement par Stripe
        let retryCount = 0;
        const maxRetries = 2;
        let response;
        let lastError;

        // Boucle de tentatives avec backoff exponentiel
        while (retryCount <= maxRetries) {
          try {
            response = await fetch("/api/stripe/payment-intent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount: amountInXof,
                serviceId,
                freelanceId: actualFreelanceId,
                metadata: {
                  ...metadata,
                  clientId: user.id,
                  userId: user.id,
                  deliveryTime: metadata.deliveryTime || "7",
                  requirements:
                    metadata.requirements || "Test de paiement automatisé",
                },
              }),
              credentials: "include",
            });

            // Si la requête a réussi, sortir de la boucle
            if (response.ok) {
              break;
            } else {
              // En cas d'erreur, enregistrer l'erreur et réessayer
              const errorText = await response.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch (e) {
                errorData = {
                  error: errorText || "Erreur de serveur inconnue",
                };
              }

              lastError = new Error(
                errorData.error || `Erreur serveur: ${response.status}`,
              );
              console.warn(
                `Tentative ${retryCount + 1}/${maxRetries + 1} échouée:`,
                lastError,
              );

              // Attendre avant de réessayer (backoff exponentiel)
              if (retryCount < maxRetries) {
                const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, etc.
                await new Promise((resolve) => setTimeout(resolve, waitTime));
              }
            }
          } catch (fetchError: any) {
            // Erreur réseau, enregistrer et réessayer
            lastError = fetchError;
            console.warn(
              `Tentative ${retryCount + 1}/${maxRetries + 1} échouée (erreur réseau):`,
              fetchError,
            );

            if (retryCount < maxRetries) {
              const waitTime = Math.pow(2, retryCount) * 1000;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
          }

          retryCount++;
        }

        // Vérifier si toutes les tentatives ont échoué
        if (!response || !response.ok) {
          throw (
            lastError ||
            new Error(
              "Échec de la création du paiement après plusieurs tentatives",
            )
          );
        }

        // Traitement de la réponse
        const data = await response.json();
        setPaymentData(data);

        // Journaliser la création réussie du PaymentIntent
        try {
          await logSecurityEvent({
            type: "payment_intent_created",
            userId: user.id,
            severity: "info",
            details: {
              paymentIntentId: data.paymentIntentId,
              serviceId,
              orderId: data.orderId,
              amount: amountInXof,
            },
          });
        } catch (logError) {
          console.warn("Erreur lors de la journalisation du succès", logError);
          // On continue même si la journalisation échoue
        }

        return data;
      } catch (err: any) {
        console.error("Erreur de paiement:", err);
        setError(
          err.message ||
            "Une erreur est survenue lors de la préparation du paiement",
        );

        // Journalisation de l'erreur pour l'audit
        try {
          await logSecurityEvent({
            type: "payment_intent_error",
            userId: user.id,
            severity: "high",
            details: {
              error: err.message,
              amount: amount,
              serviceId,
            },
          });
        } catch (logError) {
          console.warn("Erreur de journalisation de l'échec", logError);
        }

        return null;
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
              .maybeSingle();

            if (paymentError && paymentError.code !== "PGRST116") {
              console.error(
                "Erreur lors de la récupération du paiement:",
                paymentError,
              );
            } else if (paymentData && paymentData.order_id) {
              // Mettre à jour le statut de la commande
              await supabase
                .from("orders")
                .update({ status: "paid" })
                .eq("id", paymentData.order_id)
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
            .maybeSingle();

          if (paymentError && paymentError.code !== "PGRST116") {
            console.error(
              "Erreur lors de la récupération du paiement:",
              paymentError,
            );
          } else if (paymentData && paymentData.order_id) {
            // Mettre à jour le statut de la commande
            await supabase
              .from("orders")
              .update({ status: "payment_failed" })
              .eq("id", paymentData.order_id)
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
              orderId: paymentData?.order_id,
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
