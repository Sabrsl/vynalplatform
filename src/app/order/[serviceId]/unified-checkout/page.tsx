"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield,
  AlertCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useOrderData } from "@/hooks/useOrderData";
import { useStripePayment } from "@/hooks/useStripePayment";
import { StripeElementsProvider } from "@/components/StripeElementsProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";
import { PayPalButtonsForm } from "@/components/payments/PayPalButtonsForm";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PaymentMethodType } from "@/lib/constants/payment";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { Label } from "@/components/ui/label";
import useCurrency from "@/hooks/useCurrency";
import { ApplePayButton } from "@/components/payments/ApplePayButton";
import { GooglePayButton } from "@/components/payments/GooglePayButton";
import { LinkButton } from "@/components/payments/LinkButton";

// États de chargement personnalisés pour le paiement
const paymentLoadingStates = [
  { text: "Initialisation du paiement..." },
  { text: "Vérification de vos informations..." },
  { text: "Sécurisation de la transaction..." },
  { text: "Connexion au service de paiement..." },
  { text: "Traitement de votre paiement..." },
  { text: "Préparation de votre commande..." },
  { text: "Enregistrement des détails..." },
  { text: "Finalisation de la transaction..." },
];

export default function UnifiedCheckoutPage({
  params,
}: {
  params: { serviceId: string };
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const serviceId = params.serviceId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentLoader, setShowPaymentLoader] = useState(false);
  const [paymentDuration, setPaymentDuration] = useState(15000); // 15 secondes pour le processus complet

  // Stripe payment state
  const {
    loading: stripeLoading,
    error: stripeError,
    paymentData,
    createPaymentIntent,
  } = useStripePayment();

  // Payment method states
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });
  const [paypalEmail, setPaypalEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const {
    service,
    loadingService,
    isLoading,
    error,
    orderData,
    setOrderData,
    setIsLoading,
    validatePayment,
  } = useOrderData(serviceId);

  // Reset selected payment method
  useEffect(() => {
    if (orderData.selectedPaymentMethod) {
      setOrderData({ ...orderData, selectedPaymentMethod: undefined });
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(
        "/sign-in?callbackUrl=" +
          encodeURIComponent(`/order/${serviceId}/unified-checkout`),
      );
    }
  }, [user, authLoading, router, serviceId]);

  // Ajout d'un useEffect pour déboguer le prix du service
  useEffect(() => {
    if (service && orderData.selectedPaymentMethod === "paypal") {
      // Les prix sont stockés en XOF dans la base de données
      console.log("Prix du service pour PayPal:", {
        servicePriceXOF: service.price, // Prix en XOF
        serviceId,
        serviceCurrency: "XOF", // Devise de base toujours XOF dans la BD
      });
    }
  }, [service, orderData.selectedPaymentMethod, serviceId]);

  const handleBack = () => {
    router.push(`/services/${serviceId}`);
  };

  const handleMethodSelect = (method: PaymentMethodType) => {
    if (isLoading) return;

    // Si l'utilisateur clique sur la méthode déjà sélectionnée, on la désélectionne
    if (orderData.selectedPaymentMethod === method) {
      setOrderData({
        ...orderData,
        selectedPaymentMethod: undefined,
        error: null,
      });
      return;
    }

    setOrderData({ ...orderData, selectedPaymentMethod: method, error: null });

    // Si l'utilisateur sélectionne le paiement par carte, initialiser Stripe
    if (method === "card" && service?.price && !paymentData?.clientSecret) {
      // Initialiser le paiement Stripe
      (async () => {
        try {
          await createPaymentIntent({
            amount: service.price,
            serviceId: serviceId,
            freelanceId: service?.profiles?.id,
          });
        } catch (error) {
          console.error(
            "Erreur lors de l'initialisation du paiement Stripe:",
            error,
          );
          setOrderData({
            ...orderData,
            selectedPaymentMethod: method,
            error: "Erreur lors de l'initialisation du paiement par carte",
          });
        }
      })();
    }

    // Reset other payment fields
    if (method !== "card") {
      setCardDetails({
        number: "",
        expiry: "",
        cvc: "",
        name: "",
      });
    }
    if (method !== "paypal") {
      setPaypalEmail("");
    }
    if (method !== "wave" && method !== "orange-money") {
      setMobileNumber("");
    }
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return value;
  };

  const formatCVC = (value: string) => {
    return value.replace(/[^0-9]/gi, "");
  };

  const handlePlaceOrder = async () => {
    if (isLoading || !user || isSubmitting) return;

    // Validate form
    if (!orderData.requirements) {
      setOrderData({ ...orderData, error: "Veuillez décrire votre besoin" });
      return;
    }

    if (!orderData.selectedPaymentMethod) {
      setOrderData({
        ...orderData,
        error: "Veuillez sélectionner une méthode de paiement",
      });
      return;
    }

    // Check payment method data
    if (orderData.selectedPaymentMethod === "card") {
      // Pour Stripe, nous utiliserons maintenant StripeCardForm qui gère sa propre validation
      if (!paymentData || !paymentData.clientSecret) {
        setOrderData({
          ...orderData,
          error: "Erreur lors de l'initialisation du paiement par carte",
        });
        return;
      }
    } else if (orderData.selectedPaymentMethod === "paypal") {
      // Aucune validation supplémentaire requise pour PayPal
    } else if (
      orderData.selectedPaymentMethod === "wave" ||
      orderData.selectedPaymentMethod === "orange-money"
    ) {
      if (!mobileNumber) {
        setOrderData({
          ...orderData,
          error: `Veuillez saisir votre numéro ${orderData.selectedPaymentMethod === "wave" ? "Wave" : "Orange Money"}`,
        });
        return;
      }
    }

    // Si nous sommes en mode test ou si la méthode n'est pas carte, utiliser l'ancien flux
    if (orderData.isTestMode || orderData.selectedPaymentMethod !== "card") {
      // Démarrer les indicateurs de chargement
      setIsLoading(true);
      setIsSubmitting(true);
      setShowPaymentLoader(true);

      try {
        const startTime = Date.now();
        const supabase = createClientComponentClient();

        // Vérification que l'utilisateur existe
        if (!user) {
          throw new Error("Utilisateur non authentifié");
        }

        // Générer le numéro de commande une seule fois
        const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        if (orderData.isTestMode) {
          // Créer une commande de test réelle dans la base de données
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              service_id: serviceId,
              client_id: user.id,
              freelance_id: service?.profiles?.id,
              requirements: `[TEST] ${orderData.requirements}`,
              status: "pending",
              price: service?.price || 0,
              delivery_time: service?.delivery_time || 3,
              order_number: orderNumber,
            })
            .select("id, order_number")
            .single();

          if (orderError) {
            console.error(
              "Erreur lors de la création de la commande de test:",
              orderError,
            );
            throw new Error(
              "Erreur lors de la création de la commande de test",
            );
          }

          console.log("Commande créée avec succès:", {
            id: order.id,
            order_number: order.order_number,
          });

          // Créer une entrée de paiement fictif
          const { error: processPaymentError } = await supabase
            .from("payments")
            .insert({
              order_id: order.id, // Utiliser l'ID généré par Supabase
              client_id: user.id,
              freelance_id: service?.profiles?.id,
              amount: service?.price || 0,
              status: "pending",
              payment_method: `TEST_${orderData.selectedPaymentMethod}`,
            });

          if (processPaymentError) {
            console.error(
              "Erreur lors de la création du paiement de test:",
              processPaymentError,
            );
          }

          // Préparer les données avant la redirection
          setOrderData({
            ...orderData,
            orderId: order.id,
            orderNumber: order.order_number,
            testPaymentSuccess: true,
            error: null,
          });

          // Attendre que l'animation soit terminée
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, paymentDuration - elapsedTime);

          if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
          }

          // Redirection vers la page de confirmation
          router.push(`/order/${serviceId}/summary`);
        } else {
          // Payment data validation
          const validationError = validatePayment();
          if (validationError) {
            setOrderData({ ...orderData, error: validationError });
            setIsLoading(false);
            setIsSubmitting(false);
            setShowPaymentLoader(false);
            return;
          }

          // Create order
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              service_id: serviceId,
              client_id: user.id,
              freelance_id: service?.profiles?.id,
              requirements: orderData.requirements,
              status: "pending",
              price: service?.price || 0,
              delivery_time: service?.delivery_time || 3,
              order_number: orderNumber,
            })
            .select("id, order_number")
            .single();

          if (orderError) {
            console.error(
              "Erreur lors de la création de la commande:",
              orderError,
            );
            throw new Error("Erreur lors de la création de la commande");
          }

          console.log("Commande créée avec succès:", {
            id: order.id,
            order_number: order.order_number,
          });

          // Process payment
          const { error: processPaymentError } = await supabase
            .from("payments")
            .insert({
              order_id: order.id,
              client_id: user.id,
              freelance_id: service?.profiles?.id,
              amount: service?.price || 0,
              status: "pending",
              payment_method: orderData.selectedPaymentMethod,
            });

          if (processPaymentError) {
            throw new Error("Erreur lors du traitement du paiement");
          }

          // Préparer les données avant la redirection
          setOrderData({
            ...orderData,
            orderId: order.id,
            orderNumber: order.order_number,
            testPaymentSuccess: false,
            error: null,
          });

          // Attendre que l'animation soit terminée
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, paymentDuration - elapsedTime);

          if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
          }

          // Redirection vers la page de confirmation
          router.push(`/order/${serviceId}/summary`);
        }
      } catch (err) {
        console.error("Erreur lors du paiement:", err);
        setOrderData({
          ...orderData,
          error: err instanceof Error ? err.message : "Une erreur est survenue",
          testPaymentSuccess: false,
        });
        setIsLoading(false);
        setIsSubmitting(false);
        setShowPaymentLoader(false);
      }
    }
    // Pour les paiements par carte, Stripe CardForm gère le flux de paiement
  };

  const handleStripePaymentSuccess = async (paymentIntent: any) => {
    setIsLoading(true);
    setIsSubmitting(true);
    setShowPaymentLoader(true);

    try {
      const startTime = Date.now();
      const supabase = createClientComponentClient();

      // Vérification que l'utilisateur existe
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      // Récupérer l'ID du service depuis le paiement ou les paramètres
      const serviceIdToUse = paymentIntent.serviceId || serviceId;

      if (!serviceIdToUse) {
        throw new Error("ID du service manquant");
      }

      // Générer le numéro de commande une seule fois
      const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          service_id: serviceIdToUse,
          client_id: user.id,
          freelance_id: service?.profiles?.id,
          requirements: orderData.requirements,
          status: "pending",
          price: service?.price || 0,
          delivery_time: service?.delivery_time || 3,
          order_number: orderNumber,
        })
        .select("id, order_number")
        .single();

      if (orderError) {
        console.error("Erreur lors de la création de la commande:", orderError);
        throw new Error("Erreur lors de la création de la commande");
      }

      console.log("Commande créée avec succès:", {
        id: order.id,
        order_number: order.order_number,
      });

      // Extraire les données de conversion pour le stockage cohérent
      const originalCurrency = paymentIntent.originalCurrency || "XOF"; // Tous les prix sont en XOF
      const originalAmount =
        paymentIntent.originalAmount || service?.price || 0;
      const amountInEur = paymentIntent.amount || 0;
      const userCurrency = paymentIntent.userCurrency || "XOF";
      const amountInUserCurrency =
        paymentIntent.amountInUserCurrency || originalAmount;
      const wasNormalized = paymentIntent.wasNormalized || false;

      // Stocker les détails de conversion pour la traçabilité
      const conversionDetails = {
        fromCurrency: originalCurrency,
        toCurrency: "EUR",
        originalAmount: originalAmount,
        convertedAmount: amountInEur,
        userCurrency: userCurrency,
        amountInUserCurrency: amountInUserCurrency,
        wasNormalized: wasNormalized,
        conversionRate: amountInEur / originalAmount,
      };

      // Mettre à jour l'entrée de paiement Stripe avec l'ID de commande
      const { error: processPaymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          client_id: user.id,
          freelance_id: service?.profiles?.id,
          amount: originalAmount, // Toujours stocker le montant original en XOF
          currency: "XOF", // Devise originale toujours XOF
          status: "completed",
          payment_method: "card",
          payment_intent_id: paymentIntent.id,
          payment_details: JSON.stringify({
            provider: "stripe",
            amount_xof: originalAmount,
            amount_eur: amountInEur,
            user_currency: userCurrency,
            amount_user_currency: amountInUserCurrency,
            was_normalized: wasNormalized,
            conversion_details: conversionDetails,
            payment_intent_id: paymentIntent.id,
            payment_date: new Date().toISOString(),
          }),
        });

      if (processPaymentError) {
        throw new Error("Erreur lors du traitement du paiement");
      }

      // Préparer les données avant la redirection
      setOrderData({
        ...orderData,
        orderId: order.id,
        orderNumber: order.order_number,
        testPaymentSuccess: false,
        error: null,
      });

      // Attendre que l'animation soit terminée
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, paymentDuration - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // Redirection vers la page de confirmation
      router.push(`/order/${serviceIdToUse}/summary`);
    } catch (err) {
      console.error("Erreur lors du paiement:", err);
      setOrderData({
        ...orderData,
        error: err instanceof Error ? err.message : "Une erreur est survenue",
        testPaymentSuccess: false,
      });
      setIsLoading(false);
      setIsSubmitting(false);
      setShowPaymentLoader(false);
    }
  };

  const handleStripePaymentError = (error: any) => {
    console.error("Erreur de paiement Stripe:", error);
    setOrderData({
      ...orderData,
      error: error.message || "Erreur lors du traitement du paiement",
      testPaymentSuccess: false,
    });
  };

  const handleCancelPayment = () => {
    setShowPaymentLoader(false);
    setIsSubmitting(false);
    setIsLoading(false);
  };

  // Ajout des gestionnaires d'événements pour PayPal
  const handlePayPalPaymentSuccess = (paymentData: any) => {
    console.log("Paiement PayPal réussi:", paymentData);

    // Affichage de l'animation de chargement
    setShowPaymentLoader(true);
    setPaymentDuration(8000); // 8 secondes pour PayPal

    try {
      // Créer une commande directement au lieu d'utiliser validatePayment
      const createOrder = async () => {
        setIsLoading(true);
        setIsSubmitting(true);

        try {
          if (!user) {
            throw new Error("Utilisateur non authentifié");
          }

          const supabase = createClientComponentClient();
          const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

          // Créer l'entrée de commande
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              service_id: serviceId,
              client_id: user.id,
              freelance_id: service?.profiles?.id,
              requirements: orderData.requirements,
              status: "pending",
              price: service?.price || 0,
              delivery_time: service?.delivery_time || 3,
              order_number: orderNumber,
            })
            .select("id, order_number")
            .single();

          if (orderError) {
            console.error(
              "Erreur lors de la création de la commande:",
              orderError,
            );
            throw new Error("Erreur lors de la création de la commande");
          }

          // Récupérer les montants appropriés pour l'enregistrement du paiement
          // Les prix sont stockés en XOF dans la base de données et convertis par PayPal
          const paymentAmount = paymentData.amount || 0; // Montant en EUR utilisé pour PayPal
          const originalAmount = paymentData.originalAmount || 0; // Montant original en XOF
          const userCurrencyCode = paymentData.userCurrency || currency.code; // Utiliser la devise du hook
          const userCurrencyAmount =
            paymentData.amountInUserCurrency || originalAmount; // Montant dans la devise de l'utilisateur
          const wasNormalized = paymentData.wasNormalized || false; // Si une normalisation a été appliquée

          console.log("Montants PayPal enregistrés:", {
            paymentAmountEUR: paymentAmount, // Montant en EUR utilisé pour le paiement
            originalAmountXOF: originalAmount, // Montant original en XOF
            userCurrency: userCurrencyCode, // Code de la devise de l'utilisateur
            userCurrencyAmount, // Montant dans la devise de l'utilisateur
            wasNormalized, // Si une normalisation a été appliquée
            servicePrice: service?.price, // Prix du service affiché (en XOF)
          });

          // Enregistrer le paiement PayPal avec les informations de conversion
          const { error: paymentError } = await supabase
            .from("payments")
            .insert({
              order_id: order.id,
              client_id: user.id,
              freelance_id: service?.profiles?.id,
              amount: originalAmount, // Montant original en XOF
              currency: "XOF", // Devise originale toujours XOF
              original_amount: originalAmount, // Montant original dans la devise de l'utilisateur
              original_currency: "XOF", // Devise originale toujours XOF
              conversion_rate: paymentAmount / originalAmount, // Taux de conversion XOF -> EUR
              status: "completed",
              payment_method: "paypal",
              payment_intent_id: paymentData.transactionId,
              payment_details: JSON.stringify({
                ...paymentData,
                amount_original_xof: originalAmount,
                amount_eur: paymentAmount,
                user_currency: userCurrencyCode,
                amount_user_currency: userCurrencyAmount,
                was_normalized: wasNormalized,
                conversion_details: {
                  from: "XOF",
                  to: "EUR",
                  original_amount: originalAmount,
                  converted_amount: paymentAmount,
                  conversion_factor: paymentAmount / originalAmount,
                  user_currency_details: {
                    currency: userCurrencyCode,
                    amount: userCurrencyAmount,
                  },
                  normalization_applied: wasNormalized,
                },
              }),
            });

          if (paymentError) {
            console.error(
              "Erreur lors de l'enregistrement du paiement:",
              paymentError,
            );
            // On continue quand même car le paiement a réussi
          }

          // Redirection vers la commande créée
          setTimeout(() => {
            router.push(`/dashboard/orders/${order.id}`);
          }, 1000);

          return { success: true, orderId: order.id };
        } catch (error: any) {
          console.error(
            "Erreur lors de la création de la commande PayPal:",
            error,
          );
          setOrderData({
            ...orderData,
            error:
              error.message ||
              "Une erreur est survenue lors du traitement du paiement",
          });
          setShowPaymentLoader(false);
          setIsLoading(false);
          setIsSubmitting(false);
          return { success: false, error: error.message };
        }
      };

      // Exécuter la fonction de création de commande
      createOrder();
    } catch (error: any) {
      console.error("Erreur lors du traitement PayPal:", error);
      setOrderData({
        ...orderData,
        error: "Une erreur est survenue lors de la validation du paiement",
      });
      setShowPaymentLoader(false);
    }
  };

  const handlePayPalPaymentError = (error: any) => {
    console.error("Erreur de paiement PayPal:", error);
    setOrderData({
      ...orderData,
      error: error.message || "Une erreur est survenue lors du paiement PayPal",
    });
  };

  if (authLoading || loadingService) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70 dark:bg-vynal-purple-dark/30">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-vynal-accent-primary border-l-vynal-accent-primary animate-spin"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-vynal-text-secondary">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-vynal-purple-dark/30 py-8 px-4 sm:px-6 font-poppins">
      {/* Loader du paiement */}
      <MultiStepLoader
        loadingStates={paymentLoadingStates}
        loading={showPaymentLoader}
        duration={1800}
        totalDuration={paymentDuration}
      />

      {/* Back button */}
      <div className="max-w-4xl mx-auto mb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-slate-600 dark:text-vynal-text-secondary hover:text-vynal-accent-primary transition-colors text-[10px] sm:text-xs font-poppins"
        >
          <ChevronLeft className="h-3 w-3 mr-1" />
          <span>Retour</span>
        </button>
      </div>

      {/* Main content - Stripe-like layout */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left column - Order summary */}
          <div className="w-full md:w-2/5 lg:w-1/3 md:sticky md:top-8">
            <div className="bg-white dark:bg-vynal-purple-dark shadow-sm rounded-xl p-5 border border-slate-100 dark:border-vynal-purple-secondary/20">
              {/* TEST MODE badge */}
              {orderData.isTestMode && (
                <div className="flex items-center mb-4 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/20">
                  <span className="text-[8px] sm:text-[10px] font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                    Mode test
                  </span>
                </div>
              )}

              {/* Merchant Info */}
              <div className="mb-4">
                <h2 className="text-[10px] sm:text-xs font-semibold text-slate-800 dark:text-vynal-text-primary mb-1">
                  Payer {service?.profiles?.display_name || "Prestataire"}
                </h2>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {formatPrice(service?.price || 0)}
                </h1>
              </div>

              {/* Service details */}
              <div className="space-y-3 pb-4 mb-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
                {service?.images && service.images.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden relative flex-shrink-0">
                      <Image
                        src={service.images[0]}
                        alt={service.title || "Service"}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary truncate">
                        {service?.title || "Service"}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-[7px] sm:text-[9px] text-slate-500 dark:text-vynal-text-secondary">
                          {formatPrice(service?.price || 0)}
                        </span>
                        {service?.delivery_time && (
                          <>
                            <span className="mx-1 text-slate-300 dark:text-vynal-purple-secondary/40">
                              •
                            </span>
                            <Clock className="h-2 w-2 text-slate-400 mr-1" />
                            <span className="text-[7px] sm:text-[9px] text-slate-500 dark:text-vynal-text-secondary">
                              {service.delivery_time} jour(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 pt-1 pb-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
                <div className="flex justify-between">
                  <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary">
                    Prix du service
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-800 dark:text-vynal-text-primary">
                    {formatPrice(service?.price || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary">
                    Frais de service
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-green-600 dark:text-green-500">
                    Inclus
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 flex justify-between items-center">
                <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                  Total
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {formatPrice(service?.price || 0)}
                </span>
              </div>

              {/* Security badge */}
              <div className="mt-6 flex items-center justify-center">
                <div className="flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-vynal-accent-primary" />
                  <span className="text-[7px] sm:text-[8px] text-slate-400 dark:text-vynal-text-secondary">
                    Paiement sécurisé
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Payment form */}
          <div className="flex-1 w-full">
            <div className="bg-white dark:bg-vynal-purple-dark/20 shadow-sm rounded-xl overflow-hidden border border-slate-100 dark:border-vynal-purple-secondary/40">
              {/* Description section */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-vynal-purple-secondary/40">
                <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                    Description de votre besoin
                  </h2>
                  <Textarea
                    placeholder="Décrivez en détail ce que vous souhaitez obtenir..."
                    className="h-20 sm:h-24 text-[10px] sm:text-sm bg-transparent border-slate-200 dark:border-vynal-purple-secondary/40 rounded-lg resize-none focus:ring-1 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary"
                    value={orderData.requirements}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        requirements: e.target.value,
                        error: null,
                      })
                    }
                  />
                  <p className="text-[7px] sm:text-[9px] text-slate-500 dark:text-vynal-text-secondary">
                    Une description détaillée nous permettra de mieux comprendre
                    vos besoins et de vous offrir un service de qualité.
                  </p>
                </div>
              </div>

              {/* Payment methods */}
              <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                <h2 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                  Payer par
                </h2>

                {/* Error alert */}
                {orderData.error && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg p-2 sm:p-3 text-[9px] sm:text-xs text-red-600 dark:text-red-400 flex items-start">
                    <AlertCircle className="h-3 w-3 mt-0.5 mr-2 flex-shrink0 text-vynal-accent-primary" />
                    <p>{orderData.error}</p>
                  </div>
                )}

                {/* Payment method buttons */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {/* Wave Button */}
                  <button
                    onClick={() => handleMethodSelect("wave")}
                    className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all ${
                      orderData.selectedPaymentMethod === "wave"
                        ? "bg-vynal-accent-primary text-white"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-vynal-purple-secondary/20 dark:hover:bg-vynal-purple-secondary/30 text-slate-700 dark:text-vynal-text-secondary"
                    }`}
                  >
                    <Image
                      src="/assets/partners/logo_wave_.webp"
                      alt="Wave"
                      width={52}
                      height={52}
                      className="h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2"
                    />
                    <span className="text-[10px] sm:text-xs font-medium">
                      Wave
                    </span>
                  </button>

                  {/* Orange Money Button */}
                  <button
                    onClick={() => handleMethodSelect("orange-money")}
                    className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all ${
                      orderData.selectedPaymentMethod === "orange-money"
                        ? "bg-vynal-accent-primary text-white"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-vynal-purple-secondary/20 dark:hover:bg-vynal-purple-secondary/30 text-slate-700 dark:text-vynal-text-secondary"
                    }`}
                  >
                    <Image
                      src="/assets/partners/om_logo_.webp"
                      alt="Orange Money"
                      width={52}
                      height={92}
                      className="h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2"
                    />
                    <span className="text-[10px] sm:text-xs font-medium">
                      Orange
                    </span>
                  </button>

                  {/* PayPal Button */}
                  <button
                    onClick={() => handleMethodSelect("paypal")}
                    className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all ${
                      orderData.selectedPaymentMethod === "paypal"
                        ? "bg-vynal-accent-primary text-white"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-vynal-purple-secondary/20 dark:hover:bg-vynal-purple-secondary/30 text-slate-700 dark:text-vynal-text-secondary"
                    }`}
                  >
                    <Image
                      src="/images/payment/paypal.svg"
                      alt="PayPal"
                      width={32}
                      height={32}
                      className="h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2"
                    />
                    <span className="text-[10px] sm:text-xs font-medium">
                      PayPal
                    </span>
                  </button>
                </div>

                {/* Wave form */}
                {orderData.selectedPaymentMethod === "wave" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 dark:bg-vynal-purple-dark/20 rounded-md border border-slate-200 dark:border-vynal-purple-secondary/40"
                  >
                    <div className="flex items-center mb-2 sm:mb-3">
                      <Image
                        src="/assets/partners/logo_wave_.webp"
                        alt="Wave"
                        width={20}
                        height={20}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2"
                      />
                      <h3 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                        Wave
                      </h3>
                    </div>

                    <div>
                      <label
                        htmlFor="wave-number"
                        className="text-[9px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary block mb-1"
                      >
                        Numéro de téléphone
                      </label>
                      <Input
                        id="wave-number"
                        type="tel"
                        placeholder="77 123 45 67"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="h-9 sm:h-10 text-[10px] sm:text-sm bg-white dark:bg-vynal-purple-dark/40 border-slate-200 dark:border-vynal-purple-secondary/40 rounded-md opacity-50 cursor-not-allowed"
                        disabled
                      />
                      <p className="mt-1.5 sm:mt-2 text-[7px] sm:text-[9px] text-amber-600 dark:text-amber-500">
                        Le paiement par Wave sera disponible prochainement.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Orange Money form */}
                {orderData.selectedPaymentMethod === "orange-money" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 dark:bg-vynal-purple-dark/20 rounded-md border border-slate-200 dark:border-vynal-purple-secondary/40"
                  >
                    <div className="flex items-center mb-2 sm:mb-3">
                      <Image
                        src="/assets/partners/om_logo_.webp"
                        alt="Orange Money"
                        width={40}
                        height={40}
                        className="h-8 w-8 sm:h-10 sm:w-10 mr-1.5 sm:mr-2"
                      />
                      <h3 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                        Orange Money
                      </h3>
                    </div>

                    <div>
                      <label
                        htmlFor="orange-number"
                        className="text-[9px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary block mb-1"
                      >
                        Numéro de téléphone
                      </label>
                      <Input
                        id="orange-number"
                        type="tel"
                        placeholder="77 123 45 67"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="h-9 sm:h-10 text-[10px] sm:text-sm bg-white dark:bg-vynal-purple-dark/40 border-slate-200 dark:border-vynal-purple-secondary/40 rounded-md opacity-50 cursor-not-allowed"
                        disabled
                      />
                      <p className="mt-1.5 sm:mt-2 text-[7px] sm:text-[9px] text-amber-600 dark:text-amber-500">
                        Le paiement par Orange Money sera disponible
                        prochainement.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* PayPal form */}
                {orderData.selectedPaymentMethod === "paypal" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    <div className="space-y-3">
                      {/* PayPal Buttons */}
                      <PayPalButtonsForm
                        amount={service?.price || 0}
                        serviceId={serviceId}
                        onSuccess={handlePayPalPaymentSuccess}
                        onError={handlePayPalPaymentError}
                        loading={false}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Or separator */}
                <div className="relative flex items-center py-3 sm:py-4 mt-1 sm:mt-2">
                  <div className="flex-grow border-t border-slate-200 dark:border-vynal-purple-secondary/40"></div>
                  <span className="flex-shrink mx-2 sm:mx-3 text-[8px] sm:text-[9px] text-slate-400 dark:text-vynal-text-secondary">
                    Ou payer par carte
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-vynal-purple-secondary/40"></div>
                </div>

                {/* Card payment section - collapsible */}
                <div
                  onClick={(e) => {
                    if (
                      e.target === e.currentTarget ||
                      e.target === e.currentTarget.firstElementChild
                    ) {
                      handleMethodSelect("card");
                    }
                  }}
                  className="border border-slate-200 dark:border-vynal-purple-secondary/40 rounded-md overflow-hidden cursor-pointer"
                >
                  <div
                    className={`p-2.5 sm:p-3 flex items-center justify-between ${
                      orderData.selectedPaymentMethod === "card"
                        ? "bg-vynal-accent-primary/5 dark:bg-vynal-purple-secondary/20 border-vynal-accent-primary"
                        : "bg-slate-50 dark:bg-vynal-purple-dark/40"
                    }`}
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-vynal-accent-primary" />
                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                        Carte bancaire
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Image
                        src="/images/payment/visa.svg"
                        alt="Visa"
                        width={24}
                        height={16}
                        className="h-3 sm:h-4"
                      />
                      <Image
                        src="/images/payment/mastercard.svg"
                        alt="Mastercard"
                        width={24}
                        height={16}
                        className="h-3 sm:h-4 ml-0.5 sm:ml-1"
                      />
                      <Image
                        src="/images/payment/amex.svg"
                        alt="American Express"
                        width={24}
                        height={16}
                        className="h-3 sm:h-4 ml-0.5 sm:ml-1"
                      />
                    </div>
                  </div>

                  {/* Card form - expanded only when selected */}
                  {orderData.selectedPaymentMethod === "card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-200 dark:border-vynal-purple-secondary/40 p-4"
                      onClick={(e) => e.stopPropagation()} // Empêche la propagation du clic aux éléments parents
                    >
                      <div className="space-y-4">
                        {/* Email */}
                        <div>
                          <label
                            htmlFor="email"
                            className="text-[9px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary block mb-1"
                          >
                            E-mail
                          </label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="email@exemple.com"
                            className="h-10 text-xs sm:text-sm bg-transparent border-slate-200 dark:border-vynal-purple-secondary/40 rounded-md"
                            value={user?.email || ""}
                            disabled
                          />
                        </div>

                        {/* Stripe Card Element */}
                        <StripeElementsProvider
                          clientSecret={paymentData?.clientSecret}
                          enableApplePay={true}
                        >
                          <div className="space-y-4">
                            {/* Apple Pay - uniquement sur les appareils compatibles */}
                            <ApplePayButton
                              amount={service?.price || 0}
                              clientSecret={paymentData?.clientSecret || ""}
                              onSuccess={handleStripePaymentSuccess}
                              onError={handleStripePaymentError}
                              loading={stripeLoading}
                              serviceId={serviceId}
                            />

                            {/* Stripe Link - uniquement si disponible */}
                            <LinkButton
                              amount={service?.price || 0}
                              clientSecret={paymentData?.clientSecret || ""}
                              onSuccess={handleStripePaymentSuccess}
                              onError={handleStripePaymentError}
                              loading={stripeLoading}
                              serviceId={serviceId}
                            />

                            {/* Google Pay - uniquement sur les appareils compatibles */}
                            <GooglePayButton
                              amount={service?.price || 0}
                              clientSecret={paymentData?.clientSecret || ""}
                              onSuccess={handleStripePaymentSuccess}
                              onError={handleStripePaymentError}
                              loading={stripeLoading}
                              serviceId={serviceId}
                            />

                            {/* Séparateur entre les méthodes de paiement rapides et le formulaire de carte */}
                            <div
                              id="unified-payment-methods-separator"
                              className="hidden relative flex items-center py-2"
                            >
                              <div className="flex-grow border-t border-slate-200 dark:border-vynal-purple-secondary/40"></div>
                              <span className="flex-shrink mx-3 text-[8px] sm:text-[9px] text-slate-400 dark:text-vynal-text-secondary">
                                ou
                              </span>
                              <div className="flex-grow border-t border-slate-200 dark:border-vynal-purple-secondary/40"></div>
                            </div>

                            {/* Script pour afficher le séparateur uniquement si au moins une méthode de paiement rapide est disponible */}
                            <script
                              dangerouslySetInnerHTML={{
                                __html: `
                              document.addEventListener('DOMContentLoaded', function() {
                                // Vérifier si Apple Pay, Google Pay ou Link sont présents et visibles
                                const applePayBtn = document.querySelector('button[aria-label="Apple Pay"]');
                                const googlePayBtn = document.querySelector('button[aria-label="Google Pay"]');
                                const linkBtn = document.querySelector('button[aria-label="Stripe Link"]');
                                const separator = document.getElementById('unified-payment-methods-separator');
                                
                                if ((applePayBtn || googlePayBtn || linkBtn) && separator) {
                                  separator.classList.remove('hidden');
                                }
                              });
                            `,
                              }}
                            />

                            {/* Formulaire de carte Stripe */}
                            <StripeCardForm
                              amount={service?.price || 0}
                              clientSecret={paymentData?.clientSecret || ""}
                              onSuccess={handleStripePaymentSuccess}
                              onError={handleStripePaymentError}
                              loading={stripeLoading}
                              buttonText={`Payer ${formatPrice(service?.price || 0)}`}
                              hideButton={true}
                              serviceId={serviceId}
                            />
                          </div>
                        </StripeElementsProvider>

                        {stripeError && (
                          <div className="text-red-500 text-xs mt-2">
                            {stripeError}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Test mode toggle with minimalist styling */}
                <div className="flex items-center mt-4 sm:mt-6 py-1.5 sm:py-2">
                  <input
                    type="checkbox"
                    id="test-mode"
                    checked={orderData.isTestMode}
                    onChange={() =>
                      setOrderData({
                        ...orderData,
                        isTestMode: !orderData.isTestMode,
                      })
                    }
                    className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-vynal-accent-primary rounded border-slate-300 dark:border-vynal-purple-secondary/40 focus:ring-vynal-accent-primary"
                  />
                  <label
                    htmlFor="test-mode"
                    className="ml-1.5 sm:ml-2 text-[7px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary cursor-pointer"
                  >
                    Mode test (pas de paiement réel)
                  </label>
                </div>

                {/* Bouton de paiement unifié - Affiché pour toutes les méthodes de paiement */}
                <button
                  onClick={(e) => {
                    // Si c'est le mode carte et pas le mode test, soumettre le formulaire Stripe
                    if (
                      orderData.selectedPaymentMethod === "card" &&
                      !orderData.isTestMode
                    ) {
                      e.preventDefault();
                      const form = document.getElementById(
                        "stripe-payment-form",
                      ) as HTMLFormElement;
                      if (form) {
                        form.dispatchEvent(
                          new Event("submit", { cancelable: true }),
                        );
                      } else {
                        console.error("Formulaire Stripe non trouvé");
                      }
                    } else {
                      // Sinon, utiliser le flux standard
                      handlePlaceOrder();
                    }
                  }}
                  disabled={
                    isSubmitting ||
                    !orderData.requirements ||
                    !orderData.selectedPaymentMethod ||
                    (orderData.selectedPaymentMethod === "card" &&
                      !orderData.isTestMode &&
                      !paymentData?.clientSecret)
                  }
                  className="w-full h-11 mt-3 bg-vynal-accent-primary hover:bg-vynal-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white dark:text-vynal-text-primary font-medium rounded-md text-base sm:text-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Traitement en cours...
                    </span>
                  ) : (
                    `Payer ${formatPrice(service?.price || 0)}`
                  )}
                </button>

                {/* Stripe logo */}
                <div className="flex items-center justify-center mt-4 space-x-1">
                  <span className="text-[7px] sm:text-[8px] text-slate-400 dark:text-vynal-text-secondary">
                    Propulsé par
                  </span>
                  <Image
                    src="/assets/partners/logo_stripe.webp"
                    alt="Stripe"
                    width={40}
                    height={16}
                    className="h-4 opacity-60"
                  />
                </div>

                {/* Logos des méthodes de paiement acceptées */}
                <div className="flex items-center justify-center mt-2 space-x-2">
                  <Image
                    src="/images/payment/visa.svg"
                    alt="Visa"
                    width={24}
                    height={16}
                    className="h-4 opacity-60"
                  />
                  <Image
                    src="/images/payment/mastercard.svg"
                    alt="Mastercard"
                    width={24}
                    height={16}
                    className="h-4 opacity-60"
                  />
                  <Image
                    src="/images/payment/apple-pay-mark.svg"
                    alt="Apple Pay"
                    width={30}
                    height={16}
                    className="h-5 opacity-60"
                  />
                  <Image
                    src="/images/payment/google-pay-mark.svg"
                    alt="Google Pay"
                    width={30}
                    height={16}
                    className="h-3 opacity-60"
                  />
                  <Image
                    src="/images/payment/stripe-link-mark.svg"
                    alt="Stripe Link"
                    width={30}
                    height={16}
                    className="h-3 opacity-60"
                  />
                </div>

                {/* Terms and conditions */}
                <p className="text-[7px] sm:text-[8px] text-center text-slate-500 dark:text-vynal-text-secondary mt-3">
                  En finalisant votre commande, vous acceptez nos{" "}
                  <Link
                    href="/terms-of-service"
                    className="text-vynal-accent-primary hover:underline"
                  >
                    conditions générales
                  </Link>{" "}
                  et notre{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-vynal-accent-primary hover:underline"
                  >
                    politique de confidentialité
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
