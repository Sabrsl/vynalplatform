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
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucune transaction à afficher</p>
      </div>
    );
  }
  
  if (!loading && searchTerm && filteredTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun résultat pour "{searchTerm}"</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {loading && transactions.length === 0 && (
        Array(3).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      {loading && transactions.length > 0 && (
        <div className="text-center py-2">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2 align-[-0.125em]"></div>
          <span className="text-sm text-muted-foreground">Mise à jour des données...</span>
        </div>
      )}
      
      {filteredTransactions.map((transaction) => (
        <Card key={transaction.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none tracking-tight">
                    {transaction.description || `Transaction ${transaction.id.substring(0, 8)}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(transaction.created_at)} · Réf: {transaction.reference_id || transaction.id.substring(0, 8)}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={cn("font-medium", getAmountColor(transaction.type))}>
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
  switch (status) {
    case 'completed':
      return <Badge variant="success">Terminé</Badge>;
    case 'pending':
      return <Badge variant="warning">En attente</Badge>;
    case 'failed':
      return <Badge variant="destructive">Échoué</Badge>;
    default:
      return null;
  }
}

function getAmountColor(type: Transaction['type']) {
  switch (type) {
    case 'deposit':
    case 'earning':
      return 'text-green-600 dark:text-green-500';
    case 'withdrawal':
    case 'payment':
      return 'text-red-600 dark:text-red-500';
    default:
      return 'text-foreground';
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