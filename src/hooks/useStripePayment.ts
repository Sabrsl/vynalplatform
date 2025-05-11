"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logSecurityEvent } from '@/lib/security/audit';

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
}

/**
 * Hook personnalisé pour gérer les paiements Stripe
 * 
 * Fournit les fonctionnalités pour créer un PaymentIntent et gérer le succès du paiement
 */
export function useStripePayment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  
  /**
   * Crée un PaymentIntent côté serveur
   */
  const createPaymentIntent = useCallback(async ({
    amount,
    serviceId,
    freelanceId,
    metadata = {},
    bypassAuth = false
  }: CreatePaymentIntentParams) => {
    // Vérification de l'authentification (sauf si bypassAuth est activé en développement)
    const isDev = process.env.NODE_ENV === 'development';
    if (!user && !(isDev && bypassAuth)) {
      setError("Vous devez être connecté pour effectuer un paiement");
      return null;
    }
    
    // Mise à jour de l'état local
    setLoading(true);
    setError(null);
    
    try {
      // Journalisation de la tentative de paiement pour l'audit
      if (user) {
        await logSecurityEvent({
          type: 'payment_attempt',
          userId: user.id,
          severity: 'medium',
          details: {
            amount,
            serviceId
          }
        });
      }
      
      // Conversion du montant en centimes pour Stripe (avec conservation de 2 décimales)
      const amountInCents = Math.round(amount * 100);
      console.log(`Montant original: ${amount}€, converti en centimes: ${amountInCents}, serviceId: ${serviceId}`);
      
      // Si on est en mode test et qu'on n'a pas fourni explicitement les IDs, utiliser des ID par défaut
      const testClientId = metadata.clientId || '0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a';
      const testFreelanceId = freelanceId || '2fde948c-91d8-4ae7-9a04-77c363680106';
      
      // Déterminer le clientId à utiliser (priorité: metadata > user > default test)
      const clientId = metadata.clientId || user?.id || testClientId;
      
      // Appel à l'API pour créer un PaymentIntent
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents, // Déjà converti en centimes
          serviceId,
          freelanceId: freelanceId || (isDev ? testFreelanceId : undefined),
          bypassAuth,
          metadata: {
            ...metadata,
            clientId, // S'assurer que clientId est toujours inclus
            userId: user?.id || clientId,
            deliveryTime: metadata.deliveryTime || '7', // Valeur par défaut pour les tests
            requirements: metadata.requirements || 'Test de paiement automatisé'
          }
        }),
      });
      
      console.log('Réponse du serveur pour createPaymentIntent:', response.status);
      
      // Gestion des erreurs HTTP
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création du paiement");
      }
      
      // Traitement de la réponse
      const data = await response.json();
      setPaymentData(data);
      
      // Journaliser la création réussie du PaymentIntent
      await logSecurityEvent({
        type: 'payment_intent_created',
        userId: user?.id || 'dev-test',
        severity: 'info',
        details: {
          paymentIntentId: data.paymentIntentId,
          serviceId,
          amount
        }
      });
      
      return data;
    } catch (err: any) {
      console.error("Erreur de paiement:", err);
      setError(err.message || "Une erreur est survenue lors de la préparation du paiement");
      
      // Journalisation de l'erreur pour l'audit
      await logSecurityEvent({
        type: 'payment_intent_error',
        userId: user?.id,
        severity: 'high',
        details: {
          error: err.message,
          amount,
          serviceId
        }
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  /**
   * Gère le succès d'un paiement
   */
  const handlePaymentSuccess = useCallback(async (paymentIntentId: string, serviceId: string) => {
    console.log(`Paiement réussi - PaymentIntent: ${paymentIntentId}`);
    
    try {
      // Journalisation du succès du paiement pour l'audit
      await logSecurityEvent({
        type: 'payment_success',
        userId: user?.id || '0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a',
        severity: 'info',
        details: {
          paymentIntentId,
          serviceId
        }
      });
    } catch (err) {
      console.error("Erreur de journalisation:", err);
    }
  }, [user]);
  
  /**
   * Gère l'échec d'un paiement
   */
  const handlePaymentFailure = useCallback(async (paymentIntentId: string, serviceId: string, errorMessage: string) => {
    console.log(`Paiement échoué - PaymentIntent: ${paymentIntentId}, Erreur: ${errorMessage}`);
    
    try {
      // Journalisation de l'échec du paiement pour l'audit
      await logSecurityEvent({
        type: 'payment_failure',
        userId: user?.id || '0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a',
        severity: 'medium',
        details: {
          paymentIntentId,
          serviceId,
          error: errorMessage
        }
      });
    } catch (err) {
      console.error("Erreur de journalisation:", err);
    }
  }, [user]);
  
  return {
    loading,
    error,
    paymentData,
    createPaymentIntent,
    handlePaymentSuccess,
    handlePaymentFailure
  };
}

/**
 * Vérifie si une activité suspecte a été détectée
 * @param userId ID de l'utilisateur
 * @param eventType Type d'événement
 * @returns true si l'activité est suspecte
 */
async function isSuspiciousActivity(userId: string, eventType: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/security/check-activity?userId=${userId}&eventType=${eventType}`);
    
    // Si l'endpoint n'existe pas (404) ou autre erreur, retourner false
    if (!response.ok) {
      console.warn("Vérification d'activité suspecte indisponible:", response.status);
      return false;
    }
    
    const data = await response.json();
    return data.isSuspicious || false;
  } catch (error) {
    console.error("Erreur lors de la vérification d'activité suspecte:", error);
    return false;
  }
}