"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useUser } from "./useUser";
import { debounce } from "lodash";
import { useSearchParams, useRouter } from "next/navigation";
import { create } from "zustand";
import { 
  getTransactionById,
  getWalletWithTransactions
} from "@/lib/supabase/transactions";
import { Transaction } from "@/app/dashboard/transactions/page";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface WalletInfo {
  id: string;
  balance: number;
  pending_balance: number;
  total_earnings: number;
  total_withdrawals: number;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPayments: number;
  totalEarnings: number;
  incoming: number;
  outgoing: number;
  balance: number;
}

interface TransactionStore {
  transactions: Record<string, Transaction[]>;
  stats: Record<string, TransactionStats>;
  wallets: Record<string, WalletInfo>;
  setTransactions: (key: string, data: Transaction[]) => void;
  setStats: (key: string, data: TransactionStats) => void;
  setWallet: (userId: string, data: WalletInfo) => void;
  clear: (key: string) => void;
}

const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: {},
  stats: {},
  wallets: {},
  setTransactions: (key, data) => 
    set((state) => ({ 
      transactions: { ...state.transactions, [key]: data } 
    })),
  setStats: (key, data) => 
    set((state) => ({ 
      stats: { ...state.stats, [key]: data } 
    })),
  setWallet: (userId, data) => 
    set((state) => ({ 
      wallets: { ...state.wallets, [userId]: data } 
    })),
  clear: (key) => 
    set((state) => {
      const newTransactions = { ...state.transactions };
      const newStats = { ...state.stats };
      delete newTransactions[key];
      delete newStats[key];
      return { transactions: newTransactions, stats: newStats };
    }),
}));

// Helper functions
function getHookCacheKey(prefix: string, userId: string, filter?: string): string {
  if (filter) {
    return `${prefix}-${userId}-${filter}`;
  }
  return `${prefix}-${userId}`;
}

// Function to handle realtime subscriptions
function useTransactionSubscription(
  userId: string,
  onUpdate: () => void
) {
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    if (!userId) return;
    
    // Set up subscription to transactions table changes
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions',
        filter: `wallet_id=eq.${userId}`
      }, () => {
        onUpdate();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate, supabase]);
}

export function useTransactions(type: string = "all") {
  const { profile, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => type);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";
  
  // Derive cache key from user profile and type filter
  const cacheKey = useMemo(() => {
    return getHookCacheKey("transactions", profile?.id || "", activeTab);
  }, [profile?.id, activeTab]);

  // Get cached transactions - utiliser une référence stable
  const cachedTransactions = useMemo(() => 
    useTransactionStore.getState().transactions[cacheKey] || []
  , [cacheKey]);

  // Get wallet info avec une référence stable
  const wallet = useMemo(() => 
    profile?.id ? useTransactionStore.getState().wallets[profile.id] : null
  , [profile?.id]);

  // Get cached stats avec une référence stable
  const stats = useMemo(() => 
    useTransactionStore.getState().stats[cacheKey] || {
      totalTransactions: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalPayments: 0,
      totalEarnings: 0,
      incoming: 0,
      outgoing: 0,
      balance: 0
    }
  , [cacheKey]);

  // Make sure wallet has default values if null
  const safeWallet = useMemo(() => {
    return wallet || {
      id: '',
      balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_withdrawals: 0
    };
  }, [wallet]);

  // Store functions
  const setTransactionsInStore = useTransactionStore(
    (state) => state.setTransactions
  );
  const setStatsInStore = useTransactionStore(
    (state) => state.setStats
  );
  const setWalletInStore = useTransactionStore(
    (state) => state.setWallet
  );

  // Set up realtime updates
  const handleRealtimeUpdate = useCallback(() => {
    if (profile?.id) {
      fetchTransactionsData();
    }
  }, [profile?.id]);

  // Use the subscription hook
  useTransactionSubscription(
    profile?.id || "",
    handleRealtimeUpdate
  );

  // Filter transactions based on search
  const filterTransactions = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setFilteredTransactions(cachedTransactions);
        return;
      }

      const filtered = cachedTransactions.filter((transaction) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.type.toLowerCase().includes(searchLower) ||
          transaction.status.toLowerCase().includes(searchLower) ||
          (transaction.from_details && transaction.from_details.toLowerCase().includes(searchLower)) ||
          (transaction.to_details && transaction.to_details.toLowerCase().includes(searchLower))
        );
      });

      setFilteredTransactions(filtered);
    },
    [cachedTransactions]
  );

  // Fetch transactions data with retry mechanism
  const fetchTransactionsData = useCallback(async (retryCount = 0, maxRetries = 3) => {
    if (!profile?.id) return;
    
    // Indiquer explicitement que le chargement commence
    setLoading(true);
    console.log(`Fetching transactions data for ${profile.id} with tab ${activeTab}`);
    
    try {
      // Appeler la fonction RPC qui récupère tout en une seule requête
      const data = await getWalletWithTransactions(profile.id, activeTab !== "all" ? activeTab : undefined);
      
      if (data) {
        // Mettre à jour le wallet
        if (data.wallet) {
          setWalletInStore(profile.id, data.wallet);
        }
        
        // Mettre à jour les transactions
        if (data.transactions) {
          console.log(`Received ${data.transactions.length} transactions`);
          setTransactionsInStore(cacheKey, data.transactions);
          
          // Mettre à jour les transactions filtrées si une recherche est active
          if (search && search.trim() !== '') {
            // Filtrer les transactions
            const searchLower = search.toLowerCase();
            const filtered = data.transactions.filter((transaction) => {
              return (
                transaction.description.toLowerCase().includes(searchLower) ||
                transaction.type.toLowerCase().includes(searchLower) ||
                transaction.status.toLowerCase().includes(searchLower) ||
                (transaction.from_details && transaction.from_details.toLowerCase().includes(searchLower)) ||
                (transaction.to_details && transaction.to_details.toLowerCase().includes(searchLower))
              );
            });
            setFilteredTransactions(filtered);
          } else {
            setFilteredTransactions(data.transactions);
          }
        }
        
        // Mettre à jour les statistiques
        if (data.stats) {
          setStatsInStore(cacheKey, data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Retry with exponential backoff if not exceeded max retries
      if (retryCount < maxRetries) {
        const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s...
        console.log(`Retrying transactions fetch in ${backoffTime}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          fetchTransactionsData(retryCount + 1, maxRetries);
        }, backoffTime);
      }
    } finally {
      // Indiquer que le chargement est terminé
      setLoading(false);
    }
  }, [profile?.id, activeTab, cacheKey, search, setWalletInStore, setTransactionsInStore, setStatsInStore]);

  // Fetch data when profile changes or active tab changes
  useEffect(() => {
    if (!profile?.id) return;
    
    let isMounted = true;
    console.log(`Loading wallet and transactions data for user ${profile.id}`);
    
    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        // Load transactions data which includes wallet data
        await fetchTransactionsData();
        console.log('Data loading complete');
      } catch (err) {
        console.error('Error in data loading effect:', err);
      }
    };
    
    // Exécuter le chargement des données
    loadData();
    
    // Nettoyage
    return () => {
      isMounted = false;
    };
  }, [profile?.id, activeTab, cacheKey, fetchTransactionsData]);

  // Apply filter when search changes
  useEffect(() => {
    const debouncedFilter = debounce(() => {
      filterTransactions(search);
    }, 300);
    
    debouncedFilter();
    
    return () => {
      debouncedFilter.cancel();
    };
  }, [search, filterTransactions]);

  // Fetch a single transaction by ID
  const fetchTransaction = async (id: string) => {
    try {
      return await getTransactionById(id);
    } catch (err) {
      console.error("Error fetching transaction:", err);
      return null;
    }
  };

  // Fonction pour rafraîchir manuellement les transactions
  const refresh = useCallback(async () => {
    if (!profile) {
      console.log("[useTransactions] Can't refresh: No profile");
      return;
    }
    
    console.log("[useTransactions] Manual refresh triggered");
    setLoading(true);
    
    try {
      await fetchTransactionsData();
      console.log("[useTransactions] Manual refresh completed successfully");
    } catch (error) {
      console.error("[useTransactions] Error during manual refresh:", error);
    } finally {
      setLoading(false);
    }
  }, [profile, fetchTransactionsData]);

  return {
    transactions: search ? filteredTransactions : cachedTransactions,
    wallet: safeWallet,
    stats,
    loading: userLoading || loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery: search,
    refresh,
    fetchTransaction
  };
} 