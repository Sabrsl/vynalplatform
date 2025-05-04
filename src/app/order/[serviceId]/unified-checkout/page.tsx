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
  Lock
} from "lucide-react";
import { useOrderData } from "@/hooks/useOrderData";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { processMockPayment } from "@/lib/payment/mockPayment";
import { PaymentMethodType } from "@/lib/constants/payment";
import { motion } from "framer-motion";
import Link from "next/link";

export default function UnifiedCheckoutPage({ params }: { params: { serviceId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const serviceId = params.serviceId;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment method states
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: ""
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
    validatePayment
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
      router.push("/sign-in?callbackUrl=" + encodeURIComponent(`/order/${serviceId}/unified-checkout`));
    }
  }, [user, authLoading, router, serviceId]);

  const handleBack = () => {
    router.push(`/services/${serviceId}`);
  };

  const handleMethodSelect = (method: PaymentMethodType) => {
    if (isLoading) return;
    setOrderData({ ...orderData, selectedPaymentMethod: method, error: null });
    
    // Reset other payment fields
    if (method !== "card") {
      setCardDetails({
        number: "",
        expiry: "",
        cvc: "",
        name: ""
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
    setCardDetails(prev => ({
      ...prev,
      [name]: value
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
      setOrderData({ ...orderData, error: "Veuillez sélectionner une méthode de paiement" });
      return;
    }
    
    // Check payment method data
    if (orderData.selectedPaymentMethod === "card") {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
        setOrderData({ ...orderData, error: "Veuillez compléter tous les champs de la carte bancaire" });
        return;
      }
    } else if (orderData.selectedPaymentMethod === "paypal") {
      if (!paypalEmail) {
        setOrderData({ ...orderData, error: "Veuillez saisir votre email PayPal" });
        return;
      }
    } else if (orderData.selectedPaymentMethod === "wave" || orderData.selectedPaymentMethod === "orange-money") {
      if (!mobileNumber) {
        setOrderData({ ...orderData, error: `Veuillez saisir votre numéro ${orderData.selectedPaymentMethod === "wave" ? "Wave" : "Orange Money"}` });
        return;
      }
    }

    setIsLoading(true);
    setIsSubmitting(true);
    
    try {
      if (orderData.isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const testOrderId = `test_${Date.now()}`;
        setOrderData({ 
          ...orderData,
          orderId: testOrderId,
          testPaymentSuccess: true,
          error: null
        });
        router.push(`/order/${serviceId}/summary`);
      } else {
        // Payment data validation
        const paymentError = validatePayment();
        if (paymentError) {
          setOrderData({ ...orderData, error: paymentError });
          setIsLoading(false);
          setIsSubmitting(false);
          return;
        }

        const result = await processMockPayment({
          serviceId,
          clientId: user.id,
          freelanceId: service?.profiles?.id,
          amount: service?.price || 0,
          requirements: orderData.requirements,
          deliveryTime: service?.delivery_time || 3
        });

        if (result.success) {
          setOrderData({ 
            ...orderData,
            orderId: result.orderId,
            testPaymentSuccess: false,
            error: null
          });
          router.push(`/order/${serviceId}/summary`);
        } else {
          throw new Error(result.error || "Erreur lors du paiement");
        }
      }
    } catch (err) {
      console.error("Erreur lors du paiement:", err);
      setOrderData({ 
        ...orderData,
        error: err instanceof Error ? err.message : "Une erreur est survenue",
        testPaymentSuccess: false
      });
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingService) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-vynal-purple-dark">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-vynal-accent-primary border-l-vynal-accent-primary animate-spin"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-vynal-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-vynal-purple-dark py-8 px-4 sm:px-6">
      {/* Header simple */}
      <div className="max-w-4xl mx-auto mb-8">
        <button 
          onClick={handleBack}
          className="inline-flex items-center text-gray-600 dark:text-vynal-text-secondary hover:text-vynal-accent-primary transition-colors text-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Retour</span>
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-vynal-purple-dark/70 shadow-sm rounded-xl overflow-hidden">
          {/* Header with secure badge */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-vynal-purple-secondary/10 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-vynal-text-primary">Finaliser votre commande</h1>
            <div className="flex items-center text-xs text-gray-500 dark:text-vynal-text-secondary">
              <Lock className="h-3.5 w-3.5 mr-1 text-vynal-accent-primary" />
              <span>Paiement sécurisé</span>
            </div>
          </div>

          {/* Error alert */}
          {orderData.error && (
            <div className="mx-6 mt-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 flex items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <p>{orderData.error}</p>
            </div>
          )}
          
          <div className="p-6">
            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column (2/3 width) - Order details & Payment */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description section */}
                <div className="space-y-4">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-vynal-text-secondary">Description de vos besoins</h2>
                  <Textarea
                    placeholder="Décrivez en détail ce que vous souhaitez obtenir..."
                    className="h-24 text-sm bg-transparent border-gray-200 dark:border-vynal-purple-secondary/30 rounded-lg resize-none focus:ring-1 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary"
                    value={orderData.requirements}
                    onChange={(e) => setOrderData({ ...orderData, requirements: e.target.value, error: null })}
                  />
                </div>

                {/* Payment methods */}
                <div className="space-y-4">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-vynal-text-secondary">Méthode de paiement</h2>
                  
                  {/* Card selector */}
                  <div 
                    onClick={() => handleMethodSelect("card")}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      orderData.selectedPaymentMethod === "card" 
                        ? "border-vynal-accent-primary bg-vynal-accent-primary/5 dark:bg-vynal-purple-secondary/20" 
                        : "border-gray-200 dark:border-vynal-purple-secondary/30 hover:border-vynal-accent-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-5 flex items-center">
                          <CreditCard className="h-5 w-5 text-gray-600 dark:text-vynal-text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-vynal-text-primary">Carte bancaire</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Image src="/images/payment/visa.svg" alt="Visa" width={28} height={18} className="h-5" />
                        <Image src="/images/payment/mastercard.svg" alt="Mastercard" width={28} height={18} className="h-5" />
                      </div>
                    </div>

                    {/* Card form */}
                    {orderData.selectedPaymentMethod === "card" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-vynal-purple-secondary/20 overflow-hidden"
                      >
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="card-number" className="text-xs text-gray-600 dark:text-vynal-text-secondary block mb-1">Numéro de carte</label>
                            <Input
                              id="card-number"
                              name="number"
                              placeholder="1234 5678 9012 3456"
                              value={cardDetails.number}
                              onChange={(e) => {
                                const formatted = formatCardNumber(e.target.value);
                                setCardDetails(prev => ({ ...prev, number: formatted }));
                              }}
                              maxLength={19}
                              className="h-10 text-sm bg-transparent border-gray-200 dark:border-vynal-purple-secondary/30 rounded-md"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="card-name" className="text-xs text-gray-600 dark:text-vynal-text-secondary block mb-1">Nom sur la carte</label>
                              <Input
                                id="card-name"
                                name="name"
                                placeholder="JEAN DUPONT"
                                value={cardDetails.name}
                                onChange={handleCardInputChange}
                                className="h-10 text-sm bg-transparent border-gray-200 dark:border-vynal-purple-secondary/30 rounded-md"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label htmlFor="card-expiry" className="text-xs text-gray-600 dark:text-vynal-text-secondary block mb-1">Expiration</label>
                                <Input
                                  id="card-expiry"
                                  name="expiry"
                                  placeholder="MM/AA"
                                  value={cardDetails.expiry}
                                  onChange={(e) => {
                                    const formatted = formatExpiry(e.target.value);
                                    setCardDetails(prev => ({ ...prev, expiry: formatted }));
                                  }}
                                  maxLength={5}
                                  className="h-10 text-sm bg-transparent border-gray-200 dark:border-vynal-purple-secondary/30 rounded-md"
                                />
                              </div>
                              <div>
                                <label htmlFor="card-cvc" className="text-xs text-gray-600 dark:text-vynal-text-secondary block mb-1">CVC</label>
                                <Input
                                  id="card-cvc"
                                  name="cvc"
                                  placeholder="123"
                                  value={cardDetails.cvc}
                                  onChange={(e) => {
                                    const formatted = formatCVC(e.target.value);
                                    setCardDetails(prev => ({ ...prev, cvc: formatted }));
                                  }}
                                  maxLength={3}
                                  className="h-10 text-sm bg-transparent border-gray-200 dark:border-vynal-purple-secondary/30 rounded-md"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* PayPal selector */}
                  <div 
                    onClick={() => handleMethodSelect("paypal")}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      orderData.selectedPaymentMethod === "paypal" 
                        ? "border-vynal-accent-primary bg-vynal-accent-primary/5 dark:bg-vynal-purple-secondary/20" 
                        : "border-gray-200 dark:border-vynal-purple-secondary/30 hover:border-vynal-accent-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-5 flex items-center">
                          <Image src="/images/payment/paypal.svg" alt="PayPal" width={20} height={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-vynal-text-primary">PayPal</p>
                        </div>
                      </div>
                    </div>

                    {/* PayPal form */}
                    {orderData.selectedPaymentMethod === "paypal" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-vynal-purple-secondary/20 overflow-hidden"
                      >
                        <div>
                          <label htmlFor="paypal-email" className="text-xs text-gray-600 dark:text-vynal-text-secondary block mb-1">Email PayPal</label>
                          <Input
                            id="paypal-email"
                            type="email"
                            placeholder="exemple@email.com"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            className="h-10 text-sm bg-transparent border-gray-200 dark:border-vynal-purple-secondary/30 rounded-md"
                          />
                          <p className="mt-2 text-xs text-gray-500 dark:text-vynal-text-secondary">Vous serez redirigé vers PayPal pour finaliser votre paiement.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Mobile money selector (Wave + Orange Money) */}
                  <div className="flex gap-4">
                    {/* Wave */}
                    <div 
                      onClick={() => handleMethodSelect("wave")}
                      className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                        orderData.selectedPaymentMethod === "wave" 
                          ? "border-vynal-accent-primary bg-vynal-accent-primary/5 dark:bg-vynal-purple-secondary/20" 
                          : "border-gray-200 dark:border-vynal-purple-secondary/30 hover:border-vynal-accent-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-5 flex items-center">
                            <Image src="/images/payment/wave.svg" alt="Wave" width={20} height={20} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-vynal-text-primary">Wave</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Orange Money */}
                    <div 
                      onClick={() => handleMethodSelect("orange-money")}
                      className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                        orderData.selectedPaymentMethod === "orange-money" 
                          ? "border-vynal-accent-primary bg-vynal-accent-primary/5 dark:bg-vynal-purple-secondary/20" 
                          : "border-gray-200 dark:border-vynal-purple-secondary/30 hover:border-vynal-accent-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-5 flex items-center">
                            <Image src="/images/payment/orange-money.svg" alt="Orange Money" width={20} height={20} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-vynal-text-primary">Orange Money</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile payment form (shared between Wave and Orange Money) */}
                  {(orderData.selectedPaymentMethod === "wave" || orderData.selectedPaymentMethod === "orange-money") && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 p-4 border border-gray-200 dark:border-vynal-purple-secondary/30 rounded-lg overflow-hidden"
                    >
                      <div>
                        <label htmlFor="mobile-number" className="text-xs text-gray-600 dark:text-vynal-text-secondary block mb-1">
                          Numéro {orderData.selectedPaymentMethod === "wave" ? "Wave" : "Orange Money"}
                        </label>
                        <Input
                          id="mobile-number"
                          type="tel"
                          placeholder="77 123 45 67"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="h-10 text-sm bg-transparent border-gray-200 dark:border-vynal-purple-secondary/30 rounded-md"
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-vynal-text-secondary">
                          Vous recevrez un code sur votre téléphone pour valider le paiement.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Test mode toggle (simple version) */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="test-mode"
                    checked={orderData.isTestMode}
                    onChange={() => setOrderData({ ...orderData, isTestMode: !orderData.isTestMode })}
                    className="h-4 w-4 text-vynal-accent-primary rounded border-gray-300 focus:ring-vynal-accent-primary"
                  />
                  <label htmlFor="test-mode" className="text-xs text-gray-500 dark:text-vynal-text-secondary cursor-pointer">
                    Mode test (pas de paiement réel)
                  </label>
                </div>

                {/* Pay button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || !orderData.requirements || !orderData.selectedPaymentMethod}
                  className="w-full h-12 bg-vynal-accent-primary hover:bg-vynal-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-medium rounded-lg text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Traitement en cours...
                    </span>
                  ) : (
                    `Payer ${formatPrice(service?.price || 0)}`
                  )}
                </button>
              </div>

              {/* Right column (1/3 width) - Order summary */}
              <div className="bg-gray-50 dark:bg-vynal-purple-secondary/10 p-6 rounded-lg">
                <h2 className="text-sm font-medium text-gray-900 dark:text-vynal-text-primary mb-4">Résumé de la commande</h2>
                
                {/* Service information */}
                <div className="flex items-start space-x-3 pb-4 border-b border-gray-200 dark:border-vynal-purple-secondary/20">
                  <div className="w-12 h-12 rounded-md bg-gray-200 dark:bg-vynal-purple-secondary/20 overflow-hidden relative flex-shrink-0">
                    {service?.images && service.images.length > 0 ? (
                      <Image 
                        src={service.images[0]} 
                        alt={service.title || "Service"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-vynal-text-primary line-clamp-2">
                      {service?.title || "Service"}
                    </h3>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-vynal-text-secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Livraison en {service?.delivery_time || 3} jour(s)</span>
                    </div>
                  </div>
                </div>
                
                {/* Price breakdown */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-vynal-text-secondary">Prix du service</span>
                    <span className="text-xs text-gray-900 dark:text-vynal-text-primary">{formatPrice(service?.price || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-vynal-text-secondary">Frais de service</span>
                    <span className="text-xs text-green-600 dark:text-green-500">Inclus</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 dark:border-vynal-purple-secondary/20 flex justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-vynal-text-primary">Total</span>
                    <span className="text-sm font-bold text-vynal-accent-primary">{formatPrice(service?.price || 0)}</span>
                  </div>
                </div>
                
                {/* Security badge */}
                <div className="mt-6 flex items-center justify-center p-3 bg-white dark:bg-vynal-purple-dark/40 rounded-lg border border-gray-200 dark:border-vynal-purple-secondary/20">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-vynal-accent-primary" />
                    <span className="text-xs text-gray-600 dark:text-vynal-text-secondary">Paiement sécurisé par SSL</span>
                  </div>
                </div>
                
                {/* Payment methods */}
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Image src="/images/payment/visa.svg" alt="Visa" width={32} height={20} className="h-5" />
                    <Image src="/images/payment/mastercard.svg" alt="Mastercard" width={32} height={20} className="h-5" />
                    <Image src="/images/payment/paypal.svg" alt="PayPal" width={32} height={20} className="h-5" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">+2</span>
                  </div>
                </div>
                
                {/* Support link */}
                <div className="mt-4 text-center">
                  <Link href="/contact" className="text-xs text-vynal-accent-primary hover:text-vynal-accent-secondary">
                    Besoin d'aide ?
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-vynal-purple-secondary/10 text-center">
            <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
              En finalisant votre commande, vous acceptez nos <Link href="/terms-of-service" className="text-vynal-accent-primary hover:text-vynal-accent-secondary">conditions générales</Link> et notre <Link href="/privacy-policy" className="text-vynal-accent-primary hover:text-vynal-accent-secondary">politique de confidentialité</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}