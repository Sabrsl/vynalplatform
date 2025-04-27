/**
 * Mock Payment Processor
 * 
 * Ce module simule un système de paiement pour permettre des tests et des démonstrations
 * sans avoir à intégrer un vrai processeur de paiement.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from 'uuid';

export interface MockPaymentRequestProps {
  serviceId: string;
  clientId: string;
  freelanceId: string;
  amount: number;
  requirements: string;
  deliveryTime: number;
}

export interface MockPaymentResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  transactionId?: string;
  error?: string;
}

// Fonction séparée pour tenter plusieurs approches pour créer une transaction
async function createTestTransaction(supabase: any, transactionData: any): Promise<{success: boolean, id?: string, error?: string}> {
  console.log("=== TENTATIVE DE CRÉATION DE TRANSACTION TEST ===");
  
  try {
    // Approche 1: Insertion avec un minimum de champs
    const minimalTransaction = {
      wallet_id: transactionData.wallet_id,
      amount: transactionData.amount,
      type: 'test_payment',
      description: transactionData.description || "Paiement test",
      status: 'completed'
    };
    
    console.log("Tentative 1 - Transaction minimale:", minimalTransaction);
    
    let { error: error1 } = await supabase
      .from('transactions')
      .insert(minimalTransaction);
    
    if (!error1) {
      console.log("Succès avec la tentative 1 (minimale)");
      return { success: true };
    }
    
    console.error("Échec tentative 1:", error1.message);
    
    // Approche 2: Insérer via fonction RPC
    try {
      console.log("Tentative 2 - Utilisation de la fonction rpc insert_transaction");
      const { data, error: error2 } = await supabase.rpc('insert_transaction', {
        p_wallet_id: transactionData.wallet_id,
        p_amount: transactionData.amount,
        p_type: 'test_payment',
        p_description: transactionData.description || "Paiement test",
        p_status: 'completed'
      });
      
      if (!error2) {
        console.log("Succès avec la tentative 2 (RPC):", data);
        return { success: true, id: data };
      }
      
      console.error("Échec tentative 2:", error2.message);
    } catch (e) {
      console.error("Exception tentative 2:", e);
    }
    
    // Approche 3: Utiliser un format différent pour le montant
    try {
      console.log("Tentative 3 - Format montant string");
      const stringAmountTransaction = {
        ...minimalTransaction,
        amount: String(transactionData.amount)
      };
      
      let { error: error3 } = await supabase
        .from('transactions')
        .insert(stringAmountTransaction);
      
      if (!error3) {
        console.log("Succès avec la tentative 3 (montant string)");
        return { success: true };
      }
      
      console.error("Échec tentative 3:", error3.message);
    } catch (e) {
      console.error("Exception tentative 3:", e);
    }
    
    // Toutes les tentatives ont échoué
    return { 
      success: false, 
      error: "Toutes les tentatives d'insertion de transaction test ont échoué"
    };
  } catch (e) {
    console.error("Exception générale lors de la création de transaction test:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur inconnue"
    };
  }
}

export const processMockPayment = async (paymentRequest: MockPaymentRequestProps): Promise<MockPaymentResponse> => {
  // Simuler un court délai de traitement pour rendre l'expérience plus réaliste
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    console.log("=== DÉBUT TRAITEMENT PAIEMENT FICTIF ===");
    console.log("Données de paiement:", paymentRequest);
    
    const supabase = createClientComponentClient();
    
    // Générer des IDs uniques
    const orderId = uuidv4();
    const transactionId = uuidv4();
    const paymentId = uuidv4();
    
    console.log("IDs générés - Commande:", orderId, "Transaction:", transactionId, "Paiement:", paymentId);
    
    // Vérifier que tous les champs nécessaires sont présents
    if (!paymentRequest.serviceId || !paymentRequest.clientId || !paymentRequest.freelanceId) {
      console.error("Données de paiement incomplètes");
      return {
        success: false,
        error: "Données de commande incomplètes. Veuillez vérifier et réessayer."
      };
    }
    
    console.log("Vérification des données de paiement: OK");
    
    // 1. Vérifier si l'utilisateur a un wallet
    console.log("Vérification du wallet utilisateur...");
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', paymentRequest.clientId)
      .single();
    
    let walletId;
    
    if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = "No rows returned"
      console.error("Erreur lors de la récupération du wallet:", walletError);
      return {
        success: false,
        error: `Erreur de paiement fictif: ${walletError.message}`
      };
    }
    
    // Si l'utilisateur n'a pas de wallet, en créer un fictif
    if (!walletData) {
      console.log("Création d'un wallet fictif pour le test...");
      const { data: newWallet, error: newWalletError } = await supabase
        .from('wallets')
        .insert({
          user_id: paymentRequest.clientId,
          balance: 10000, // Solde fictif pour les tests
          currency: 'XOF',
          currency_symbol: 'FCFA'
        })
        .select('id')
        .single();
      
      if (newWalletError) {
        console.error("Erreur lors de la création du wallet fictif:", newWalletError);
        // Pour les tests, on continue même si le wallet n'est pas créé
        walletId = uuidv4(); // ID fictif pour permettre les tests
        console.log("Utilisation d'un wallet fictif avec ID:", walletId);
      } else {
        walletId = newWallet.id;
        console.log("Wallet fictif créé avec succès, ID:", walletId);
      }
    } else {
      walletId = walletData.id;
      console.log("Wallet existant trouvé, ID:", walletId);
    }
    
    // 2. Insérer la commande (order) avec l'ID prédéfini
    console.log("Création de la commande test...");
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        client_id: paymentRequest.clientId,
        freelance_id: paymentRequest.freelanceId,
        service_id: paymentRequest.serviceId,
        status: 'pending',
        price: paymentRequest.amount,
        delivery_time: paymentRequest.deliveryTime,
        requirements: paymentRequest.requirements
      });
    
    if (orderError) {
      console.error("Erreur lors de la création de la commande test:", orderError);
      return {
        success: false,
        error: `Erreur lors de la création de la commande: ${orderError.message}`
      };
    }
    
    console.log("Commande test créée avec succès, ID:", orderId);
    
    // 3. Tentative de création de transaction test avec plusieurs méthodes
    const transactionResult = await createTestTransaction(supabase, {
      wallet_id: walletId,
      amount: paymentRequest.amount,
      description: `Test pour commande #${orderId.substring(0, 8)}`,
      order_id: orderId,
      service_id: paymentRequest.serviceId,
      client_id: paymentRequest.clientId,
      freelance_id: paymentRequest.freelanceId
    });
    
    if (!transactionResult.success) {
      console.warn("Impossible de créer la transaction test, mais poursuite du processus:", transactionResult.error);
    } else {
      console.log("Transaction test créée avec succès");
    }
    
    // 4. Créer le paiement fictif après la transaction
    console.log("Création du paiement test...");
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        order_id: orderId,
        client_id: paymentRequest.clientId,
        freelance_id: paymentRequest.freelanceId,
        amount: paymentRequest.amount,
        status: 'paid',
        payment_method: 'mock_payment' // Méthode spéciale pour les paiements fictifs
      });
    
    if (paymentError) {
      console.error("Erreur lors de l'enregistrement du paiement fictif:", paymentError);
      return {
        success: false,
        error: `Erreur lors de l'enregistrement du paiement: ${paymentError.message}`
      };
    }
    
    console.log("Paiement test créé avec succès, ID:", paymentId);
    
    // 5. Créer un message automatique pour informer le freelance
    console.log("Envoi de la notification test...");
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        order_id: orderId,
        sender_id: paymentRequest.clientId,
        content: `Nouvelle commande (TEST) pour votre service. Veuillez consulter les détails pour commencer.`,
        read: false
      });
    
    if (messageError) {
      console.error("Erreur lors de la création du message de notification:", messageError);
      // On ne bloque pas le processus si l'envoi du message échoue
    } else {
      console.log("Message de notification test créé avec succès");
    }
    
    console.log("=== FIN TRAITEMENT PAIEMENT FICTIF: SUCCÈS ===");
    
    return {
      success: true,
      orderId,
      paymentId,
      transactionId: transactionResult.id || transactionId
    };
  } catch (error) {
    console.error("Erreur inattendue lors du traitement du paiement fictif:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Message d'erreur détaillé:", errorMessage);
    
    console.log("=== FIN TRAITEMENT PAIEMENT FICTIF: ERREUR ===");
    return {
      success: false,
      error: "Une erreur inattendue s'est produite"
    };
  }
}; 