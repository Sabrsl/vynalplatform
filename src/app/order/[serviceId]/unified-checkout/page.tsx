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
  FileCheck,
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
import { QuickTooltip } from "@/components/ui/tooltip";

// Déclaration pour la fonction globale de soumission Stripe
declare global {
  interface Window {
    submitStripeForm?: () => boolean;
  }
}

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

  // États pour la modale de description
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [tempRequirements, setTempRequirements] = useState("");

  // États pour la détection de disponibilité des moyens de paiement
  const [paymentAvailability, setPaymentAvailability] = useState({
    applePay: false,
    googlePay: false,
    link: false,
  });
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  // États pour les paiements directs
  const [directPaymentLoading, setDirectPaymentLoading] = useState({
    applePay: false,
    googlePay: false,
    link: false,
  });

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

  // Détecter la disponibilité des moyens de paiement
  useEffect(() => {
    const checkPaymentMethodAvailability = async () => {
      if (!paymentData?.clientSecret) return;

      setCheckingAvailability(true);

      try {
        const { getStripe } = await import("@/lib/stripe/client");
        const stripe = await getStripe();
        if (!stripe) return;

        // Créer un PaymentRequest pour tester la disponibilité
        const paymentRequest = stripe.paymentRequest({
          country: "FR",
          currency: "eur",
          total: {
            label: "Test",
            amount: 100, // Montant de test minimal
          },
        });

        // Vérifier la disponibilité des différentes méthodes
        const canMakePayment = await paymentRequest.canMakePayment();

        setPaymentAvailability({
          applePay: canMakePayment ? canMakePayment.applePay || false : false,
          googlePay: canMakePayment ? canMakePayment.googlePay || false : false,
          link: canMakePayment ? true : false, // Link est généralement disponible si Stripe fonctionne
        });
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de disponibilité:",
          error,
        );
        setPaymentAvailability({
          applePay: false,
          googlePay: false,
          link: false,
        });
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkPaymentMethodAvailability();
  }, [paymentData?.clientSecret]);

  // Initialiser automatiquement Stripe pour les boutons Apple Pay, Google Pay et Link
  useEffect(() => {
    if (service?.price && !paymentData?.clientSecret && !stripeLoading) {
      // Initialiser le paiement Stripe automatiquement
      (async () => {
        try {
          await createPaymentIntent({
            amount: service.price,
            serviceId: serviceId,
            freelanceId: service?.profiles?.id,
          });
        } catch (error) {
          console.error(
            "Erreur lors de l'initialisation automatique de Stripe:",
            error,
          );
        }
      })();
    }
  }, [
    service?.price,
    paymentData?.clientSecret,
    stripeLoading,
    createPaymentIntent,
    serviceId,
    service?.profiles?.id,
  ]);

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

    // Initialiser Stripe pour les méthodes qui en ont besoin
    if (
      (method === "card" ||
        method === "apple-pay" ||
        method === "google-pay" ||
        method === "link") &&
      service?.price &&
      !paymentData?.clientSecret
    ) {
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
            error: `Erreur lors de l'initialisation du paiement ${method === "card" ? "par carte" : method}`,
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
    setIsLoading(true);
    setIsSubmitting(true);
    const startTime = Date.now();
    const supabase = createClientComponentClient();

    try {
      // Vérification que l'utilisateur existe
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      // Générer le numéro de commande une seule fois
      const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Pour les paiements autres que par carte, créer une commande immédiatement
      if (orderData.selectedPaymentMethod !== "card") {
        // Mode réel: toujours créer une commande standard

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
            requirements:
              orderData.requirements || "Aucune description fournie",
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
      // Pour les paiements par carte, Stripe CardForm gère le flux de paiement
    } catch (err) {
      console.error("Erreur lors du paiement:", err);
      setOrderData({
        ...orderData,
        error: err instanceof Error ? err.message : "Une erreur est survenue",
      });
      setIsLoading(false);
      setIsSubmitting(false);
      setShowPaymentLoader(false);
    }
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
          requirements: orderData.requirements || "Aucune description fournie",
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
  const handlePayPalPaymentSuccess = async (paymentData: any) => {
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
              requirements:
                orderData.requirements || "Aucune description fournie",
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

          // Créer des transactions pour le client et le freelance
          try {
            // 1. Récupérer/créer le wallet du client pour la transaction de paiement
            const { data: clientWallet, error: clientWalletError } =
              await supabase
                .from("wallets")
                .select("id, balance")
                .eq("user_id", user.id)
                .single();

            if (clientWalletError && clientWalletError.code === "PGRST116") {
              // Le wallet n'existe pas, le créer
              const { data: newClientWallet, error: createClientWalletError } =
                await supabase
                  .from("wallets")
                  .insert({
                    user_id: user.id,
                    balance: 0,
                    pending_balance: 0,
                    total_earnings: 0,
                  })
                  .select("id")
                  .single();

              if (!createClientWalletError && newClientWallet) {
                // Créer une transaction de paiement pour le client
                await supabase.from("transactions").insert({
                  wallet_id: newClientWallet.id,
                  amount: -originalAmount, // Montant négatif pour un paiement
                  type: "payment",
                  status: "completed",
                  description: `Paiement PayPal pour service ${service?.title || serviceId}`,
                  reference_id: order.id,
                  client_id: user.id,
                  freelance_id: service?.profiles?.id,
                  service_id: serviceId,
                  order_id: order.id,
                  currency: "XOF",
                  currency_symbol: "FCFA",
                  completed_at: new Date().toISOString(),
                });
              }
            } else if (clientWallet) {
              // Créer une transaction de paiement pour le client
              await supabase.from("transactions").insert({
                wallet_id: clientWallet.id,
                amount: -originalAmount, // Montant négatif pour un paiement
                type: "payment",
                status: "completed",
                description: `Paiement PayPal pour service ${service?.title || serviceId}`,
                reference_id: order.id,
                client_id: user.id,
                freelance_id: service?.profiles?.id,
                service_id: serviceId,
                order_id: order.id,
                currency: "XOF",
                currency_symbol: "FCFA",
                completed_at: new Date().toISOString(),
              });

              // Mettre à jour le solde du client
              const newClientBalance = Math.max(
                0,
                Number(clientWallet.balance || 0) - originalAmount,
              );
              await supabase
                .from("wallets")
                .update({
                  balance: newClientBalance,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", clientWallet.id);
            }

            // 2. Récupérer/créer le wallet du freelance pour la transaction de réception
            if (service?.profiles?.id) {
              const { data: freelanceWallet, error: freelanceWalletError } =
                await supabase
                  .from("wallets")
                  .select("id, pending_balance, total_earnings")
                  .eq("user_id", service.profiles.id)
                  .single();

              if (
                freelanceWalletError &&
                freelanceWalletError.code === "PGRST116"
              ) {
                // Le wallet n'existe pas, le créer
                const {
                  data: newFreelanceWallet,
                  error: createFreelanceWalletError,
                } = await supabase
                  .from("wallets")
                  .insert({
                    user_id: service.profiles.id,
                    balance: 0,
                    pending_balance: originalAmount,
                    total_earnings: originalAmount,
                  })
                  .select("id")
                  .single();

                if (!createFreelanceWalletError && newFreelanceWallet) {
                  // Créer une transaction de réception pour le freelance
                  await supabase.from("transactions").insert({
                    wallet_id: newFreelanceWallet.id,
                    amount: originalAmount,
                    type: "earning",
                    status: "pending",
                    description: `Paiement PayPal reçu pour service ${service?.title || serviceId}`,
                    reference_id: order.id,
                    client_id: user.id,
                    freelance_id: service.profiles.id,
                    service_id: serviceId,
                    order_id: order.id,
                    currency: "XOF",
                    currency_symbol: "FCFA",
                  });
                }
              } else if (freelanceWallet) {
                // Créer une transaction de réception pour le freelance
                await supabase.from("transactions").insert({
                  wallet_id: freelanceWallet.id,
                  amount: originalAmount,
                  type: "earning",
                  status: "pending",
                  description: `Paiement PayPal reçu pour service ${service?.title || serviceId}`,
                  reference_id: order.id,
                  client_id: user.id,
                  freelance_id: service.profiles.id,
                  service_id: serviceId,
                  order_id: order.id,
                  currency: "XOF",
                  currency_symbol: "FCFA",
                });

                // Mettre à jour le solde en attente et les gains totaux du freelance
                const newPendingBalance =
                  Number(freelanceWallet.pending_balance || 0) + originalAmount;
                const newTotalEarnings =
                  Number(freelanceWallet.total_earnings || 0) + originalAmount;

                await supabase
                  .from("wallets")
                  .update({
                    pending_balance: newPendingBalance,
                    total_earnings: newTotalEarnings,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", freelanceWallet.id);
              }
            }
          } catch (transactionError) {
            console.error(
              "Erreur lors de la création des transactions:",
              transactionError,
            );
            // On continue quand même car le paiement a réussi et est enregistré
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
        }
      };

      // Exécuter la fonction de création de commande
      await createOrder();
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

  // Ouvrir la modale avec le contenu actuel
  const openDescriptionModal = () => {
    setTempRequirements(orderData.requirements || "");
    setShowDescriptionModal(true);
  };

  // Sauvegarder les modifications et fermer la modale
  const saveDescription = () => {
    setOrderData({
      ...orderData,
      requirements: tempRequirements,
      error: null,
    });
    setShowDescriptionModal(false);
  };

  // Fonctions pour les paiements directs
  const handleDirectApplePay = async () => {
    if (!paymentData?.clientSecret || !service?.price) return;

    setDirectPaymentLoading((prev) => ({ ...prev, applePay: true }));

    try {
      const { getStripe } = await import("@/lib/stripe/client");
      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe non disponible");

      // Convertir le montant pour Stripe
      const {
        convertToEur,
        normalizeAmount,
      } = require("@/lib/utils/currency-updater");
      const normalizedXofAmount = normalizeAmount(service.price, "XOF");
      const amountInEuros = convertToEur(
        normalizedXofAmount,
        "XOF",
        false,
      ) as number;
      const amountInEuroCents = Math.round(amountInEuros * 100);

      const paymentRequest = stripe.paymentRequest({
        country: "FR",
        currency: "eur",
        total: {
          label: "Paiement Vynal",
          amount: amountInEuroCents,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Vérifier la disponibilité AVANT de configurer les événements
      const canMakePayment = await paymentRequest.canMakePayment();
      if (!canMakePayment || !canMakePayment.applePay) {
        throw new Error("Apple Pay non disponible sur cet appareil");
      }

      paymentRequest.on("paymentmethod", async (ev: any) => {
        try {
          const { error, paymentIntent } = await stripe.confirmCardPayment(
            paymentData.clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false },
          );

          if (error) {
            ev.complete("fail");
            handleStripePaymentError(error);
          } else if (paymentIntent) {
            ev.complete("success");
            const enrichedPaymentData = {
              ...paymentIntent,
              serviceId,
              paymentMethod: "apple_pay",
              provider: "stripe",
            };
            await handleStripePaymentSuccess(enrichedPaymentData);
          }
        } catch (err) {
          ev.complete("fail");
          handleStripePaymentError(err);
        }
      });

      paymentRequest.show();
    } catch (error) {
      console.error("Erreur Apple Pay:", error);
      handleStripePaymentError(error);
    } finally {
      setDirectPaymentLoading((prev) => ({ ...prev, applePay: false }));
    }
  };

  const handleDirectGooglePay = async () => {
    if (!paymentData?.clientSecret || !service?.price) return;

    setDirectPaymentLoading((prev) => ({ ...prev, googlePay: true }));

    try {
      const { getStripe } = await import("@/lib/stripe/client");
      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe non disponible");

      // Convertir le montant pour Stripe
      const {
        convertToEur,
        normalizeAmount,
      } = require("@/lib/utils/currency-updater");
      const normalizedXofAmount = normalizeAmount(service.price, "XOF");
      const amountInEuros = convertToEur(
        normalizedXofAmount,
        "XOF",
        false,
      ) as number;
      const amountInEuroCents = Math.round(amountInEuros * 100);

      const paymentRequest = stripe.paymentRequest({
        country: "FR",
        currency: "eur",
        total: {
          label: "Paiement Vynal",
          amount: amountInEuroCents,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Vérifier la disponibilité AVANT de configurer les événements
      const canMakePayment = await paymentRequest.canMakePayment();
      if (!canMakePayment || !canMakePayment.googlePay) {
        throw new Error("Google Pay non disponible sur cet appareil");
      }

      paymentRequest.on("paymentmethod", async (ev: any) => {
        try {
          const { error, paymentIntent } = await stripe.confirmCardPayment(
            paymentData.clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false },
          );

          if (error) {
            ev.complete("fail");
            handleStripePaymentError(error);
          } else if (paymentIntent) {
            ev.complete("success");
            const enrichedPaymentData = {
              ...paymentIntent,
              serviceId,
              paymentMethod: "google_pay",
              provider: "stripe",
            };
            await handleStripePaymentSuccess(enrichedPaymentData);
          }
        } catch (err) {
          ev.complete("fail");
          handleStripePaymentError(err);
        }
      });

      paymentRequest.show();
    } catch (error) {
      console.error("Erreur Google Pay:", error);
      handleStripePaymentError(error);
    } finally {
      setDirectPaymentLoading((prev) => ({ ...prev, googlePay: false }));
    }
  };

  const handleDirectLink = async () => {
    if (!paymentData?.clientSecret || !service?.price) return;

    setDirectPaymentLoading((prev) => ({ ...prev, link: true }));

    try {
      const { getStripe } = await import("@/lib/stripe/client");
      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe non disponible");

      // Convertir le montant pour Stripe
      const {
        convertToEur,
        normalizeAmount,
      } = require("@/lib/utils/currency-updater");
      const normalizedXofAmount = normalizeAmount(service.price, "XOF");
      const amountInEuros = convertToEur(
        normalizedXofAmount,
        "XOF",
        false,
      ) as number;

      // Pour Link, on utilise directement confirmPayment avec redirect si nécessaire
      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret: paymentData.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order/${serviceId}/summary`,
          payment_method_data: {
            type: "link",
          },
        },
        redirect: "if_required",
      });

      if (error) {
        handleStripePaymentError(error);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        const enrichedPaymentData = {
          ...paymentIntent,
          serviceId,
          paymentMethod: "link",
          provider: "stripe",
          originalAmount: service.price,
          originalCurrency: "XOF",
          amountInUserCurrency: service.price,
          userCurrency: "XOF",
          wasNormalized: false,
        };
        await handleStripePaymentSuccess(enrichedPaymentData);
      }
    } catch (error) {
      console.error("Erreur Stripe Link:", error);
      handleStripePaymentError(error);
    } finally {
      setDirectPaymentLoading((prev) => ({ ...prev, link: false }));
    }
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
          className="inline-flex items-center text-slate-600 dark:text-vynal-text-secondary hover:text-vynal-accent-secondary dark:hover:text-vynal-accent-primary transition-colors text-[10px] sm:text-xs font-poppins"
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
            <div className="bg-white/30 dark:bg-slate-900/30 shadow-sm rounded-xl p-5 border border-slate-200 dark:border-slate-700/30">
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
              <div className="space-y-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-700/20">
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
                        {service?.delivery_time && (
                          <>
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
              <div className="space-y-2 pt-1 pb-4 border-b border-slate-200 dark:border-slate-700/20">
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
                  <QuickTooltip
                    content="Paiement sécurisé SSL 256-bit"
                    side="top"
                    variant="default"
                    delayDuration={100}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <Lock className="h-3 w-3 text-vynal-accent-secondary dark:text-vynal-accent-primary" />
                  </QuickTooltip>
                  <span className="text-[7px] sm:text-[8px] text-slate-400 dark:text-vynal-text-secondary">
                    Paiement sécurisé
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Payment form */}
          <div className="flex-1 w-full">
            <div className="bg-white/25 dark:bg-slate-900/20 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/20">
              {/* Payment methods */}
              <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                <h2 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                  Payer par
                </h2>

                {/* Error alert */}
                {orderData.error && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg p-2 sm:p-3 text-[9px] sm:text-xs text-red-600 dark:text-red-400 flex items-start">
                    <AlertCircle className="h-3 w-3 mt-0.5 mr-2 flex-shrink0 text-vynal-accent-secondary dark:text-vynal-accent-primary" />
                    <p>{orderData.error}</p>
                  </div>
                )}

                {/* Payment method buttons */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {/* Wave Button */}
                  <QuickTooltip
                    content="Wave Money : Bientôt disponible sur Vynal"
                    side="top"
                    variant="default"
                    delayDuration={150}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <button
                      onClick={() => handleMethodSelect("wave")}
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all border ${
                        orderData.selectedPaymentMethod === "wave"
                          ? "bg-gradient-to-r from-vynal-accent-secondary to-purple-500 dark:from-vynal-accent-primary dark:to-purple-600 text-white border-vynal-accent-secondary dark:border-vynal-accent-primary shadow-lg"
                          : "bg-slate-200/60 hover:bg-slate-100 dark:bg-slate-800/25 dark:hover:bg-slate-800/40 text-slate-700 dark:text-vynal-text-secondary border-slate-200/50 dark:border-slate-700/30"
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
                  </QuickTooltip>

                  {/* Orange Money Button */}
                  <QuickTooltip
                    content="Orange Money : Bientôt disponible sur Vynal"
                    side="top"
                    variant="default"
                    delayDuration={150}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <button
                      onClick={() => handleMethodSelect("orange-money")}
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all border ${
                        orderData.selectedPaymentMethod === "orange-money"
                          ? "bg-gradient-to-r from-orange-400 to-vynal-accent-secondary dark:from-orange-500 dark:to-vynal-accent-primary text-white border-orange-400 dark:border-orange-500 shadow-lg"
                          : "bg-slate-200/60 hover:bg-slate-100 dark:bg-slate-800/25 dark:hover:bg-slate-800/40 text-slate-700 dark:text-vynal-text-secondary border-slate-200/50 dark:border-slate-700/30"
                      }`}
                    >
                      <Image
                        src="/images/payment/orangemoney.png"
                        alt="Orange Money"
                        width={40}
                        height={40}
                        className="h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2"
                      />
                      <span className="text-[10px] sm:text-xs font-medium">
                        Orange
                      </span>
                    </button>
                  </QuickTooltip>

                  {/* PayPal Button */}
                  <QuickTooltip
                    content="Paiement sécurisé PayPal avec conversion automatique"
                    side="top"
                    variant="default"
                    delayDuration={150}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <button
                      onClick={() => handleMethodSelect("paypal")}
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all border ${
                        orderData.selectedPaymentMethod === "paypal"
                          ? "bg-gradient-to-r from-blue-500 to-vynal-accent-secondary dark:from-blue-600 dark:to-vynal-accent-primary text-white border-blue-500 dark:border-blue-600 shadow-lg"
                          : "bg-slate-200/60 hover:bg-slate-100 dark:bg-slate-800/25 dark:hover:bg-slate-800/40 text-slate-700 dark:text-vynal-text-secondary border-slate-200/50 dark:border-slate-700/30"
                      }`}
                    >
                      <Image
                        src="/images/payment/paypallogo.png"
                        alt="PayPal"
                        width={32}
                        height={32}
                        className="h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2"
                      />
                      <span className="text-[10px] sm:text-xs font-medium">
                        PayPal
                      </span>
                    </button>
                  </QuickTooltip>
                </div>

                {/* Wave form */}
                {orderData.selectedPaymentMethod === "wave" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/20 dark:bg-slate-800/25 rounded-md border border-slate-200 dark:border-slate-700/15"
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
                        className="h-9 sm:h-10 text-[10px] sm:text-sm bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/15 rounded-md opacity-50 cursor-not-allowed"
                        disabled
                      />
                      <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm text-amber-600 dark:text-amber-500">
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
                    className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/20 dark:bg-slate-800/25 rounded-md border border-slate-200 dark:border-slate-700/15"
                  >
                    <div className="flex items-center mb-2 sm:mb-3">
                      <Image
                        src="/images/payment/orangemoney.png"
                        alt="Orange Money"
                        width={40}
                        height={40}
                        className="h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2"
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
                        className="h-9 sm:h-10 text-[10px] sm:text-sm bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/15 rounded-md opacity-50 cursor-not-allowed"
                        disabled
                      />
                      <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm text-amber-600 dark:text-amber-500">
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

                {/* Section Apple Pay, Google Pay et Link - affichage automatique */}
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Apple Pay Button */}
                    <QuickTooltip
                      content={
                        checkingAvailability
                          ? "Vérification de la disponibilité d'Apple Pay..."
                          : !paymentAvailability.applePay
                            ? "Apple Pay non disponible sur cet appareil"
                            : directPaymentLoading.applePay
                              ? "Traitement Apple Pay en cours..."
                              : "Payer en un clic avec Apple Pay"
                      }
                      side="top"
                      variant="default"
                      delayDuration={100}
                      className="bg-slate-100/90 dark:bg-slate-800/90
                        border border-slate-200 dark:border-slate-700/30
                        text-slate-700 dark:text-vynal-text-primary
                        shadow-sm backdrop-blur-sm
                        rounded-lg"
                    >
                      <button
                        onClick={() => {
                          if (
                            paymentAvailability.applePay &&
                            !checkingAvailability
                          ) {
                            handleDirectApplePay();
                          }
                        }}
                        disabled={
                          !paymentAvailability.applePay ||
                          checkingAvailability ||
                          directPaymentLoading.applePay
                        }
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all ${
                          paymentAvailability.applePay && !checkingAvailability
                            ? "bg-pink-200/80 hover:bg-pink-200/80 dark:bg-pink-900/25 dark:hover:bg-pink-800/40 text-pink-700 dark:text-pink-300 cursor-pointer border border-pink-200/50 dark:border-pink-700/30"
                            : "bg-slate-100/30 dark:bg-slate-800/30 text-slate-400 dark:text-vynal-text-secondary/50 cursor-not-allowed opacity-50"
                        }`}
                        title={
                          checkingAvailability
                            ? "Vérification de la disponibilité..."
                            : !paymentAvailability.applePay
                              ? "Apple Pay non disponible sur cet appareil"
                              : "Payer avec Apple Pay"
                        }
                      >
                        <Image
                          src="/images/payment/applepay.png"
                          alt="Apple Pay"
                          width={40}
                          height={40}
                          className={`h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2 ${
                            !paymentAvailability.applePay ||
                            checkingAvailability
                              ? "opacity-50"
                              : ""
                          }`}
                        />
                        <span className="text-[10px] sm:text-xs font-medium">
                          {directPaymentLoading.applePay ? "..." : "Apple Pay"}
                        </span>
                      </button>
                    </QuickTooltip>

                    {/* Google Pay Button */}
                    <QuickTooltip
                      content={
                        checkingAvailability
                          ? "Vérification de la disponibilité de Google Pay..."
                          : !paymentAvailability.googlePay
                            ? "Google Pay non disponible sur cet appareil"
                            : directPaymentLoading.googlePay
                              ? "Traitement Google Pay en cours..."
                              : "Payer en un clic avec Google Pay"
                      }
                      side="top"
                      variant="default"
                      delayDuration={100}
                      className="bg-slate-100/90 dark:bg-slate-800/90
                        border border-slate-200 dark:border-slate-700/30
                        text-slate-700 dark:text-vynal-text-primary
                        shadow-sm backdrop-blur-sm
                        rounded-lg"
                    >
                      <button
                        onClick={() => {
                          if (
                            paymentAvailability.googlePay &&
                            !checkingAvailability
                          ) {
                            handleDirectGooglePay();
                          }
                        }}
                        disabled={
                          !paymentAvailability.googlePay ||
                          checkingAvailability ||
                          directPaymentLoading.googlePay
                        }
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all ${
                          paymentAvailability.googlePay && !checkingAvailability
                            ? "bg-pink-200/80 hover:bg-pink-200/80 dark:bg-pink-900/25 dark:hover:bg-pink-800/40 text-pink-700 dark:text-pink-300 cursor-pointer border border-pink-200/50 dark:border-pink-700/30"
                            : "bg-slate-100/30 dark:bg-slate-800/30 text-slate-400 dark:text-vynal-text-secondary/50 cursor-not-allowed opacity-50"
                        }`}
                        title={
                          checkingAvailability
                            ? "Vérification de la disponibilité..."
                            : !paymentAvailability.googlePay
                              ? "Google Pay non disponible sur cet appareil"
                              : "Payer avec Google Pay"
                        }
                      >
                        <Image
                          src="/images/payment/googlepaylogo.png"
                          alt="Google Pay"
                          width={40}
                          height={40}
                          className={`h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2 ${
                            !paymentAvailability.googlePay ||
                            checkingAvailability
                              ? "opacity-50"
                              : ""
                          }`}
                        />
                        <span className="text-[10px] sm:text-xs font-medium">
                          {directPaymentLoading.googlePay
                            ? "..."
                            : "Google Pay"}
                        </span>
                      </button>
                    </QuickTooltip>

                    {/* Link Button */}
                    <QuickTooltip
                      content={
                        checkingAvailability
                          ? "Vérification de la disponibilité de Stripe Link..."
                          : !paymentAvailability.link
                            ? "Stripe Link non disponible"
                            : directPaymentLoading.link
                              ? "Traitement Stripe Link en cours..."
                              : "Payer rapidement avec Stripe Link"
                      }
                      side="top"
                      variant="default"
                      delayDuration={100}
                      className="bg-slate-100/90 dark:bg-slate-800/90
                        border border-slate-200 dark:border-slate-700/30
                        text-slate-700 dark:text-vynal-text-primary
                        shadow-sm backdrop-blur-sm
                        rounded-lg"
                    >
                      <button
                        onClick={() => {
                          if (
                            paymentAvailability.link &&
                            !checkingAvailability
                          ) {
                            handleDirectLink();
                          }
                        }}
                        disabled={
                          !paymentAvailability.link ||
                          checkingAvailability ||
                          directPaymentLoading.link
                        }
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-md flex items-center justify-center transition-all ${
                          paymentAvailability.link && !checkingAvailability
                            ? "bg-pink-200/80 hover:bg-pink-200/80 dark:bg-pink-900/25 dark:hover:bg-pink-800/40 text-pink-700 dark:text-pink-300 cursor-pointer border border-pink-200/50 dark:border-pink-700/30"
                            : "bg-slate-100/30 dark:bg-slate-800/30 text-slate-400 dark:text-vynal-text-secondary/50 cursor-not-allowed opacity-50"
                        }`}
                        title={
                          checkingAvailability
                            ? "Vérification de la disponibilité..."
                            : !paymentAvailability.link
                              ? "Stripe Link non disponible"
                              : "Payer avec Stripe Link"
                        }
                      >
                        <Image
                          src="/images/payment/linklogo.png"
                          alt="Stripe Link"
                          width={40}
                          height={40}
                          className={`h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2 ${
                            !paymentAvailability.link || checkingAvailability
                              ? "opacity-50"
                              : ""
                          }`}
                        />
                        <span className="text-[10px] sm:text-xs font-medium">
                          {directPaymentLoading.link ? "..." : "Link"}
                        </span>
                      </button>
                    </QuickTooltip>
                  </div>
                </div>

                {/* Or separator */}
                <div className="relative flex items-center py-3 sm:py-4 mt-1 sm:mt-2">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700/20"></div>
                  <span className="flex-shrink mx-2 sm:mx-3 text-[8px] sm:text-[9px] text-slate-400 dark:text-vynal-text-secondary">
                    Ou payer par carte
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700/20"></div>
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
                  className={`border rounded-md overflow-hidden cursor-pointer transition-all hover:border-vynal-accent-secondary/50 dark:hover:border-vynal-accent-primary/50 hover:shadow-md ${
                    orderData.selectedPaymentMethod === "card"
                      ? "border-vynal-accent-secondary dark:border-vynal-accent-primary shadow-lg ring-2 ring-vynal-accent-secondary/20 dark:ring-vynal-accent-primary/20"
                      : "border-slate-200 dark:border-slate-700/20"
                  }`}
                >
                  <div
                    className={`p-2.5 sm:p-3 flex items-center justify-between ${
                      orderData.selectedPaymentMethod === "card"
                        ? "bg-gradient-to-r from-vynal-accent-secondary/15 to-purple-500/10 dark:from-vynal-accent-primary/15 dark:to-purple-600/10 border-vynal-accent-secondary/30 dark:border-vynal-accent-primary/30"
                        : "bg-slate-200/60 dark:bg-slate-800/25"
                    }`}
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-vynal-accent-secondary dark:text-vynal-accent-primary" />
                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                        Carte bancaire
                      </span>
                    </div>
                    <div className="flex items-center">
                      <QuickTooltip
                        content="Paiement par carte Visa accepté"
                        side="top"
                        variant="default"
                        delayDuration={200}
                        className="bg-slate-100/90 dark:bg-slate-800/90
                          border border-slate-200 dark:border-slate-700/30
                          text-slate-700 dark:text-vynal-text-primary
                          shadow-sm backdrop-blur-sm
                          rounded-lg"
                      >
                        <Image
                          src="/images/payment/visalogo.png"
                          alt="Visa"
                          width={60}
                          height={20}
                          className="h-6 sm:h-7 opacity-80 object-contain"
                        />
                      </QuickTooltip>
                      <QuickTooltip
                        content="Paiement par carte Mastercard accepté"
                        side="top"
                        variant="default"
                        delayDuration={200}
                        className="bg-slate-100/90 dark:bg-slate-800/90
                          border border-slate-200 dark:border-slate-700/30
                          text-slate-700 dark:text-vynal-text-primary
                          shadow-sm backdrop-blur-sm
                          rounded-lg"
                      >
                        <Image
                          src="/images/payment/mastercardlogo.png"
                          alt="Mastercard"
                          width={40}
                          height={40}
                          className="h-6 sm:h-7 opacity-80 object-contain ml-2"
                        />
                      </QuickTooltip>
                      <QuickTooltip
                        content="Paiement par carte American Express accepté"
                        side="top"
                        variant="default"
                        delayDuration={200}
                        className="bg-slate-100/90 dark:bg-slate-800/90
                          border border-slate-200 dark:border-slate-700/30
                          text-slate-700 dark:text-vynal-text-primary
                          shadow-sm backdrop-blur-sm
                          rounded-lg"
                      >
                        <Image
                          src="/images/payment/americanexpresslogo.png"
                          alt="American Express"
                          width={54}
                          height={28}
                          className="h-5 sm:h-5 opacity-80 object-contain ml-2"
                        />
                      </QuickTooltip>
                    </div>
                  </div>

                  {/* Card form - expanded only when selected */}
                  {orderData.selectedPaymentMethod === "card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-200 dark:border-slate-700/20 p-4"
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
                            className="h-10 text-xs sm:text-sm bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/15 rounded-md"
                            value={user?.email || ""}
                            disabled
                          />
                        </div>

                        {/* Stripe Card Element */}
                        <StripeElementsProvider
                          clientSecret={paymentData?.clientSecret}
                          enableApplePay={false}
                        >
                          <div className="space-y-4">
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

                {/* Bouton pour ouvrir la modale de description */}
                <div className="mt-4 border-t border-slate-200 dark:border-slate-700/20 pt-4">
                  <QuickTooltip
                    content="Décrivez précisément votre besoin pour un meilleur résultat"
                    side="top"
                    variant="default"
                    delayDuration={200}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <button
                      type="button"
                      onClick={openDescriptionModal}
                      className="flex items-center justify-between w-full p-2.5 sm:p-3 bg-slate-200/60 dark:bg-slate-800/25 border border-slate-200 dark:border-slate-700/15 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all duration-200 hover:border-vynal-accent-secondary/50 dark:hover:border-vynal-accent-primary/50 hover:shadow-md"
                    >
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-vynal-accent-secondary dark:text-vynal-accent-primary" />
                          <div>
                            <h3 className="text-[10px] sm:text-xs text-slate-800 dark:text-vynal-text-primary line-clamp-2">
                              Description de votre besoin
                            </h3>
                            <p className="text-[9px] text-slate-500 dark:text-vynal-text-secondary mt-0.5 line-clamp-1">
                              {orderData.requirements
                                ? orderData.requirements.substring(0, 60) +
                                  (orderData.requirements.length > 60
                                    ? "..."
                                    : "")
                                : "Cliquez pour ajouter une description... (facultatif)"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-400 dark:text-vynal-text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </QuickTooltip>
                </div>

                {/* Bouton de paiement unifié - Affiché pour toutes les méthodes de paiement SAUF Apple Pay, Google Pay et Link */}
                {orderData.selectedPaymentMethod &&
                  !["apple-pay", "google-pay", "link"].includes(
                    orderData.selectedPaymentMethod,
                  ) && (
                    <button
                      onClick={(e) => {
                        // Si c'est le mode carte et pas le mode test, soumettre le formulaire Stripe
                        if (
                          orderData.selectedPaymentMethod === "card" &&
                          !orderData.isTestMode
                        ) {
                          e.preventDefault();
                          console.log(
                            "Tentative de soumission du formulaire Stripe via méthode globale",
                          );

                          // Utiliser la fonction globale si disponible
                          if (
                            window.submitStripeForm &&
                            typeof window.submitStripeForm === "function"
                          ) {
                            console.log(
                              "Fonction submitStripeForm trouvée, appel",
                            );
                            window.submitStripeForm();
                          } else {
                            console.log(
                              "Fonction submitStripeForm non disponible, méthode de secours",
                            );
                            const form = document.getElementById(
                              "stripe-payment-form",
                            ) as HTMLFormElement;
                            if (form) {
                              try {
                                // Tenter de cliquer sur le bouton caché
                                const hiddenSubmitButton =
                                  document.getElementById(
                                    "stripe-hidden-submit",
                                  );
                                if (hiddenSubmitButton) {
                                  console.log(
                                    "Bouton caché trouvé, déclenchement du clic",
                                  );
                                  (
                                    hiddenSubmitButton as HTMLButtonElement
                                  ).click();
                                } else {
                                  // Fallback - tenter de déclencher l'événement submit directement
                                  console.log(
                                    "Bouton caché non trouvé, utilisation de dispatchEvent",
                                  );
                                  form.dispatchEvent(
                                    new Event("submit", {
                                      bubbles: true,
                                      cancelable: true,
                                    }),
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Erreur lors de la soumission du formulaire",
                                  error,
                                );
                              }
                            } else {
                              console.error("Formulaire Stripe non trouvé");
                            }
                          }
                        } else {
                          // Sinon, utiliser le flux standard
                          handlePlaceOrder();
                        }
                      }}
                      disabled={
                        isSubmitting ||
                        !orderData.selectedPaymentMethod ||
                        (orderData.selectedPaymentMethod === "card" &&
                          !orderData.isTestMode &&
                          !paymentData?.clientSecret)
                      }
                      className="w-full h-11 mt-3 bg-vynal-accent-secondary hover:bg-vynal-accent-primary dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white dark:text-vynal-text-primary font-medium rounded-md text-base sm:text-lg border border-transparent hover:border-vynal-accent-primary/50 dark:hover:border-vynal-accent-secondary/50 hover:shadow-md"
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
                  )}

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
                    src="/images/payment/visalogo.png"
                    alt="Visa"
                    width={60}
                    height={20}
                    className="h-6 sm:h-7 opacity-80 object-contain"
                  />
                  <Image
                    src="/images/payment/mastercardlogo.png"
                    alt="Mastercard"
                    width={40}
                    height={40}
                    className="h-6 sm:h-7 opacity-80 object-contain ml-2"
                  />
                  <Image
                    src="/images/payment/americanexpresslogo.png"
                    alt="American Express"
                    width={54}
                    height={28}
                    className="h-5 sm:h-5 opacity-80 object-contain ml-2"
                  />
                  <Image
                    src="/images/payment/applepay.png"
                    alt="Apple Pay"
                    width={48}
                    height={24}
                    className="h-7 object-contain opacity-80"
                  />
                  <Image
                    src="/images/payment/googlepaylogo.png"
                    alt="Google Pay"
                    width={48}
                    height={24}
                    className="h-7 object-contain opacity-80"
                  />
                  <Image
                    src="/images/payment/linklogo.png"
                    alt="Stripe Link"
                    width={48}
                    height={24}
                    className="h-7 object-contain opacity-80"
                  />
                </div>

                {/* Terms and conditions */}
                <p className="text-[7px] sm:text-[8px] text-center text-slate-500 dark:text-vynal-text-secondary mt-3">
                  En finalisant votre commande, vous acceptez nos{" "}
                  <Link
                    href="/terms-of-service"
                    className="text-vynal-accent-secondary dark:text-vynal-accent-primary hover:underline"
                  >
                    conditions générales
                  </Link>{" "}
                  et notre{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-vynal-accent-secondary dark:text-vynal-accent-primary hover:underline"
                  >
                    politique de confidentialité
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modale pour la description */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/30 dark:bg-slate-900/30 rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden backdrop-blur-sm"
          >
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-vynal-text-primary">
                  Description de votre besoin (facultatif)
                </h3>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-500 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary"
                  onClick={() => setShowDescriptionModal(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <Textarea
                  placeholder="Décrivez en détail ce que vous souhaitez obtenir..."
                  className="h-48 text-sm bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/15 rounded-lg resize-none focus:ring-1 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary w-full"
                  value={tempRequirements}
                  onChange={(e) => setTempRequirements(e.target.value)}
                />
                <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary mt-2">
                  Une description détaillée nous permettra de mieux comprendre
                  vos besoins et de vous offrir un service de qualité.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-vynal-text-secondary bg-white/25 dark:bg-slate-800/25 border border-slate-300 dark:border-slate-700/15 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all duration-200"
                  onClick={() => setShowDescriptionModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-vynal-accent-secondary hover:bg-vynal-accent-primary dark:bg-vynal-accent-primary dark:hover:bg-vynal-accent-secondary rounded-md transition-all duration-200"
                  onClick={saveDescription}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
