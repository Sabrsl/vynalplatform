"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { useTransactions } from "@/hooks/useTransactions";

// Types pour le contexte
type TransactionsContextType = {
  loading: boolean;
  refreshingTransactions: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refresh: () => Promise<void>;
};

// Création du contexte
const TransactionsContext = createContext<TransactionsContextType | null>(null);

// Hook pour utiliser le contexte
export function useTransactionsContext() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error("useTransactionsContext doit être utilisé à l'intérieur d'un TransactionsProvider");
  }
  return context;
}

// Provider du contexte
export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [refreshingTransactions, setRefreshingTransactions] = useState(false);
  
  // Utiliser le hook useTransactions pour récupérer les données
  const { 
    loading: transactionsLoading, 
    refresh: refreshTransactions 
  } = useTransactions(activeTab);
  
  // Fonction optimisée pour rafraîchir les transactions
  const refresh = useCallback(async () => {
    if (!profile) return;
    
    setRefreshingTransactions(true);
    
    try {
      await refreshTransactions();
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des transactions:", error);
    } finally {
      // Ajouter un petit délai pour l'animation
      setTimeout(() => {
        setRefreshingTransactions(false);
      }, 500);
    }
  }, [profile, refreshTransactions]);
  
  // Valeur du contexte
  const value = {
    loading: transactionsLoading,
    refreshingTransactions,
    activeTab,
    setActiveTab,
    refresh
  };
  
  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
} 