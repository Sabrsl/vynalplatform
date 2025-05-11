"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase/client";
import { getCachedData, setCachedData, CACHE_EXPIRY, CACHE_KEYS } from "@/lib/optimizations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Database, Terminal, Settings, Wallet, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminToolsPage() {
  const { isAdmin } = useUser();
  const router = useRouter();
  
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState<string>("");
  const [processingMin, setProcessingMin] = useState<boolean>(false);
  const [processingFunctions, setProcessingFunctions] = useState<boolean>(false);
  
  // Récupérer le montant minimum de retrait actuel au chargement
  useEffect(() => {
    const fetchMinWithdrawalAmount = async () => {
      try {
        // Vérifier d'abord le cache
        const cachedAmount = getCachedData<string>(CACHE_KEYS.ADMIN_MIN_WITHDRAWAL);
        if (cachedAmount !== null) {
          setMinWithdrawalAmount(cachedAmount);
          return;
        }
        
        // Si pas de cache valide, récupérer depuis l'API
        const response = await fetch("/api/wallet/get-min-withdrawal");
        if (response.ok) {
          const data = await response.json();
          if (data.amount) {
            setMinWithdrawalAmount(data.amount.toString());
            
            // Mettre en cache avec une durée d'une semaine (configuration quasi-statique)
            setCachedData(
              CACHE_KEYS.ADMIN_MIN_WITHDRAWAL, 
              data.amount.toString(), 
              { expiry: CACHE_EXPIRY.WEEK, priority: 'low' }
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du montant minimum:", error);
      }
    };
    
    fetchMinWithdrawalAmount();
  }, []);
  
  // Rediriger vers le dashboard si l'utilisateur n'est pas admin (via useEffect pour éviter les tâches longues)
  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, router]);
  
  // Si l'utilisateur n'est pas administrateur, ne rien afficher pendant la redirection
  if (!isAdmin) {
    return null;
  }
  
  // Mettre à jour le montant minimum de retrait
  const handleUpdateMinWithdrawal = async () => {
    try {
      setProcessingMin(true);
      
      // Validation
      const amount = parseFloat(minWithdrawalAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Veuillez entrer un montant valide");
        return;
      }
      
      // Appel API
      const response = await fetch("/api/wallet/update-min-withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Une erreur s'est produite");
      }
      
      // Mettre à jour le cache avec le système centralisé
      setCachedData(
        CACHE_KEYS.ADMIN_MIN_WITHDRAWAL, 
        amount.toString(), 
        { expiry: CACHE_EXPIRY.WEEK, priority: 'low' }
      );
      
      toast.success(data.message || "Montant minimum mis à jour avec succès");
      setMinWithdrawalAmount("");
      
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du montant minimum:", error);
      toast.error(error.message || "Une erreur s'est produite");
    } finally {
      setProcessingMin(false);
    }
  };
  
  // Installer les fonctions de base de données
  const handleInstallFunctions = async () => {
    try {
      setProcessingFunctions(true);
      
      // Appel API
      const response = await fetch("/api/db-functions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Une erreur s'est produite");
      }
      
      toast.success(data.message || "Fonctions installées avec succès");
      
    } catch (error: any) {
      console.error("Erreur lors de l'installation des fonctions:", error);
      toast.error(error.message || "Une erreur s'est produite");
    } finally {
      setProcessingFunctions(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Outils d'administration</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Configuration et outils pour la plateforme</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-500" />
              Gestion des paiements
            </CardTitle>
            <CardDescription>
              Configuration des montants et des limites pour les paiements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="minWithdrawal">Montant minimum de retrait (FCFA)</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="minWithdrawal"
                    type="number"
                    placeholder="Ex: 5000"
                    value={minWithdrawalAmount}
                    onChange={(e) => setMinWithdrawalAmount(e.target.value)}
                  />
                  <Button 
                    onClick={handleUpdateMinWithdrawal}
                    disabled={processingMin || !minWithdrawalAmount}
                  >
                    {processingMin ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Mettre à jour
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-1.5">
                  Cette action met à jour le montant minimum de retrait pour tous les wallets.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              Fonctions de base de données
            </CardTitle>
            <CardDescription>
              Installation et mise à jour des fonctions PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Installation des fonctions</Label>
                <p className="text-sm text-slate-500 mt-1.5 mb-3">
                  Installe les fonctions nécessaires pour le système de retrait et de gestion des wallets.
                </p>
                <Button 
                  onClick={handleInstallFunctions}
                  disabled={processingFunctions}
                  variant="outline"
                >
                  {processingFunctions ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Terminal className="h-4 w-4 mr-2" />
                  )}
                  Installer les fonctions
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Ces opérations doivent être exécutées par un administrateur uniquement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 