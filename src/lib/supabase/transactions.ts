import { createClient } from "@/lib/supabase/client";
import { Transaction } from "@/app/dashboard/transactions/page";

export async function fetchTransactions(
  userId: string,
  type?: string
): Promise<Transaction[]> {
  const supabase = createClient();
  console.log(`Fetching transactions for user ${userId}${type ? ` with type ${type}` : ''}`);

  try {
    // D'abord on récupère le wallet de l'utilisateur
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (walletError) {
      // Si l'erreur est "No row found", c'est que l'utilisateur n'a pas encore de wallet
      if (walletError.code === 'PGRST116') {
        console.info(`Aucun wallet trouvé pour l'utilisateur ${userId}`);
        return []; // Retourner un tableau vide
      }
      
      console.error("Error fetching wallet:", walletError);
      throw walletError;
    }

    if (!wallet || !wallet.id) {
      console.warn(`Wallet trouvé mais sans ID valide pour l'utilisateur ${userId}`);
      return [];
    }

    console.log(`Wallet trouvé: ${wallet.id}, récupération des transactions...`);

    // Ensuite on récupère les transactions associées à ce wallet
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false });
    
    if (type && type !== "all") {
      query = query.eq("type", type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
    
    console.log(`Récupéré ${data?.length || 0} transactions`);
    return data || [];
  } catch (err) {
    console.error("Exception in fetchTransactions:", err);
    // Retourner un tableau vide plutôt que de lancer une exception
    // pour éviter de bloquer l'interface utilisateur
    return [];
  }
}

export async function createTransaction(
  walletId: string,
  amount: number,
  type: "deposit" | "withdrawal" | "payment" | "earning",
  description: string,
  options?: {
    reference_id?: string;
    service_id?: string;
    client_id?: string;
    freelance_id?: string;
    order_id?: string;
    commission_amount?: number;
    from_details?: string;
    to_details?: string;
    withdrawal_method?: string;
  }
): Promise<Transaction> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      wallet_id: walletId,
      amount,
      type,
      description,
      status: "pending",
      ...options
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
  
  return data as Transaction;
}

export async function getTransactionById(
  transactionId: string
): Promise<Transaction | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .single();
  
  if (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
  
  return data as Transaction;
}

export async function fetchWalletForUser(
  userId: string
): Promise<{ id: string; balance: number; pending_balance: number; total_earnings: number; total_withdrawals: number } | null> {
  const supabase = createClient();
  console.log(`Fetching wallet for user ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from("wallets")
      .select("id, balance, pending_balance, total_earnings, total_withdrawals")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      // Si l'utilisateur n'a pas de wallet, on retourne null sans erreur
      if (error.code === 'PGRST116') {
        console.info(`Aucun wallet trouvé pour l'utilisateur ${userId}`);
        return null;
      }
      
      console.error("Error fetching wallet:", error);
      return null;
    }
    
    if (!data) {
      console.warn(`Aucune donnée de wallet pour l'utilisateur ${userId}`);
      return null;
    }
    
    console.log(`Wallet récupéré: ${data.id}, balance: ${data.balance}`);
    return data;
  } catch (err) {
    console.error("Exception in fetchWalletForUser:", err);
    return null;
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: "pending" | "completed" | "failed",
  completedAt?: Date
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("transactions")
    .update({
      status,
      completed_at: status === "completed" ? completedAt || new Date() : null
    })
    .eq("id", transactionId);
  
  if (error) {
    console.error("Error updating transaction status:", error);
    return false;
  }
  
  return true;
}

// Ajouter une nouvelle fonction pour récupérer les données via la fonction RPC
export async function getWalletWithTransactions(
  userId: string,
  type?: string
): Promise<{
  wallet: { 
    id: string; 
    balance: number; 
    pending_balance: number; 
    total_earnings: number; 
    total_withdrawals: number; 
  } | null;
  transactions: Transaction[];
  stats: {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalPayments: number;
    totalEarnings: number;
    incoming: number;
    outgoing: number;
    balance: number;
  };
}> {
  const supabase = createClient();
  console.log(`Calling RPC get_wallet_with_transactions for user ${userId}${type ? ` with type ${type}` : ''}`);
  
  try {
    const { data, error } = await supabase.rpc('get_wallet_with_transactions', {
      user_id_param: userId,
      transaction_type_param: type === 'all' ? null : type
    });
    
    if (error) {
      console.error("Error calling get_wallet_with_transactions:", error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        wallet: null,
        transactions: [],
        stats: {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalPayments: 0,
          totalEarnings: 0,
          incoming: 0,
          outgoing: 0,
          balance: 0
        }
      };
    }
    
    console.log(`RPC call successful, raw data:`, data);
    console.log(`Wallet data:`, data.wallet);
    console.log(`Stats data:`, data.stats);
    console.log(`Transactions count:`, data.transactions?.length || 0);
    
    // S'assurer que les données sont bien structurées
    const result = {
      wallet: data.wallet || null,
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      stats: data.stats || {
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPayments: 0,
        totalEarnings: 0, 
        incoming: 0,
        outgoing: 0,
        balance: 0
      }
    };
    
    console.log('Final structured data:', result);
    return result;
  } catch (err) {
    console.error("Exception in getWalletWithTransactions:", err);
    // Retourner des valeurs par défaut en cas d'exception
    return {
      wallet: null,
      transactions: [],
      stats: {
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPayments: 0,
        totalEarnings: 0,
        incoming: 0,
        outgoing: 0,
        balance: 0
      }
    };
  }
} 