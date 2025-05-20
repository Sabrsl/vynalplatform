"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { ServiceSummary } from "@/components/orders/ServiceSummary";
import { PaymentMethodCard } from "@/components/orders/PaymentMethodCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, CheckCircle, Loader, FileCheck, CreditCard, Lock, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { PAYMENT_METHODS, PaymentMethodType, validatePaymentData } from "@/lib/constants/payment";
import { PaymentForm } from "@/components/orders/PaymentForm";
import { encrypt } from "@/lib/security/encryption";
import { generateCSRFToken, validateCSRFToken } from "@/lib/security/csrf";
import { logSecurityEvent, isSuspiciousActivity } from "@/lib/security/audit";

export default function PaymentPage() {
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get('serviceId');
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorFading, setErrorFading] = useState(false);
  const [isOwnService, setIsOwnService] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Informations de paiement par carte
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  
  // Informations de paiement mobile
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileOperator, setMobileOperator] = useState<"orange-money" | "free-money" | "wave">("orange-money");
  
  // Informations PayPal
  const [paypalEmail, setPaypalEmail] = useState("");
  
  // Récupérer les détails de la commande du sessionStorage
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Effet pour faire disparaître les messages d'erreur après quelques secondes
  useEffect(() => {
    if (error) {
      // Attendre 3 secondes avant de commencer à faire disparaître le message
      const fadeTimer = setTimeout(() => {
        setErrorFading(true);
        
        // Attendre 1 seconde pour l'animation avant de supprimer complètement le message
        const removeTimer = setTimeout(() => {
          setError(null);
          setErrorFading(false);
        }, 1000);
        
        return () => clearTimeout(removeTimer);
      }, 3000);
      
      return () => clearTimeout(fadeTimer);
    }
  }, [error]);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Vérifier si l'utilisateur a un rôle de freelance avec useUser
    if (isFreelance) {
      router.push("/dashboard");
      setError("Les prestataires ne peuvent pas effectuer de paiements");
      return;
    }

    // Récupérer les détails de la commande du sessionStorage
    const savedOrder = sessionStorage.getItem('pendingOrder');
    if (savedOrder) {
      setOrderDetails(JSON.parse(savedOrder));
    } else {
      setError("Aucune commande en attente n'a été trouvée");
    }

    // Récupérer les données du service depuis l'API
    const fetchService = async () => {
      setLoading(true);
      try {
        if (!serviceId) {
          setError("Aucun service n'a été spécifié");
          return;
        }
        
        // Appel direct à Supabase pour récupérer les données du service
        const { data, error: fetchError } = await supabase
          .from('services')
          .select(`
            *,
            profiles!services_freelance_id_fkey (
              id, 
              username, 
              full_name, 
              avatar_url
            )
          `)
          .eq('id', serviceId)
          .single();
        
        if (fetchError) {
          console.error("Erreur lors de la récupération du service:", fetchError);
          throw new Error(fetchError.message);
        }
        
        if (!data) {
          throw new Error("Service non trouvé");
        }
        
        // Vérifier si l'utilisateur est le propriétaire du service
        if (profile && data.freelance_id === profile.id) {
          setIsOwnService(true);
          setError("Vous ne pouvez pas commander votre propre service");
          router.push(`/dashboard/services/${serviceId}`);
          return;
        }
        
        // Récupérer la note moyenne du prestataire si disponible
        let rating = 0;
        if (data.freelance_id) {
          /* DÉSACTIVATION TEMPORAIRE DES APPELS AUX REVIEWS
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('freelance_id', data.freelance_id);
            
          if (!reviewsError && reviewsData && reviewsData.length > 0) {
            rating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
          }
          */
          rating = 0;
        }
        
        // Formater les données du service
        setService({
          ...data,
          profiles: data.profiles ? {
            ...data.profiles,
            rating: rating
          } : undefined
        });
      } catch (err: any) {
        console.error("Erreur lors de la récupération du service", err);
        setError("Une erreur s'est produite lors du chargement du service: " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [user, router, serviceId, profile, isFreelance]);

  const handlePayment = async () => {
    if (isOwnService) {
      setError("Vous ne pouvez pas commander votre propre service");
      return;
    }
    
    if (!selectedPaymentMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    // Vérifier les activités suspectes
    if (user?.id) {
      const isSuspicious = await isSuspiciousActivity(user.id, 'payment_attempt');
      if (isSuspicious) {
        setError("Trop de tentatives de paiement. Veuillez réessayer plus tard.");
        return;
      }
    }

    const paymentData = {
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
      paypalEmail,
      phoneNumber,
      mobileOperator
    };

    const validationError = validatePaymentData(selectedPaymentMethod, paymentData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setPaymentProcessing(true);

    try {
      // Générer un token CSRF
      const csrfToken = generateCSRFToken(user?.id || '');
      
      // Récupérer les données de commande du sessionStorage
      const savedOrder = sessionStorage.getItem('pendingOrder');
      if (!savedOrder) {
        throw new Error("Aucune commande en attente n'a été trouvée");
      }
      
      const orderData = JSON.parse(savedOrder);
      
      // Chiffrer les données sensibles
      const encryptedPaymentData = {
        ...paymentData,
        cardNumber: encrypt(paymentData.cardNumber),
        cvv: encrypt(paymentData.cvv)
      };
      
      // Envoyer les données à l'API
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            service_id: serviceId,
            client_id: user?.id,
            requirements: orderData.requirements,
            delivery_date: orderData.delivery_date,
            status: 'pending',
            payment_method: selectedPaymentMethod,
            payment_status: 'completed',
            total_amount: service?.price || 0,
            payment_data: encryptedPaymentData,
            csrf_token: csrfToken
          }
        ])
        .select()
        .single();
      
      if (orderError) {
        throw new Error("Erreur lors de la création de la commande: " + orderError.message);
      }
      
      // Logger l'événement de paiement
      await logSecurityEvent({
        type: 'payment_success',
        userId: user?.id,
        severity: 'medium',
        details: {
          orderId: insertedOrder.id,
          amount: service?.price,
          paymentMethod: selectedPaymentMethod
        }
      });
      
      // Paiement réussi
      setPaymentSuccess(true);
      
      // Effacer les données de commande temporaires
      sessionStorage.removeItem('pendingOrder');
      
      // Après quelques secondes, rediriger vers le tableau de bord
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 3000);
    } catch (err: any) {
      console.error("Erreur lors du traitement du paiement", err);
      
      // Logger l'échec du paiement
      await logSecurityEvent({
        type: 'payment_failure',
        userId: user?.id,
        severity: 'high',
        details: {
          error: err.message,
          paymentMethod: selectedPaymentMethod
        }
      });
      
      setError("Une erreur s'est produite lors du traitement du paiement: " + (err.message || ""));
    } finally {
      setPaymentProcessing(false);
    }
  };

  const renderPaymentDetailsForm = () => {
    return (
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
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isOwnService) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Vous ne pouvez pas commander votre propre service
              </h2>
              <p className="text-gray-600 mb-6">
                En tant que prestataire, vous ne pouvez pas acheter les services que vous proposez.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => router.push('/dashboard/services')} className="mx-2">
                  Retour à mes services
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/services')} 
                  className="mx-2"
                >
                  Explorer d'autres services
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card className="border-green-100">
          <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Paiement réussi !</h2>
            <p className="text-slate-600 mb-6">
              Votre commande a été confirmée et le prestataire a été notifié.
              Vous allez être redirigé vers vos commandes.
            </p>
            <div className="mt-2 animate-pulse">
              <Loader className="h-5 w-5 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Service introuvable"}
          </h2>
          <p className="text-slate-600 mb-6">
            Impossible de traiter votre paiement pour le moment.
          </p>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/dashboard/orders/new?serviceId=${serviceId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux détails de la commande
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Finaliser votre commande</h1>
        <p className="text-slate-600 flex items-center mt-1">
          <CreditCard className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Sélectionnez votre méthode de paiement préférée pour confirmer la commande
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ServiceSummary service={service} />
          {orderDetails && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Détails de la commande</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4 space-y-2 text-sm">
                {orderDetails.requirements && (
                  <div>
                    <p className="font-medium text-slate-700">Instructions:</p>
                    <p className="text-slate-600 line-clamp-2">{orderDetails.requirements}</p>
                  </div>
                )}
                {orderDetails.delivery_date && (
                  <div>
                    <p className="font-medium text-slate-700">Livraison souhaitée:</p>
                    <p className="text-slate-600">{new Date(orderDetails.delivery_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {orderDetails.has_files && (
                  <div className="flex items-center text-slate-600">
                    <FileCheck className="h-4 w-4 mr-1.5 text-green-500" />
                    <span>Fichiers joints</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Méthode de paiement</CardTitle>
              <CardDescription>
                Choisissez la méthode de paiement qui vous convient le mieux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className={`bg-red-50 p-2 rounded-md flex items-start gap-2 text-red-700 text-xs mb-3 max-h-20 overflow-y-auto transition-opacity duration-1000 ${errorFading ? 'opacity-0' : 'opacity-100'}`}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {!selectedPaymentMethod ? (
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      id={method.id}
                      name={method.name}
                      description={method.description}
                      logo={method.logo}
                      selected={selectedPaymentMethod === method.id}
                      onSelect={(id) => setSelectedPaymentMethod(id as PaymentMethodType)}
                    />
                  ))}
                </div>
              ) : (
                renderPaymentDetailsForm()
              )}

              <div className="pt-4 mt-2 border-t border-gray-100">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-slate-500">
                    Prix total (TTC)
                  </div>
                  <div className="font-medium text-xl text-indigo-700">
                    {formatPrice(service?.price || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              {selectedPaymentMethod ? (
                <>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    asChild
                  >
                    <Link href="/services">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Link>
                  </Button>
                  <Button 
                    onClick={handlePayment}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Traitement...
                      </>
                    ) : (
                      "Payer maintenant"
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setSelectedPaymentMethod("card")} 
                  className="ml-auto"
                >
                  Continuer
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 