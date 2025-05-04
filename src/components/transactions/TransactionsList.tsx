import { Transaction } from "@/app/dashboard/transactions/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionsList({ transactions, isLoading }: TransactionsListProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-vynal-purple-secondary/5 dark:from-vynal-purple-dark/50 dark:to-vynal-purple-dark/30 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-3 sm:p-4">
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-pulse space-y-2">
              <div className="h-3 w-48 bg-vynal-purple-secondary/30 rounded"></div>
              <div className="h-3 w-36 bg-vynal-purple-secondary/30 rounded"></div>
              <div className="h-3 w-40 bg-vynal-purple-secondary/30 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-vynal-purple-secondary/5 dark:from-vynal-purple-dark/50 dark:to-vynal-purple-dark/30 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-3 sm:p-4">
          <div className="flex justify-center items-center min-h-[200px]">
            <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucune transaction à afficher</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile View - Bento Cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((transaction) => (
          <Card 
            key={transaction.id}
            className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-vynal-purple-secondary/5 dark:from-vynal-purple-dark/50 dark:to-vynal-purple-dark/30 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                    {transaction.description}
                  </p>
                  <p className="text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary">
                    {format(new Date(transaction.created_at), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={cn(
                    "text-xs font-medium",
                    transaction.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {formatCurrency(transaction.amount)}
                  </span>
                  <div className="flex gap-1">
                    <TransactionTypeBadge type={transaction.type} />
                    <TransactionStatusBadge status={transaction.status} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block">
        <Card className="rounded-2xl border border-vynal-purple-secondary/10 bg-gradient-to-br from-white to-vynal-purple-secondary/5 dark:from-vynal-purple-dark/50 dark:to-vynal-purple-dark/30 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Date</TableHead>
                  <TableHead className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Description</TableHead>
                  <TableHead className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Type</TableHead>
                  <TableHead className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Montant</TableHead>
                  <TableHead className="text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-vynal-purple-secondary/5">
                    <TableCell className="text-xs py-2">
                      {format(new Date(transaction.created_at), "dd MMMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-xs py-2">{transaction.description}</TableCell>
                    <TableCell className="text-xs py-2">
                      <TransactionTypeBadge type={transaction.type} />
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs py-2 font-medium",
                      transaction.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-xs py-2">
                      <TransactionStatusBadge status={transaction.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TransactionTypeBadge({ type }: { type: string }) {
  const getTypeProps = () => {
    switch (type) {
      case "deposit":
        return { label: "Dépôt", variant: "outline" as const, className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" };
      case "withdrawal":
        return { label: "Retrait", variant: "outline" as const, className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50" };
      case "payment":
        return { label: "Paiement", variant: "outline" as const, className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50" };
      case "refund":
        return { label: "Remboursement", variant: "outline" as const, className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50" };
      default:
        return { label: type, variant: "outline" as const, className: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-100 dark:border-gray-900/50" };
    }
  };

  const { label, className } = getTypeProps();

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${className}`}>
      {label}
    </span>
  );
}

function TransactionStatusBadge({ status }: { status: string }) {
  const getStatusProps = () => {
    switch (status) {
      case "pending":
        return { label: "En attente", className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50" };
      case "completed":
        return { label: "Terminé", className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-900/50" };
      case "failed":
        return { label: "Échoué", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50" };
      default:
        return { label: status, className: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-100 dark:border-gray-900/50" };
    }
  };

  const { label, className } = getStatusProps();

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${className}`}>
      {label}
    </span>
  );
} 