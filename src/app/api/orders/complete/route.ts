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
 * API Route pour marquer une commande comme complétée et transférer les fonds de pending_balance vers balance
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabaseAuth = createServerComponentClient({ cookies });
    const { data: { session } } = await supabaseAuth.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }
    
    // Récupérer l'ID de commande du corps de la requête
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'ID de commande requis' }, { status: 400 });
    }
    
    // Récupérer les détails de la commande
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, status, price, freelance_id, client_id, service_id, order_number')
      .eq('id', orderId)
      .eq('client_id', session.user.id) // S'assurer que le client est propriétaire de la commande
      .single();
      
    if (orderError) {
      console.error('❌ Erreur lors de la récupération des détails de la commande:', orderError);
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    
    // Vérifier si la commande est déjà complétée
    if (orderData.status === 'completed') {
      return NextResponse.json({ message: 'Commande déjà complétée' }, { status: 200 });
    }
    
    // Vérifier si la commande est en statut "delivered" (prête à être complétée)
    if (orderData.status !== 'delivered') {
      return NextResponse.json({ error: 'La commande doit être livrée avant de pouvoir être complétée' }, { status: 400 });
    }
    
    // 1. Récupérer les transactions liées à cette commande
    const { data: transactions, error: transactionQueryError } = await supabase
      .from('transactions')
      .select('id, amount, wallet_id, status')
      .eq('order_id', orderId)
      .eq('type', 'earning');
      
    if (transactionQueryError) {
      console.error('❌ Erreur lors de la récupération des transactions:', transactionQueryError);
      return NextResponse.json({ error: 'Erreur lors de la recherche des transactions' }, { status: 500 });
    }
    
    if (!transactions || transactions.length === 0) {
      console.warn(`⚠️ Aucune transaction trouvée pour la commande ${orderId}`);
    }
    
    // Traiter chaque transaction
    for (const transaction of transactions) {
      // Mettre à jour le statut de la transaction
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transaction.id);
        
      if (updateTransactionError) {
        console.error('❌ Erreur lors de la mise à jour de la transaction:', updateTransactionError);
        continue;
      }
      
      // Récupérer le wallet associé
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance, pending_balance, total_earnings')
        .eq('id', transaction.wallet_id)
        .single();
        
      if (walletError) {
        console.error(`❌ Erreur lors de la récupération du wallet ${transaction.wallet_id}:`, walletError);
        continue;
      }
      
      // Transférer le montant de pending_balance vers balance
      const amount = transaction.amount;
      const newPendingBalance = Math.max(0, Number(walletData.pending_balance || 0) - amount);
      const newBalance = Number(walletData.balance || 0) + amount;
      
      const { error: updateWalletError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          pending_balance: newPendingBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.wallet_id);
        
      if (updateWalletError) {
        console.error('❌ Erreur lors de la mise à jour du wallet:', updateWalletError);
        continue;
      }
      
      console.log(`💰 Transfert réussi pour le wallet ${transaction.wallet_id}: pending_balance=${newPendingBalance}, balance=${newBalance}`);
    }
    
    // 2. Mettre à jour le statut de la commande
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (updateOrderError) {
      console.error('❌ Erreur lors de la mise à jour du statut de la commande:', updateOrderError);
      return NextResponse.json({ error: 'Échec de la mise à jour du statut de la commande' }, { status: 500 });
    }
    
    // 3. Enregistrer l'événement pour audit
    try {
      await logSecurityEvent({
        type: 'payment_success',
        userId: session.user.id,
        ipAddress: req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        severity: 'medium',
        details: {
          orderId: orderId,
          amount: orderData.price,
          freelanceId: orderData.freelance_id,
          action: 'order_completed'
        }
      });
    } catch (auditError) {
      console.warn('⚠️ Erreur lors de la journalisation de l\'événement:', auditError);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Commande complétée et paiement transféré avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Exception lors du traitement de la demande:', error);
    return NextResponse.json({ 
      error: error.message || 'Une erreur est survenue lors du traitement de la demande' 
    }, { status: 500 });
  }
} 