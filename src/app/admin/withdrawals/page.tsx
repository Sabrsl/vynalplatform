"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Heading } from "@/components/headings/Heading";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { getCachedData, setCachedData, CACHE_EXPIRY, CACHE_KEYS } from "@/lib/optimizations";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader, Check, X, RefreshCw, AlertCircle, CheckCircle, DollarSign, MoreHorizontal, CreditCard, Filter } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Types pour les demandes de retrait
interface WithdrawalRequest {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';
  notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  payment_reference: string | null;
  profile?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

// Composant principal
export default function WithdrawalsAdminPage() {
  const { isAdmin } = useUser();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "process" | null>(null);
  
  // Charger les demandes de retrait
  const fetchWithdrawals = useCallback(async (forceFetch = false) => {
    setIsLoading(true);
    try {
      // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
      if (!forceFetch) {
        const cachedData = getCachedData<WithdrawalRequest[]>(CACHE_KEYS.ADMIN_WITHDRAWALS);
        if (cachedData) {
          setWithdrawals(cachedData);
          setIsLoading(false);
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profile:user_id (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setWithdrawals(data || []);
      
      // Mettre en cache le résultat avec une durée maximale (invalidation manuelle)
      setCachedData(
        CACHE_KEYS.ADMIN_WITHDRAWALS, 
        data || [], 
        { expiry: CACHE_EXPIRY.LONG, priority: 'high' }
      );
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de retrait:', error);
      toast.error('Impossible de charger les demandes de retrait');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fonction pour forcer le rafraîchissement des données
  const handleRefresh = () => {
    // Forcer le rafraîchissement
    fetchWithdrawals(true);
    
    // Invalider explicitement le cache
    setCachedData(
      CACHE_KEYS.ADMIN_WITHDRAWALS,
      null,
      { expiry: 0 } // Expiration immédiate = invalidation
    );
    
    toast.success('Données actualisées');
  };
  
  // Fonction pour invalider le cache des retraits
  const invalidateWithdrawalsCache = () => {
    // Invalider le cache
    setCachedData(
      CACHE_KEYS.ADMIN_WITHDRAWALS,
      null,
      { expiry: 0 }
    );
    
    // Déclencher un événement pour informer les autres composants
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:withdrawals-updated'));
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
        detail: { key: CACHE_KEYS.ADMIN_WITHDRAWALS }
      }));
    }
  };
  
  // Écouter les événements de mise à jour des retraits
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleWithdrawalsUpdated = () => {
        console.log('Demandes de retrait mises à jour, rafraîchissement...');
        fetchWithdrawals(true);
      };
      
      // Ajouter l'écouteur d'événements
      window.addEventListener('vynal:withdrawals-updated', handleWithdrawalsUpdated);
      window.addEventListener('vynal:cache-invalidated', handleWithdrawalsUpdated);
      
      // Nettoyer l'écouteur lors du démontage
      return () => {
        window.removeEventListener('vynal:withdrawals-updated', handleWithdrawalsUpdated);
        window.removeEventListener('vynal:cache-invalidated', handleWithdrawalsUpdated);
      };
    }
  }, [fetchWithdrawals]);
  
  // Vérifier l'accès administrateur
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    fetchWithdrawals();
  }, [isAdmin, router, fetchWithdrawals]);
  
  // Si l'utilisateur n'est pas administrateur, ne rien afficher pendant la redirection
  if (!isAdmin) {
    return null;
  }
  
  // Filtrer les demandes en fonction de l'onglet actif
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (activeTab === 'pending') {
      return withdrawal.status === 'pending';
    } else if (activeTab === 'processed') {
      return ['approved', 'processed'].includes(withdrawal.status);
    } else if (activeTab === 'rejected') {
      return withdrawal.status === 'rejected';
    }
    return true; // 'all' tab
  });
  
  // Formatage des montants
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`;
  };
  
  // Formatage des dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy à HH:mm', { locale: fr });
  };
  
  // Gérer l'approbation d'une demande
  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    
    setProcessingAction(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          notes: 'Demande approuvée par l\'administrateur',
          processed_by: userId,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);
        
      if (error) {
        throw error;
      }
      
      toast.success('La demande a été approuvée avec succès');
      
      // Invalider le cache et rafraîchir les données
      invalidateWithdrawalsCache();
      fetchWithdrawals(true);
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la demande:', error);
      toast.error('Impossible d\'approuver la demande');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Gérer le rejet d'une demande
  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason) return;
    
    setProcessingAction(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      
      // 1. Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          notes: `Demande rejetée: ${rejectionReason}`,
          processed_by: userId,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);
        
      if (updateError) throw updateError;
      
      // Invalider le cache et rafraîchir les données
      invalidateWithdrawalsCache();
      fetchWithdrawals(true);
      
      toast.success('La demande a été rejetée');
      setDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
      toast.error('Impossible de rejeter la demande');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Gérer le traitement d'une demande
  const handleProcess = async () => {
    if (!selectedWithdrawal || !paymentReference) return;
    
    setProcessingAction(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      
      // Mettre à jour la demande comme traitée
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'processed',
          payment_reference: paymentReference,
          notes: `Paiement traité. Référence: ${paymentReference}`,
          processed_by: userId,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);
        
      if (error) throw error;
      
      // Invalider le cache et rafraîchir les données
      invalidateWithdrawalsCache();
      fetchWithdrawals(true);
      
      toast.success('Le paiement a été marqué comme traité');
      setDialogOpen(false);
      setPaymentReference('');
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      toast.error('Impossible de traiter le paiement');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Ouvrir le dialogue d'action
  const openActionDialog = (withdrawal: WithdrawalRequest, action: "approve" | "reject" | "process") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setDialogOpen(true);
    
    // Réinitialiser les champs
    setPaymentReference("");
    setRejectionReason("");
  };
  
  // Afficher le statut avec un badge coloré
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Approuvée</Badge>;
      case 'processed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Traitée</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejetée</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Afficher un message de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Chargement des demandes de retrait...</p>
        </div>
      </div>
    );
  }
  
  // Fonction pour afficher le tableau des demandes
  const WithdrawalsTable = memo(function WithdrawalsTable({ withdrawals, title }: { withdrawals: WithdrawalRequest[], title: string }) {
    if (withdrawals.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-slate-500">Aucune demande de retrait {title.toLowerCase()} pour le moment.</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {withdrawals.length} demande{withdrawals.length > 1 ? 's' : ''} de retrait {title.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Freelance</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="font-mono text-xs">{withdrawal.id.substring(0, 8)}...</TableCell>
                  <TableCell>{withdrawal.profile?.full_name || 'N/A'}</TableCell>
                  <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                  <TableCell>{formatAmount(withdrawal.amount)}</TableCell>
                  <TableCell>{formatAmount(withdrawal.net_amount)}</TableCell>
                  <TableCell>{withdrawal.payment_method}</TableCell>
                  <TableCell>{renderStatusBadge(withdrawal.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openActionDialog(withdrawal, 'approve')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => openActionDialog(withdrawal, 'reject')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      
                      {withdrawal.status === 'approved' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openActionDialog(withdrawal, 'process')}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Traiter
                        </Button>
                      )}
                      
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Détails de la demande</SheetTitle>
                            <SheetDescription>
                              Demande de retrait #{withdrawal.id.substring(0, 8)}
                            </SheetDescription>
                          </SheetHeader>
                          
                          <div className="space-y-4 mt-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-slate-500">Statut</p>
                                <div className="mt-1">{renderStatusBadge(withdrawal.status)}</div>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Date</p>
                                <p className="font-medium">{formatDate(withdrawal.created_at)}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-slate-500">Freelance</p>
                              <p className="font-medium">{withdrawal.profile?.full_name || 'N/A'}</p>
                              <p className="text-sm text-slate-500">{withdrawal.profile?.email || 'N/A'}</p>
                              {withdrawal.profile?.phone && (
                                <p className="text-sm text-slate-500">{withdrawal.profile.phone}</p>
                              )}
                            </div>
                            
                            <div className="border-t pt-4">
                              <p className="text-sm text-slate-500">Montant</p>
                              <p className="font-medium text-xl">{formatAmount(withdrawal.amount)}</p>
                              
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <p className="text-sm text-slate-500">Frais</p>
                                  <p className="font-medium">{formatAmount(withdrawal.fee_amount)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Net à verser</p>
                                  <p className="font-medium">{formatAmount(withdrawal.net_amount)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-slate-500">Méthode de paiement</p>
                              <p className="font-medium">{withdrawal.payment_method}</p>
                            </div>
                            
                            {withdrawal.notes && (
                              <div>
                                <p className="text-sm text-slate-500">Notes</p>
                                <p className="font-medium">{withdrawal.notes}</p>
                              </div>
                            )}
                            
                            {withdrawal.payment_reference && (
                              <div>
                                <p className="text-sm text-slate-500">Référence de paiement</p>
                                <p className="font-medium">{withdrawal.payment_reference}</p>
                              </div>
                            )}
                            
                            {withdrawal.processed_at && (
                              <div>
                                <p className="text-sm text-slate-500">Traité le</p>
                                <p className="font-medium">{formatDate(withdrawal.processed_at)}</p>
                              </div>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Heading title="Gestion des demandes de retrait" subtitle="Traitement des demandes de retrait des freelances" />
      
      <div className="flex justify-between items-center mb-6">
        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              En attente
              {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                <Badge className="ml-2 bg-yellow-500">{withdrawals.filter(w => w.status === 'pending').length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed">
              Traitées
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejetées
            </TabsTrigger>
            <TabsTrigger value="all">
              Toutes
            </TabsTrigger>
          </TabsList>
          
          <div className="flex justify-end my-4">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
          
          <TabsContent value="pending" className="mt-4">
            <WithdrawalsTable withdrawals={filteredWithdrawals} title="En attente" />
          </TabsContent>
          
          <TabsContent value="processed" className="mt-4">
            <WithdrawalsTable withdrawals={filteredWithdrawals} title="Traitées" />
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-4">
            <WithdrawalsTable withdrawals={filteredWithdrawals} title="Rejetées" />
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            <WithdrawalsTable withdrawals={filteredWithdrawals} title="Toutes les demandes" />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialogue d'action */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && "Approuver la demande"}
              {actionType === 'reject' && "Rejeter la demande"}
              {actionType === 'process' && "Traiter la demande"}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && "Vous êtes sur le point d'approuver cette demande de retrait."}
              {actionType === 'reject' && "Vous êtes sur le point de rejeter cette demande de retrait. Les fonds seront remis dans le wallet de l'utilisateur."}
              {actionType === 'process' && "Confirmez que le paiement a été effectué pour cette demande de retrait."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Montant</p>
                  <p className="font-medium">{formatAmount(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Frais</p>
                  <p className="font-medium">{formatAmount(selectedWithdrawal.fee_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Net à verser</p>
                  <p className="font-medium">{formatAmount(selectedWithdrawal.net_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Méthode</p>
                  <p className="font-medium">{selectedWithdrawal.payment_method}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Freelance</p>
                  <p className="font-medium">{selectedWithdrawal.profile?.full_name || 'N/A'}</p>
                </div>
              </div>
              
              {actionType === 'reject' && (
                <div className="mb-4">
                  <Label htmlFor="rejectionReason">Motif du rejet</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Veuillez fournir un motif pour le rejet de cette demande"
                    className="mt-1"
                  />
                </div>
              )}
              
              {actionType === 'process' && (
                <div className="mb-4">
                  <Label htmlFor="paymentReference">Référence de paiement</Label>
                  <Input
                    id="paymentReference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ex: TR-123456 ou référence du virement"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processingAction}>
              Annuler
            </Button>
            {actionType === 'approve' && (
              <Button onClick={handleApprove} disabled={processingAction}>
                {processingAction && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Approuver
              </Button>
            )}
            {actionType === 'reject' && (
              <Button variant="destructive" onClick={handleReject} disabled={processingAction || !rejectionReason}>
                {processingAction && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Rejeter
              </Button>
            )}
            {actionType === 'process' && (
              <Button onClick={handleProcess} disabled={processingAction || !paymentReference}>
                {processingAction && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Confirmer le paiement
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 