"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Check, FileText, Home, AlertCircle, ArrowLeft, ArrowRight, Smartphone, Clock, User, Calendar, FileArchive, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast as hotToast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import { PaymentMethodType } from "@/lib/constants/payment";

interface OrderSummaryProps {
  service: {
    title: string;
    description: string;
    price: number;
    delivery_time: number;
    images?: string[];
    profiles?: {
      username?: string;
    };
  };
  requirements: string;
  files: File[];
  paymentMethod: PaymentMethodType;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
  error?: string | null;
  isTestMode?: boolean;
  orderId: string;
  orderNumber?: string;
  onClose: () => void;
}

export function OrderSummary({
  service,
  requirements,
  files,
  paymentMethod,
  onBack,
  onNext,
  loading = false,
  error = null,
  isTestMode = false,
  orderId,
  orderNumber,
  onClose
}: OrderSummaryProps) {
  const router = useRouter();
  
  // Effet pour s'assurer que l'ID de commande est valide
  useEffect(() => {
    if (!orderId) {
      console.error("ID de commande manquant dans le résumé de commande");
      hotToast.error("Une erreur est survenue avec votre commande");
      // Fermer automatiquement après 2 secondes si pas d'ID de commande
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [orderId, onClose]);
  
  const handleViewOrders = () => {
    try {
      router.push('/dashboard/orders');
      onClose();
    } catch (error) {
      console.error("Erreur lors de la redirection vers les commandes:", error);
      hotToast.error("Impossible de naviguer vers vos commandes");
    }
  };

  const handleBackClick = () => {
    onBack();
  };

  return (
    <>
      <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-vynal-purple-dark dark:to-vynal-purple-darkest p-4 rounded-t-lg border-b border-slate-200 dark:border-vynal-purple-secondary/30">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-vynal-text-primary mb-1">
            Commande confirmée
          </h2>
          <p className="text-sm text-slate-600 dark:text-vynal-text-secondary">
            {isTestMode ? 'Simulation de commande réussie' : 'Votre paiement a été effectué avec succès'}
          </p>
        </div>
      </div>
      
      <div className="space-y-6 py-4 px-4 bg-white dark:bg-vynal-purple-darkest">
        {/* Message de confirmation */}
        <div className="p-4 rounded-lg border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-700 dark:text-green-500">
              {isTestMode ? 'Commande de test enregistrée' : 'Commande confirmée'}
            </h3>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 leading-relaxed">
              {isTestMode 
                ? 'Cette commande de test a été créée avec succès et est disponible dans votre tableau de bord. Elle est clairement identifiée comme un test.' 
                : 'Votre paiement a été traité avec succès et le freelance a été notifié de votre commande.'}
            </p>
          </div>
        </div>
        
        {/* Message de mode test si activé */}
        {isTestMode && (
          <div className="p-3 bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-700 dark:text-amber-500">Mode Test activé</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1">
                  Cette commande a été créée en mode test. Elle est visible dans votre tableau de bord et celui du prestataire pour des fins de test.
                  Aucune transaction réelle n'a été effectuée.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Numéro de commande */}
        <div className="p-3 bg-slate-50 dark:bg-vynal-purple-secondary/10 rounded-lg border border-slate-200 dark:border-vynal-purple-secondary/30">
          <p className="text-xs text-slate-600 dark:text-vynal-text-secondary mb-1">Numéro de commande</p>
          <p className="text-sm font-mono font-medium text-slate-800 dark:text-vynal-accent-primary">{orderNumber || orderId}</p>
        </div>
        
        {/* Résumé du service commandé */}
        <div className="bg-slate-50 dark:bg-vynal-purple-secondary/10 rounded-lg p-4 border border-slate-200 dark:border-vynal-purple-secondary/30">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-vynal-purple-secondary/20">
              {service?.images && service.images.length > 0 ? (
                <Image 
                  src={service.images[0]} 
                  alt={service.title || "Service image"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-vynal-purple-secondary/30">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-vynal-accent-primary" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-1 text-slate-800 dark:text-vynal-text-primary">{service?.title}</h3>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary mt-1 line-clamp-1">
                Par <span className="font-medium">{service?.profiles?.username || "Vendeur"}</span>
              </p>
              <div className="flex items-center mt-1">
                <div className="text-base font-medium text-slate-900 dark:text-vynal-accent-primary">
                  {formatPrice(service?.price || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Détails de la commande */}
        <div className="bg-slate-50 dark:bg-vynal-purple-secondary/10 rounded-lg p-3 border border-slate-200 dark:border-vynal-purple-secondary/30">
          <h3 className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-2">Détails de la commande</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <User className="h-4 w-4 text-slate-600 dark:text-vynal-accent-primary mr-1.5" />
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">Prestataire:</p>
              <p className="text-xs font-medium text-slate-800 dark:text-vynal-text-primary ml-1.5">{service?.profiles?.username || "Vendeur"}</p>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-slate-600 dark:text-vynal-accent-primary mr-1.5" />
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">Délai de livraison:</p>
              <p className="text-xs font-medium text-slate-800 dark:text-vynal-text-primary ml-1.5">
                {service?.delivery_time || 3} jour(s)
              </p>
            </div>
            
            {files && files.length > 0 && (
              <div className="flex items-center">
                <FileArchive className="h-4 w-4 text-slate-600 dark:text-vynal-accent-primary mr-1.5" />
                <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">Fichiers joints:</p>
                <p className="text-xs font-medium text-slate-800 dark:text-vynal-text-primary ml-1.5">{files.length} fichier(s)</p>
              </div>
            )}
          </div>
          
          <Separator className="my-2 bg-slate-200 dark:bg-vynal-purple-secondary/30" />
          
          <div>
            <p className="text-xs text-slate-600 dark:text-vynal-text-secondary mb-1.5">Instructions:</p>
            <div className="text-xs text-slate-800 dark:text-vynal-text-primary p-1.5 bg-slate-100 dark:bg-vynal-purple-secondary/20 rounded-md max-h-16 overflow-y-auto">
              {requirements || "Aucune instruction spécifique"}
            </div>
          </div>
        </div>
        
        {/* Message d'erreurs */}
        {error && (
          <div className="bg-red-50 dark:bg-vynal-status-error/20 p-2 rounded-md flex items-start gap-2 text-red-600 dark:text-vynal-status-error text-xs border border-red-200 dark:border-vynal-status-error/30">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </>
  );
} 