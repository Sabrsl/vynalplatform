"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User, Calendar, AlertTriangle } from "lucide-react";

interface CancellationData {
  id: string;
  order_id: string;
  reason: string;
  cancelled_by: string;
  cancelled_at: string;
  created_at: string;
  order: {
    order_number: string;
    client: {
      full_name: string;
      username: string;
    };
    freelance: {
      full_name: string;
      username: string;
    };
    service: {
      title: string;
    };
  };
  canceller: {
    full_name: string;
    username: string;
    role: string;
  };
}

export default function CancellationsPage() {
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const [cancellations, setCancellations] = useState<CancellationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCancellations() {
      if (!user || !isAdmin) return;

      try {
        const { data, error } = await supabase
          .from('order_cancellations')
          .select(`
            *,
            order: orders (
              order_number,
              client: profiles!client_id (*),
              freelance: profiles!freelance_id (*),
              service: services (*)
            ),
            canceller: profiles!cancelled_by (*)
          `)
          .order('cancelled_at', { ascending: false });

        if (error) throw error;
        
        setCancellations(data || []);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des annulations:", err);
        setError("Impossible de charger les données d'annulation");
        setLoading(false);
      }
    }

    fetchCancellations();
  }, [user, isAdmin]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 text-vynal-accent-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
              </p>
              <Button asChild>
                <Link href="/admin-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au tableau de bord
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link href="/admin-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mb-2">Historique des annulations de commandes</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Consultez les raisons d'annulation des commandes sur la plateforme.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Annulations récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {cancellations.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-slate-600 dark:text-slate-400">Aucune annulation trouvée.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Annulée par</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancellations.map((cancellation) => (
                  <TableRow key={cancellation.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        {format(new Date(cancellation.cancelled_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {cancellation.order?.service?.title || "Service inconnu"}
                        </span>
                        <span className="text-xs text-slate-500">
                          #{cancellation.order?.order_number?.substring(0, 8) || cancellation.order_id.substring(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-slate-400" />
                        <div>
                          <span>{cancellation.canceller?.full_name || cancellation.cancelled_by.substring(0, 8)}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {cancellation.canceller?.role === 'client' ? 'Client' : 
                             cancellation.canceller?.role === 'freelance' ? 'Freelance' : 'Admin'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={cancellation.reason}>
                        {cancellation.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin-dashboard/orders/${cancellation.order_id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Détails
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 