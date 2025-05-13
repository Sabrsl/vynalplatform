import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logSecurityEvent } from '@/lib/security/audit';

/**
 * API pour créer une commande PayPal
 * 
 * Route: POST /api/paypal/create-order
 * Cette API requiert une authentification
 */
export async function POST(req: NextRequest) {
  // Récupérer les informations sur le client
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Récupération et validation du corps de la requête
    const body = await req.json();
    
    console.log('API paypal/create-order - Corps de la requête:', JSON.stringify(body));
    
    // Validation des données requises
    if (!body.amount || !body.serviceId) {
      return NextResponse.json(
        { error: 'Données incomplètes. Montant et ID du service requis.' },
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
          error: 'Tentative de création de commande PayPal sans authentification',
          endpoint: '/api/paypal/create-order',
          amount: body.amount,
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
    const { amount, serviceId, email = userEmail, metadata = {} } = body;
    
    // Vérification du montant (doit être un nombre positif)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'ID du service existe
    let serviceData;
    try {
      console.log(`Recherche du service ${serviceId}`);
      const { data, error } = await supabase
        .from('services')
        .select('title, price, freelance_id')
        .eq('id', serviceId)
        .single();
        
      if (error) {
        console.error('Erreur recherche service:', error);
        
        if (isDev && bypassAuth) {
          // En mode développement avec bypass, utiliser des données factices
          serviceData = {
            title: 'Service de test',
            price: amount,
            freelance_id: '2fde948c-91d8-4ae7-9a04-77c363680106'
          };
        } else {
          throw new Error(error?.message || 'Service non trouvé');
        }
      } else {
        serviceData = data;
      }
    } catch (error: any) {
      console.error('Erreur récupération service:', error);
      
      if (isDev && bypassAuth) {
        // En mode développement avec bypass, utiliser des données factices
        serviceData = {
          title: 'Service de test',
          price: amount,
          freelance_id: '2fde948c-91d8-4ae7-9a04-77c363680106'
        };
      } else {
        return NextResponse.json(
          { error: 'Service invalide ou inaccessible' },
          { status: 400 }
        );
      }
    }
    
    // Journaliser la tentative de création de commande
    await logSecurityEvent({
      type: 'paypal_order_attempt',
      userId,
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'medium',
      details: {
        serviceId,
        amount
      }
    });
    
    try {
      // Création d'une commande PayPal
      // Convertir le montant en format approprié (s'assurer qu'il s'agit d'un nombre à deux décimales)
      const amountValue = parseFloat(amount.toString()).toFixed(2);
      if (isNaN(parseFloat(amountValue)) || parseFloat(amountValue) <= 0) {
        throw new Error('Montant invalide');
      }

      // Créer la commande PayPal
      const order = await createPayPalOrder({
        amount: parseFloat(amountValue),
        itemName: serviceData.title || 'Service sur Vynal Platform',
        description: `Paiement pour ${serviceData.title || 'un service'} sur Vynal Platform`,
        userEmail: email,
        metadata: {
          clientId: userId,
          freelanceId: serviceData.freelance_id,
          serviceId,
          ...metadata
        }
      });
      
      // Journalisation de la création de la commande pour l'audit
      try {
        await logSecurityEvent({
          type: 'paypal_order_created',
          userId,
          ipAddress: clientIp as string,
          userAgent: userAgent as string,
          severity: 'info',
          details: {
            orderId: order.id,
            serviceId,
            amount
          }
        });
      } catch (auditError) {
        console.warn('Échec de la journalisation de l\'événement:', auditError);
      }
      
      // Renvoi des informations nécessaires au client
      return NextResponse.json({
        orderId: order.id,
        status: order.status
      });
    } catch (paypalError: any) {
      console.error('Erreur PayPal:', paypalError);
      
      // Journalisation de l'erreur PayPal
      try {
        await logSecurityEvent({
          type: 'paypal_order_error',
          userId,
          ipAddress: clientIp as string,
          userAgent: userAgent as string,
          severity: 'high',
          details: {
            error: paypalError.message,
            serviceId,
            amount
          }
        });
      } catch (auditError) {
        console.warn('Échec de la journalisation de l\'erreur:', auditError);
      }
      
      return NextResponse.json(
        { error: paypalError.message || 'Erreur lors de la création de la commande PayPal' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur API paypal/create-order:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erreur serveur interne' },
      { status: 500 }
    );
  }
} 