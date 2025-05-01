import { useReducer, useCallback, useMemo } from "react";

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

// Types d'actions pour le reducer
type PaymentFormAction =
  | { type: 'SET_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_CARD_FIELD'; field: 'cardNumber' | 'cardHolder' | 'expiryDate' | 'cvv'; payload: string }
  | { type: 'SET_PAYPAL_EMAIL'; payload: string }
  | { type: 'SET_PHONE_NUMBER'; payload: string }
  | { type: 'SET_MOBILE_OPERATOR'; payload: MobileOperator }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAYMENT_PROCESSING'; payload: boolean }
  | { type: 'SET_PAYMENT_SUCCESS'; payload: boolean }
  | { type: 'RESET_FORM'; initialMethod: string };

// État initial
const createInitialState = (initialMethod: string): PaymentFormState => ({
  selectedPaymentMethod: initialMethod,
  cardNumber: "",
  cardHolder: "",
  expiryDate: "",
  cvv: "",
  paypalEmail: "",
  phoneNumber: "",
  mobileOperator: "orange-money",
  error: null,
  paymentProcessing: false,
  paymentSuccess: false
});

// Reducer pour la gestion d'état
const paymentFormReducer = (state: PaymentFormState, action: PaymentFormAction): PaymentFormState => {
  switch (action.type) {
    case 'SET_PAYMENT_METHOD':
      return { ...state, selectedPaymentMethod: action.payload, error: null };
    case 'SET_CARD_FIELD':
      return { ...state, [action.field]: action.payload, error: null };
    case 'SET_PAYPAL_EMAIL':
      return { ...state, paypalEmail: action.payload, error: null };
    case 'SET_PHONE_NUMBER':
      return { ...state, phoneNumber: action.payload, error: null };
    case 'SET_MOBILE_OPERATOR':
      return { ...state, mobileOperator: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PAYMENT_PROCESSING':
      return { ...state, paymentProcessing: action.payload };
    case 'SET_PAYMENT_SUCCESS':
      return { ...state, paymentSuccess: action.payload };
    case 'RESET_FORM':
      return createInitialState(action.initialMethod);
    default:
      return state;
  }
};

/**
 * Hook optimisé pour gérer les formulaires de paiement
 * - Utilise useReducer pour une gestion d'état centralisée
 * - Fonctions mémorisées pour éviter les re-rendus inutiles
 * - Object de retour mémorisé pour stabilité des références
 * 
 * @param initialMethod Méthode de paiement initiale
 */
export const usePaymentForm = (initialMethod = "") => {
  // Utiliser useReducer au lieu de plusieurs useState
  const [state, dispatch] = useReducer(paymentFormReducer, initialMethod, createInitialState);

  // Fonctions mémorisées pour les mises à jour d'état
  const setSelectedPaymentMethod = useCallback((method: string) => {
    dispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
  }, []);

  const setCardNumber = useCallback((value: string) => {
    dispatch({ type: 'SET_CARD_FIELD', field: 'cardNumber', payload: value });
  }, []);

  const setCardHolder = useCallback((value: string) => {
    dispatch({ type: 'SET_CARD_FIELD', field: 'cardHolder', payload: value });
  }, []);

  const setExpiryDate = useCallback((value: string) => {
    dispatch({ type: 'SET_CARD_FIELD', field: 'expiryDate', payload: value });
  }, []);

  const setCvv = useCallback((value: string) => {
    dispatch({ type: 'SET_CARD_FIELD', field: 'cvv', payload: value });
  }, []);

  const setPaypalEmail = useCallback((value: string) => {
    dispatch({ type: 'SET_PAYPAL_EMAIL', payload: value });
  }, []);

  const setPhoneNumber = useCallback((value: string) => {
    dispatch({ type: 'SET_PHONE_NUMBER', payload: value });
  }, []);

  const setMobileOperator = useCallback((value: MobileOperator) => {
    dispatch({ type: 'SET_MOBILE_OPERATOR', payload: value });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setPaymentProcessing = useCallback((value: boolean) => {
    dispatch({ type: 'SET_PAYMENT_PROCESSING', payload: value });
  }, []);

  const setPaymentSuccess = useCallback((value: boolean) => {
    dispatch({ type: 'SET_PAYMENT_SUCCESS', payload: value });
  }, []);

  // Fonction de validation optimisée
  const validatePaymentDetails = useCallback((): boolean => {
    if (!state.selectedPaymentMethod) {
      dispatch({ type: 'SET_ERROR', payload: "Veuillez sélectionner une méthode de paiement" });
      return false;
    }

    switch (state.selectedPaymentMethod) {
      case 'card':
        if (!state.cardNumber.trim() || !state.cardHolder.trim() || !state.expiryDate.trim() || !state.cvv.trim()) {
          dispatch({ type: 'SET_ERROR', payload: "Veuillez remplir tous les champs de paiement" });
          return false;
        }
        break;
      case 'paypal':
        if (!state.paypalEmail.trim()) {
          dispatch({ type: 'SET_ERROR', payload: "Veuillez entrer votre email PayPal" });
          return false;
        }
        break;
      case 'orange-money':
      case 'free-money':
      case 'wave':
        if (!state.phoneNumber.trim()) {
          dispatch({ type: 'SET_ERROR', payload: "Veuillez entrer votre numéro de téléphone" });
          return false;
        }
        break;
    }

    dispatch({ type: 'SET_ERROR', payload: null });
    return true;
  }, [state.selectedPaymentMethod, state.cardNumber, state.cardHolder, state.expiryDate, state.cvv, 
      state.paypalEmail, state.phoneNumber]);

  // Fonction pour réinitialiser le formulaire
  const resetPaymentForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM', initialMethod });
  }, [initialMethod]);

  // Retourner un objet mémorisé pour éviter les re-rendus inutiles
  return useMemo(() => ({
    // États
    ...state,
    
    // Setters
    setSelectedPaymentMethod,
    setCardNumber,
    setCardHolder,
    setExpiryDate,
    setCvv,
    setPaypalEmail,
    setPhoneNumber,
    setMobileOperator,
    setError,
    setPaymentProcessing,
    setPaymentSuccess,
    
    // Méthodes
    validatePaymentDetails,
    resetPaymentForm,
    
    // État complet pour faciliter le passage aux composants
    formState: state
  }), [
    state,
    setSelectedPaymentMethod,
    setCardNumber,
    setCardHolder,
    setExpiryDate,
    setCvv,
    setPaypalEmail,
    setPhoneNumber,
    setMobileOperator,
    setError,
    setPaymentProcessing,
    setPaymentSuccess,
    validatePaymentDetails,
    resetPaymentForm
  ]);
}; 