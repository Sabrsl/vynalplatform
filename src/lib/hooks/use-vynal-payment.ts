import { useState, useCallback } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { processMockPayment } from '../payment/mockPayment';

interface PaymentProps {
  serviceId: string;
  freelanceId: string;
  amount: number;
  requirements?: string;
  deliveryTime?: number;
}

export function useVynalPayment() {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
    transactionId?: string;
    orderId?: string;
  }>({
    status: 'idle'
  });

  // Fonction pour tenter de créer une transaction avec plusieurs méthodes
  const createTransaction = async (transactionData: any): Promise<{success: boolean, id?: string, error?: string}> => {
    try {
      console.log("Tentative 1: Insertion complète");
      // Première tentative: insertion complète
      const { data: transData1, error: error1 } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();
      
      if (!error1 && transData1) {
        console.log("Succès avec la tentative 1 (complète):", transData1);
        return { success: true, id: transData1.id };
      }
      
      // Si la première tentative échoue, essayons avec moins de champs
      console.log("Échec tentative 1, erreur:", error1?.message || "Erreur inconnue");
      console.log("Tentative 2: Insertion minimale");
      
      const minimalData = {
        wallet_id: transactionData.wallet_id,
        amount: transactionData.amount,
        type: 'payment',
        description: transactionData.description || `Paiement de service`,
        status: 'completed',
        currency: 'XOF',
        currency_symbol: 'FCFA'
      };
      
      const { data: transData2, error: error2 } = await supabase
        .from('transactions')
        .insert(minimalData)
        .select()
        .single();
      
      if (!error2 && transData2) {
        console.log("Succès avec la tentative 2 (minimale):", transData2);
        return { success: true, id: transData2.id };
      }
      
      // Si les deux premières tentatives échouent, essayons avec un RPC
      console.log("Échec tentative 2, erreur:", error2?.message || "Erreur inconnue");
      console.log("Tentative 3: Utilisation d'un RPC");
      
      const { data: transData3, error: error3 } = await supabase
        .rpc('create_transaction', {
          p_wallet_id: transactionData.wallet_id,
          p_amount: transactionData.amount,
          p_type: 'payment',
          p_description: transactionData.description,
          p_status: 'completed',
          p_service_id: transactionData.service_id,
          p_client_id: transactionData.client_id,
          p_freelance_id: transactionData.freelance_id,
          p_order_id: transactionData.order_id
        });
        
      if (!error3 && transData3) {
        console.log("Succès avec la tentative 3 (RPC):", transData3);
        return { success: true, id: transData3 };
      }
      
      console.log("Échec tentative 3, erreur:", error3?.message || "Erreur inconnue");
      return { 
        success: false, 
        error: "Impossible de créer la transaction après 3 tentatives" 
      };
    } catch (error) {
      console.error("Erreur lors de la création de transaction:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      };
    }
  };

  const initiatePayment = useCallback(async ({ serviceId, freelanceId, amount, requirements, deliveryTime }: PaymentProps) => {
    if (!user) {
      toast.error("Vous devez être connecté pour effectuer un paiement");
      setPaymentData({
        status: 'error',
        error: "Authentification requise"
      });
      return;
    }

    setPaymentData({ status: 'loading' });

    try {
      // 1. Récupérer l'ID du wallet de l'utilisateur
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        throw new Error(`Erreur lors de la récupération du wallet: ${walletError.message}`);
      }

      // 2. Procéder au paiement simulé
      const { success, orderId } = await processMockPayment({
        serviceId,
        clientId: user.id,
        freelanceId,
        amount,
        requirements: requirements ?? '',
        deliveryTime: deliveryTime ?? 0
      });
      
      if (!success) {
        throw new Error("Le paiement a échoué");
      }

      // 3. Créer la transaction avec plusieurs tentatives
      const transactionData = {
        wallet_id: walletData.id,
        amount,
        type: 'payment',
        description: `Paiement pour service #${serviceId}`,
        status: 'completed',
        service_id: serviceId,
        client_id: user.id,
        freelance_id: freelanceId,
        order_id: orderId,
        currency: 'XOF',
        currency_symbol: 'FCFA'
      };

      const { success: transSuccess, id: transactionId, error: transError } = 
        await createTransaction(transactionData);

      if (!transSuccess) {
        throw new Error(`Erreur lors de la création de la transaction: ${transError}`);
      }

      // 4. Mettre à jour le statut et retourner les données
      setPaymentData({
        status: 'success',
        transactionId,
        orderId
      });

      toast.success("Paiement effectué avec succès!");
      return { success: true, transactionId, orderId };

    } catch (error) {
      console.error("Erreur de paiement:", error);
      setPaymentData({
        status: 'error',
        error: error instanceof Error ? error.message : "Une erreur inconnue est survenue"
      });
      toast.error(error instanceof Error ? error.message : "Le paiement a échoué");
      return { success: false, error };
    }
  }, [user, supabase]);

  return {
    paymentData,
    initiatePayment
  };
}