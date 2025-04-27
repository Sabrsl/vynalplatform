import { Transaction } from "@/app/dashboard/transactions/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionsList({ transactions, isLoading }: TransactionsListProps) {
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
              <div className="h-4 w-36 bg-gray-200 rounded"></div>
              <div className="h-4 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-center items-center min-h-[200px]">
            <p className="text-gray-500">Aucune transaction à afficher</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.created_at), "dd MMMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <TransactionTypeBadge type={transaction.type} />
                </TableCell>
                <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <TransactionStatusBadge status={transaction.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TransactionTypeBadge({ type }: { type: string }) {
  const getTypeProps = () => {
    switch (type) {
      case "deposit":
        return { label: "Dépôt", variant: "outline" as const };
      case "withdrawal":
        return { label: "Retrait", variant: "outline" as const };
      case "payment":
        return { label: "Paiement", variant: "outline" as const };
      case "refund":
        return { label: "Remboursement", variant: "outline" as const };
      default:
        return { label: type, variant: "outline" as const };
    }
  };

  const { label, variant } = getTypeProps();

  return <Badge variant={variant}>{label}</Badge>;
}

function TransactionStatusBadge({ status }: { status: string }) {
  const getStatusProps = () => {
    switch (status) {
      case "pending":
        return { label: "En attente", variant: "secondary" as const };
      case "completed":
        return { label: "Terminé", variant: "success" as const };
      case "failed":
        return { label: "Échoué", variant: "destructive" as const };
      default:
        return { label: status, variant: "outline" as const };
    }
  };

  const { label, variant } = getStatusProps();

  return <Badge variant={variant}>{label}</Badge>;
} 