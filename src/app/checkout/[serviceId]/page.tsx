"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStripePayment } from "@/hooks/useStripePayment";
import { StripeElementsProvider } from "@/components/StripeElementsProvider";
import { StripeCardForm } from "@/components/payments/StripeCardForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, CreditCard, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { logSecurityEvent } from "@/lib/security/audit";
import { PaymentCurrencyNotice } from "@/components/payments/PaymentCurrencyNotice";

// Type pour les données de service
interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
}

/**
 * Page de checkout pour un service
 * 
 * Cette page permet à l'utilisateur de payer pour un service
 * Elle utilise Stripe pour le traitement du paiement
 */
export default function CheckoutPage({ params }: { params: { serviceId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { createPaymentIntent, handlePaymentSuccess, handlePaymentFailure, loading, error, paymentData } = useStripePayment();
  const [service, setService] = useState<ServiceData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const serviceId = params.serviceId;

  // Redirection si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Journaliser la tentative d'accès non autorisé
      if (!authLoading) {
        logSecurityEvent({
          type: 'security_violation',
          severity: 'medium',
          details: {
            message: "Tentative d'accès à la page de paiement sans authentification",
            serviceId
          }
        });
      }
      
      router.push(`/auth/sign-in?callbackUrl=/checkout/${serviceId}`);
    }
  }, [user, authLoading, router, serviceId, isAuthenticated]);

  // Chargement des données du service
  useEffect(() => {
    const fetchService = async () => {
      try {
        // Tenter de récupérer le service depuis l'API
        const response = await fetch(`/api/services/${serviceId}`);
        
        if (!response.ok) {
          throw new Error('Service non trouvé');
        }
        
        const serviceData = await response.json();
        setService(serviceData);
        
        // Journaliser le chargement du service
        if (user) {
          logSecurityEvent({
            type: 'sensitive_data_access',
            userId: user.id,
            severity: 'low',
            details: {
              action: "view_service_checkout",
              serviceId
            }
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement du service:", err);
        
        // Fallback pour démo - RETIRER EN PRODUCTION
        setService({
          id: serviceId,
          title: "Service Premium Vynal Platform",
          description: "Accès aux fonctionnalités premium de la plateforme",
          price: 49.99,
          imageUrl: "/assets/service-image.jpg"
        });
      }
    };

    if (user) {
      fetchService();
    }
  }, [user, serviceId]);

  // Initialisation du paiement
  const handleInitPayment = async () => {
    if (!service || !user) return;
    
    setPaymentStatus("processing");
    const response = await createPaymentIntent({
      amount: service.price,
      serviceId: service.id,
      metadata: {
        serviceName: service.title,
        userEmail: user.email
      }
    });

    if (!response) {
      setPaymentStatus("error");
      setPaymentError("Impossible d'initialiser le paiement. Veuillez réessayer.");
    }
    // Si le paiement est initialisé avec succès, on reste dans l'état "processing"
  };

  // Gestion du succès du paiement
  const handleSuccess = (paymentIntent: any) => {
    setPaymentStatus("success");
    handlePaymentSuccess(paymentIntent.id, serviceId);
    
    // Journaliser le succès du paiement côté client
    logSecurityEvent({
      type: 'payment_success',
      userId: user?.id,
      severity: 'info',
      details: {
        paymentIntentId: paymentIntent.id,
        serviceId,
        amount: service?.price
      }
    });
    
    // Redirection vers la page de confirmation après un court délai
    setTimeout(() => {
      router.push(`/dashboard/orders?success=true&orderId=${paymentIntent.id}`);
    }, 3000);
  };

  // Gestion de l'erreur de paiement
  const handleError = (error: any) => {
    setPaymentStatus("error");
    const errorMessage = error.message || "Une erreur est survenue lors du paiement. Veuillez réessayer.";
    setPaymentError(errorMessage);
    
    // Journaliser l'erreur de paiement côté client
    logSecurityEvent({
      type: 'payment_failure',
      userId: user?.id,
      severity: 'medium',
      details: {
        error: errorMessage,
        serviceId,
        paymentIntentId: paymentData?.paymentIntentId
      }
    });
    
    // Si nous avons un ID de paiement, notifier le serveur
    if (paymentData?.paymentIntentId) {
      handlePaymentFailure(paymentData.paymentIntentId, serviceId, errorMessage);
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
                Procéder au paiement
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <StripeElementsProvider clientSecret={paymentData.clientSecret}>
        <StripeCardForm 
          amount={service?.price || 0}
          clientSecret={paymentData.clientSecret}
          onSuccess={handleSuccess}
          onError={handleError}
          loading={paymentStatus === "processing" && !paymentError}
        />
      </StripeElementsProvider>
    );
  };

  // Affichage pendant le chargement
  if (authLoading || !service) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse h-6 w-6 bg-blue-600 rounded-full mx-1"></div>
        <div className="animate-pulse h-6 w-6 bg-blue-600 rounded-full mx-1 animation-delay-200"></div>
        <div className="animate-pulse h-6 w-6 bg-blue-600 rounded-full mx-1 animation-delay-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/services/${serviceId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au service
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Résumé du service */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
                <CardDescription>
                  Détails du service que vous allez acheter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.imageUrl && (
                    <div className="rounded-lg overflow-hidden">
                      <Image 
                        src={service.imageUrl} 
                        alt={service.title}
                        width={400}
                        height={200}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{service.description}</p>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Prix</span>
                      <span className="font-bold">{service.price.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Informations de sécurité */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">Paiement sécurisé</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Toutes vos données de paiement sont chiffrées et sécurisées par Stripe, leader mondial des solutions de paiement.
              </p>
              <div className="flex items-center mt-3 space-x-2">
                <Lock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">SSL / TLS encryption</span>
              </div>
            </div>
          </div>
          
          {/* Formulaire de paiement */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Paiement</CardTitle>
                <CardDescription>
                  Saisissez vos informations de paiement en toute sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentStatus === "success" ? (
                  <div className="py-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Paiement réussi !</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Merci pour votre commande. Vous allez être redirigé vers votre tableau de bord.
                    </p>
                  </div>
                ) : paymentStatus === "error" ? (
                  <div className="py-6 text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Erreur de paiement</h3>
                    <p className="text-red-600 mb-4">{paymentError || error || "Une erreur est survenue"}</p>
                    <Button onClick={() => setPaymentStatus("idle")}>
                      Réessayer
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Notification de devise pour le paiement */}
                    <PaymentCurrencyNotice className="mb-4" />
                    
                    {renderPaymentForm()}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Image 
                    src="/assets/partners/logo_stripe.webp" 
                    alt="Stripe" 
                    width={60} 
                    height={25} 
                    onError={(e) => {
                      // Fallback si l'image n'existe pas
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Image 
                    src="/images/payment/visa.svg" 
                    alt="Visa" 
                    width={32} 
                    height={20}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Image 
                    src="/images/payment/mastercard.svg" 
                    alt="Mastercard" 
                    width={32} 
                    height={20}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}