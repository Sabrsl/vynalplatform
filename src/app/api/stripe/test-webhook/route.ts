import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

// Création d'une instance Supabase pour les opérations serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Route de test pour simuler des événements webhook Stripe
 * ATTENTION: Cette route ne doit être accessible qu'en mode développement
 * 
 * POST /api/stripe/test-webhook
 */
export async function POST(req: NextRequest) {
  // ⚠️ SÉCURITÉ: Cette route ne doit être accessible qu'en développement
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    console.error('Tentative d\'accès à l\'API de test webhook en mode production');
    return NextResponse.json(
      { error: 'Cette route n\'est accessible qu\'en mode développement' },
      { status: 403 }
    );
  }
  
  // Vérifier l'origine de la requête pour plus de sécurité
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  
  if (!allowedOrigins.includes(origin)) {
    console.warn(`Tentative d'accès à l'API de test webhook depuis une origine non autorisée: ${origin}`);
    return NextResponse.json(
      { error: 'Origine non autorisée' },
      { status: 403 }
    );
  }
  
  try {
    const body = await req.json();
    const { eventType, data = {} } = body;
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'Type d\'événement requis' },
        { status: 400 }
      );
    }
    
    // Récupérer le webhook URL pour traiter l'événement
    const webhookUrl = `${req.headers.get('origin')}/api/stripe/webhook`;
    
    // Simulation d'un événement selon le type demandé
    let eventData: any;
    
    switch (eventType) {
      case 'payment_intent.succeeded': {
        // Créer un paymentIntent valide dans Stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount: data.amount || 1000,
          currency: 'eur',
          payment_method_types: ['card'],
          metadata: {
            clientId: data.clientId || '0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a',
            freelanceId: data.freelanceId || '2fde948c-91d8-4ae7-9a04-77c363680106',
            serviceId: data.serviceId || 'baa01d07-b860-4423-ac58-5392bae6a9c6',
            deliveryTime: data.deliveryTime || '7'
          },
          confirm: true,
          payment_method: 'pm_card_visa', // Carte de test toujours valide
        });
        
        console.log(`✅ Test PaymentIntent créé: ${paymentIntent.id} avec les métadonnées:`, paymentIntent.metadata);
        
        // Construire l'événement
        eventData = {
          id: `evt_test_${Date.now()}`,
          object: 'event',
          api_version: '2025-04-30.basil',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: paymentIntent
          },
          type: 'payment_intent.succeeded'
        };
        break;
      }
      
      case 'payment_intent.payment_failed': {
        // Créer un paymentIntent qui échoue
        const paymentIntent = await stripe.paymentIntents.create({
          amount: data.amount || 1000,
          currency: 'eur',
          payment_method_types: ['card'],
          metadata: {
            clientId: data.clientId || '0ed321ec-ef9e-48f0-97dd-6c5b5e097c5a',
            freelanceId: data.freelanceId || '2fde948c-91d8-4ae7-9a04-77c363680106',
            serviceId: data.serviceId || 'baa01d07-b860-4423-ac58-5392bae6a9c6'
          }
        });
        
        // Simuler un échec
        paymentIntent.status = 'requires_payment_method';
        paymentIntent.last_payment_error = {
          type: 'card_error',
          code: 'card_declined',
          message: 'Votre carte a été refusée.',
          decline_code: 'generic_decline'
        };
        
        // Construire l'événement
        eventData = {
          id: `evt_test_${Date.now()}`,
          object: 'event',
          api_version: '2025-04-30.basil',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: paymentIntent
          },
          type: 'payment_intent.payment_failed'
        };
        break;
      }
      
      case 'charge.refunded': {
        // Simuler un remboursement
        const charge = {
          id: `ch_test_${Date.now()}`,
          object: 'charge',
          amount: data.amount || 1000,
          amount_refunded: data.amount || 1000,
          payment_intent: data.paymentIntentId || `pi_test_${Date.now()}`,
          refunded: true,
          refunds: {
            object: 'list',
            data: [
              {
                id: `re_test_${Date.now()}`,
                object: 'refund',
                amount: data.amount || 1000,
                reason: data.reason || 'requested_by_customer'
              }
            ],
            has_more: false
          }
        };
        
        // Construire l'événement
        eventData = {
          id: `evt_test_${Date.now()}`,
          object: 'event',
          api_version: '2025-04-30.basil',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: charge
          },
          type: 'charge.refunded'
        };
        break;
      }
      
      default:
        return NextResponse.json(
          { error: `Type d'événement non pris en charge: ${eventType}` },
          { status: 400 }
        );
    }
    
    // Soumettre l'événement simulé au webhook
    console.log(`Envoi d'un événement simulé de type ${eventType} au webhook`);
    
    // Créer un objet de signature pour simuler le webhook Stripe
    // Note: Cette signature ne sera pas validée car nous n'avons pas la clé privée Stripe
    // C'est pourquoi nous devons modifier temporairement la validation dans le gestionnaire
    // lors des tests
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `t=${timestamp},v1=test_signature,v0=test_signature`;
    
    // Préparation de la requête
    const eventBody = JSON.stringify(eventData);
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature,
        'X-Test-Mode': 'true' // Ajouter un en-tête pour identifier les requêtes de test
      },
      body: eventBody
    });
    
    // Vérifier que la requête a bien été reçue
    const webhookResult = await webhookResponse.json();
    console.log(`📊 Résultat du webhook de test:`, JSON.stringify(webhookResult));
    
    // Si le test a réussi, vérifier dans la base de données
    if (webhookResult.received) {
      let dbCheck = {};
      
      // Vérifier les effets dans la base de données selon le type d'événement
      switch (eventType) {
        case 'payment_intent.succeeded': {
          // Vérifier la création de l'ordre et du paiement
          const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
            
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
            
            // Vérifier aussi les transactions
            const { data: transactions } = await supabase
              .from('transactions')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1);
            
            // Vérifier la mise à jour du wallet
            const { data: wallets } = await supabase
              .from('wallets')
              .select('*')
              .eq('user_id', data.freelanceId || '2fde948c-91d8-4ae7-9a04-77c363680106')
              .maybeSingle();
            
            dbCheck = {
              orders: orders?.[0] || null,
              payments: payments?.[0] || null,
              transactions: transactions?.[0] || null,
              wallet: wallets || null,
            };
            break;
        }
        
        case 'payment_intent.payment_failed': {
          // Vérifier si un paiement échoué a été enregistré
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('status', 'failed')
            .order('created_at', { ascending: false })
            .limit(1);
            
          dbCheck = {
            failedPayments: payments?.[0] || null
          };
          break;
        }
        
        case 'charge.refunded': {
          // Vérifier si un remboursement a été enregistré
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('status', 'refunded')
            .order('created_at', { ascending: false })
            .limit(1);
            
          dbCheck = {
            refundedPayments: payments?.[0] || null
          };
          break;
        }
      }
      
      return NextResponse.json({
        success: true,
        event: eventData,
        webhookResult,
        dbCheck
      });
    }
    
    return NextResponse.json({
      success: false,
      event: eventData,
      webhookResult
    });
    
  } catch (error: any) {
    console.error('Erreur lors du test du webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 