import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Création d'une instance Supabase pour les opérations serveur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERREUR CRITIQUE: Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Endpoint API pour créer une demande de retrait
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const cookieStore = cookies();
    const supabaseClient = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }
    
    // Récupérer les données de la demande
    const { amount, payment_method, fee_amount, net_amount } = await req.json();
    
    // Valider les données
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    
    if (!payment_method) {
      return NextResponse.json({ error: 'Méthode de paiement requise' }, { status: 400 });
    }
    
    // 1. Récupérer le wallet de l'utilisateur
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, pending_balance, min_withdrawal_amount, withdrawal_fee_percentage')
      .eq('user_id', session.user.id)
      .single();
      
    if (walletError) {
      console.error('Erreur lors de la récupération du wallet:', walletError);
      return NextResponse.json({ error: 'Impossible de récupérer les informations du wallet' }, { status: 500 });
    }
    
    // 2. Vérifier les conditions de retrait
    if (amount > walletData.balance) {
      return NextResponse.json({ 
        error: `Le montant demandé (${amount}) dépasse votre solde disponible (${walletData.balance})` 
      }, { status: 400 });
    }
    
    if (amount < walletData.min_withdrawal_amount) {
      return NextResponse.json({ 
        error: `Le montant minimum de retrait est de ${walletData.min_withdrawal_amount}` 
      }, { status: 400 });
    }
    
    // 3. Créer une table pour les demandes de retrait si elle n'existe pas déjà
    // Cette vérification doit normalement être faite dans les migrations de base de données
    const { error: schemaError } = await supabase.rpc('create_withdrawal_requests_if_not_exists');
    
    if (schemaError) {
      console.error('Erreur lors de la vérification/création de la table:', schemaError);
      // Continuer car la table peut déjà exister
    }
    
    // 4. Créer une nouvelle demande de retrait
    const { data: withdrawalRequest, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: session.user.id,
        wallet_id: walletData.id,
        amount: amount,
        fee_amount: fee_amount || (amount * walletData.withdrawal_fee_percentage / 100),
        net_amount: net_amount || (amount - (amount * walletData.withdrawal_fee_percentage / 100)),
        payment_method: payment_method,
        status: 'pending',
        notes: 'Demande de retrait soumise par l\'utilisateur'
      })
      .select()
      .single();
      
    if (withdrawalError) {
      console.error('Erreur lors de la création de la demande de retrait:', withdrawalError);
      return NextResponse.json({ error: 'Impossible de créer la demande de retrait' }, { status: 500 });
    }
    
    // 5. Mettre à jour le wallet pour réserver le montant demandé
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({
        balance: walletData.balance - amount,
        pending_balance: walletData.pending_balance + amount
      })
      .eq('id', walletData.id);
      
    if (updateWalletError) {
      console.error('Erreur lors de la mise à jour du wallet:', updateWalletError);
      
      // Annuler la demande de retrait en cas d'erreur
      await supabase
        .from('withdrawal_requests')
        .update({ status: 'failed', notes: 'Échec de la mise à jour du wallet' })
        .eq('id', withdrawalRequest.id);
        
      return NextResponse.json({ error: 'Impossible de mettre à jour le wallet' }, { status: 500 });
    }
    
    // 6. Créer une entrée dans la table transactions
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletData.id,
        amount: amount,
        type: 'withdrawal',
        description: `Demande de retrait via ${payment_method}`,
        reference_id: withdrawalRequest.id,
        status: 'pending'
      });
      
    if (transactionError) {
      console.error('Erreur lors de la création de la transaction:', transactionError);
      // Ne pas échouer ici, car la demande a été créée avec succès
    }
    
    // 7. Enregistrer l'événement pour audit
    const { error: auditError } = await supabase
      .from('payment_events')
      .insert({
        user_id: session.user.id,
        event_type: 'withdrawal_request',
        severity: 'medium',
        details: {
          withdrawal_id: withdrawalRequest.id,
          amount: amount,
          payment_method: payment_method
        }
      });
      
    if (auditError) {
      console.warn('Erreur lors de l\'enregistrement de l\'événement d\'audit:', auditError);
      // Ne pas échouer ici, car la demande a été créée avec succès
    }
    
    // 8. Retourner la réponse
    return NextResponse.json({
      message: 'Demande de retrait créée avec succès',
      withdrawal_id: withdrawalRequest.id,
      status: 'pending'
    });
    
  } catch (error) {
    console.error('Erreur non gérée:', error);
    return NextResponse.json({ error: 'Une erreur inattendue s\'est produite' }, { status: 500 });
  }
} 