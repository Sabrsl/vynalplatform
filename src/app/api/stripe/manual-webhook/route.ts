import { NextRequest, NextResponse } from 'next/server';
import { stripe, retrievePaymentIntent } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { logSecurityEvent } from '@/lib/security/audit';

// Création d'une instance Supabase pour les opérations serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERREUR CRITIQUE: Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Génère un numéro de commande unique
function generateOrderNumber(): string {
  const prefix = 'VNL';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Endpoint pour traiter manuellement les paiements par carte qui pourraient ne pas avoir déclenché le webhook
 * Cette route est appelée côté client lorsqu'un paiement par carte est confirmé
 * 
 * Route: POST /api/stripe/manual-webhook
 */
export async function POST(req: NextRequest) {
  try {
    // Récupérer les informations sur le client
    const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Extraire le paymentIntentId du corps de la requête
    const body = await req.json();
    const { paymentIntentId } = body;
    
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'PaymentIntent ID manquant' }, { status: 400 });
    }
    
    console.log(`Traitement manuel du paiement ${paymentIntentId}`);
    
    // Récupérer les détails du PaymentIntent depuis Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);
    
    // Vérifier que le paiement est bien réussi
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        error: 'Le paiement n\'est pas dans l\'état "succeeded"',
        status: paymentIntent.status
      }, { status: 400 });
    }
    
    // Vérifier si ce paiement a déjà été traité
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();
      
    if (existingPayment) {
      return NextResponse.json({ 
        message: 'Ce paiement a déjà été traité',
        paymentId: existingPayment.id,
        alreadyProcessed: true
      });
    }
    
    // Extraire les métadonnées
    const { clientId, freelanceId, serviceId, deliveryTime = 7 } = paymentIntent.metadata || {};
    
    if (!clientId || !freelanceId || !serviceId) {
      console.error('Métadonnées manquantes dans le payment intent', paymentIntent.metadata);
      return NextResponse.json({ 
        error: 'Métadonnées incomplètes'
      }, { status: 400 });
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
      return NextResponse.json({ 
        error: `Erreur création commande: ${orderError.message}`
      }, { status: 500 });
    }
    
    // Récupération de l'ID de la commande créée
    let orderId = null;
    if (orderData && Array.isArray(orderData) && orderData.length > 0) {
      orderId = orderData[0].id;
    } else {
      return NextResponse.json({ 
        error: "Impossible de récupérer l'ID de la commande créée"
      }, { status: 500 });
    }
    
    // Enregistrement du paiement avec l'ID de commande
    const paymentDataObj = {
      client_id: clientId,
      freelance_id: freelanceId,
      order_id: orderId,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Conversion des centimes en euros
      status: 'paid',
      payment_method: 'card'
    };
    
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
      return NextResponse.json({ 
        error: `Erreur base de données: ${paymentError.message}`
      }, { status: 500 });
    }
    
    // Récupérer le wallet du freelance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, pending_balance, total_earnings')
      .eq('user_id', freelanceId)
      .single();
      
    // Traitement du wallet et enregistrement de la transaction si le wallet existe
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
        } else if (newWallet) {
          // Utiliser le montant brut sans commission
          const amount = paymentIntent.amount / 100;
          
          // Enregistrer la transaction
          await createTransaction(
            newWallet.id,
            freelanceId,
            clientId,
            serviceId,
            orderId,
            orderNumber,
            amount
          );
          
          // Mettre à jour le wallet
          await updateWalletBalance(newWallet.id, amount, amount);
        }
      }
    } else if (walletData) {
      // Utiliser le montant brut sans commission
      const amount = paymentIntent.amount / 100;
      
      // Enregistrer la transaction
      await createTransaction(
        walletData.id,
        freelanceId,
        clientId,
        serviceId,
        orderId,
        orderNumber,
        amount
      );
      
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
    
    // Journalisation du paiement réussi pour l'audit
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
          amount: paymentIntent.amount / 100,
          manual: true
        }
      });
    } catch (auditError) {
      console.warn('Échec de la journalisation de l\'événement:', auditError);
    }
    
    // Confirmer la réussite avec des détails
    console.log('💲 Paiement manuel enregistré avec succès:', {
      clientId,
      freelanceId,
      orderId,
      amount: paymentIntent.amount / 100,
      orderNumber
    });
    
    return NextResponse.json({
      success: true,
      paymentId: paymentData[0].id,
      orderId,
      orderNumber
    });
    
  } catch (error: any) {
    console.error('Erreur lors du traitement manuel du webhook:', error);
    
    // Journalisation de l'erreur
    await logSecurityEvent({
      type: 'stripe_webhook_processing_error',
      ipAddress: req.ip as string,
      userAgent: req.headers.get('user-agent') as string,
      severity: 'high',
      details: { 
        error: error.message,
        isManualWebhook: true
      }
    });
    
    return NextResponse.json({ 
      error: error.message || 'Une erreur est survenue' 
    }, { status: 500 });
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
        status: 'pending',
        completed_at: null,
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
        pending_balance: newPendingAmount,
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