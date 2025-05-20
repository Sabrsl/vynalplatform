import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { logSecurityEvent } from '@/lib/security/audit';
import { cookies } from 'next/headers';
import { validatePaymentCurrency, detectCurrency } from '@/lib/utils/currency-updater';

/**
 * API pour créer un PaymentIntent Stripe avec authentification RLS
 * 
 * Route: POST /api/stripe/payment-intent
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
    
    // Utilisation de createRouteHandlerClient pour accéder à Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Vérification de la session utilisateur (la sécurité est gérée par RLS)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Variables pour l'utilisateur
    let userId: string = session?.user?.id || '';
    let userEmail: string = session?.user?.email || '';
    
    // Si aucune session valide n'est trouvée, retourner une erreur 401
    if (!session?.user) {
      // Enregistrer l'événement de sécurité
      await logSecurityEvent({
        type: 'security_violation',
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: { 
          error: 'Tentative de création de paiement sans authentification',
          endpoint: '/api/stripe/payment-intent'
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
    
    // Rechercher le freelanceId si non fourni, en utilisant RLS
    let freelanceIdentifier = freelanceId;
    if (!freelanceIdentifier) {
      try {
        // Récupérer le freelance ID à partir du service via RLS
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('freelance_id')
          .eq('id', serviceId)
          .single();
        
        if (!serviceError && serviceData) {
          freelanceIdentifier = serviceData.freelance_id;
        } else if (isDev) {
          // En développement uniquement, utiliser un ID par défaut
          freelanceIdentifier = '2fde948c-91d8-4ae7-9a04-77c363680106';
        } else {
          throw new Error('Service non trouvé ou inaccessible');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Service invalide ou inaccessible' },
          { status: 400 }
        );
      }
    }
    
    if (!freelanceIdentifier) {
      return NextResponse.json(
        { error: 'ID du freelance requis pour le paiement' },
        { status: 400 }
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
      // Obtenir l'ID de commande en utilisant le serviceId
      // Si pas de commande, on en crée une
      let orderId;
      
      // Vérifier si une commande existe déjà pour ce service et ce client
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('service_id', serviceId)
        .eq('client_id', userId)
        .eq('status', 'pending')
        .single();
      
      if (existingOrder) {
        orderId = existingOrder.id;
      } else {
        // Créer une commande si nécessaire
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            client_id: userId,
            freelance_id: freelanceIdentifier,
            service_id: serviceId,
            status: 'pending',
            requirements: metadata.requirements || '',
            delivery_time: metadata.deliveryTime || 7
          })
          .select('id')
          .single();
        
        if (orderError) {
          console.error('Erreur lors de la création de la commande:', orderError);
          throw new Error('Erreur lors de la création de la commande');
        }
        
        orderId = newOrder?.id;
      }
      
      if (!orderId) {
        throw new Error('Impossible de créer ou récupérer la commande');
      }
      
      // Récupérer les informations de l'utilisateur pour la devise
      let userCurrency = 'eur'; // Devise par défaut
      
      const { data: userProfileData } = await supabase
        .from('profiles')
        .select('country, currency_preference')
        .eq('id', userId)
        .single();
      
      if (userProfileData) {
        const userCountry = userProfileData.country || 'SN';
        
        // Gérer la préférence de devise
        if (userProfileData.currency_preference) {
          const validation = validatePaymentCurrency(userProfileData.currency_preference, userCountry);
          userCurrency = validation.isValid ? 
            userProfileData.currency_preference.toLowerCase() : 
            validation.recommendedCurrency.toLowerCase();
        } else {
          userCurrency = detectCurrency(userCountry).toLowerCase();
        }
      }
      
      // Création du PaymentIntent via l'API Stripe
      const paymentIntent = await createPaymentIntent({
        amount: Math.round(parseFloat(amount.toString())),
        currency: userCurrency,
        metadata: {
          clientId: userId,
          freelanceId: freelanceIdentifier,
          serviceId,
          orderId,
          userEmail,
          ...metadata
        }
      });
      
      // Insérer l'entrée dans la table payments (protégée par RLS)
      const { error: dbError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          client_id: userId,
          freelance_id: freelanceIdentifier,
          amount: parseFloat(amount) / 100,  // Convertir les centimes en unités pour le stockage
          status: 'pending',
          payment_method: 'stripe',
          payment_intent_id: paymentIntent.id
        });
      
      if (dbError) {
        console.error('Erreur lors de l\'enregistrement du paiement:', dbError);
        throw new Error('Erreur lors de l\'enregistrement du paiement');
      }
      
      // Retourner les informations du PaymentIntent
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId
      });
    } catch (error: any) {
      console.error('Erreur lors de la création du PaymentIntent:', error);
      
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la création du paiement' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Exception non gérée:', error);
    
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue' },
      { status: 500 }
    );
  }
}