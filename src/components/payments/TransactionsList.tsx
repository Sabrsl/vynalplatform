"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  reference_id?: string | null;
}

interface TransactionsListProps {
  transactions: Transaction[];
  loading: boolean;
  searchTerm?: string;
}

export function TransactionsList({ transactions, loading, searchTerm }: TransactionsListProps) {
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions || [];
    
    const search = searchTerm.toLowerCase();
    return (transactions || []).filter((transaction) => {
      return (
        transaction.id.toLowerCase().includes(search) ||
        (transaction.description && transaction.description.toLowerCase().includes(search)) ||
        (transaction.reference_id && transaction.reference_id.toLowerCase().includes(search)) ||
        transaction.type.toLowerCase().includes(search) ||
        transaction.status.toLowerCase().includes(search)
      );
    });
  }, [transactions, searchTerm]);
  
  if (!loading && (!transactions || transactions.length === 0)) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucune transaction à afficher</p>
      </div>
    );
  }
  
  if (!loading && searchTerm && filteredTransactions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucun résultat pour "{searchTerm}"</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {loading && transactions.length === 0 && (
        Array(3).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden border border-vynal-purple-secondary/10 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      {loading && transactions.length > 0 && (
        <div className="text-center py-2">
          <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-1.5 align-[-0.125em]"></div>
          <span className="text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary">Mise à jour des données...</span>
        </div>
      )}
      
      {filteredTransactions.map((transaction) => (
        <Card 
          key={transaction.id} 
          className="overflow-hidden border border-vynal-purple-secondary/10 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white dark:bg-vynal-purple-dark/10"
        >
          <CardContent className="p-0">
            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-medium leading-none tracking-tight text-vynal-purple-light dark:text-vynal-text-primary">
                    {transaction.description || `Transaction ${transaction.id.substring(0, 8)}`}
                  </h3>
                  <p className="text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary">
                    {formatDate(transaction.created_at)} · Réf: {transaction.reference_id || transaction.id.substring(0, 8)}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1.5">
                  <span className={cn("text-xs font-medium", getAmountColor(transaction.type))}>
                    {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
                  </span>
                  <TransactionStatusBadge status={transaction.status} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TransactionStatusBadge({ status }: { status: Transaction['status'] }) {
  const baseClasses = "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium";
  
  switch (status) {
    case 'completed':
      return (
        <span className={`${baseClasses} bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-900/50`}>
          Terminé
        </span>
      );
    case 'pending':
      return (
        <span className={`${baseClasses} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50`}>
          En attente
        </span>
      );
    case 'failed':
      return (
        <span className={`${baseClasses} bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50`}>
          Échoué
        </span>
      );
    default:
      return null;
  }
}

function getAmountColor(type: Transaction['type']) {
  switch (type) {
    case 'deposit':
    case 'earning':
      return 'text-green-600 dark:text-green-400';
    case 'withdrawal':
    case 'payment':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-vynal-purple-light dark:text-vynal-text-primary';
  }
}

function getAmountPrefix(type: Transaction['type']) {
  switch (type) {
    case 'deposit':
    case 'earning':
      return '+';
    case 'withdrawal':
    case 'payment':
      return '-';
    default:
      return '';
  }
} 