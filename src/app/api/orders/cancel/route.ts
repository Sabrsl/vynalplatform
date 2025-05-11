import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logSecurityEvent } from '@/lib/security/audit';

// Création d'une instance Supabase pour les opérations serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERREUR CRITIQUE: Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Endpoint pour annuler une commande
 * Route: POST /api/orders/cancel
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabaseAuth = createServerComponentClient({ cookies });
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Obtenir les données de la requête
    const { orderId, reason = "Annulation demandée par l'utilisateur" } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'ID de commande requis' }, { status: 400 });
    }

    // Vérifier si l'utilisateur a le droit d'annuler cette commande
    const { data: orderData, error: orderQueryError } = await supabase
      .from('orders')
      .select('id, client_id, freelance_id, status, price, order_number, service_id')
      .eq('id', orderId)
      .single();

    if (orderQueryError || !orderData) {
      console.error('Erreur lors de la récupération de la commande:', orderQueryError);
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // Vérifier si l'utilisateur est le client ou le freelance de cette commande
    if (orderData.client_id !== session.user.id && orderData.freelance_id !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé à annuler cette commande' }, { status: 403 });
    }

    // Vérifier si la commande est déjà annulée
    if (orderData.status === 'cancelled') {
      return NextResponse.json({ message: 'Cette commande est déjà annulée' });
    }

    // Vérifier si la commande est dans un état qui peut être annulé
    const cancellableStatuses = ['pending', 'in_progress'];
    if (!cancellableStatuses.includes(orderData.status)) {
      return NextResponse.json({ 
        error: 'Cette commande ne peut pas être annulée dans son état actuel' 
      }, { status: 400 });
    }

    // Effectuer l'annulation de la commande
    const result = await handleOrderCancellation(
      orderId, 
      session.user.id, 
      reason
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Commande annulée avec succès', 
      details: result.details 
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'annulation de la commande:', error);
    return NextResponse.json({ 
      error: error.message || 'Une erreur est survenue lors de l\'annulation' 
    }, { status: 500 });
  }
}

/**
 * Fonction utilitaire pour créer une transaction de remboursement et mettre à jour le wallet
 */
async function handleOrderCancellation(
  orderId: string, 
  initiatorId: string, 
  reason: string
) {
  try {
    console.log(`🔄 Traitement de l'annulation pour orderId: ${orderId}, initiateur: ${initiatorId}`);
    
    // 1. Récupérer les détails de la commande et du paiement
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, price, order_number, freelance_id, client_id, service_id, status')
      .eq('id', orderId)
      .single();
      
    if (orderError) {
      console.error('❌ Erreur lors de la récupération des détails de la commande:', orderError);
      return { success: false, message: 'Impossible de récupérer les détails de la commande' };
    }

    // Vérifier si la commande est déjà annulée
    if (orderData.status === 'cancelled') {
      return { success: true, message: 'Commande déjà annulée', details: { orderData } };
    }
    
    // 2. Vérifier si une transaction a déjà été créée pour cette commande
    const { data: transactions, error: transactionQueryError } = await supabase
      .from('transactions')
      .select('id, amount, wallet_id, client_id, freelance_id, service_id, order_id, type')
      .eq('order_id', orderId)
      .eq('type', 'earning');
      
    if (transactionQueryError) {
      console.error('❌ Erreur lors de la vérification des transactions existantes:', transactionQueryError);
      return { success: false, message: 'Impossible de vérifier les transactions existantes' };
    }
    
    let updateDetails = {
      transactionsProcessed: 0,
      walletsUpdated: 0
    };
    
    // Si aucune transaction n'a été trouvée, on vérifie s'il faut en créer une pour le wallet du freelance
    if (!transactions || transactions.length === 0) {
      console.log(`ℹ️ Aucune transaction trouvée pour la commande ${orderId}, vérification du wallet du freelance`);
      
      // Vérifier si le freelance a un wallet
      const { data: wallet, error: walletQueryError } = await supabase
        .from('wallets')
        .select('id, balance, total_earnings')
        .eq('user_id', orderData.freelance_id)
        .single();
      
      if (walletQueryError && walletQueryError.code !== 'PGRST116') { // PGRST116 = "no result found"
        console.error(`❌ Erreur lors de la récupération du wallet du freelance:`, walletQueryError);
      } else if (wallet) {
        // Créer une transaction de type 'refund' pour documenter l'annulation
        const { error: refundTransactionError } = await supabase
          .from('transactions')
          .insert({
            wallet_id: wallet.id,
            amount: 0, // Montant zéro car aucune transaction d'origine
            type: 'refund',
            description: `Annulation de la commande ${orderData.order_number} - ${reason}`,
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
          console.error('❌ Erreur lors de l\'enregistrement de la transaction d\'annulation:', refundTransactionError);
        } else {
          updateDetails.transactionsProcessed++;
          console.log(`✅ Transaction d'annulation créée pour la commande ${orderId}`);
        }
      }
    } else {
      // 3. Traiter les transactions existantes
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
          // 4. Créer une transaction de remboursement avec tous les champs nécessaires
          try {
            // Vérifier le schéma actuel de la table transactions
            const { data: columnInfo, error: columnError } = await supabase
              .rpc('get_table_columns', { table_name: 'transactions' });
              
            if (columnError) {
              console.error('❌ Erreur lors de la vérification du schéma de la table transactions:', columnError);
            } else {
              console.log('📊 Colonnes de la table transactions:', columnInfo);
            }
            
            // Préparer les données de transaction
            const transactionData: Record<string, any> = {
              wallet_id: transaction.wallet_id,
              amount: -transaction.amount, // Montant négatif pour indiquer un remboursement
              type: 'refund',
              description: `Remboursement pour la commande ${orderData.order_number} - ${reason}`,
              reference_id: orderId,
              client_id: transaction.client_id || orderData.client_id,
              freelance_id: transaction.freelance_id || orderData.freelance_id,
              service_id: transaction.service_id || orderData.service_id,
              order_id: orderId,
              status: 'completed',
              completed_at: new Date().toISOString()
            };
            
            // Ajouter les champs de devise uniquement s'ils existent dans le schéma
            if (columnInfo && columnInfo.some((col: { column_name: string }) => col.column_name === 'currency')) {
              transactionData.currency = 'XOF';
            }
            
            if (columnInfo && columnInfo.some((col: { column_name: string }) => col.column_name === 'currency_symbol')) {
              transactionData.currency_symbol = 'FCFA';
            }
            
            // Insérer la transaction
            const { error: refundTransactionError } = await supabase
              .from('transactions')
              .insert(transactionData);
              
            if (refundTransactionError) {
              console.error('❌ Erreur lors de l\'enregistrement de la transaction de remboursement:', refundTransactionError);
              console.error('Détails de l\'erreur:', refundTransactionError.details || refundTransactionError.message);
              continue;
            }
            
            updateDetails.transactionsProcessed++;
            
            // Récupérer le statut de la transaction originale pour déterminer s'il faut mettre à jour balance ou pending_balance
            const { data: originalTransactionData, error: originalTransactionError } = await supabase
              .from('transactions')
              .select('status')
              .eq('id', transaction.id)
              .single();
              
            if (originalTransactionError) {
              console.error('❌ Erreur lors de la récupération du statut de la transaction originale:', originalTransactionError);
              continue;
            }
            
            // 5. Mettre à jour le solde du wallet en fonction du statut de la transaction
            // Pour une commande complétée, l'argent est dans balance
            // Pour une commande en cours, l'argent est dans pending_balance
            const isCompletedTransaction = originalTransactionData?.status === 'completed';
            
            // Récupérer à nouveau le wallet avec tous les champs nécessaires
            const { data: currentWallet, error: currentWalletError } = await supabase
              .from('wallets')
              .select('id, balance, pending_balance, total_earnings')
              .eq('id', transaction.wallet_id)
              .single();
              
            if (currentWalletError) {
              console.error(`❌ Erreur lors de la récupération des données actuelles du wallet:`, currentWalletError);
              continue;
            }
            
            // Calculer les nouveaux soldes
            const transactionAmount = Math.abs(transaction.amount);
            let newBalance = Number(currentWallet.balance || 0);
            let newPendingBalance = Number(currentWallet.pending_balance || 0);
            const newTotalEarnings = Math.max(0, Number(currentWallet.total_earnings || 0) - transactionAmount);
            
            if (isCompletedTransaction) {
              // Si la transaction était complétée, soustraire de balance
              newBalance = Math.max(0, newBalance - transactionAmount);
            } else {
              // Sinon, soustraire de pending_balance
              newPendingBalance = Math.max(0, newPendingBalance - transactionAmount);
            }
            
            console.log(`Mise à jour du wallet ${currentWallet.id}:
              balance: ${currentWallet.balance} -> ${newBalance}
              pending_balance: ${currentWallet.pending_balance} -> ${newPendingBalance}
              earnings: ${currentWallet.total_earnings} -> ${newTotalEarnings}`);
            
            // Préparer les données de mise à jour du wallet
            const walletUpdateData: any = { 
              balance: newBalance,
              pending_balance: newPendingBalance,
              total_earnings: newTotalEarnings,
              updated_at: new Date().toISOString()
            };
            
            const { error: updateWalletError } = await supabase
              .from('wallets')
              .update(walletUpdateData)
              .eq('id', transaction.wallet_id);
              
            if (updateWalletError) {
              console.error('❌ Erreur lors de la mise à jour du wallet après annulation:', updateWalletError);
              console.error('Détails de l\'erreur:', updateWalletError.details || updateWalletError.message);
              continue;
            }
            
            updateDetails.walletsUpdated++;
            console.log(`💰 Wallet mis à jour après annulation: solde=${newBalance}, pending=${newPendingBalance}, gains=${newTotalEarnings}`);
          } catch (txError) {
            console.error('❌ Exception lors du traitement de la transaction de remboursement:', txError);
            continue;
          }
        }
      }
    }
    
    // 6. Mettre à jour le statut de la commande
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (orderUpdateError) {
      console.error('❌ Erreur lors de la mise à jour du statut de la commande:', orderUpdateError);
      return { success: false, message: 'Échec de la mise à jour du statut de la commande' };
    }
    
    // Stockage de la raison d'annulation dans une nouvelle table dédiée
    const { error: cancelReasonError } = await supabase
      .from('order_cancellations')
      .insert({
        order_id: orderId,
        reason: reason,
        cancelled_by: initiatorId,
        cancelled_at: new Date().toISOString()
      });
      
    if (cancelReasonError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement de la raison d\'annulation:', cancelReasonError);
      // Ne pas bloquer le processus si l'enregistrement de la raison échoue
    }
    
    // 7. Mettre à jour le statut du paiement si existant
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('order_id', orderId);
      
    if (paymentUpdateError) {
      console.log('⚠️ Aucun paiement trouvé pour cette commande ou erreur:', paymentUpdateError);
    }
    
    // 7.1 Rembourser le client si nécessaire
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
      console.error('❌ Exception lors du traitement du remboursement client:', clientRefundError);
    }
    
    // 8. Ajouter une notification pour l'autre partie
    const recipientId = initiatorId === orderData.client_id ? orderData.freelance_id : orderData.client_id;
    const initiatorRole = initiatorId === orderData.client_id ? 'client' : 'freelance';
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'order_cancelled',
        content: `La commande ${orderData.order_number} a été annulée par ${initiatorRole === 'client' ? 'le client' : 'le freelance'}`,
        data: { 
          order_id: orderId,
          reason: reason
        }
      });
      
    if (notificationError) {
      console.warn('⚠️ Erreur lors de l\'envoi de la notification:', notificationError);
    }
    
    // 9. Journalisation de l'annulation pour l'audit
    try {
      await logSecurityEvent({
        type: 'payment_refunded',
        userId: initiatorId,
        ipAddress: 'system' as string,
        userAgent: 'system' as string,
        severity: 'medium',
        details: {
          orderId: orderId,
          amount: orderData.price,
          reason: reason,
          initiatorRole,
          action: 'order_cancelled'
        }
      });
    } catch (auditError) {
      console.warn('Échec de la journalisation de l\'événement d\'annulation:', auditError);
    }
    
    console.log(`✅ Annulation traitée avec succès pour la commande ${orderId}`);
    return { 
      success: true, 
      message: 'Annulation traitée avec succès',
      details: {
        orderId,
        updateDetails
      }
    };
  } catch (error: any) {
    console.error('❌ Exception lors du traitement de l\'annulation:', error);
    return { success: false, message: error.message || 'Erreur inconnue lors de l\'annulation' };
  }
} 