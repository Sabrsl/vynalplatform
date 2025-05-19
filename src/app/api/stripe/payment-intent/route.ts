import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logSecurityEvent } from '@/lib/security/audit';
import { isSuspiciousActivity } from '@/lib/security/audit';
import { cookies } from 'next/headers';
import { validatePaymentCurrency, detectCurrency } from '@/lib/utils/currency-updater';

/**
 * API pour créer un PaymentIntent Stripe
 * 
 * Route: POST /api/stripe/payment-intent
 * Cette API requiert une authentification
 */
export async function POST(req: NextRequest) {
  // Récupérer les informations sur le client
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Récupération et validation du corps de la requête
    const body = await req.json();
    
    console.log('API payment-intent - Corps de la requête:', JSON.stringify(body));
    
    // Validation des données requises
    if (!body.amount || !body.serviceId) {
      return NextResponse.json(
        { error: 'Données incomplètes. Montant et ID du service requis.' },
        { status: 400 }
      );
    }
    
    // Configuration de l'environnement
    const isDev = process.env.NODE_ENV === 'development';
    
    // Vérification de l'authentification avec Supabase
    // Utiliser la version simplifiée pour les API routes
    const supabase = createClientComponentClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Variables pour l'utilisateur
    let userId: string = session?.user?.id || '';
    let userEmail: string = session?.user?.email || '';
    
    // Rejet si l'utilisateur n'est pas authentifié
    if (!session?.user) {
      await logSecurityEvent({
        type: 'security_violation',
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: { 
          error: 'Tentative de création de paiement sans authentification',
          endpoint: '/api/stripe/payment-intent',
          sessionError: sessionError?.message || 'Aucune session trouvée',
          amount: body.amount,
          serviceId: body.serviceId
        }
      });
      
      return NextResponse.json(
        { error: 'Non autorisé. Authentification requise.' },
        { status: 401 }
      );
    }
    
    // Extraction des informations nécessaires
    const { amount, serviceId, freelanceId, metadata = {} } = body;
    
    // Vérification du montant (doit être un nombre positif)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'ID du service existe et récupérer les infos du freelance si non fournies
    let freelanceIdentifier = freelanceId;
    if (!freelanceIdentifier) {
      try {
        console.log(`Recherche du freelance pour le service ${serviceId}`);
        // Récupérer le freelance ID à partir du service
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('freelance_id')
          .eq('id', serviceId)
          .single();
          
        if (serviceError) {
          console.error('Erreur recherche service:', serviceError);
          
          if (isDev) {
            // En mode développement, utiliser un ID de freelance par défaut
            console.log('Mode développement: utilisation d\'un freelance par défaut');
            freelanceIdentifier = '2fde948c-91d8-4ae7-9a04-77c363680106';
          } else {
            throw new Error(serviceError?.message || 'Service non trouvé');
          }
        } else if (serviceData) {
          freelanceIdentifier = serviceData.freelance_id;
          console.log(`Freelance trouvé: ${freelanceIdentifier}`);
        }
      } catch (error: any) {
        console.error('Erreur récupération service:', error);
        
        if (isDev) {
          // En mode développement, utiliser un ID de freelance par défaut
          console.log('Mode développement après erreur: utilisation d\'un freelance par défaut');
          freelanceIdentifier = '2fde948c-91d8-4ae7-9a04-77c363680106';
        } else {
          return NextResponse.json(
            { error: 'Service invalide ou inaccessible' },
            { status: 400 }
          );
        }
      }
    }
    
    if (!freelanceIdentifier) {
      return NextResponse.json(
        { error: 'ID du freelance requis pour le paiement' },
        { status: 400 }
      );
    }
    
    // Vérifier les activités suspectes (désactivé en mode développement)
    let suspicious = false;
    if (!isDev) {
      suspicious = await isSuspiciousActivity(userId, 'payment_attempt');
    }
    
    if (suspicious) {
      await logSecurityEvent({
        type: 'security_violation',
        userId,
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: { 
          error: 'Activité de paiement suspecte détectée',
          serviceId,
          amount
        }
      });
      
      return NextResponse.json(
        { error: 'Trop de tentatives de paiement. Veuillez réessayer plus tard.' },
        { status: 429 }
      );
    }
    
    // Journaliser la tentative de création de PaymentIntent
    await logSecurityEvent({
      type: 'payment_attempt',
      userId,
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'medium',
      details: {
        serviceId,
        freelanceId: freelanceIdentifier,
        amount
      }
    });
    
    try {
      // Création d'un intent de paiement via l'API Stripe
      // Vérifier que le montant est bien un nombre entier (Stripe n'accepte pas les décimales)
      const amountInCents = Math.round(parseFloat(amount.toString()));
      if (isNaN(amountInCents) || amountInCents <= 0) {
        throw new Error('Montant invalide');
      }

      // Récupérer les informations de localisation de l'utilisateur
      let userCountry = 'SN'; // Pays par défaut - Sénégal (XOF)
      let userCurrency = 'eur'; // Devise par défaut pour Stripe
      let userData: { country?: string; currency_preference?: string } | null = null;

      try {
        // Récupérer le pays de l'utilisateur depuis son profil
        const { data: userProfileData, error: userError } = await supabase
          .from('profiles')
          .select('country, currency_preference')
          .eq('id', userId)
          .single();

        if (!userError && userProfileData) {
          userData = userProfileData;
          userCountry = userData.country || userCountry;
          
          // Si l'utilisateur a défini une préférence de devise
          if (userData.currency_preference) {
            // Valider si cette devise est adaptée au paiement selon le pays
            const validation = validatePaymentCurrency(userData.currency_preference, userCountry);
            
            // Utiliser la devise recommandée (soit celle de l'utilisateur si valide, soit la locale)
            userCurrency = validation.isValid ? 
              userData.currency_preference.toLowerCase() : 
              validation.recommendedCurrency.toLowerCase();
              
            console.log(`Validation devise: ${validation.isValid ? 'Valide' : 'Invalide'}, devise choisie pour paiement: ${userCurrency}`);
          } else {
            // Pas de préférence définie, utiliser la devise du pays
            userCurrency = detectCurrency(userCountry).toLowerCase();
          }
        }
      } catch (geoError) {
        console.error('Erreur lors de la récupération des informations de géolocalisation:', geoError);
        // En cas d'erreur, conserver la devise par défaut
      }

      // Création du PaymentIntent avec la devise validée
      const paymentIntent = await createPaymentIntent({
        amount: amountInCents,
        currency: userCurrency,
        metadata: {
          clientId: userId,
          freelanceId: freelanceIdentifier,
          serviceId,
          userEmail,
          deliveryTime: metadata.deliveryTime || '7',
          requirements: metadata.requirements || '',
          ...metadata,
          // Ajouter des métadonnées sur la devise et le pays pour traçabilité
          userCountry,
          originalCurrency: userData?.currency_preference || 'none',
          paymentCurrency: userCurrency
        }
      });
      
      // Journalisation de la création du PaymentIntent pour l'audit (optionnel)
      try {
        await logSecurityEvent({
          type: 'payment_intent_created',
          userId,
          ipAddress: clientIp as string,
          userAgent: userAgent as string,
          severity: 'info',
          details: {
            paymentIntentId: paymentIntent.id,
            serviceId,
            freelanceId: freelanceIdentifier,
            amount
          }
        });
      } catch (auditError) {
        console.warn('Échec de la journalisation de l\'événement:', auditError);
      }
      
      // Renvoi des informations nécessaires au client
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (stripeError: any) {
      console.error('Erreur Stripe:', stripeError);
      
      // Journalisation spécifique de l'erreur Stripe (optionnel)
      try {
        await logSecurityEvent({
          type: 'payment_intent_error',
          userId,
          ipAddress: clientIp as string,
          userAgent: userAgent as string,
          severity: 'high',
          details: {
            stripeErrorType: stripeError.type,
            stripeErrorCode: stripeError.code,
            error: stripeError.message,
            serviceId,
            freelanceId: freelanceIdentifier,
            amount
          }
        });
      } catch (auditError) {
        console.warn('Échec de la journalisation de l\'erreur:', auditError);
      }
      
      // Catégorisation des erreurs Stripe pour retourner des messages d'erreur appropriés
      let errorMessage = stripeError.message;
      let statusCode = 400;
      
      if (stripeError.type === 'StripeCardError') {
        errorMessage = `Erreur de carte: ${stripeError.message}`;
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        errorMessage = `Demande invalide: ${stripeError.message}`;
      } else if (stripeError.type === 'StripeAPIError') {
        errorMessage = 'Erreur temporaire du système de paiement. Veuillez réessayer plus tard.';
        statusCode = 503;
      } else if (stripeError.type === 'StripeConnectionError') {
        errorMessage = 'Problème de connexion au système de paiement. Veuillez réessayer plus tard.';
        statusCode = 503;
      } else if (stripeError.type === 'StripeAuthenticationError') {
        // Ne pas exposer les détails d'authentification
        errorMessage = 'Erreur interne du système de paiement.';
        statusCode = 500;
        
        // Enregistrer l'erreur pour investigation administrative
        console.error('Erreur d\'authentification Stripe critique:', stripeError);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
  } catch (error: any) {
    console.error('Erreur générale API payment-intent:', error);
    
    await logSecurityEvent({
      type: 'payment_intent_error', // Type valide pour l'événement de sécurité
      ipAddress: clientIp as string, 
      userAgent: userAgent as string,
      severity: 'high',
      details: {
        endpoint: '/api/stripe/payment-intent',
        error: error.message
      }
    });
    
    return NextResponse.json(
      { error: 'Erreur du serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}