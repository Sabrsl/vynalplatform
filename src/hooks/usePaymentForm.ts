import { useState } from "react";

export type MobileOperator = "orange-money" | "free-money" | "wave";

export interface PaymentFormState {
  selectedPaymentMethod: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  paypalEmail: string;
  phoneNumber: string;
  mobileOperator: MobileOperator;
  error: string | null;
  paymentProcessing: boolean;
  paymentSuccess: boolean;
}

export const usePaymentForm = (initialMethod = "") => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(initialMethod);
  
  // États pour carte bancaire
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  
  // États pour PayPal
  const [paypalEmail, setPaypalEmail] = useState("");
  
  // États pour paiement mobile
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileOperator, setMobileOperator] = useState<MobileOperator>("orange-money");
  
  // États pour le traitement du paiement
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fonction de validation des champs selon la méthode de paiement
  const validatePaymentDetails = (): boolean => {
    if (!selectedPaymentMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return false;
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardNumber.trim() || !cardHolder.trim() || !expiryDate.trim() || !cvv.trim()) {
        setError("Veuillez remplir tous les champs de paiement");
        return false;
      }
    } 
    else if (selectedPaymentMethod === 'paypal') {
      if (!paypalEmail.trim()) {
        setError("Veuillez entrer votre email PayPal");
        return false;
      }
    }
    else if (['orange-money', 'free-money', 'wave'].includes(selectedPaymentMethod)) {
      if (!phoneNumber.trim()) {
        setError("Veuillez entrer votre numéro de téléphone");
        return false;
      }
    }

    setError(null);
    return true;
  };

  // Fonction pour réinitialiser tous les états
  const resetPaymentForm = () => {
    setSelectedPaymentMethod(initialMethod);
    setCardNumber("");
    setCardHolder("");
    setExpiryDate("");
    setCvv("");
    setPaypalEmail("");
    setPhoneNumber("");
    setMobileOperator("orange-money");
    setError(null);
    setPaymentProcessing(false);
    setPaymentSuccess(false);
  };

  return {
    // États
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
    
    // Méthodes
    validatePaymentDetails,
    resetPaymentForm,
    
    // État complet pour faciliter le passage aux composants
    formState: {
      selectedPaymentMethod,
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
      paypalEmail,
      phoneNumber,
      mobileOperator,
      error,
      paymentProcessing,
      paymentSuccess
    } as PaymentFormState
  };
}; 