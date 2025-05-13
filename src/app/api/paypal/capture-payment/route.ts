import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalPayment, verifyPayPalTransaction } from '@/lib/paypal/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logSecurityEvent } from '@/lib/security/audit';

/**
 * API pour capturer un paiement PayPal
 * 
 * Route: POST /api/paypal/capture-payment
 * Cette API requiert une authentification
 */
export async function POST(req: NextRequest) {
  // Récupérer les informations sur le client
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Récupération et validation du corps de la requête
    const body = await req.json();
    
    console.log('API paypal/capture-payment - Corps de la requête:', JSON.stringify(body));
    
    // Validation des données requises
    if (!body.orderId || !body.serviceId) {
      return NextResponse.json(
        { error: 'Données incomplètes. ID de commande et ID du service requis.' },
        { status: 400 }
      );
    }
    
    // Vérification de l'authentification avec Supabase
    const supabase = createClientComponentClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Bypass d'authentification en développement si activé
    const isDev = process.env.NODE_ENV === 'development';
    const bypassAuth = isDev && body.bypassAuth === true;
    
    // Variables pour l'utilisateur (soit authentifié, soit en bypass temporaire)
    let userId: string = session?.user?.id || '';
    let userEmail: string = session?.user?.email || '';
    
    // Rejet si l'utilisateur n'est pas authentifié, sauf en mode bypass dev
    if (!session?.user && !bypassAuth) {
      await logSecurityEvent({
        type: 'security_violation',
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: { 
          error: 'Tentative de capture de paiement PayPal sans authentification',
          endpoint: '/api/paypal/capture-payment',
          orderId: body.orderId,
          serviceId: body.serviceId
        }
      });
      
      return NextResponse.json(
        { error: 'Non autorisé. Authentification requise.' },
        { status: 401 }
      );
    }
    
    // Si bypass dev, utiliser un ID temporaire
    if (bypassAuth) {
      userId = 'dev-test-user';
      userEmail = 'dev@example.com';
      console.warn('⚠️ Mode développement: Bypass d\'authentification utilisé pour tester PayPal');
    }
    
    // Extraction des informations nécessaires
    const { orderId, serviceId } = body;
    
    // Journaliser la tentative de capture de paiement
    await logSecurityEvent({
      type: 'payment_attempt',
      userId,
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'medium',
      details: {
        serviceId,
        orderId,
        paymentMethod: 'paypal'
      }
    });
    
    try {
      // Vérifier d'abord l'état de la commande
      const orderDetails = await verifyPayPalTransaction(orderId);
      
      // Vérifier si la commande est dans un état qui peut être capturé
      if (orderDetails.status !== 'APPROVED' && orderDetails.status !== 'CREATED') {
        return NextResponse.json(
          { error: `La commande est dans un état qui ne peut pas être capturé: ${orderDetails.status}` },
          { status: 400 }
        );
      }
      
      // Capturer le paiement PayPal
      const captureResult = await capturePayPalPayment(orderId);
      
      // Vérifier le résultat de la capture
      if (captureResult.status !== 'COMPLETED') {
        throw new Error(`La capture a échoué, statut: ${captureResult.status}`);
      }
      
      // Enregistrer la commande dans la base de données
      // En supposant que nous avons une table orders dans Supabase
      try {
        const { error: dbError } = await supabase
          .from('orders')
          .insert({
            service_id: serviceId,
            client_id: userId,
            payment_method: 'paypal',
            payment_id: orderId,
            payment_details: captureResult,
            status: 'paid',
            amount: captureResult.purchase_units[0]?.payments?.captures[0]?.amount?.value || 0,
            created_at: new Date().toISOString()
          });
          
        if (dbError) {
          console.error('Erreur lors de l\'enregistrement de la commande:', dbError);
          // On continue même s'il y a une erreur d'enregistrement, car le paiement a réussi
        }
      } catch (dbError) {
        console.error('Exception lors de l\'enregistrement de la commande:', dbError);
        // On continue quand même car le paiement a réussi
      }
      
      // Journalisation du succès du paiement pour l'audit
      await logSecurityEvent({
        type: 'paypal_order_success',
        userId,
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'info',
        details: {
          orderId,
          serviceId,
          amount: captureResult.purchase_units[0]?.payments?.captures[0]?.amount?.value
        }
      });
      
      // Renvoi des informations nécessaires au client
      return NextResponse.json({
        success: true,
        orderId: orderId,
        transactionId: captureResult.purchase_units[0]?.payments?.captures[0]?.id,
        status: captureResult.status
      });
    } catch (paypalError: any) {
      console.error('Erreur PayPal:', paypalError);
      
      // Journalisation de l'erreur PayPal
      await logSecurityEvent({
        type: 'paypal_order_failure',
        userId,
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: {
          error: paypalError.message,
          orderId,
          serviceId
        }
      });
      
      return NextResponse.json(
        { error: paypalError.message || 'Erreur lors de la capture du paiement PayPal' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur API paypal/capture-payment:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erreur serveur interne' },
      { status: 500 }
    );
  }
} 