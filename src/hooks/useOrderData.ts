import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast as hotToast } from "react-hot-toast";
import { PaymentData, PaymentMethodType, validatePaymentData } from "@/lib/constants/payment";

interface OrderData {
  requirements: string;
  deliveryDate: string;
  files: FileList | null;
  selectedPaymentMethod: PaymentMethodType;
  paymentData: PaymentData;
  isTestMode: boolean;
  orderId?: string;
  orderNumber?: string;
  testPaymentSuccess?: boolean;
  error?: string | null;
  paymentProcessing: boolean;
  paymentSuccess: boolean;
}

export function useOrderData(serviceId: string) {
  const [loadingService, setLoadingService] = useState(true);
  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData>({
    requirements: '',
    deliveryDate: '',
    files: null,
    selectedPaymentMethod: 'card',
    paymentData: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      paypalEmail: '',
      phoneNumber: '',
      mobileOperator: 'orange-money'
    },
    isTestMode: false,
    paymentProcessing: false,
    paymentSuccess: false
  });

  const supabase = createClientComponentClient();

  // Charger les données du service
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId) return;
      
      setLoadingService(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            profiles(*),
            categories(*)
          `)
          .eq('id', serviceId)
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération du service");
          setError("Impossible de récupérer les détails du service.");
          hotToast.error("Impossible de récupérer les détails du service");
          return;
        }
        
        if (data) {
          setService(data);
        }
      } catch (err) {
        console.error("Erreur inattendue");
        setError("Une erreur est survenue lors du chargement des détails du service.");
        hotToast.error("Une erreur est survenue lors du chargement du service");
      } finally {
        setLoadingService(false);
      }
    };

    fetchServiceData();
  }, [serviceId, supabase]);

  // Charger les données sauvegardées
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`order_${serviceId}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setOrderData(prev => ({
          ...prev,
          ...parsedData
        }));
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données");
      hotToast.error("Erreur lors du chargement des données précédentes");
    }
  }, [serviceId]);

  // Sauvegarder les données
  const saveOrderData = useCallback((newData: Partial<OrderData>) => {
    try {
      const updatedData = { ...orderData, ...newData };
      setOrderData(updatedData);
      localStorage.setItem(`order_${serviceId}`, JSON.stringify(updatedData));
    } catch (err) {
      console.error("Erreur lors de la sauvegarde des données");
      setError("Erreur lors de la sauvegarde des données");
    }
  }, [orderData, serviceId]);

  // Gestion des paiements
  const setPaymentMethod = useCallback((method: PaymentMethodType) => {
    saveOrderData({ selectedPaymentMethod: method, error: null });
  }, [saveOrderData]);

  const setPaymentField = useCallback((field: keyof PaymentData, value: string) => {
    saveOrderData({
      paymentData: {
        ...orderData.paymentData,
        [field]: value
      },
      error: null
    });
  }, [saveOrderData, orderData.paymentData]);

  const setPaymentProcessing = useCallback((processing: boolean) => {
    saveOrderData({ paymentProcessing: processing });
  }, [saveOrderData]);

  const setPaymentSuccess = useCallback((success: boolean) => {
    saveOrderData({ paymentSuccess: success });
  }, [saveOrderData]);

  const validatePayment = useCallback((): string | null => {
    return validatePaymentData(orderData.selectedPaymentMethod, orderData.paymentData);
  }, [orderData.selectedPaymentMethod, orderData.paymentData]);

  const resetPaymentForm = useCallback(() => {
    saveOrderData({
      selectedPaymentMethod: "card",
      paymentData: {
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: "",
        paypalEmail: "",
        phoneNumber: "",
        mobileOperator: "orange-money"
      },
      error: null,
      paymentProcessing: false,
      paymentSuccess: false
    });
  }, [saveOrderData]);

  return {
    service,
    loadingService,
    isLoading,
    error,
    orderData,
    setOrderData: saveOrderData,
    setIsLoading,
    setError,
    // Méthodes de paiement
    setPaymentMethod,
    setPaymentField,
    setPaymentProcessing,
    setPaymentSuccess,
    validatePayment,
    resetPaymentForm
  };
} 