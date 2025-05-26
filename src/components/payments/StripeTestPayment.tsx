"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStripePayment } from "@/hooks/useStripePayment";
import { StripeElementsProvider } from "@/components/StripeElementsProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, CreditCard } from "lucide-react";

interface StripeTestPaymentProps {
  title: string;
  description: string;
  amount: number;
}

/**
 * Composant de test de paiement Stripe
 *
 * Permet de tester le paiement Stripe avec une carte de test
 */
export function StripeTestPayment({
  title,
  description,
  amount,
}: StripeTestPaymentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Utilisation du hook personnalisé pour les paiements Stripe
  const {
    loading,
    error,
    paymentData,
    createPaymentIntent,
    handlePaymentSuccess,
    handlePaymentFailure,
  } = useStripePayment();

  // Initialisation du paiement
  const handleInitPayment = async () => {
    setPaymentStatus("processing");
    setPaymentError(null);

    try {
      // Utiliser les IDs spécifiques fournis
      const clientId = "0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a";
      const freelanceId = "2fde948c-91d8-4ae7-9a04-77c363680106";
      const serviceId = "baa01d07-b860-4423-ac58-5392bae6a9c6";

      // Création du PaymentIntent avec les IDs spécifiques
      const result = await createPaymentIntent({
        amount,
        serviceId,
        freelanceId,
        metadata: {
          clientId,
          test: true,
          description: "Test de paiement",
        },
        bypassAuth: true,
      });

      if (!result) {
        throw new Error("Échec de la création du PaymentIntent");
      }

      setPaymentStatus("idle");
    } catch (err: any) {
      console.error("Erreur d'initialisation du paiement:", err);
      setPaymentStatus("error");
      setPaymentError(
        err.message ||
          "Une erreur est survenue lors de la préparation du paiement",
      );
    }
  };

  // Gestion du succès du paiement
  const handleSuccess = async (paymentIntent: any) => {
    setPaymentStatus("success");
    setTransactionId(paymentIntent.id);

    // Appel de la fonction de succès du hook
    if (paymentIntent.id) {
      await handlePaymentSuccess(
        paymentIntent.id,
        "baa01d07-b860-4423-ac58-5392bae6a9c6",
      );
    }
  };

  // Gestion de l'erreur de paiement
  const handleError = async (error: any) => {
    setPaymentStatus("error");
    setPaymentError(
      error.message || "Une erreur est survenue lors du paiement",
    );

    // Appel de la fonction d'échec du hook
    if (paymentData?.paymentIntentId) {
      await handlePaymentFailure(
        paymentData.paymentIntentId,
        "baa01d07-b860-4423-ac58-5392bae6a9c6",
        error.message || "Une erreur est survenue",
      );
    }
  };

  // Rendu du formulaire de paiement
  const renderPaymentForm = () => {
    if (!paymentData?.clientSecret) {
      return (
        <div className="p-4 text-center">
          <Button
            onClick={handleInitPayment}
            disabled={loading}
            className="mt-4"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                Préparation du paiement...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Démarrer le test
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <StripeElementsProvider clientSecret={paymentData.clientSecret}>
        <StripeCardForm
          amount={amount}
          clientSecret={paymentData.clientSecret}
          onSuccess={handleSuccess}
          onError={handleError}
          loading={paymentStatus === "processing" && !paymentError}
          currency="eur"
          serviceId="baa01d07-b860-4423-ac58-5392bae6a9c6"
        />
      </StripeElementsProvider>
    );
  };

  // Affichage des résultats du paiement
  const renderPaymentResult = () => {
    if (paymentStatus === "success") {
      return (
        <div className="p-4 text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-lg font-medium">Paiement réussi !</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ID de transaction: {transactionId}
            </p>
          </div>
          <Button onClick={() => setPaymentStatus("idle")} className="mt-2">
            Tester à nouveau
          </Button>
        </div>
      );
    }

    if (paymentStatus === "error" && paymentError) {
      return (
        <div className="p-4 text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
            <h3 className="text-lg font-medium">Échec du paiement</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {paymentError}
            </p>
          </div>
          <Button onClick={() => setPaymentStatus("idle")} className="mt-2">
            Réessayer
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentStatus === "success" || paymentStatus === "error"
          ? renderPaymentResult()
          : renderPaymentForm()}

        {error && (
          <div className="text-red-500 text-sm mt-4">Erreur: {error}</div>
        )}
      </CardContent>
    </Card>
  );
}
