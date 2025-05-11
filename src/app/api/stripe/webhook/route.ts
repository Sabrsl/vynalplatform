import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { logSecurityEvent } from '@/lib/security/audit';
import { createClient } from '@supabase/supabase-js';

// Création d'une instance Supabase pour les opérations serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERREUR CRITIQUE: Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface pour les données de paiement
interface PaymentData {
  id: string;
  client_id: string;
  freelance_id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: string;
}

// Interface pour les données de commande
interface OrderData {
  id: string;
  client_id: string;
  freelance_id: string;
  service_id: string;
  status: string;
  price: number;
  delivery_time: number;
  requirements: string | null;
  order_number: string;
}

// Interface pour les données de transaction
interface TransactionData {
  wallet_id: string;
  amount: number;
  type: string;
  description: string;
  reference_id?: string;
  client_id?: string;
  freelance_id?: string;
  service_id?: string;
  order_id?: string;
  status: string;
}

// Génère un numéro de commande unique
function generateOrderNumber(): string {
  const prefix = 'VNL';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Gestionnaire de webhooks Stripe
 * 
 * Route: POST /api/stripe/webhook
 * Cette route écoute les événements envoyés par Stripe
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  
  // Récupérer les informations sur le client
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Vérifier si c'est une requête de test (pour le développement uniquement)
  const isTestMode = req.headers.get('x-test-mode') === 'true';
  const isDev = process.env.NODE_ENV === 'development';
  
  // Pour le monitoring
  const startTime = Date.now();
  console.log(`🔔 Webhook Stripe reçu - IP: ${clientIp} - UA: ${userAgent} - Signature: ${signature ? 'présente' : 'absente'}`);
  
  // Si c'est un test en mode développement, nous utilisons un traitement spécial
  let event;
  
  if (isTestMode && isDev) {
    try {
      // Pour les tests, nous parsons simplement le corps JSON sans vérifier la signature
      event = JSON.parse(body);
      console.log('Mode test détecté, traitement de la requête sans validation de signature');
    } catch (error) {
      console.error('Erreur lors du parsing du webhook de test:', error);
      return NextResponse.json({ error: 'Format de webhook invalide' }, { status: 400 });
    }
  } else {
    // Rejet en l'absence de signature Stripe pour les requêtes normales
    if (!signature) {
      await logSecurityEvent({
        type: 'stripe_webhook_invalid_signature',
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: { 
          error: 'Signature manquante',
          headers: Object.fromEntries(req.headers)
        }
      });
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
    }
    
    // Récupération de la clé secrète du webhook depuis les variables d'environnement
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Vérification de la présence de la clé secrète
    if (!endpointSecret) {
      console.error('ERREUR CRITIQUE: Clé secrète de webhook Stripe manquante');
      return NextResponse.json({ error: 'Configuration du webhook incorrecte' }, { status: 500 });
    }
  
    try {
      // Vérification de la signature pour s'assurer que l'événement vient bien de Stripe
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      // Journalisation de l'erreur d'authentification pour l'audit
      await logSecurityEvent({
        type: 'stripe_webhook_invalid_signature',
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'high',
        details: { error: err.message }
      });
      return NextResponse.json({ error: `Signature webhook: ${err.message}` }, { status: 400 });
    }
  }
  
  // Traitement des différents événements
  try {
    console.log(`Événement Stripe reçu: ${event.type} | ID: ${event.id}`);
    
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`💰 Paiement réussi - ID: ${paymentIntent.id}, Montant: ${paymentIntent.amount / 100}€`);
        
        // Extraction des métadonnées
        const { clientId, freelanceId, serviceId, deliveryTime = 7 } = paymentIntent.metadata || {};
        
        console.log(`Métadonnées du paiement: `, JSON.stringify(paymentIntent.metadata));
        
        if (!clientId || !freelanceId || !serviceId) {
          console.error('❌ Métadonnées manquantes dans le payment intent', paymentIntent.metadata);
          return NextResponse.json({ 
            error: 'Métadonnées incomplètes', 
            received: true 
          });
        }
        
        // Vérifier si ce paiement a déjà été traité
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id, order_id')
          .eq('payment_intent_id', paymentIntent.id)
          .maybeSingle();
          
        if (existingPayment) {
          console.log(`✅ Paiement ${paymentIntent.id} déjà traité, id: ${existingPayment.id}, commande: ${existingPayment.order_id}`);
          return NextResponse.json({ 
            message: 'Ce paiement a déjà été traité',
            paymentId: existingPayment.id,
            orderId: existingPayment.order_id,
            alreadyProcessed: true,
            received: true
          });
        }
        
        try {
          // En mode test, vérifier d'abord si les UUIDs sont valides
          if (isTestMode && isDev) {
            // Vérifier si le client existe
            const { data: clientData, error: clientError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', clientId)
              .single();
              
            if (clientError) {
              console.warn(`Client ID ${clientId} non trouvé, création d'un client de test`);
              
              // Créer un client de test si nécessaire
              const { error: createClientError } = await supabase
                .from('profiles')
                .insert({
                  id: clientId,
                  role: 'client',
                  full_name: 'Client Test',
                  is_active: true
                });
                
              if (createClientError) {
                console.error('Erreur lors de la création du client de test:', createClientError);
                throw new Error(`Erreur création client: ${createClientError.message}`);
              }
            }
            
            // Vérifier si le freelance existe
            const { data: freelanceData, error: freelanceError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', freelanceId)
              .single();
              
            if (freelanceError) {
              console.warn(`Freelance ID ${freelanceId} non trouvé, création d'un freelance de test`);
              
              // Créer un freelance de test si nécessaire
              const { error: createFreelanceError } = await supabase
                .from('profiles')
                .insert({
                  id: freelanceId,
                  role: 'freelance',
                  full_name: 'Freelance Test',
                  is_active: true
                });
                
              if (createFreelanceError) {
                console.error('Erreur lors de la création du freelance de test:', createFreelanceError);
                throw new Error(`Erreur création freelance: ${createFreelanceError.message}`);
              }
              
              // Créer un wallet pour le freelance de test
              const { error: createWalletError } = await supabase
                .from('wallets')
                .insert({
                  profile_id: freelanceId,
                  balance: 0,
                  currency: 'XOF',
                  currency_symbol: 'FCFA'
                });
                
              if (createWalletError) {
                console.error('Erreur lors de la création du wallet de test:', createWalletError);
                throw new Error(`Erreur création wallet: ${createWalletError.message}`);
              }
            }
            
            // Vérifier si le service existe
            const { data: serviceData, error: serviceError } = await supabase
              .from('services')
              .select('id')
              .eq('id', serviceId)
              .single();
              
            if (serviceError) {
              console.warn(`Service ID ${serviceId} non trouvé, création d'un service de test`);
              
              // Créer un service de test si nécessaire
              const { error: createServiceError } = await supabase
                .from('services')
                .insert({
                  id: serviceId,
                  freelance_id: freelanceId,
                  title: 'Service Test',
                  price: paymentIntent.amount / 100,
                  delivery_time: parseInt(deliveryTime as string) || 7,
                  status: 'active'
                });
                
              if (createServiceError) {
                console.error('Erreur lors de la création du service de test:', createServiceError);
                throw new Error(`Erreur création service: ${createServiceError.message}`);
              }
            }
          }

          // Création de la commande
          const orderNumber = generateOrderNumber();
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
              client_id: clientId,
              freelance_id: freelanceId,
              service_id: serviceId,
              status: 'pending',
              price: paymentIntent.amount / 100, // Conversion des centimes en euros
              delivery_time: parseInt(deliveryTime as string) || 7,
              order_number: orderNumber
            })
            .select();
            
          if (orderError) {
            console.error('Erreur lors de la création de la commande:', orderError);
            throw new Error(`Erreur création commande: ${orderError.message}`);
          }
          
          // Récupération de l'ID de la commande créée
          let orderId = null;
          if (orderData && Array.isArray(orderData) && orderData.length > 0) {
            orderId = orderData[0].id;
          } else {
            throw new Error("Impossible de récupérer l'ID de la commande créée");
          }
          
          // Enregistrement du paiement avec l'ID de commande
          let paymentDataObj: any = {
            client_id: clientId,
            freelance_id: freelanceId,
            order_id: orderId,
            amount: paymentIntent.amount / 100, // Conversion des centimes en euros
            status: 'paid',
            payment_method: 'card'
          };
          
          // Tenter d'ajouter payment_intent_id s'il est supporté
          try {
            paymentDataObj.payment_intent_id = paymentIntent.id;
            console.log(`💾 Ajout du payment_intent_id au paiement: ${paymentIntent.id}`);
          } catch (paymentIdError) {
            console.warn('⚠️ Impossible d\'ajouter payment_intent_id:', paymentIdError);
          }
          
          console.log(`💾 Enregistrement du paiement dans la BDD: ${JSON.stringify(paymentDataObj)}`);
          
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .insert(paymentDataObj)
            .select();
            
          if (paymentError) {
            console.error('Erreur détaillée lors de l\'enregistrement du paiement:', {
              error: paymentError,
              code: paymentError.code,
              details: paymentError.details,
              hint: paymentError.hint,
              message: paymentError.message
            });
            throw new Error(`Erreur base de données: ${paymentError.message}`);
          }
          
          // Récupérer le wallet du freelance
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('id, balance, pending_balance, total_earnings')
            .eq('user_id', freelanceId)
            .single();
            
          if (walletError) {
            console.error('❌ Erreur lors de la récupération du wallet:', walletError);
            
            // Si le wallet n'existe pas, on le crée
            if (walletError.code === 'PGRST116') {
              console.log(`Wallet non trouvé pour ${freelanceId}, création d'un nouveau wallet`);
              
              const { data: newWallet, error: createWalletError } = await supabase
                .from('wallets')
                .insert({
                  user_id: freelanceId,
                  balance: 0,
                  pending_balance: 0,
                  total_earnings: 0
                })
                .select('id')
                .single();
                
              if (createWalletError) {
                console.error('❌ Erreur lors de la création du wallet:', createWalletError);
                throw new Error(`Erreur création wallet: ${createWalletError.message}`);
              }
              
              // Utiliser le nouveau wallet pour la transaction
              if (newWallet) {
                // Utiliser le montant brut sans commission
                const amount = paymentIntent.amount / 100;
                
                // Enregistrer la transaction
                await createTransaction(newWallet.id, freelanceId, clientId, serviceId, orderId, orderNumber, amount);
                
                // Mettre à jour le wallet
                await updateWalletBalance(newWallet.id, amount, amount);
              }
            }
          } else if (walletData) {
            // Utiliser le montant brut sans commission
            const amount = paymentIntent.amount / 100;
            
            // Enregistrer la transaction
            await createTransaction(walletData.id, freelanceId, clientId, serviceId, orderId, orderNumber, amount);
            
            // Mettre à jour le wallet avec le nouveau solde et les gains totaux
            const newPendingBalance = Number(walletData.pending_balance || 0) + amount;
            const newTotalEarnings = Number(walletData.total_earnings || 0) + amount;
            
            await updateWalletBalance(walletData.id, newPendingBalance, newTotalEarnings);
          }
          
          // Mise à jour du wallet du client (déduire le montant payé)
          try {
            // Vérifier si le client a un wallet
            const { data: clientWallet, error: clientWalletError } = await supabase
              .from('wallets')
              .select('id, balance, pending_balance')
              .eq('user_id', clientId)
              .single();
            
            if (clientWalletError) {
              if (clientWalletError.code === 'PGRST116') {
                console.log(`Wallet non trouvé pour le client ${clientId}, création d'un nouveau wallet`);
                
                // Créer un wallet pour le client
                const { data: newClientWallet, error: createClientWalletError } = await supabase
                  .from('wallets')
                  .insert({
                    user_id: clientId,
                    balance: 0,
                    pending_balance: 0,
                    total_earnings: 0
                  })
                  .select('id')
                  .single();
                  
                if (createClientWalletError) {
                  console.error('❌ Erreur lors de la création du wallet client:', createClientWalletError);
                } else if (newClientWallet) {
                  // Créer une transaction pour le paiement
                  const { error: clientTransactionError } = await supabase
                    .from('transactions')
                    .insert({
                      wallet_id: newClientWallet.id,
                      amount: -(paymentIntent.amount / 100), // Montant négatif pour indiquer un paiement
                      type: 'payment',
                      description: `Paiement pour la commande ${orderNumber}`,
                      reference_id: orderId,
                      client_id: clientId,
                      freelance_id: freelanceId,
                      service_id: serviceId,
                      order_id: orderId,
                      status: 'completed',
                      completed_at: new Date().toISOString(),
                      currency: 'XOF',
                      currency_symbol: 'FCFA'
                    });
                    
                  if (clientTransactionError) {
                    console.error('❌ Erreur lors de l\'enregistrement de la transaction client:', clientTransactionError);
                  } else {
                    console.log('💸 Transaction client enregistrée avec succès');
                  }
                }
              } else {
                console.error('❌ Erreur lors de la récupération du wallet client:', clientWalletError);
              }
            } else if (clientWallet) {
              // Créer une transaction pour le paiement
              const { error: clientTransactionError } = await supabase
                .from('transactions')
                .insert({
                  wallet_id: clientWallet.id,
                  amount: -(paymentIntent.amount / 100), // Montant négatif pour indiquer un paiement
                  type: 'payment',
                  description: `Paiement pour la commande ${orderNumber}`,
                  reference_id: orderId,
                  client_id: clientId,
                  freelance_id: freelanceId,
                  service_id: serviceId,
                  order_id: orderId,
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  currency: 'XOF',
                  currency_symbol: 'FCFA'
                });
                
              if (clientTransactionError) {
                console.error('❌ Erreur lors de l\'enregistrement de la transaction client:', clientTransactionError);
              } else {
                // Mettre à jour le solde du wallet du client
                const newClientBalance = Math.max(0, Number(clientWallet.balance || 0) - (paymentIntent.amount / 100));
                
                const { error: updateClientWalletError } = await supabase
                  .from('wallets')
                  .update({
                    balance: newClientBalance,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', clientWallet.id);
                  
                if (updateClientWalletError) {
                  console.error('❌ Erreur lors de la mise à jour du wallet client:', updateClientWalletError);
                } else {
                  console.log(`💰 Wallet client mis à jour: nouveau solde=${newClientBalance}`);
                }
              }
            }
          } catch (clientError) {
            console.error('❌ Exception lors du traitement du wallet client:', clientError);
          }
          
          // Journalisation du paiement réussi pour l'audit (optionnel, peut échouer)
          try {
            await logSecurityEvent({
              type: 'payment_success',
              userId: clientId,
              ipAddress: clientIp as string,
              userAgent: userAgent as string,
              severity: 'info',
              details: {
                paymentIntentId: paymentIntent.id,
                serviceId,
                orderId,
                orderNumber,
                amount: paymentIntent.amount / 100
              }
            });
          } catch (auditError) {
            console.warn('Échec de la journalisation de l\'événement:', auditError);
          }
          
          // Confirmer la réussite avec des détails
          console.log('💲 Paiement enregistré avec succès:', {
            clientId,
            freelanceId,
            orderId,
            amount: paymentIntent.amount / 100,
            orderNumber,
            paymentId: paymentData?.[0]?.id || 'non disponible'
          });
          
        } catch (processError: any) {
          console.error('❌ Erreur lors du traitement du paiement réussi:', processError);
          
          // Journalisation de l'erreur
          await logSecurityEvent({
            type: 'stripe_webhook_processing_error',
            userId: clientId,
            ipAddress: clientIp as string,
            userAgent: userAgent as string,
            severity: 'high',
            details: { 
              error: processError.message,
              paymentIntentId: paymentIntent.id
            }
          });
          
          // Informer Stripe de l'erreur pour qu'il réessaie plus tard
          return NextResponse.json(
            { error: processError.message }, 
            { status: 500 }
          );
        }
        
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const { clientId, freelanceId, serviceId } = paymentIntent.metadata || {};
        
        // Si une commande a déjà été créée pour ce paiement, la mettre à jour
        if (paymentIntent.metadata?.orderId) {
          await handleOrderCancellation(paymentIntent.metadata.orderId, paymentIntent.id);
        } else {
          // Rechercher un paiement associé à ce payment intent
          const { data: existingPayment, error: searchError } = await supabase
            .from('payments')
            .select('id, order_id')
            .eq('payment_intent_id', paymentIntent.id)
            .single();
            
          if (!searchError && existingPayment) {
            await handleOrderCancellation(existingPayment.order_id, paymentIntent.id);
          }
        }
        
        // Journalisation de l'échec du paiement pour l'audit (optionnel, peut échouer)
        try {
          await logSecurityEvent({
            type: 'payment_failure',
            userId: clientId || 'unknown',
            ipAddress: clientIp as string,
            userAgent: userAgent as string,
            severity: 'medium',
            details: {
              paymentIntentId: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message || 'Raison inconnue',
              errorCode: paymentIntent.last_payment_error?.code,
              errorType: paymentIntent.last_payment_error?.type,
              declineCode: paymentIntent.last_payment_error?.decline_code
            }
          });
        } catch (auditError) {
          console.warn('Échec de la journalisation de l\'événement d\'échec:', auditError);
        }
        
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        
        // Trouver le payment_intent associé en utilisant le payment_intent_id
        const { data: payments, error: paymentQueryError } = await supabase
          .from('payments')
          .select('id, order_id, client_id, freelance_id')
          .eq('payment_intent_id', paymentIntentId)
          .eq('status', 'paid')
          .single();
          
        if (paymentQueryError) {
          console.error('Erreur lors de la recherche du paiement pour remboursement:', paymentQueryError);
        } else if (payments) {
          const paymentData = payments;
          await handleOrderCancellation(paymentData.order_id, paymentIntentId);
        }
        
        break;
      }
      
      // Autres événements que vous pourriez vouloir gérer
      case 'checkout.session.completed':
        // Gestion des sessions de checkout complétées si vous utilisez Checkout
        console.log(`Événement Stripe Checkout complété: ${event.id}`);
        break;
        
      default:
        // Événement non traité
        console.log(`Événement Stripe non traité: ${event.type} | ID: ${event.id}`);
    }
    
    // Confirmation de la réception de l'événement
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('❌ Erreur traitement webhook Stripe:', error);
    
    // Calculer le temps d'exécution pour les statistiques
    const executionTime = Date.now() - startTime;
    console.log(`⏱️ Temps d'exécution du webhook: ${executionTime}ms (échec)`);
    
    // Journalisation de l'erreur pour l'audit
    await logSecurityEvent({
      type: 'stripe_webhook_processing_error',
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'high',
      details: { error: error.message, eventType: event?.type, eventId: event?.id }
    });
    
    // Renvoi d'une réponse d'erreur
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    );
  }
}

/**
 * Fonction utilitaire pour créer une transaction
 */
async function createTransaction(
  walletId: string,
  freelanceId: string,
  clientId: string,
  serviceId: string,
  orderId: string,
  orderNumber: string,
  amount: number
) {
  try {
    console.log(`📝 Tentative d'enregistrement d'une transaction - wallet_id: ${walletId}, amount: ${amount}, order_id: ${orderId}`);
    
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletId,
        amount: amount,
        type: 'earning',
        description: `Paiement pour la commande ${orderNumber}`,
        reference_id: orderId,
        client_id: clientId,
        freelance_id: freelanceId,
        service_id: serviceId,
        order_id: orderId,
        status: 'pending', // Statut initial en pending jusqu'à l'acceptation de la livraison
        completed_at: null, // Sera mis à jour lors de l'acceptation de la livraison
        currency: 'XOF',
        currency_symbol: 'FCFA'
      })
      .select();
      
    if (transactionError) {
      console.error('❌ Erreur lors de l\'enregistrement de la transaction:', transactionError);
      throw new Error(`Erreur transaction: ${transactionError.message}`);
    }
    
    console.log('💸 Transaction enregistrée avec succès', transactionData);
    return true;
  } catch (error: any) {
    console.error('❌ Exception lors de la création de la transaction:', error);
    return false;
  }
}

/**
 * Fonction utilitaire pour mettre à jour le solde du wallet
 */
async function updateWalletBalance(walletId: string, newPendingAmount: number, newTotalEarnings: number) {
  try {
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        pending_balance: newPendingAmount, // Utiliser pending_balance au lieu de balance
        total_earnings: newTotalEarnings,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId);
      
    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du wallet:', updateError);
      throw new Error(`Erreur mise à jour wallet: ${updateError.message}`);
    }
    
    console.log(`💰 Wallet mis à jour avec succès: pending_balance=${newPendingAmount}, gains=${newTotalEarnings}`);
    return true;
  } catch (error: any) {
    console.error('❌ Exception lors de la mise à jour du wallet:', error);
    return false;
  }
}

/**
 * Fonction utilitaire pour créer une transaction de remboursement et mettre à jour le wallet
 */
async function handleOrderCancellation(orderId: string, paymentIntentId: string) {
  try {
    console.log(`🔄 Traitement de l'annulation pour orderId: ${orderId}, paymentIntentId: ${paymentIntentId}`);
    
    // 1. Récupérer les détails de la commande et du paiement
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, price, order_number, freelance_id, client_id, service_id')
      .eq('id', orderId)
      .single();
      
    if (orderError) {
      console.error('❌ Erreur lors de la récupération des détails de la commande:', orderError);
      return false;
    }
    
    // 2. Vérifier si une transaction a déjà été créée pour cette commande
    const { data: transactions, error: transactionQueryError } = await supabase
      .from('transactions')
      .select('id, amount, wallet_id, status')
      .eq('order_id', orderId)
      .eq('type', 'earning');
      
    if (transactionQueryError) {
      console.error('❌ Erreur lors de la vérification des transactions existantes:', transactionQueryError);
      return false;
    }
    
    // Si aucune transaction n'a été trouvée, rien à annuler
    if (!transactions || transactions.length === 0) {
      console.log(`ℹ️ Aucune transaction à annuler pour la commande ${orderId}`);
      return true;
    }
    
    // 3. Récupérer le wallet associé à chaque transaction
    for (const transaction of transactions) {
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance, pending_balance, total_earnings')
        .eq('id', transaction.wallet_id)
        .single();
        
      if (walletError) {
        console.error(`❌ Erreur lors de la récupération du wallet ${transaction.wallet_id}:`, walletError);
        continue;
      }
      
      if (walletData) {
        // 4. Créer une transaction de remboursement
        const { error: refundTransactionError } = await supabase
          .from('transactions')
          .insert({
            wallet_id: transaction.wallet_id,
            amount: -transaction.amount, // Montant négatif pour indiquer un remboursement
            type: 'refund',
            description: `Remboursement pour la commande ${orderData.order_number}`,
            reference_id: orderId,
            client_id: orderData.client_id,
            freelance_id: orderData.freelance_id,
            service_id: orderData.service_id,
            order_id: orderId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            currency: 'XOF',
            currency_symbol: 'FCFA'
          });
          
        if (refundTransactionError) {
          console.error('❌ Erreur lors de l\'enregistrement de la transaction de remboursement:', refundTransactionError);
          continue;
        }
        
        // 5. Déterminer quel solde mettre à jour en fonction du statut de la transaction
        const isCompletedTransaction = transaction.status === 'completed';
        
        // Pour les transactions terminées, ajuster le solde principal, sinon ajuster le solde en attente
        let newBalance = Number(walletData.balance || 0);
        let newPendingBalance = Number(walletData.pending_balance || 0);
        const newTotalEarnings = Math.max(0, Number(walletData.total_earnings || 0) - transaction.amount);
        
        if (isCompletedTransaction) {
          newBalance = Math.max(0, newBalance - transaction.amount);
        } else {
          newPendingBalance = Math.max(0, newPendingBalance - transaction.amount);
        }
        
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({ 
            balance: newBalance,
            pending_balance: newPendingBalance,
            total_earnings: newTotalEarnings,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.wallet_id);
          
        if (updateWalletError) {
          console.error('❌ Erreur lors de la mise à jour du wallet après annulation:', updateWalletError);
          continue;
        }
        
        console.log(`💰 Wallet mis à jour après annulation: solde=${newBalance}, pending=${newPendingBalance}, gains=${newTotalEarnings}`);
      }
    }
    
    // 6. Rembourser le client
    try {
      // Vérifier si le client a un wallet
      const { data: clientWallet, error: clientWalletError } = await supabase
        .from('wallets')
        .select('id, balance, pending_balance')
        .eq('user_id', orderData.client_id)
        .single();
      
      if (clientWalletError && clientWalletError.code !== 'PGRST116') {
        console.error('❌ Erreur lors de la récupération du wallet du client:', clientWalletError);
      } else if (clientWallet) {
        // Créer une transaction de type 'refund' pour le client
        const { error: clientRefundTransactionError } = await supabase
          .from('transactions')
          .insert({
            wallet_id: clientWallet.id,
            amount: orderData.price, // Montant positif pour indiquer un remboursement au client
            type: 'refund',
            description: `Remboursement pour l'annulation de la commande ${orderData.order_number}`,
            reference_id: orderId,
            client_id: orderData.client_id,
            freelance_id: orderData.freelance_id,
            service_id: orderData.service_id,
            order_id: orderId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            currency: 'XOF',
            currency_symbol: 'FCFA'
          });
          
        if (clientRefundTransactionError) {
          console.error('❌ Erreur lors de l\'enregistrement de la transaction de remboursement client:', clientRefundTransactionError);
        } else {
          // Mettre à jour le solde du wallet du client (rembourser)
          const newClientBalance = Number(clientWallet.balance || 0) + orderData.price;
          
          const { error: updateClientWalletError } = await supabase
            .from('wallets')
            .update({
              balance: newClientBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', clientWallet.id);
            
          if (updateClientWalletError) {
            console.error('❌ Erreur lors de la mise à jour du wallet du client:', updateClientWalletError);
          } else {
            console.log(`💰 Wallet du client mis à jour après annulation: solde=${newClientBalance}`);
          }
        }
      }
    } catch (clientRefundError) {
      console.error('❌ Exception lors du remboursement du client:', clientRefundError);
    }
    
    // 7. Mettre à jour les status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);
      
    if (orderUpdateError) {
      console.error('❌ Erreur lors de la mise à jour du statut de la commande:', orderUpdateError);
    }
    
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('order_id', orderId);
      
    if (paymentUpdateError) {
      console.error('❌ Erreur lors de la mise à jour du statut du paiement:', paymentUpdateError);
    }
    
    // 8. Journalisation du remboursement pour l'audit
    try {
      await logSecurityEvent({
        type: 'payment_refunded',
        userId: orderData.client_id,
        ipAddress: 'system' as string,
        userAgent: 'system' as string,
        severity: 'medium',
        details: {
          orderId: orderId,
          amount: orderData.price,
          reason: 'Annulation de commande'
        }
      });
    } catch (auditError) {
      console.warn('Échec de la journalisation de l\'événement de remboursement:', auditError);
    }
    
    console.log(`✅ Annulation traitée avec succès pour la commande ${orderId}`);
    return true;
  } catch (error: any) {
    console.error('❌ Exception lors du traitement de l\'annulation:', error);
    return false;
  }
}