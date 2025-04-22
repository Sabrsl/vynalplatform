"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { FieldValues, useForm } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateReviewForm } from "@/components/reviews/CreateReviewForm";
import ServiceReviews from "@/components/reviews/ServiceReviews";

import {
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";

import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  FileType,
  FileUp,
  FileIcon,
  Inbox,
  Loader,
  MessageSquare,
  Package,
  PackageOpen,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Trash,
  Upload,
  X,
  AlertCircle,
  Star,
  ClipboardList,
  CheckCircle2,
  XCircle,
  BarChart4,
  ArrowRightCircle,
  DollarSign
} from "lucide-react";

// Types pour le statut des commandes et les données
type OrderStatus = "pending" | "in_progress" | "completed" | "delivered" | "revision_requested" | "cancelled" | "in_dispute";

// Type d'onglet pour la navigation
type TabValue = "details" | "messages" | "files" | "reviews";

// Type pour les commandes
type Order = {
  id: string;
  created_at: string;
  status: OrderStatus;
  requirements?: string;
  delivery_date?: string;
  payment_status?: "pending" | "paid" | "refunded" | "disputed";
  dispute_id?: string;
  service: {
    id: string;
    title: string;
    price: number;
    delivery_time: number;
    description: string;
    category: string;
  };
  freelance: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url?: string;
  };
  client: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url?: string;
  };
  messages?: {
    id: string;
    sender_id: string;
    content: string;
    timestamp: string;
    is_read: boolean;
  }[];
  files?: {
    id: string;
    name: string;
    size: string;
    url: string;
    uploaded_at: string;
    uploader_id: string;
  }[];
  delivery?: {
    message: string;
    delivered_at: string;
    files: {
      name: string;
      size: string;
      url: string;
    }[];
  };
};

// Données fictives pour la démo - normalement, ces données proviendraient de votre API
const MOCK_ORDERS: Record<string, Order> = {
  "order-1": {
    id: "order-1",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_progress",
    requirements: "Je souhaite un logo moderne qui représente bien l'identité de ma marque. Les couleurs principales sont le bleu et le violet. Je voudrais également avoir une version monochrome pour certains usages.",
    delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    payment_status: "paid",
    service: {
      id: "service-1",
      title: "Création d'un logo professionnel",
      price: 150,
      delivery_time: 3,
      description: "Je créerai un logo moderne et professionnel pour votre entreprise ou produit, avec plusieurs propositions et révisions illimitées.",
      category: "Design graphique"
    },
    freelance: {
      id: "freelance-1",
      username: "designpro",
      full_name: "Marie Dupont",
      avatar_url: "/avatars/marie.jpg"
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
      avatar_url: "/avatars/jean.jpg"
    },
    messages: [
      {
        id: "msg-1",
        sender_id: "client-1",
        content: "Bonjour, j'ai hâte de voir vos premières propositions pour le logo.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        is_read: true
      },
      {
        id: "msg-2",
        sender_id: "freelance-1",
        content: "Bonjour ! Je vais commencer à travailler sur votre projet dès aujourd'hui. Auriez-vous des exemples de logos qui vous plaisent ?",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        is_read: true
      }
    ],
    files: [
      {
        id: "file-1",
        name: "brief-logo.pdf",
        size: "1.2 Mo",
        url: "/files/brief-logo.pdf",
        uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        uploader_id: "client-1"
      }
    ]
  },
  "order-2": {
    id: "order-2",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "delivered",
    requirements: "Article optimisé pour les mots-clés suivants: marketing digital, stratégie de contenu, SEO. L'article doit faire environ 1500-2000 mots et inclure des sous-titres clairs.",
    delivery_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    payment_status: "paid",
    service: {
      id: "service-2",
      title: "Rédaction d'un article SEO optimisé",
      price: 85,
      delivery_time: 2,
      description: "Je rédigerai un article de qualité optimisé pour les moteurs de recherche, avec recherche de mots-clés et structure SEO.",
      category: "Rédaction & Traduction"
    },
    freelance: {
      id: "freelance-2",
      username: "contentwizard",
      full_name: "Lucas Bernard",
      avatar_url: "/avatars/lucas.jpg"
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
      avatar_url: "/avatars/jean.jpg"
    },
    delivery: {
      message: "Bonjour Jean, voici l'article SEO que vous avez commandé. J'ai optimisé le contenu pour les mots-clés demandés tout en gardant un style naturel et engageant. N'hésitez pas à me demander des ajustements si nécessaire.",
      delivered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      files: [
        {
          name: "article-seo-marketing-digital.docx",
          size: "0.8 Mo",
          url: "/files/article-seo.docx"
        },
        {
          name: "article-seo-marketing-digital.pdf",
          size: "0.7 Mo",
          url: "/files/article-seo.pdf"
        }
      ]
    }
  },
  "order-3": {
    id: "order-3",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_dispute",
    requirements: "Développement d'un site vitrine pour mon entreprise de coaching. Le site doit inclure une page d'accueil, une page à propos, une page services, et un formulaire de contact.",
    delivery_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    payment_status: "disputed",
    dispute_id: "dispute-1",
    service: {
      id: "service-3",
      title: "Création d'un site web vitrine",
      price: 350,
      delivery_time: 7,
      description: "Je développerai un site web vitrine professionnel et responsive, optimisé pour les moteurs de recherche et adapté à votre image de marque.",
      category: "Développement Web"
    },
    freelance: {
      id: "freelance-3",
      username: "webdev",
      full_name: "Sophie Mercier",
      avatar_url: "/avatars/sophie.jpg"
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
      avatar_url: "/avatars/jean.jpg"
    },
    messages: [
      {
        id: "msg-5",
        sender_id: "client-1",
        content: "Bonjour, la livraison ne correspond pas à ce que j'avais demandé. Le design n'est pas du tout adapté à mon entreprise.",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        is_read: true
      },
      {
        id: "msg-6",
        sender_id: "freelance-3",
        content: "Je suis désolée d'apprendre cela. Pouvez-vous me préciser quels aspects ne vous conviennent pas afin que je puisse les ajuster ?",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        is_read: true
      }
    ],
    delivery: {
      message: "Bonjour Jean, voici la première version de votre site web. J'attends vos retours pour d'éventuelles modifications.",
      delivered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      files: [
        {
          name: "site-web-preview.pdf",
          size: "2.4 Mo",
          url: "/files/site-web-preview.pdf"
        },
        {
          name: "site-web-sources.zip",
          size: "15 Mo",
          url: "/files/site-web-sources.zip"
        }
      ]
    }
  },
  "order-4": {
    id: "order-4",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "cancelled",
    requirements: "Traduction d'un document technique de l'anglais vers le français, environ 20 pages.",
    delivery_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    payment_status: "refunded",
    service: {
      id: "service-4",
      title: "Traduction technique anglais-français",
      price: 120,
      delivery_time: 5,
      description: "Je traduis vos documents techniques de l'anglais vers le français avec une attention particulière à la terminologie spécifique de votre domaine.",
      category: "Rédaction & Traduction"
    },
    freelance: {
      id: "freelance-4",
      username: "translatepro",
      full_name: "Philippe Durand",
      avatar_url: "/avatars/philippe.jpg"
    },
    client: {
      id: "client-1",
      username: "clientuser",
      full_name: "Jean Martin",
      avatar_url: "/avatars/jean.jpg"
    },
    messages: [
      {
        id: "msg-7",
        sender_id: "client-1",
        content: "Bonjour, je dois annuler cette commande car le document n'est plus nécessaire.",
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        is_read: true
      },
      {
        id: "msg-8",
        sender_id: "freelance-4",
        content: "Je comprends. Pas de problème, la commande va être annulée.",
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        is_read: true
      }
    ],
    files: [
      {
        id: "file-2",
        name: "document-technique.pdf",
        size: "4.5 Mo",
        url: "/files/document-technique.pdf",
        uploaded_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        uploader_id: "client-1"
      }
    ]
  }
};

// Données mockées pour les avis clients
const MOCK_REVIEWS: Record<string, any[]> = {
  "service-1": [
    {
      id: "review-1",
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 5,
      comment: "Excellent travail ! Le logo est exactement ce que je recherchais. Très professionnel et réactif.",
      client_id: "client-2",
      service_id: "service-1",
      freelance_id: "freelance-1",
      order_id: "order-past-1",
      client: {
        username: "sarahb",
        full_name: "Sarah Blanc",
        avatar_url: "/avatars/sarah.jpg"
      }
    },
    {
      id: "review-2",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 4,
      comment: "Très bon travail. La première proposition n'était pas tout à fait ce que je voulais mais les ajustements ont été parfaits.",
      client_id: "client-3",
      service_id: "service-1",
      freelance_id: "freelance-1",
      order_id: "order-past-2",
      client: {
        username: "thomasv",
        full_name: "Thomas Vidal",
        avatar_url: "/avatars/thomas.jpg"
      }
    }
  ],
  "service-2": [
    {
      id: "review-3",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 5,
      comment: "Article très bien écrit et optimisé pour le SEO. Je recommande vivement !",
      client_id: "client-4",
      service_id: "service-2",
      freelance_id: "freelance-2",
      order_id: "order-past-3",
      client: {
        username: "carole_m",
        full_name: "Carole Mercier",
        avatar_url: "/avatars/carole.jpg"
      }
    }
  ],
  "service-3": [
    {
      id: "review-4",
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 3,
      comment: "Le site web fonctionne correctement mais le design pourrait être amélioré. Délai de livraison respecté.",
      client_id: "client-5",
      service_id: "service-3",
      freelance_id: "freelance-3",
      order_id: "order-past-4",
      client: {
        username: "pierre_d",
        full_name: "Pierre Durand",
        avatar_url: "/avatars/pierre.jpg"
      }
    }
  ],
  "service-4": []
};

// Utilitaires pour les couleurs et labels basés sur le statut
const statusColors = {
  pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30",
  delivered: "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 dark:bg-vynal-accent-primary/20 dark:border-vynal-accent-primary/30",
  revision_requested: "bg-vynal-purple-secondary/10 text-vynal-purple-secondary border-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30",
  cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30",
  in_dispute: "bg-red-100 text-red-600 border-red-200 dark:bg-red-700/30 dark:text-red-400 dark:border-red-500/40",
};
  
const statusLabels = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  delivered: "Livrée",
  revision_requested: "Révision demandée",
  cancelled: "Annulée",
  in_dispute: "En litige",
};

const statusIcons = {
  pending: <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />,
  completed: <CheckCircle className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />,
  delivered: <FileCheck className="h-3.5 w-3.5 text-vynal-accent-primary dark:text-vynal-accent-primary" />,
  revision_requested: <RefreshCw className="h-3.5 w-3.5 text-vynal-purple-secondary dark:text-vynal-purple-secondary" />,
  cancelled: <Clock className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />,
  in_dispute: <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-500" />,
};

export default function OrderDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("details");
  const [newMessage, setNewMessage] = useState("");
  
  // État pour le modal de litige
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [submitingDispute, setSubmitingDispute] = useState(false);
  
  // Déterminer si l'utilisateur est le freelance ou le client
  const isFreelance = user?.user_metadata?.role === "freelance";
  
  const [isRequestRevisionOpen, setIsRequestRevisionOpen] = useState(false);
  const [isCancelOrderOpen, setIsCancelOrderOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Simuler un chargement initial depuis l'API
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Simuler un délai API
    const timer = setTimeout(() => {
      try {
        // Vérifier si la commande existe
        const foundOrder = MOCK_ORDERS[orderId as string];
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError("Commande introuvable");
        }
      } catch (err) {
        setError("Erreur lors du chargement des données");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [orderId]);
  
  // Gérer l'envoi d'un nouveau message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Simulation d'envoi de message (à remplacer par votre API)
    console.log("Message envoyé:", newMessage);
    
    // Mise à jour locale de l'état (dans une app réelle, cela viendrait d'une mutation API)
    if (order && order.messages) {
      const updatedMessages = [
        ...order.messages,
        {
          id: `msg-${Date.now()}`,
          sender_id: isFreelance ? order.freelance.id : order.client.id,
          content: newMessage,
          timestamp: new Date().toISOString(),
          is_read: false
        }
      ];
      
      setOrder({
        ...order,
        messages: updatedMessages
      });
    }
    
    // Réinitialiser le champ de message
    setNewMessage("");
  };
  
  // Gérer l'acceptation d'une livraison
  const handleAcceptDelivery = () => {
    // Simuler un changement de statut
    if (order) {
      setOrder({
        ...order,
        status: "completed",
        messages: [
          ...(order.messages || []),
          {
            id: `msg-${Date.now()}`,
            sender_id: order.client.id,
            content: "La livraison a été acceptée par le client.",
            timestamp: new Date().toISOString(),
            is_read: false
          }
        ]
      });
      
      toast({
        title: "Livraison acceptée",
        description: "Vous avez accepté la livraison avec succès.",
      });

      // Ouvrir le modal de review si l'utilisateur est le client
      if (!isFreelance) {
        setIsReviewModalOpen(true);
      }
    }
  };
  
  // Gérer la demande de révision
  const handleRequestRevision = () => {
    if (!revisionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez préciser les détails de la révision.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRequestRevisionOpen(false);
    
    // Simuler un changement de statut
    if (order) {
      setOrder({
        ...order,
        status: "revision_requested",
        messages: [
          ...(order.messages || []),
          {
            id: `msg-${Date.now()}`,
            sender_id: order.client.id,
            content: `Demande de révision: ${revisionReason}`,
            timestamp: new Date().toISOString(),
            is_read: false
          }
        ]
      });
      
      // Réinitialiser le champ de révision après envoi
      setRevisionReason("");
      
      toast({
        title: "Révision demandée",
        description: "Votre demande de révision a été envoyée avec succès.",
      });
    }
  };
  
  // Gérer l'ouverture du sélecteur de fichiers
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Gérer les fichiers sélectionnés
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDisputeFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  // Supprimer un fichier de la liste
  const removeFile = (fileName: string) => {
    setDisputeFiles(prev => prev.filter(file => file.name !== fileName));
  };
  
  // Soumettre le formulaire de litige
  const submitDispute = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez expliquer la raison du litige.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitingDispute(true);
    
    try {
      // Simulation : Dans une app réelle, ceci serait un appel API pour créer un litige
      // et uploader les fichiers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler réponse API
      const disputeId = `dispute-${Date.now()}`;
      
      // Mettre à jour l'état local de la commande
      if (order) {
        setOrder({
          ...order,
          status: "in_dispute",
          dispute_id: disputeId,
          payment_status: "disputed"
        });
      }
      
      // Fermer le modal et réinitialiser les champs
      setDisputeModalOpen(false);
      setDisputeReason("");
      setDisputeFiles([]);
      
      toast({
        title: "Litige créé",
        description: "Votre litige a été enregistré avec succès.",
      });
      
      // Rediriger vers la page du litige
      router.push(`/dashboard/disputes/${disputeId}`);
    } catch (error) {
      console.error("Erreur lors de la création du litige:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du litige. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setSubmitingDispute(false);
    }
  };
  
  const handleCancelOrder = () => {
    setIsCancelOrderOpen(false);
    
    // Simuler un changement de statut
    if (order) {
      setOrder({
        ...order,
        status: "cancelled",
        messages: [
          ...(order.messages || []),
          {
            id: `msg-${Date.now()}`,
            sender_id: order.client.id,
            content: "La commande a été annulée par le client.",
            timestamp: new Date().toISOString(),
            is_read: false
          }
        ]
      });
      
      toast({
        title: "Commande annulée",
        description: "Votre commande a été annulée avec succès.",
      });
    }
  };
  
  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-vynal-accent-primary" />
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (error || !order) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Commande introuvable"}
          </h2>
          <p className="text-vynal-purple-secondary dark:text-vynal-text-secondary mb-6">
            Impossible de charger les détails de la commande.
          </p>
          <Button asChild>
            <Link href="/dashboard/orders">Retour aux commandes</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Obtenir l'autre partie (client ou freelance)
  const otherParty = isFreelance ? order.client : order.freelance;
  const createdDate = new Date(order.created_at);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: fr });
  const formattedCreatedDate = format(createdDate, 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Rendu principal
  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2 sm:mr-4 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 hover:text-vynal-purple-light dark:text-vynal-text-secondary dark:hover:bg-vynal-purple-secondary/10 dark:hover:text-vynal-text-primary">
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Retour</span>
              </Link>
            </Button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary truncate">
              Détails de la commande
            </h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Panneau Latéral - Détails de la commande */}
          <Card className="lg:col-span-1 border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
            <CardHeader className="pb-2 sm:pb-3 border-b border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg text-vynal-purple-light dark:text-vynal-text-primary">
                    Commande #{order.id}
                  </CardTitle>
                </div>
                <div className="flex items-center">
                  {statusIcons[order.status]}
                  <Badge variant="outline" className={`ml-1 text-xs sm:text-sm ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary flex items-center mt-1 sm:mt-2">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/60" />
                {formattedCreatedDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-vynal-purple-light dark:text-vynal-text-primary line-clamp-2">
                  {order.service.title}
                </h3>
                <p className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1 line-clamp-3">
                  {order.service.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-vynal-purple-secondary/10 text-vynal-purple-secondary dark:bg-vynal-purple-secondary/20 dark:text-vynal-accent-secondary text-xs">
                    {order.service.category}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 border-t border-b border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 py-2 sm:py-3 my-2 sm:my-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Prix:</span>
                  <span className="font-medium text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">{order.service.price} €</span>
                </div>
                
                {order.payment_status && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Paiement:</span>
                    <Badge variant="outline" className={`text-xs ${
                      order.payment_status === "paid" 
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30"
                        : order.payment_status === "pending"
                        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30"
                        : order.payment_status === "refunded"
                        ? "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 dark:bg-vynal-accent-primary/20 dark:border-vynal-accent-primary/30"
                        : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30"
                    }`}>
                      <CreditCard className="h-3 w-3 mr-1" />
                      {order.payment_status === "paid" ? "Payé" : 
                       order.payment_status === "pending" ? "En attente" : 
                       order.payment_status === "refunded" ? "Remboursé" : 
                       "Contesté"}
                    </Badge>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Délai de livraison:</span>
                  <span className="font-medium text-xs sm:text-sm text-vynal-purple-light dark:text-vynal-text-primary">
                    {order.service.delivery_time} jours
                  </span>
                </div>
                
                {order.delivery_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Date prévue:</span>
                    <span className="font-medium text-xs sm:text-sm text-vynal-purple-light dark:text-vynal-text-primary flex items-center">
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-vynal-purple-secondary/70" />
                      {format(new Date(order.delivery_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">
                  {isFreelance ? "Client" : "Freelance"}
                </h4>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3">
                    <AvatarImage src={otherParty.avatar_url} alt={otherParty.full_name || otherParty.username} />
                    <AvatarFallback className="bg-vynal-accent-primary/20 text-vynal-accent-primary text-xs sm:text-sm">
                      {(otherParty.full_name || otherParty.username).substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">
                      {otherParty.full_name || otherParty.username}
                    </p>
                    <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                      @{otherParty.username}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Bouton de demande de révision */}
              {order.status === "delivered" && !isFreelance && (
                <div className="pt-4 space-y-2">
                  <Button 
                    onClick={handleAcceptDelivery}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium border border-emerald-600 shadow-sm hover:shadow"
                  >
                    <FileCheck className="h-4 w-4 mr-1.5" />
                    Accepter la livraison
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full bg-amber-50 border-amber-400 text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:border-amber-500 dark:text-amber-300 dark:bg-transparent dark:hover:bg-amber-900/40 dark:hover:text-amber-200"
                    onClick={() => {
                      setRevisionReason("");
                      setIsRequestRevisionOpen(true);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Demander une révision
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full bg-red-50 border-red-400 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-500 dark:text-red-300 dark:bg-transparent dark:hover:bg-red-900/40 dark:hover:text-red-200"
                    onClick={() => {
                      setDisputeReason("");
                      setDisputeFiles([]);
                      setDisputeModalOpen(true);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Signaler un problème
                  </Button>
                </div>
              )}
              
              {/* Boutons pour annuler une commande ou ouvrir un litige (client uniquement) */}
              {!isFreelance && (order.status === "pending" || order.status === "in_progress") && (
                <div className="pt-2">
                  <ConfirmDialog
                    onConfirm={handleCancelOrder}
                    title="Annuler la commande"
                    description="Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible."
                    confirmText="Annuler la commande"
                    cancelText="Retour"
                    variant="destructive"
                    trigger={
                      <Button 
                        variant="outline" 
                        className="w-full bg-red-50 border-red-400 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-500 dark:text-red-300 dark:bg-transparent dark:hover:bg-red-900/40 dark:hover:text-red-200"
                      >
                        <Ban className="h-4 w-4 mr-1.5" />
                        Annuler la commande
                      </Button>
                    }
                  />
                </div>
              )}
              
              {/* Afficher un lien vers le litige existant s'il y en a un */}
              {order.dispute_id && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
                    asChild
                  >
                    <Link href={`/dashboard/disputes/${order.dispute_id}`}>
                      <AlertCircle className="h-4 w-4 mr-1.5" />
                      Voir le litige
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Contenu principal avec onglets */}
          <div className="lg:col-span-2">
            <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="pb-2 sm:pb-3 border-b border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 p-3 sm:p-4">
                <Tabs defaultValue="details" value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
                  <TabsList className="bg-vynal-purple-secondary/10 dark:bg-vynal-purple-secondary/20 grid w-full grid-cols-4 h-9 sm:h-10">
                    <TabsTrigger value="details" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Détails
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                      <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Messages
                    </TabsTrigger>
                    <TabsTrigger value="files" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                      <FileType className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Fichiers
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Avis
                    </TabsTrigger>
                  </TabsList>
              
                  <div className="mt-0">
                    <TabsContent value="details" className="m-0">
                      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
                        {/* Cahier des charges */}
                        <div>
                          <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">Cahier des charges</h3>
                          <div className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary p-3 sm:p-4 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10">
                            {order.requirements || "Aucun cahier des charges spécifié."}
                          </div>
                        </div>
                        
                        {/* Chronologie */}
                        <div>
                          <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2 sm:mb-3">Chronologie</h3>
                          <div className="relative pl-5 sm:pl-6 border-l border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 space-y-3 sm:space-y-4">
                            <div className="relative">
                              <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/30">
                                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-accent-primary"></div>
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commande créée</p>
                              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">{formattedCreatedDate}</p>
                            </div>
                            
                            {order.status !== "pending" && order.status !== "cancelled" && (
                              <div className="relative">
                                <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-accent-secondary/20 dark:bg-vynal-accent-secondary/30">
                                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-accent-secondary"></div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Projet en cours</p>
                                <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                                  {format(new Date(new Date(order.created_at).getTime() + 1 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                            )}
                            
                            {order.status === "cancelled" && (
                              <div className="relative">
                                <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-red-500/20 dark:bg-red-500/30">
                                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500"></div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commande annulée</p>
                                <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                                  {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                            )}
                            
                            {order.status === "in_dispute" && (
                              <div className="relative">
                                <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-amber-500/20 dark:bg-amber-500/30">
                                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500"></div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Litige ouvert</p>
                                <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                                  {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                            )}
                            
                            {(order.status === "delivered" || order.status === "revision_requested" || order.status === "completed") ? (
                              <div className="relative">
                                <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/30">
                                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-accent-primary"></div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Livraison</p>
                                <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                                  {order.delivery ? format(new Date(order.delivery.delivered_at), 'dd MMMM yyyy', { locale: fr }) : "N/A"}
                                </p>
                              </div>
                            ) : null}
                            
                            {order.status === "revision_requested" && (
                              <div className="relative">
                                <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/30">
                                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-purple-secondary"></div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Révision demandée</p>
                                <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                                  {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                            )}
                            
                            {order.status === "completed" && (
                              <div className="relative">
                                <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30">
                                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500"></div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commande terminée</p>
                                <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                                  {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Instructions de livraison */}
                        {order.delivery && (
                          <div>
                            <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">Message de livraison</h3>
                            <div className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary p-3 sm:p-4 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10">
                              {order.delivery.message}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Section Messages */}
                    <TabsContent value="messages" className="m-0">
                      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                        <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-vynal-purple-secondary/20 scrollbar-track-transparent">
                          {order.messages && order.messages.length > 0 ? (
                            order.messages.map((message) => (
                              <div 
                                key={message.id} 
                                className={`flex ${message.sender_id === (isFreelance ? order.freelance.id : order.client.id) ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 ${
                                    message.sender_id === (isFreelance ? order.freelance.id : order.client.id) 
                                      ? 'bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white'
                                      : 'bg-vynal-purple-secondary/10 dark:bg-vynal-purple-secondary/20 text-vynal-purple-secondary dark:text-vynal-text-secondary'
                                  }`}
                                >
                                  <p className="text-xs sm:text-sm">{message.content}</p>
                                  <p className="text-[10px] sm:text-xs mt-1 opacity-80">
                                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true, locale: fr })}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 sm:py-6">
                              <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-vynal-purple-secondary/30 dark:text-vynal-text-secondary/30" />
                              <p className="mt-2 text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucun message pour le moment</p>
                              <p className="text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">Envoyez un message pour communiquer avec {isFreelance ? "le client" : "le freelance"}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 pt-3 sm:pt-4">
                          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                            <Textarea
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder={`Envoyez un message à ${isFreelance ? "votre client" : "votre freelance"}...`}
                              className="flex-1 border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 focus-visible:ring-vynal-accent-primary text-xs sm:text-sm"
                              rows={3}
                            />
                            <Button 
                              type="submit"
                              disabled={!newMessage.trim()}
                              size="sm"
                              className="bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 self-end"
                            >
                              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Section Fichiers */}
                    <TabsContent value="files" className="m-0">
                      <div className="p-3 sm:p-4 space-y-4">
                        {/* Fichiers du projet */}
                        <div>
                          <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2 sm:mb-3">Fichiers du projet</h3>
                          
                          {order.files && order.files.length > 0 ? (
                            <div className="space-y-2">
                              {order.files.map((file) => (
                                <div 
                                  key={file.id}
                                  className="flex items-center justify-between p-2 sm:p-3 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10"
                                >
                                  <div className="flex items-center flex-1 min-w-0">
                                    <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-purple-secondary dark:text-vynal-text-secondary mr-2 sm:mr-3 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 truncate">
                                        {file.size} • {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true, locale: fr })}
                                      </p>
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    asChild
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-vynal-purple-secondary hover:text-vynal-purple-light hover:bg-vynal-purple-secondary/5 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                                  >
                                    <Link href={file.url} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 sm:py-6 border border-dashed border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 rounded-md">
                              <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-vynal-purple-secondary/30 dark:text-vynal-text-secondary/30" />
                              <p className="mt-2 text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucun fichier partagé</p>
                              <Button 
                                variant="outline"
                                size="sm"
                                className="mt-3 border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10 text-xs sm:text-sm"
                              >
                                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                                Partager un fichier
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Fichiers livrés */}
                        {order.delivery && order.delivery.files && order.delivery.files.length > 0 && (
                          <div>
                            <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2 sm:mb-3">Fichiers livrés</h3>
                            <div className="space-y-2">
                              {order.delivery.files.map((file, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center justify-between p-2 sm:p-3 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-accent-primary/5 dark:bg-vynal-accent-primary/10"
                                >
                                  <div className="flex items-center flex-1 min-w-0">
                                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary dark:text-vynal-accent-primary mr-2 sm:mr-3 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 truncate">
                                        {file.size} • Fichier de livraison
                                      </p>
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    asChild
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-vynal-purple-secondary hover:text-vynal-purple-light hover:bg-vynal-purple-secondary/5 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                                  >
                                    <Link href={file.url} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Section Avis */}
                    <TabsContent value="reviews" className="m-0">
                      <div className="p-3 sm:p-4">
                        {order && (
                          <ServiceReviews 
                            serviceId={order.service.id} 
                            initialReviews={MOCK_REVIEWS[order.service.id] || []} 
                          />
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal pour signaler un problème / ouvrir un litige */}
      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95%] max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary flex items-center">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500" />
              Signaler un problème
            </DialogTitle>
            <DialogDescription className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
              Expliquez la raison de votre contestation. Notre équipe examinera votre demande.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="dispute-reason" className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                Raison du litige <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="dispute-reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Veuillez décrire précisément le problème rencontré..."
                className="border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 focus-visible:ring-vynal-accent-primary min-h-[100px] sm:min-h-[120px] text-sm"
              />
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary/80 dark:text-vynal-text-secondary/80">
                Soyez précis et factuel. Expliquez clairement le problème et ce que vous attendez comme résolution.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                Pièces jointes (facultatif)
              </Label>
              
              <div className="border border-dashed rounded-md border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 p-2 sm:p-4">
                {disputeFiles.length > 0 ? (
                  <div className="space-y-2">
                    {disputeFiles.map((file) => (
                      <div key={file.name} className="flex items-center justify-between p-1.5 sm:p-2 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 rounded">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <FileIcon className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                          <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary truncate max-w-[150px] sm:max-w-[250px]">
                            {file.name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-vynal-purple-secondary/60 dark:text-vynal-text-secondary/60">
                            ({(file.size / (1024 * 1024)).toFixed(2)} Mo)
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-vynal-purple-secondary hover:text-vynal-purple-light hover:bg-vynal-purple-secondary/5 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                          onClick={() => removeFile(file.name)}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 sm:py-4">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-vynal-purple-secondary/30 dark:text-vynal-text-secondary/30" />
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
                      Aucun fichier sélectionné
                    </p>
                  </div>
                )}
                
                <Input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileChange}
                />
                
                <div className="mt-2 sm:mt-4 flex justify-center">
                  <Button
                    type="button" 
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-9 text-xs sm:text-sm border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/50 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                    onClick={handleFileButtonClick}
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    {disputeFiles.length > 0 ? "Ajouter d'autres fichiers" : "Ajouter des fichiers"}
                  </Button>
                </div>
                
                <p className="text-[10px] sm:text-xs text-center text-vynal-purple-secondary/80 dark:text-vynal-text-secondary/80 mt-1 sm:mt-2">
                  Formats acceptés: JPG, PNG, PDF • Max 5Mo par fichier
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisputeModalOpen(false)}
              className="w-full sm:w-auto h-9 text-xs sm:text-sm border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/50 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={submitDispute}
              disabled={submitingDispute || !disputeReason.trim()}
              className="w-full sm:w-auto h-9 text-xs sm:text-sm bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {submitingDispute ? (
                <>
                  <Loader className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Créer le litige
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour demander une révision */}
      <Dialog open={isRequestRevisionOpen} onOpenChange={setIsRequestRevisionOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95%]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary flex items-center">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-amber-500" />
              Demander une révision
            </DialogTitle>
            <DialogDescription className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
              Êtes-vous sûr de vouloir demander une révision pour cette commande ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="revision-reason" className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                Détails de la révision <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="revision-reason"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Veuillez préciser vos attentes pour la révision..."
                className="border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 focus-visible:ring-vynal-accent-primary min-h-[100px] sm:min-h-[120px] text-sm"
              />
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary/80 dark:text-vynal-text-secondary/80">
                Soyez précis et clair sur les modifications que vous souhaitez. Le freelance utilisera ces informations pour effectuer la révision.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRequestRevisionOpen(false)}
              className="w-full sm:w-auto h-9 text-xs sm:text-sm border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/50 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleRequestRevision}
              disabled={!revisionReason.trim()}
              className="w-full sm:w-auto h-9 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white dark:from-amber-400 dark:to-amber-500 dark:hover:from-amber-500 dark:hover:to-amber-600"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Demander la révision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation pour l'annulation de commande */}
      <Dialog open={isCancelOrderOpen} onOpenChange={setIsCancelOrderOpen}>
        <DialogContent className="max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Annuler la commande</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelOrderOpen(false)}
              className="w-full sm:w-auto h-9 text-xs sm:text-sm border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/50 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
            >
              Retour
            </Button>
            <Button
              size="sm"
              onClick={handleCancelOrder}
              className="w-full sm:w-auto h-9 text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Annuler la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour laisser un avis */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-w-[95%] bg-vynal-purple-dark border-vynal-purple-secondary/30">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-vynal-text-primary flex items-center">
              <Star className="h-5 w-5 mr-2 text-vynal-accent-primary" />
              Évaluez votre commande
            </DialogTitle>
            <DialogDescription className="text-vynal-text-secondary">
              Partagez votre expérience avec ce service et ce freelance pour aider la communauté.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {order && (
              <CreateReviewForm
                serviceId={order.service.id}
                freelanceId={order.freelance.id}
                clientId={order.client.id}
                orderId={order.id}
                onSuccess={() => setIsReviewModalOpen(false)}
                onCancel={() => setIsReviewModalOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 