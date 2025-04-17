"use client";

import { usePaymentForm } from "@/hooks/usePaymentForm";
import { PaymentForm } from "@/components/orders/PaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export function PaymentFormExample() {
  // Utilisation du hook pour gérer tous les états de paiement
  const {
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    cardNumber,
    setCardNumber,
    cardHolder,
    setCardHolder,
    expiryDate,
    setExpiryDate,
    cvv,
    setCvv,
    paypalEmail,
    setPaypalEmail,
    phoneNumber, 
    setPhoneNumber,
    mobileOperator,
    setMobileOperator,
    error,
    setError,
    paymentProcessing,
    setPaymentProcessing,
    paymentSuccess,
    setPaymentSuccess,
    validatePaymentDetails,
    resetPaymentForm
  } = usePaymentForm("card"); // Initialisation avec carte comme méthode par défaut

  // Exemple de traitement de paiement
  const handlePayment = async () => {
    // Validation des données de formulaire
    if (!validatePaymentDetails()) {
      return;
    }

    // Simulation du traitement du paiement
    setPaymentProcessing(true);
    
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Paiement réussi
      setPaymentSuccess(true);
      
      // Réinitialiser après quelques secondes
      setTimeout(() => {
        resetPaymentForm();
      }, 3000);
    } catch (err) {
      setError("Une erreur est survenue lors du traitement du paiement");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Afficher le succès du paiement
  if (paymentSuccess) {
    return (
      <Card className="border-green-100">
        <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
          <div className="bg-green-100 rounded-full p-3 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Paiement réussi !</h2>
          <p className="text-slate-600 mb-6">
            Votre paiement a été traité avec succès.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 p-2 rounded-md flex items-start gap-2 text-red-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Sélection de la méthode de paiement */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Méthode de paiement</label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={selectedPaymentMethod === "card" ? "default" : "outline"}
              onClick={() => setSelectedPaymentMethod("card")}
              className="flex-1"
            >
              Carte
            </Button>
            <Button
              type="button"
              variant={selectedPaymentMethod === "paypal" ? "default" : "outline"}
              onClick={() => setSelectedPaymentMethod("paypal")}
              className="flex-1"
            >
              PayPal
            </Button>
            <Button
              type="button"
              variant={selectedPaymentMethod === "orange-money" ? "default" : "outline"}
              onClick={() => setSelectedPaymentMethod("orange-money")}
              className="flex-1"
            >
              Mobile
            </Button>
          </div>
        </div>
        
        {/* Formulaire de paiement */}
        <PaymentForm
          method={selectedPaymentMethod}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardHolder={cardHolder}
          setCardHolder={setCardHolder}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          cvv={cvv}
          setCvv={setCvv}
          paypalEmail={paypalEmail}
          setPaypalEmail={setPaypalEmail}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          mobileOperator={mobileOperator}
          setMobileOperator={setMobileOperator}
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePayment}
          className="w-full"
          disabled={paymentProcessing}
        >
          {paymentProcessing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            "Payer maintenant"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 