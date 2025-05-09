"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/orders/FileUpload";
import { ArrowLeft, PackageOpen, AlertCircle, CheckCircle, Loader, SendHorizontal, RefreshCw } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache
} from '@/lib/optimizations/cache';
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { 
  generateOptimizedFilePath, 
  handleUploadWithRetries,
  preprocessFile 
} from '@/lib/workers/fileUploadWorker';

// Constantes locales pour le cache
const CACHE_KEYS = {
  ORDER_DETAILS: 'order_details_',
  DELIVERIES: 'deliveries_'
};

// Mise à jour des constantes locales de cache
const CACHE_EXPIRY = {
  ORDER_DETAILS: 5 * 60 * 1000, // 5 minutes
  DELIVERIES: 2 * 60 * 1000, // 2 minutes
  DASHBOARD_DATA: 5 * 60 * 1000 // 5 minutes
};

// Définition locale des priorités de cache
const CACHE_PRIORITIES = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

// Performance optimizations
import dynamic from 'next/dynamic';

// Loading fallbacks pour les chargements différés
const LoadingCard = memo(function LoadingCard() {
  return (
    <div className="animate-pulse p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
  );
});

// Chargement différé des composants lourds
const DynamicFileUpload = dynamic(() => import('@/components/orders/FileUpload').then(mod => mod.FileUpload), {
  loading: () => <LoadingCard />,
  ssr: false
});

// Définition de type pour les commandes plus stricte avec readonly
interface OrderDetails {
  readonly id: string;
  readonly created_at: string;
  readonly status: string;
  readonly service: {
    readonly id: string;
    readonly title: string;
    readonly price: number;
  };
  readonly freelance: {
    readonly id: string;
    readonly username: string;
    readonly full_name: string;
  };
  readonly client: {
    readonly id: string;
    readonly username: string;
    readonly full_name: string;
  };
  readonly requirements: string;
}

// Type d'état pour réduire les re-rendus et améliorer la maintenabilité
interface OrderState {
  readonly loading: boolean;
  readonly order: OrderDetails | null;
  readonly error: string | null;
  readonly deliveryProcessing: boolean;
  readonly deliverySuccess: boolean;
  readonly silentLoading: boolean;
}

// Sous-composants memoized pour réduire les re-rendus inutiles
const OrderDetailCard = memo(function OrderDetailCard({ order }: { order: OrderDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails de la commande</CardTitle>
        <CardDescription>
          Commande #{order.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">{order.service.title}</h3>
          <p className="text-sm text-slate-500">
            Client: {order.client.full_name || order.client.username}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-1">Instructions du client:</h4>
          <div className="text-sm text-slate-600 border p-3 rounded-md bg-slate-50">
            {order.requirements || "Aucune instruction spécifique"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const DeliveryForm = memo(function DeliveryForm({
  message,
  error,
  onMessageChange,
  onFilesChange,
  onSubmit,
  isSubmitDisabled,
  isProcessing
}: {
  message: string;
  error: string | null;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFilesChange: (files: FileList | null) => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  isProcessing: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Livraison</CardTitle>
        <CardDescription>
          Préparez et envoyez votre travail final
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 text-red-700 text-sm mb-4">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="message">Message pour le client</Label>
          <Textarea
            id="message"
            placeholder="Décrivez ce que vous avez réalisé, comment utiliser les fichiers, etc."
            rows={4}
            value={message}
            onChange={onMessageChange}
          />
        </div>
        
        <DynamicFileUpload
          onChange={onFilesChange}
          label="Fichiers à livrer"
          description="Téléversez tous les fichiers finaux pour le client"
          maxFiles={10}
          maxSize={50} // 50 Mo
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button 
          onClick={onSubmit} 
          className="w-full" 
          disabled={isSubmitDisabled}
        >
          {isProcessing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <SendHorizontal className="h-4 w-4 mr-2" />
              Envoyer la livraison
            </>
          )}
        </Button>
        <p className="text-xs text-center text-slate-500 mt-2">
          Une fois la livraison envoyée, le client pourra accepter votre travail ou demander des révisions si nécessaire.
        </p>
      </CardFooter>
    </Card>
  );
});

export default function DeliveryPage() {
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") || null;
  const { toast } = useToast();
  
  // États optimisés avec des types stricts
  const [state, setState] = useState<OrderState>({
    loading: true,
    order: null,
    error: null,
    deliveryProcessing: false,
    deliverySuccess: false,
    silentLoading: false
  });
  
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const debouncedMessage = useDebounce(message, 300);
  
  // Références optimisées
  const requestInProgressRef = useRef(false);
  const orderIdRef = useRef<string | null>(orderId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const filesRef = useRef<FileList | null>(null);
  const mountedRef = useRef(true); // Pour éviter les mises à jour sur un composant démonté

  // Memoized cache key avec dépendance minimale
  const cacheKey = useMemo(() => 
    orderId ? `order_detail_${orderId}` : null, 
    [orderId]
  );

  // Fonction pour mettre à jour l'état de manière immutable et sécurisée
  const safeSetState = useCallback((updater: (prev: OrderState) => OrderState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);

  // Optimisation: préparation de la requête Supabase pour réutilisation
  const getOrderQuery = useCallback((id: string, profileId: string) => {
    return supabase
      .from('orders')
      .select(`
        *,
        services (*),
        profiles!orders_client_id_fkey (id, username, full_name, avatar_url),
        freelance:profiles!orders_freelance_id_fkey (id, username, full_name, avatar_url)
      `)
      .eq('id', id)
      .eq('freelance_id', profileId)
      .single();
  }, []);

  // Memoized fonction pour charger les données avec optimisations avancées
  const fetchOrderDetails = useCallback(async (id: string, silent = false) => {
    // Vérifications préalables
    if (!id) {
      safeSetState(prev => ({ ...prev, error: "Identifiant de commande manquant", loading: false }));
      return;
    }
    
    if (!profile?.id) {
      console.warn("Tentative de chargement sans profil utilisateur");
      return;
    }
    
    // Protection contre les requêtes multiples avec verrouillage atomique
    if (requestInProgressRef.current && !silent) {
      console.warn("Requête déjà en cours, annulation");
      return;
    }
    
    // Gestion atomique de l'état de chargement
    if (!silent) {
      safeSetState(prev => ({ ...prev, loading: true, error: null }));
    } else {
      safeSetState(prev => ({ ...prev, silentLoading: true }));
    }
    
    // Verrouillage atomique
    requestInProgressRef.current = true;
    
    // Vérifier le cache avec gestion TTL optimisée
    const cacheKeyLocal = `order_detail_${id}`;
    const cachedOrder = getCachedData<OrderDetails>(cacheKeyLocal);
    
    if (cachedOrder && !silent) {
      safeSetState(prev => ({ 
        ...prev, 
        order: cachedOrder, 
        loading: false 
      }));
      
      // Maintenir le verrouillage seulement pendant les opérations importantes
      requestInProgressRef.current = false;
      
      // Rafraîchir en arrière-plan avec un délai optimisé
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          fetchOrderDetails(id, true);
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Annuler toute requête précédente pour économiser les ressources réseau
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Signal d'annulation avec timeout pour éviter les requêtes bloquées
    abortControllerRef.current = new AbortController();
    const timeout = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.warn("Requête annulée après timeout");
        safeSetState(prev => ({
          ...prev,
          error: silent ? prev.error : "Temps d'attente dépassé, veuillez réessayer",
          loading: false,
          silentLoading: false
        }));
        requestInProgressRef.current = false;
      }
    }, 10000); // Timeout de sécurité
    
    try {
      // Utilisation de query préparée pour réduire la charge CPU
      const { data, error } = await getOrderQuery(id, profile.id);
      
      // Nettoyage du timeout
      clearTimeout(timeout);
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error("Commande introuvable ou vous n'avez pas les permissions requises");
      }
      
      // Transformation immutable des données avec un mapping optimisé
      const orderDetails: OrderDetails = {
        id: data.id,
        created_at: data.created_at,
        status: data.status,
        service: data.services,
        freelance: data.freelance,
        client: data.profiles,
        requirements: data.requirements || ''
      };
      
      // Cache optimisé avec priorité dynamique
      setCachedData(cacheKeyLocal, orderDetails, {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA,
        priority: silent ? CACHE_PRIORITIES.MEDIUM : CACHE_PRIORITIES.HIGH
      });
      
      // Mise à jour atomique de l'état avec vérification de montage
      if (mountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          order: orderDetails,
          error: null,
          ...(silent ? { silentLoading: false } : { loading: false })
        }));
      }
    } catch (err: any) {
      // Nettoyage du timeout
      clearTimeout(timeout);
      
      console.error("Erreur lors de la récupération de la commande", err);
      if (mountedRef.current) {
        if (!silent) {
          safeSetState(prev => ({
            ...prev,
            error: err.message || "Une erreur s'est produite lors du chargement de la commande",
            loading: false
          }));
        } else {
          safeSetState(prev => ({ ...prev, silentLoading: false }));
        }
      }
    } finally {
      // Garantie de libération des verrous
      requestInProgressRef.current = false;
      abortControllerRef.current = null;
    }
  }, [profile?.id, safeSetState, getOrderQuery]);

  // Effet de chargement initial avec sécurité
  useEffect(() => {
    // Marquer le composant comme monté
    mountedRef.current = true;
    
    // Vérifications de sécurité pour redirection 
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!isFreelance) {
      router.push("/dashboard/orders");
      return;
    }
    
    if (orderId && profile?.id) {
      orderIdRef.current = orderId;
      fetchOrderDetails(orderId);
    }
    
    // Nettoyage amélioré lors du démontage
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, isFreelance, router, orderId, profile?.id, fetchOrderDetails]);

  // Écouter les changements en temps réel avec optimisation des abonnements
  useEffect(() => {
    if (!orderId || !profile?.id || !mountedRef.current) return;
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Fonction debounce pour éviter les rafraîchissements excessifs
    const refreshWithDebounce = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          fetchOrderDetails(orderId, true);
        }
      }, 300);
    };
    
    // Abonnement optimisé
    const orderChannel = supabase
      .channel(`order_updates_${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, refreshWithDebounce)
      .subscribe();
    
    return () => {
      // Nettoyage complet des ressources
      if (timeoutId) clearTimeout(timeoutId);
      orderChannel.unsubscribe();
    };
  }, [orderId, profile?.id, fetchOrderDetails]);

  // Optimisation de téléversement avec un worker si disponible
  const createFilePayload = useCallback(async (file: File, orderId: string) => {
    // Prétraitement pour optimiser le fichier (ex: compression d'images)
    const optimizedFile = await preprocessFile(file);
    
    // Génération d'un chemin de fichier optimisé et sécurisé
    const filePath = generateOptimizedFilePath(`deliveries/${orderId}`, file.name);
    
    return { file: optimizedFile, filePath };
  }, []);

  // Optimisation du téléversement de fichiers avec lot et progression
  const uploadFilesInBatches = useCallback(async (
    files: FileList, 
    orderId: string,
    batchSize = 3 // Téléversement simultané optimisé
  ) => {
    const allFiles = Array.from(files);
    const results = [];
    
    // Traitement par lots pour éviter de surcharger le réseau
    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        const { file: optimizedFile, filePath } = await createFilePayload(file, orderId);
        
        // Utiliser le retry handler pour la robustesse
        return handleUploadWithRetries(async () => {
          const { error: uploadError } = await supabase.storage
            .from('tchatfiles')
            .upload(filePath, optimizedFile, { 
              cacheControl: '3600', 
              upsert: true 
            });
          
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage
            .from('tchatfiles')
            .getPublicUrl(filePath);
          
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            url: data.publicUrl,
            path: filePath
          };
        }, 3, 800); // 3 tentatives max avec délai initial de 800ms
      });
      
      // Attendre que le lot actuel soit terminé avant de passer au suivant
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Petite pause entre les lots pour éviter de surcharger l'API
      if (i + batchSize < allFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    return results;
  }, [createFilePayload]);

  // Fonction optimisée pour la livraison avec gestion d'erreurs améliorée
  const handleDelivery = useCallback(async () => {
    // Validation avec une sortie anticipée pour optimiser
    safeSetState(prev => ({ ...prev, error: null }));
    
    if (!debouncedMessage.trim()) {
      safeSetState(prev => ({ ...prev, error: "Veuillez ajouter un message pour le client" }));
      return;
    }
    
    if (!files || files.length === 0) {
      safeSetState(prev => ({ ...prev, error: "Veuillez téléverser au moins un fichier" }));
      return;
    }
    
    if (!state.order || !state.order.id || !profile?.id) {
      safeSetState(prev => ({ ...prev, error: "Informations de commande incomplètes" }));
      return;
    }
    
    safeSetState(prev => ({ ...prev, deliveryProcessing: true }));
    
    try {
      // Capture des références pour éviter les fermetures problématiques
      const messageToSend = debouncedMessage.trim();
      const filesToUpload = files;
      const currentOrderId = state.order.id;
      const currentProfileId = profile.id;
      
      // Téléversement optimisé par lots
      const uploadedFiles = await uploadFilesInBatches(filesToUpload, currentOrderId);
      
      // Transaction optimisée pour réduire les allers-retours
      const { error: deliveryError } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          updated_at: new Date().toISOString(),
          delivery: {
            message: messageToSend,
            files: uploadedFiles,
            delivered_at: new Date().toISOString(),
            freelance_id: currentProfileId
          }
        })
        .eq('id', currentOrderId);
      
      if (deliveryError) {
        throw deliveryError;
      }
      
      // Message de notification avec retry automatique
      const sendNotification = async (retries = 2) => {
        try {
          return await supabase
            .from('messages')
            .insert({
              order_id: currentOrderId,
              sender_id: currentProfileId,
              recipient_id: state.order!.client.id,
              content: `Livraison effectuée: ${messageToSend.substring(0, 100)}${messageToSend.length > 100 ? '...' : ''}`,
              has_attachment: true,
              attachment_type: 'delivery',
              created_at: new Date().toISOString()
            });
        } catch (err) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 500));
            return sendNotification(retries - 1);
          }
          console.error("Échec de l'envoi de notification après plusieurs tentatives:", err);
          return { error: err };
        }
      };
      
      // Envoi de la notification en parallèle
      sendNotification().catch(console.error);
      
      // Invalidation de cache optimisée
      if (cacheKey) invalidateCache(cacheKey);
      invalidateCache(`orders_freelance_${currentProfileId}`);
      
      // Notification de succès
      if (mountedRef.current) {
        toast({
          title: "Livraison réussie!",
          description: "Votre livraison a été envoyée au client avec succès.",
          variant: "success"
        });
        
        // Mise à jour atomique de l'état
        safeSetState(prev => ({ ...prev, deliverySuccess: true, deliveryProcessing: false }));
      }
      
      // Redirection différée pour permettre à l'utilisateur de voir le message
      if (mountedRef.current) {
        const redirectTimeout = setTimeout(() => {
          if (mountedRef.current) {
            router.push('/dashboard/orders');
          }
        }, 2000);
        return () => clearTimeout(redirectTimeout);
      }
    } catch (err: any) {
      console.error("Erreur lors de la livraison", err);
      
      if (mountedRef.current) {
        safeSetState(prev => ({ 
          ...prev, 
          error: err.message || "Une erreur s'est produite lors de l'envoi de votre livraison",
          deliveryProcessing: false
        }));
        
        toast({
          title: "Échec de la livraison",
          description: err.message || "Une erreur s'est produite lors de l'envoi de votre livraison",
          variant: "destructive"
        });
      }
    }
  }, [debouncedMessage, files, state.order, profile?.id, toast, router, cacheKey, safeSetState, uploadFilesInBatches]);

  // Handler des fichiers optimisé
  const handleFilesChange = useCallback((newFiles: FileList | null) => {
    setFiles(newFiles);
    filesRef.current = newFiles;
  }, []);

  // Extraction des états par destructuration pour plus de clarté
  const { loading, order, error, deliveryProcessing, deliverySuccess, silentLoading } = state;

  // Optimisation des conditions avec useMemo
  const isSubmitDisabled = useMemo(() => (
    deliveryProcessing || !debouncedMessage.trim() || !files || files.length === 0
  ), [deliveryProcessing, debouncedMessage, files]);

  // État de chargement initial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-600">Chargement des détails de commande...</p>
        </div>
      </div>
    );
  }

  // Affichage du succès de livraison
  if (deliverySuccess) {
    return (
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card className="border-green-100">
          <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Livraison envoyée !</h2>
            <p className="text-slate-600 mb-6">
              Votre livraison a été envoyée avec succès au client.
              Vous allez être redirigé vers vos commandes.
            </p>
            <div className="mt-2 animate-pulse">
              <Loader className="h-5 w-5 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage des erreurs
  if (error || !order) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Commande introuvable"}
          </h2>
          <p className="text-slate-600 mb-6">
            Impossible de charger les détails de la commande pour le moment.
          </p>
          <Button asChild>
            <Link href="/dashboard/orders">Retour aux commandes</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Affichage principal avec rendu optimisé
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Livrer la commande</h1>
          {silentLoading && (
            <div className="text-xs text-slate-500 flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Actualisation...
            </div>
          )}
        </div>
        <p className="text-slate-600 flex items-center mt-1">
          <PackageOpen className="h-4 w-4 mr-1 text-indigo-600" />
          <span className="text-sm">
            Envoyez vos fichiers finaux au client
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <OrderDetailCard order={order} />
        </div>
        
        <div className="lg:col-span-2">
          <DeliveryForm 
            message={message}
            error={error}
            onMessageChange={(e) => setMessage(e.target.value)}
            onFilesChange={handleFilesChange}
            onSubmit={handleDelivery}
            isSubmitDisabled={isSubmitDisabled}
            isProcessing={deliveryProcessing}
          />
        </div>
      </div>
    </div>
  );
} 