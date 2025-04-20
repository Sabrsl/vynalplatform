"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowDownUp, 
  Download, 
  Search, 
  Filter, 
  ShoppingCart, 
  CreditCard, 
  RefreshCcw, 
  Send,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Wallet,
  TrendingUp,
  Undo2
} from "lucide-react";
import { CURRENCY } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Types
type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  category: string;
  type: "payment" | "commission" | "withdrawal" | "refund";
  orderId?: string;
};

export default function PaymentsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const itemsPerPage = 15;
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx_1",
      date: "2023-11-20",
      description: "Paiement pour service de design logo",
      amount: -35000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023112001"
    },
    {
      id: "tx_2",
      date: "2023-11-18",
      description: "Commission sur service de développement web",
      amount: -1500,
      status: "completed",
      category: "Commissions",
      type: "commission",
      orderId: "ORD-2023111802"
    },
    {
      id: "tx_3",
      date: "2023-11-15",
      description: "Paiement reçu pour service de traduction",
      amount: 25000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023111503"
    },
    {
      id: "tx_4",
      date: "2023-11-12",
      description: "Retrait vers compte bancaire",
      amount: -75000,
      status: "completed",
      category: "Retraits",
      type: "withdrawal"
    },
    {
      id: "tx_5",
      date: "2023-11-10",
      description: "Paiement pour service de rédaction",
      amount: -12000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023111004"
    },
    {
      id: "tx_6",
      date: "2023-11-08",
      description: "Remboursement partiel service de montage vidéo",
      amount: 8000,
      status: "completed",
      category: "Remboursements",
      type: "refund",
      orderId: "ORD-2023110805"
    },
    {
      id: "tx_7",
      date: "2023-11-05",
      description: "Paiement reçu pour service de conseil",
      amount: 45000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023110506"
    },
    {
      id: "tx_8",
      date: "2023-11-01",
      description: "Commission sur service de marketing",
      amount: -2250,
      status: "completed",
      category: "Commissions",
      type: "commission",
      orderId: "ORD-2023110107"
    },
    {
      id: "tx_9",
      date: "2023-10-28",
      description: "Paiement en attente pour service de formation",
      amount: -18500,
      status: "pending",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023102808"
    },
    {
      id: "tx_10",
      date: "2023-10-25",
      description: "Paiement reçu pour consultation",
      amount: 30000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023102509"
    },
    {
      id: "tx_11",
      date: "2023-10-20",
      description: "Paiement pour service de conception UX/UI",
      amount: -42000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023102010"
    },
    {
      id: "tx_12",
      date: "2023-10-15",
      description: "Commission sur service de référencement SEO",
      amount: -1800,
      status: "completed",
      category: "Commissions",
      type: "commission",
      orderId: "ORD-2023101511"
    },
    {
      id: "tx_13",
      date: "2023-10-10",
      description: "Paiement reçu pour service de montage vidéo",
      amount: 28000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023101012"
    },
    {
      id: "tx_14",
      date: "2023-10-05",
      description: "Retrait vers Orange Money",
      amount: -50000,
      status: "completed",
      category: "Retraits",
      type: "withdrawal"
    },
    {
      id: "tx_15",
      date: "2023-10-01",
      description: "Paiement pour service de community management",
      amount: -15000,
      status: "completed",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023100113"
    },
    {
      id: "tx_16",
      date: "2023-09-28",
      description: "Remboursement service de design non conforme",
      amount: 12000,
      status: "completed",
      category: "Remboursements",
      type: "refund",
      orderId: "ORD-2023092814"
    },
    {
      id: "tx_17",
      date: "2023-09-20",
      description: "Paiement en attente pour service de copywriting",
      amount: -8500,
      status: "pending",
      category: "Paiements",
      type: "payment",
      orderId: "ORD-2023092015"
    }
  ]);

  // Réinitialise la page courante quand on change de filtre ou de recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, activeTab]);

  // Filter transactions based on search term and filter type
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "payment") return matchesSearch && transaction.type === "payment";
    if (filter === "commission") return matchesSearch && transaction.type === "commission";
    if (filter === "withdrawal") return matchesSearch && transaction.type === "withdrawal";
    if (filter === "refund") return matchesSearch && transaction.type === "refund";
    if (filter === "pending") return matchesSearch && transaction.status === "pending";
    
    return matchesSearch;
  });

  // Filter transactions based on active tab
  const tabFilteredTransactions = activeTab === "all" 
    ? filteredTransactions 
    : filteredTransactions.filter(tx => tx.type === activeTab);

  // Pagination
  const totalPages = Math.ceil(tabFilteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = tabFilteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Get status style based on transaction status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50";
      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/50";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800/30 dark:border-slate-700";
    }
  };

  // Get amount style based on transaction type
  const getAmountStyle = (amount: number) => {
    return amount >= 0 
      ? "text-emerald-600 font-medium dark:text-emerald-400" 
      : "text-vynal-purple-light font-medium dark:text-vynal-accent-primary";
  };

  // Get icon based on transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <ShoppingCart className="h-4 w-4 text-vynal-accent-secondary dark:text-vynal-accent-primary" />;
      case "commission":
        return <CreditCard className="h-4 w-4 text-vynal-purple-secondary dark:text-vynal-purple-secondary" />;
      case "withdrawal":
        return <Send className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case "refund":
        return <RefreshCcw className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  // Get status icon based on transaction status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll en haut du tableau quand on change de page
    window.scrollTo({
      top: document.getElementById('transactions-table')?.offsetTop || 0,
      behavior: 'smooth'
    });
  };

  // Calculer les statistiques financières
  const totalBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalCommissions = transactions
    .filter(tx => tx.type === "commission")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const totalRefunds = transactions
    .filter(tx => tx.type === "refund")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 pb-8 sm:pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <h1 className="text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
            Historique des transactions
          </h1>
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
            Suivez tous vos paiements, commissions et remboursements de services sur la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Solde Card */}
          <Card className="overflow-hidden border border-vynal-accent-primary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-primary/20 before:via-vynal-accent-primary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-primary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Solde disponible</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {formatPrice(totalBalance)}
              </div>
              <div className="flex items-center mt-1">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary mr-1"></div>
                <p className="text-[10px] sm:text-xs text-vynal-accent-secondary dark:text-emerald-400 truncate">
                  Solde actuel
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Commissions Card */}
          <Card className="overflow-hidden border border-vynal-accent-secondary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-accent-secondary/20 before:via-vynal-accent-secondary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-vynal-accent-secondary/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-secondary/40 to-vynal-accent-secondary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-secondary dark:text-vynal-accent-secondary" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Commissions</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {formatPrice(totalCommissions)}
              </div>
              <div className="flex items-center mt-1">
                <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-accent-secondary/30 to-vynal-accent-secondary/20 text-vynal-accent-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-vynal-accent-secondary truncate">
                  Total prélevé
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remboursements Card */}
          <Card className="overflow-hidden border border-vynal-purple-secondary/20 shadow-sm bg-white relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-vynal-purple-secondary/20 before:via-vynal-purple-secondary/10 before:to-white before:rounded-lg dark:bg-vynal-purple-dark/20 dark:before:from-amber-400/20 dark:before:via-vynal-purple-secondary/10 dark:before:to-transparent hover:shadow-md transition-shadow duration-300 col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 pt-2 sm:px-6 sm:pt-6 relative z-10">
              <CardTitle className="text-xs sm:text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <div className="mr-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-vynal-purple-secondary/40 to-vynal-purple-secondary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
                    <Undo2 className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-amber-400" />
                  </div>
                  <span className="truncate text-vynal-purple-light dark:text-vynal-text-primary">Remboursements</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6 relative z-10">
              <div className="text-lg sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                {formatPrice(totalRefunds)}
              </div>
              <div className="flex items-center mt-1">
                <div className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 text-vynal-purple-secondary rounded-md dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 dark:text-amber-400 truncate">
                  Total reversé
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Empty 4th card placeholder for grid alignment when lg screen */}
          <Card className="overflow-hidden border border-transparent shadow-none bg-transparent relative hover:shadow-none transition-none lg:block hidden">
          </Card>
        </div>

        <Card className="border border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm overflow-hidden bg-white dark:bg-vynal-purple-dark/20">
          <CardHeader className="pb-0 p-3 sm:p-6">
            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-vynal-accent-secondary dark:text-vynal-accent-primary" />
                <CardTitle className="text-lg font-semibold text-vynal-purple-light dark:text-vynal-text-primary">
                  Transactions
                </CardTitle>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    className="pl-8 border-vynal-border dark:border-vynal-purple-secondary/40 text-sm bg-white dark:bg-vynal-purple-secondary/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="border-vynal-border dark:border-vynal-purple-secondary/40 w-full md:w-[140px] bg-white dark:bg-vynal-purple-secondary/10">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                        <SelectValue placeholder="Tous" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="payment">Paiements</SelectItem>
                      <SelectItem value="commission">Commissions</SelectItem>
                      <SelectItem value="withdrawal">Retraits</SelectItem>
                      <SelectItem value="refund">Remboursements</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="border-vynal-border dark:border-vynal-purple-secondary/40 bg-white dark:bg-vynal-purple-secondary/10">
                    <Download className="h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-3 sm:p-6">
            <Tabs 
              defaultValue="all" 
              className="w-full"
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                setCurrentPage(1);
              }}
            >
              <div className="overflow-x-auto pb-1">
                <TabsList className="mb-4 inline-flex bg-gray-100 dark:bg-vynal-purple-secondary/20 rounded-md">
                  <TabsTrigger 
                    value="all" 
                    className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-vynal-purple-secondary/60 data-[state=active]:text-vynal-purple-light dark:data-[state=active]:text-vynal-accent-primary"
                  >
                    Tous
                  </TabsTrigger>
                  <TabsTrigger 
                    value="payment"
                    className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-vynal-purple-secondary/60 data-[state=active]:text-vynal-purple-light dark:data-[state=active]:text-vynal-accent-primary"
                  >
                    Paiements
                  </TabsTrigger>
                  <TabsTrigger 
                    value="commission"
                    className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-vynal-purple-secondary/60 data-[state=active]:text-vynal-purple-light dark:data-[state=active]:text-vynal-accent-primary"
                  >
                    Commissions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="withdrawal"
                    className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-vynal-purple-secondary/60 data-[state=active]:text-vynal-purple-light dark:data-[state=active]:text-vynal-accent-primary"
                  >
                    Retraits
                  </TabsTrigger>
                  <TabsTrigger 
                    value="refund"
                    className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-vynal-purple-secondary/60 data-[state=active]:text-vynal-purple-light dark:data-[state=active]:text-vynal-accent-primary"
                  >
                    Remboursements
                  </TabsTrigger>
                </TabsList>
              </div>

              <div id="transactions-table" className="rounded-md border border-vynal-border dark:border-vynal-purple-secondary/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50 dark:bg-vynal-purple-secondary/20 dark:hover:bg-vynal-purple-secondary/20 border-vynal-border dark:border-vynal-purple-secondary/40">
                        {!isMobile && <TableHead className="w-[110px] text-vynal-purple-secondary dark:text-vynal-text-secondary/70">Date</TableHead>}
                        <TableHead className={`${isMobile ? 'w-auto' : 'w-[45%]'} text-vynal-purple-secondary dark:text-vynal-text-secondary/70`}>Description</TableHead>
                        {!isMobile && <TableHead className="text-vynal-purple-secondary dark:text-vynal-text-secondary/70">Type</TableHead>}
                        <TableHead className="text-vynal-purple-secondary dark:text-vynal-text-secondary/70">Statut</TableHead>
                        <TableHead className="text-right text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
                          <div className="flex items-center justify-end">
                            Montant
                            <ArrowDownUp className="ml-2 h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary/70" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isMobile ? 3 : 5} className="text-center h-32 text-vynal-purple-secondary dark:text-vynal-text-secondary">
                            Aucune transaction à afficher
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedTransactions.map((transaction) => (
                          <TableRow 
                            key={transaction.id} 
                            className="hover:bg-gray-50 dark:hover:bg-vynal-purple-secondary/10 border-vynal-border dark:border-vynal-purple-secondary/40 cursor-pointer"
                          >
                            {!isMobile && (
                              <TableCell className="font-medium text-vynal-purple-light dark:text-vynal-text-secondary">
                                {formatDate(transaction.date)}
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-vynal-purple-light dark:text-vynal-text-primary">
                                  {transaction.description}
                                </span>
                                {isMobile && (
                                  <span className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mt-1">
                                    {formatDate(transaction.date)} {getTransactionIcon(transaction.type)}
                                  </span>
                                )}
                                {transaction.orderId && (
                                  <span className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mt-1">
                                    Commande #{transaction.orderId}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <div className="flex items-center">
                                  {getTransactionIcon(transaction.type)}
                                  <span className="ml-1.5 text-vynal-purple-secondary dark:text-vynal-text-secondary">
                                    {transaction.type === "payment" ? "Paiement" : 
                                     transaction.type === "commission" ? "Commission" : 
                                     transaction.type === "withdrawal" ? "Retrait" : "Remboursement"}
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <span className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs border flex items-center w-fit ${getStatusStyle(transaction.status)}`}>
                                {getStatusIcon(transaction.status)}
                                {transaction.status === "completed" ? "Effectué" : 
                                 transaction.status === "pending" ? "En attente" : "Échoué"}
                              </span>
                            </TableCell>
                            <TableCell className={`text-right ${getAmountStyle(transaction.amount)}`}>
                              {formatPrice(transaction.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 p-0 border-vynal-border dark:border-vynal-purple-secondary/40 bg-white dark:bg-vynal-purple-secondary/10"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronFirst className="h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 p-0 border-vynal-border dark:border-vynal-purple-secondary/40 bg-white dark:bg-vynal-purple-secondary/10"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                  </Button>
                  
                  <div className="flex items-center">
                    <span className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
                      Page {currentPage} sur {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 p-0 border-vynal-border dark:border-vynal-purple-secondary/40 bg-white dark:bg-vynal-purple-secondary/10"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 p-0 border-vynal-border dark:border-vynal-purple-secondary/40 bg-white dark:bg-vynal-purple-secondary/10"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronLast className="h-4 w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                  </Button>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 