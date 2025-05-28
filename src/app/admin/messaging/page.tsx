"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Search,
  Flag,
  Eye,
  ArrowUpDown,
  UserCircle,
  AlertTriangle,
  CheckCircle,
  Send,
  RefreshCw,
  X,
  AlertCircle,
  Mail,
} from "lucide-react";
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getCachedData,
  setCachedData,
  CACHE_EXPIRY,
  CACHE_KEYS,
} from "@/lib/optimizations";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as Dialog from "@radix-ui/react-dialog";

// Interface pour les messages de contact
interface ContactMessage {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "in_progress" | "archived" | "completed";
  handled_by: string | null;
  handled_at: string | null;
  ticket_id: string | null;
}

// Interface pour les réponses aux messages
interface ContactMessageResponse {
  id: string;
  created_at: string;
  message_id: string;
  response_text: string;
  responded_by: string | null;
  read_at: string | null;
}

// Paramètres de pagination pour les réponses
const RESPONSES_PER_PAGE = 10;

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Fonction pour obtenir le badge de statut
const getStatusBadge = (status: string = "unread") => {
  switch (status) {
    case "unread":
      return (
        <Badge
          variant="outline"
          className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:hover:border-red-500/40 transition-all duration-200"
        >
          Non lu
        </Badge>
      );
    case "read":
      return (
        <Badge
          variant="outline"
          className="bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/15 hover:border-vynal-accent-primary/30 dark:bg-vynal-accent-primary/10 dark:border-vynal-accent-primary/20 dark:hover:bg-vynal-accent-primary/20 dark:hover:border-vynal-accent-primary/40 transition-all duration-200"
        >
          Lu
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:border-amber-500/40 transition-all duration-200"
        >
          En cours
        </Badge>
      );
    case "archived":
      return (
        <Badge
          variant="outline"
          className="bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/15 hover:border-slate-500/30 dark:bg-slate-500/10 dark:border-slate-500/20 dark:hover:bg-slate-500/20 dark:hover:border-slate-500/40 transition-all duration-200"
        >
          Archivé
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500/40 transition-all duration-200"
        >
          Complété
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-slate-100/30 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/30"
        >
          {status}
        </Badge>
      );
  }
};

export default function MessagingPage() {
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [responses, setResponses] = useState<ContactMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentMessage, setCurrentMessage] = useState<ContactMessage | null>(
    null,
  );
  const [showMessagePopover, setShowMessagePopover] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [responsesPage, setResponsesPage] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [formattedResponse, setFormattedResponse] = useState("");

  // Fonction pour formater la réponse comme un email professionnel
  const formatEmailResponse = useCallback(
    (message: ContactMessage | null, responseText: string) => {
      if (!message) return responseText;

      const salutation = `Bonjour ${message.first_name},\n\n`;
      const signature = "\n\nCordialement,\nL'équipe Support Vynal Platform";

      return salutation + responseText + signature;
    },
    [],
  );

  // Mettre à jour le texte de la réponse avec formatage
  useEffect(() => {
    if (currentMessage) {
      setFormattedResponse(formatEmailResponse(currentMessage, adminResponse));
    }
  }, [adminResponse, currentMessage, formatEmailResponse]);

  // Charger les messages depuis Supabase avec cache
  const fetchMessages = useCallback(
    async (forceFetch = false) => {
      try {
        setLoading(true);

        // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
        if (!forceFetch) {
          const cachedData = getCachedData<ContactMessage[]>(
            "admin_contact_messages",
          );
          if (cachedData) {
            setContactMessages(cachedData);
            setLoading(false);
            return;
          }
        }

        // Requête pour récupérer tous les messages de contact
        const { data, error } = await supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        console.log(
          `[DEBUG] Récupération de ${data.length} messages de contact au total`,
        );

        // Mettre en cache les données pour 30 minutes (messages semi-dynamiques)
        setCachedData("admin_contact_messages", data, {
          expiry: CACHE_EXPIRY.MEDIUM,
          priority: "medium",
        });

        setContactMessages(data);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des messages de contact:",
          error,
        );
        setError(
          "Impossible de charger les messages de contact. Veuillez réessayer plus tard.",
        );
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  // Forcer le rafraîchissement des données
  const handleRefresh = () => {
    fetchMessages(true);
    toast({
      title: "Actualisation",
      description: "Les messages ont été actualisés",
    });
  };

  // Chargement initial
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Charger les réponses d'un message avec cache et pagination
  const loadResponses = async (
    messageId: string,
    forceFetch = false,
    page = 1,
  ) => {
    try {
      console.log(
        `Chargement des réponses pour le message: ${messageId}, page: ${page}`,
      );
      setLoadingResponses(true);
      setResponsesPage(page);

      // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
      if (!forceFetch) {
        const cacheKey = `admin_message_responses_${messageId}_page_${page}`;
        const cachedResponses = getCachedData<{
          data: ContactMessageResponse[];
          count: number;
        }>(cacheKey);
        if (cachedResponses) {
          console.log(
            "Réponses trouvées en cache:",
            cachedResponses.data.length,
          );
          setResponses(cachedResponses.data);
          setTotalResponses(cachedResponses.count);
          setLoadingResponses(false);

          // Vérifier si le message doit être marqué comme complété (s'il a des réponses)
          if (
            cachedResponses.count > 0 &&
            currentMessage &&
            (currentMessage.status === "read" ||
              currentMessage.status === "in_progress")
          ) {
            await updateMessageStatus(messageId, "completed");
          }

          return;
        }
      }

      console.log("Pas de cache, chargement depuis Supabase...");

      // Requête pour compter le nombre total de réponses
      const { count, error: countError } = await supabase
        .from("contact_message_responses")
        .select("*", { count: "exact", head: true })
        .eq("message_id", messageId);

      if (countError) {
        console.error("Erreur lors du comptage des réponses:", countError);
        throw countError;
      }

      setTotalResponses(count || 0);

      // Calculer l'offset pour la pagination
      const offset = (page - 1) * RESPONSES_PER_PAGE;

      // Requête pour récupérer les réponses paginées
      const { data, error } = await supabase
        .from("contact_message_responses")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true })
        .range(offset, offset + RESPONSES_PER_PAGE - 1);

      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }

      console.log("Réponses chargées depuis Supabase:", data?.length || 0);

      // Mettre en cache les réponses pour 15 minutes
      const cacheKey = `admin_message_responses_${messageId}_page_${page}`;
      setCachedData(
        cacheKey,
        { data, count: count || 0 },
        { expiry: CACHE_EXPIRY.SHORT, priority: "low" },
      );

      setResponses(data);

      // Si le message est non lu, le marquer comme lu
      if (currentMessage && currentMessage.status === "unread") {
        console.log("Mise à jour du statut du message de non lu à lu");
        await updateMessageStatus(messageId, "read");
      }
      // Si le message a des réponses et n'est pas encore marqué comme complété
      else if (
        count &&
        count > 0 &&
        currentMessage &&
        (currentMessage.status === "read" ||
          currentMessage.status === "in_progress")
      ) {
        console.log("Le message a des réponses, marquage comme complété");
        await updateMessageStatus(messageId, "completed");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réponses:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réponses",
        variant: "destructive",
      });
    } finally {
      setLoadingResponses(false);
    }
  };

  // Mettre à jour le statut d'un message
  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      console.log(
        `Mise à jour du statut du message ${messageId} à "${status}"`,
      );

      // Préparer les données de mise à jour
      const updateData = {
        status: status,
        handled_at: status === "unread" ? null : new Date().toISOString(),
      };
      console.log("Données de mise à jour:", updateData);

      const { data, error } = await supabase
        .from("contact_messages")
        .update(updateData)
        .eq("id", messageId)
        .select();

      if (error) {
        console.error("Erreur Supabase lors de la mise à jour:", error);
        throw error;
      }

      console.log("Réponse Supabase après mise à jour:", data);

      // Mettre à jour l'état local
      setContactMessages((messages) =>
        messages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: status as any,
                handled_at:
                  status === "unread" ? null : new Date().toISOString(),
              }
            : msg,
        ),
      );

      if (currentMessage && currentMessage.id === messageId) {
        console.log("Mise à jour du message actuel");
        setCurrentMessage((prev) =>
          prev ? { ...prev, status: status as any } : null,
        );
      }

      // Forcer le rechargement des données après un court délai
      setTimeout(() => {
        fetchMessages(true);
      }, 500);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  // Modifier la fonction pour ouvrir le modal
  const openMessagePopover = (message: ContactMessage) => {
    console.log("Ouverture du modal pour le message:", message.id);
    setCurrentMessage(message);
    setAdminResponse("");
    loadResponses(message.id);
    setShowMessagePopover(true);
  };

  // Forcer le rafraîchissement des réponses
  const refreshCurrentResponses = () => {
    if (currentMessage) {
      loadResponses(currentMessage.id, true, responsesPage);
      toast({
        title: "Actualisation",
        description: "Les réponses ont été actualisées",
      });
    }
  };

  // Changer de page pour les réponses
  const changePage = (newPage: number) => {
    if (currentMessage) {
      loadResponses(currentMessage.id, false, newPage);
    }
  };

  // Envoyer une réponse d'administrateur
  const sendAdminResponse = async () => {
    if (!currentMessage || !adminResponse.trim()) return;

    try {
      setIsSending(true);

      // Préparer le texte de la réponse avec salutation et signature
      const salutation = `Bonjour ${currentMessage.first_name},\n\n`;
      const signature = "\n\nCordialement,\nL'équipe Support Vynal Platform";
      const fullResponse = salutation + adminResponse.trim() + signature;

      // Insérer la réponse dans la base de données
      const { error } = await supabase
        .from("contact_message_responses")
        .insert({
          message_id: currentMessage.id,
          response_text: fullResponse,
          responded_by: null, // TODO: Ajouter l'ID du profil admin si disponible
        });

      if (error) {
        throw error;
      }

      // Envoyer un email à l'utilisateur via l'API
      let emailSent = false;
      try {
        // S'assurer que le ticket_id est inclus dans l'objet de l'email
        // Utiliser l'opérateur ?. pour éviter les erreurs si ticket_id est undefined
        const ticketReference = currentMessage?.ticket_id
          ? `(Ticket: ${currentMessage.ticket_id})`
          : "";

        const emailResponse = await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send",
            to: currentMessage.email,
            subject:
              `Réponse à votre message: ${currentMessage.subject} ${ticketReference}`.trim(),
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #6554AF;">Réponse à votre message</h2>
                ${currentMessage?.ticket_id ? `<p><strong>Référence ticket:</strong> ${currentMessage.ticket_id}</p>` : ""}
                <p>Bonjour ${currentMessage.first_name},</p>
                <p>Nous avons le plaisir de vous répondre concernant votre message pour sujet: <strong>${currentMessage.subject}</strong></p>
                <div style="background-color: #f7f9fc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="white-space: pre-wrap;">${adminResponse.trim()}</p>
                </div>
                <p>Pour la suite de nos échanges, vous pouvez :</p>
                <ul>
                  <li>Répondre directement à cet email</li>
                  ${currentMessage?.ticket_id ? `<li>Ou nous contacter via notre formulaire en mentionnant votre numéro de ticket: <strong>${currentMessage.ticket_id}</strong></li>` : ""}
                </ul>
                <p>Cordialement,<br>L'équipe Support Vynal Platform</p>
              </div>
            `,
            text: `Réponse à votre message${currentMessage?.ticket_id ? " (Ticket: " + currentMessage.ticket_id + ")" : ""}\n\nBonjour ${currentMessage.first_name},\n\nNous avons le plaisir de vous répondre concernant votre message pour sujet: ${currentMessage.subject}\n\n${adminResponse.trim()}\n\nPour la suite de nos échanges, vous pouvez :\n- Répondre directement à cet email\n${currentMessage?.ticket_id ? `- Nous contacter via notre formulaire en mentionnant votre numéro de ticket: ${currentMessage.ticket_id}` : ""}\n\nCordialement,\nL'équipe Support Vynal Platform`,
          }),
        });

        const emailResult = await emailResponse.json();
        emailSent = emailResult.success;

        if (emailSent) {
          console.log(`Email de réponse envoyé à ${currentMessage.email}`);
          toast({
            title: "Email envoyé",
            description: `Un email a été envoyé à ${currentMessage.email}`,
            variant: "default",
          });
        } else {
          throw new Error("Échec de l'envoi de l'email");
        }
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        toast({
          title: "Attention",
          description: `L'email n'a pas pu être envoyé à ${currentMessage.email}, mais la réponse a été enregistrée dans le système`,
          variant: "warning",
        });
      }

      // Mettre à jour le statut du message (qu'importe si l'email a été envoyé ou non)
      await updateMessageStatus(currentMessage.id, "completed");

      // Recharger les réponses en ignorant le cache
      loadResponses(currentMessage.id, true, 1);
      setAdminResponse("");

      // Invalider spécifiquement le cache des réponses pour ce message
      setCachedData(
        `admin_message_responses_${currentMessage.id}`,
        null,
        { expiry: 0 }, // Expiration immédiate = invalidation
      );

      // Récupérer les messages mis à jour
      fetchMessages(true);

      toast({
        title: emailSent ? "Réponse envoyée" : "Réponse enregistrée",
        description: emailSent
          ? "Votre réponse a été envoyée avec succès et un email a été envoyé au destinataire"
          : "Votre réponse a été enregistrée mais l'email n'a pas pu être envoyé",
        variant: emailSent ? "default" : "warning",
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Archiver un message
  const archiveMessage = async (messageId: string) => {
    try {
      await updateMessageStatus(messageId, "archived");

      // Fermer le popover
      setShowMessagePopover(false);

      // Récupérer les messages mis à jour
      fetchMessages(true);

      toast({
        title: "Message archivé",
        description: "Le message a été archivé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'archivage du message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le message",
        variant: "destructive",
      });
    }
  };

  // Filtrer les messages selon les critères
  const filteredMessages = contactMessages.filter((message) => {
    // Pour la recherche, on vérifie dans le nom, email ou sujet
    const matchesSearch =
      searchTerm === "" ||
      `${message.first_name} ${message.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrer selon l'onglet actif
    const matchesStatus =
      activeTab === "all" ||
      (activeTab === "active" &&
        (message.status === "unread" ||
          message.status === "read" ||
          message.status === "in_progress")) ||
      (activeTab === "closed" &&
        (message.status === "archived" || message.status === "completed"));

    return matchesSearch && matchesStatus;
  });

  console.log(
    `[DEBUG] Filtrage: ${filteredMessages.length} messages après filtrage (tab: ${activeTab}, search: '${searchTerm}')`,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold text-slate-800 dark:text-vynal-text-primary">
          Administration - Messagerie
        </h1>
        <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary mt-0.5">
          Gestion des messages et conversations
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400 dark:text-vynal-text-secondary/50" />
          <Input
            placeholder="Rechercher un message..."
            className="pl-8 h-8 text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Chargement..." : "Actualiser"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              // Forcer une actualisation complète en ignorant le cache
              toast({
                title: "Rechargement forcé",
                description: "Rechargement complet des données en cours...",
                variant: "default",
              });

              // Supprimer le cache d'abord
              localStorage.removeItem("cache_admin_contact_messages");

              // Puis recharger les données
              fetchMessages(true);
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1`} />
            Forcer MAJ
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        onValueChange={setActiveTab}
        className="space-y-3"
      >
        <TabsList className="bg-white/25 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700/20">
          <TabsTrigger
            value="all"
            className="flex gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Tous</span>
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="flex gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <CheckCircle className="h-3 w-3" />
            <span>En cours</span>
          </TabsTrigger>
          <TabsTrigger
            value="closed"
            className="flex gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <X className="h-3 w-3" />
            <span>Traités/Archivés</span>
          </TabsTrigger>
        </TabsList>

        <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-800 dark:text-vynal-text-primary">
              Liste des messages de contact
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-vynal-text-secondary">
              {filteredMessages.length} message(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-200 dark:border-slate-700/30 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-100/30 dark:bg-slate-800/30">
                  <TableRow>
                    <TableHead className="text-xs text-slate-700 dark:text-vynal-text-secondary">
                      Sujet
                    </TableHead>
                    <TableHead className="text-xs text-slate-700 dark:text-vynal-text-secondary">
                      Expéditeur
                    </TableHead>
                    <TableHead className="text-xs text-slate-700 dark:text-vynal-text-secondary">
                      Email
                    </TableHead>
                    <TableHead className="w-[140px] text-xs text-slate-700 dark:text-vynal-text-secondary">
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] text-xs text-slate-700 dark:text-vynal-text-secondary">
                      Statut
                    </TableHead>
                    <TableHead className="text-right w-[100px] text-xs text-slate-700 dark:text-vynal-text-secondary">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-xs text-slate-600 dark:text-vynal-text-secondary"
                      >
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-vynal-accent-primary"></div>
                          <span className="ml-2">Chargement...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <TableRow
                        key={message.id}
                        className="hover:bg-slate-100 dark:hover:bg-slate-800/25 transition-all duration-200"
                      >
                        <TableCell className="font-medium text-xs text-slate-800 dark:text-vynal-text-primary">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-vynal-accent-primary" />
                            {message.subject}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 dark:text-vynal-text-secondary">
                          {`${message.first_name} ${message.last_name}`}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 dark:text-vynal-text-secondary">
                          {message.email}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 dark:text-vynal-text-secondary">
                          {formatDate(message.created_at)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {getStatusBadge(message.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openMessagePopover(message);
                            }}
                          >
                            <Eye className="h-3 w-3 text-slate-700 dark:text-vynal-text-secondary" />
                            <span className="sr-only">Voir le message</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-xs text-slate-600 dark:text-vynal-text-secondary"
                      >
                        Aucun message de contact trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Modal pour afficher les messages - Implémentation complète Radix UI */}
      <Dialog.Root
        open={showMessagePopover}
        onOpenChange={(open) => {
          setShowMessagePopover(open);
          if (!open) {
            setAdminResponse("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/30 dark:bg-slate-900/30 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/30 max-w-[500px] w-[90vw] max-h-[85vh] overflow-hidden z-50 p-0">
            {currentMessage && (
              <div className="flex flex-col h-full max-h-[85vh]">
                {/* En-tête */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700/20 bg-white/25 dark:bg-slate-900/20">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="font-medium text-slate-800 dark:text-vynal-text-primary">
                        Message de {currentMessage?.first_name}{" "}
                        {currentMessage?.last_name}
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        {currentMessage?.ticket_id && (
                          <Badge
                            variant="outline"
                            className="bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 font-mono text-[8px] sm:text-xs"
                          >
                            Ticket: {currentMessage.ticket_id}
                          </Badge>
                        )}
                        {getStatusBadge(currentMessage?.status)}
                      </div>
                    </div>
                    <div className="text-xs flex justify-between items-center mt-1 flex-wrap gap-1">
                      <span className="flex flex-wrap gap-1 items-center">
                        <span className="text-slate-500 dark:text-vynal-text-secondary text-[9px] sm:text-xs">
                          {currentMessage?.email}
                        </span>
                        <span className="mx-2 hidden sm:inline">•</span>
                        <span className="text-slate-400 dark:text-vynal-text-secondary/70 text-[9px] sm:text-xs">
                          {formatDate(currentMessage.created_at)}
                        </span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[8px] sm:text-[9px] border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25 text-slate-700 dark:text-vynal-text-secondary"
                        onClick={refreshCurrentResponses}
                        disabled={loadingResponses}
                      >
                        <RefreshCw
                          className={`h-2.5 w-2.5 mr-1 ${loadingResponses ? "animate-spin" : ""}`}
                        />
                        Actualiser
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Corps */}
                <div className="p-3 flex-1 overflow-auto">
                  <ScrollArea className="h-[200px] sm:h-[300px] rounded-md border border-slate-200 dark:border-slate-700/30 p-4 bg-white/20 dark:bg-slate-800/25">
                    {/* Message original */}
                    <div className="p-4 mb-4 rounded-lg bg-slate-100/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/15">
                      <div className="mb-2">
                        <h3 className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                          {currentMessage.subject}
                        </h3>
                        <div className="mt-1 text-xs text-slate-600 dark:text-vynal-text-secondary">
                          De: {currentMessage.first_name}{" "}
                          {currentMessage.last_name} ({currentMessage.email})
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-vynal-text-secondary">
                          Date: {formatDate(currentMessage.created_at)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm whitespace-pre-wrap text-slate-700 dark:text-vynal-text-secondary">
                        {currentMessage.message}
                      </div>
                    </div>

                    {/* Réponses */}
                    {loadingResponses ? (
                      <div className="flex justify-center items-center h-[100px]">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-vynal-accent-primary"></div>
                        <span className="ml-2 text-xs text-slate-600 dark:text-vynal-text-secondary">
                          Chargement des réponses...
                        </span>
                      </div>
                    ) : responses.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {responses.map((response) => (
                            <div
                              key={response.id}
                              className="bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 border border-vynal-accent-primary/20 dark:border-vynal-accent-primary/20 ml-auto mr-0 max-w-[80%] p-3 rounded-lg hover:bg-vynal-accent-primary/15 hover:border-vynal-accent-primary/30 dark:hover:bg-vynal-accent-primary/20 dark:hover:border-vynal-accent-primary/40 transition-all duration-200"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-vynal-accent-primary">
                                  Admin
                                </span>
                                <span className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                                  {formatDate(response.created_at)}
                                </span>
                              </div>
                              <p className="text-xs whitespace-pre-wrap text-slate-700 dark:text-vynal-text-secondary">
                                {response.response_text}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Pagination des réponses */}
                        {totalResponses > RESPONSES_PER_PAGE && (
                          <div className="flex justify-center items-center mt-4 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                              disabled={responsesPage === 1}
                              onClick={() => changePage(responsesPage - 1)}
                            >
                              &lt;
                            </Button>
                            <span className="text-xs text-slate-700 dark:text-vynal-text-secondary">
                              Page {responsesPage} /{" "}
                              {Math.ceil(totalResponses / RESPONSES_PER_PAGE)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                              disabled={
                                responsesPage >=
                                Math.ceil(totalResponses / RESPONSES_PER_PAGE)
                              }
                              onClick={() => changePage(responsesPage + 1)}
                            >
                              &gt;
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-xs text-slate-600 dark:text-vynal-text-secondary py-4">
                        Aucune réponse pour ce message
                      </div>
                    )}
                  </ScrollArea>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex-1 w-full">
                        <Textarea
                          placeholder="Répondre en tant qu'administrateur..."
                          value={adminResponse}
                          onChange={(e) => setAdminResponse(e.target.value)}
                          className="min-h-[60px] sm:min-h-[80px] text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                        />
                        <div className="mt-1 text-[8px] text-slate-600 dark:text-vynal-text-secondary">
                          Note: "Bonjour [Prénom]" et "Cordialement, L'équipe
                          Support Vynal Platform" seront ajoutés automatiquement
                        </div>
                      </div>
                      <Button
                        onClick={sendAdminResponse}
                        disabled={isSending || !adminResponse.trim()}
                        size="sm"
                        className="mb-1 bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
                      >
                        {isSending ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-[9px]">Envoyer</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pied de page avec boutons d'action */}
                <div className="p-2 border-t border-slate-200 dark:border-slate-700/20 bg-white/25 dark:bg-slate-900/20 flex items-center justify-between sticky bottom-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowMessagePopover(false)}
                    size="sm"
                    className="text-xs border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25 text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Fermer
                  </Button>

                  {/* Bouton d'archivage - rendu seulement pour les messages non archivés et non complétés */}
                  {currentMessage.status !== "archived" &&
                    currentMessage.status !== "completed" && (
                      <Button
                        variant="destructive"
                        onClick={() => archiveMessage(currentMessage.id)}
                        size="sm"
                        className="text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Archiver
                      </Button>
                    )}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
