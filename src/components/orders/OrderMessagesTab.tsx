"use client";

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Paperclip,
  X,
  Loader2,
  FileText,
  FileIcon,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Order } from "@/types/orders";
import { Message } from "@/types/supabase/messages.types";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { uploadOrderMessageAttachment } from "@/lib/supabase/file-upload";
import { uploadOrderFile } from "@/lib/supabase/order-files";
import { validateMessage } from "@/lib/message-validation";
import ImageNext from "next/image";

// Composant memoïsé pour le rendu des pièces jointes
const MessageAttachment = memo(({ message }: { message: Message }) => {
  if (!message.attachment_url) return null;

  const isImage = message.attachment_type?.startsWith("image/");

  return (
    <div className="mb-2 border rounded-md overflow-hidden bg-white/10">
      {isImage ? (
        <a
          href={message.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <ImageNext
            src={message.attachment_url}
            alt={message.attachment_name || "Pièce jointe"}
            className="max-h-[150px] w-auto object-contain"
            width={200}
            height={150}
            unoptimized
          />
        </a>
      ) : (
        <a
          href={message.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-2 hover:bg-black/5"
        >
          <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <div className="text-[8px] sm:text-[9px] text-gray-200 dark:text-gray-300 truncate">
            {message.attachment_name || "Fichier joint"}
          </div>
        </a>
      )}
    </div>
  );
});

MessageAttachment.displayName = "MessageAttachment";

// Composant memoïsé pour l'avatar de l'utilisateur
const UserAvatar = memo(
  ({
    sender,
    avatarUrl,
    size = "small",
  }: {
    sender: any;
    avatarUrl: string | null;
    size?: "small" | "medium";
  }) => {
    const sizeClass =
      size === "small" ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-8 sm:h-10 sm:w-10";

    const getSenderInitials = (sender: any) => {
      if (!sender) return "UN";

      if (sender.full_name) {
        const nameParts = sender.full_name.split(" ");
        if (nameParts.length > 1) {
          return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
        }
        return sender.full_name.substring(0, 2).toUpperCase();
      }

      return sender.username
        ? sender.username.substring(0, 2).toUpperCase()
        : "UN";
    };

    return (
      <div
        className={`${sizeClass} rounded-full bg-vynal-purple-secondary/10 flex items-center justify-center overflow-hidden`}
      >
        {avatarUrl ? (
          <ImageNext
            src={avatarUrl}
            alt={sender?.username || "Avatar"}
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[8px] sm:text-[9px] font-medium text-vynal-purple-secondary">
            {getSenderInitials(sender)}
          </span>
        )}
      </div>
    );
  },
);

UserAvatar.displayName = "UserAvatar";

// Composant memoïsé pour l'indicateur de frappe
const TypingIndicator = memo(() => (
  <div className="flex justify-start">
    <div className="max-w-[60%] rounded-lg p-2 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 text-vynal-purple-secondary dark:text-vynal-text-secondary animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex space-x-1 items-center text-vynal-accent-primary dark:text-vynal-text-secondary animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div
          className="w-1.5 h-1.5 bg-vynal-purple-secondary/30 rounded-full animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1s" }}
        />
        <div
          className="w-1.5 h-1.5 bg-vynal-purple-secondary/30 rounded-full animate-bounce"
          style={{ animationDelay: "150ms", animationDuration: "1s" }}
        />
        <div
          className="w-1.5 h-1.5 bg-vynal-purple-secondary/30 rounded-full animate-bounce"
          style={{ animationDelay: "300ms", animationDuration: "1s" }}
        />
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = "TypingIndicator";

// Composant memoïsé pour l'état vide
const EmptyMessagesState = memo(({ isFreelance }: { isFreelance: boolean }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-vynal-purple-secondary/30 dark:text-vynal-text-secondary/30" />
    <p className="mt-2 text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
      Aucun message pour le moment
    </p>
    <p className="text-[8px] sm:text-[9px] text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">
      Envoyez un message pour communiquer avec{" "}
      {isFreelance ? "le client" : "le freelance"}
    </p>
  </div>
));

EmptyMessagesState.displayName = "EmptyMessagesState";

// Composant memoïsé pour un message individuel
const MessageItem = memo(
  ({
    message,
    isCurrentUser,
    sender,
    index,
  }: {
    message: Message;
    isCurrentUser: boolean;
    sender: any;
    index: number;
  }) => {
    return (
      <div
        key={message.id || index}
        className={clsx(
          "flex items-start space-x-2 mb-4",
          isCurrentUser ? "justify-end" : "justify-start",
        )}
      >
        {!isCurrentUser && (
          <div className="flex-shrink-0">
            <UserAvatar sender={sender} avatarUrl={sender.avatar_url} />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={clsx(
            "relative max-w-[80%] sm:max-w-[75%] rounded-lg p-2.5 pb-4 sm:p-3 sm:pb-4",
            isCurrentUser
              ? "bg-vynal-accent-primary text-white"
              : "bg-vynal-purple-secondary/10 text-vynal-purple-light dark:bg-vynal-purple-secondary/20 dark:text-vynal-text-primary",
          )}
        >
          <MessageAttachment message={message} />

          <div className="text-[10px] sm:text-xs break-words whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>

          <div
            className={clsx(
              "absolute bottom-0.5 right-2 text-[8px] sm:text-[9px] whitespace-nowrap",
              isCurrentUser
                ? "text-white/80"
                : "text-vynal-purple-secondary dark:text-vynal-text-secondary",
            )}
          >
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </div>
        </motion.div>

        {isCurrentUser && (
          <div className="flex-shrink-0">
            <UserAvatar sender={sender} avatarUrl={sender.avatar_url} />
          </div>
        )}
      </div>
    );
  },
);

MessageItem.displayName = "MessageItem";

// Composant pour le fichier sélectionné
const SelectedFile = memo(
  ({
    attachment,
    onClear,
  }: {
    attachment: File | null;
    onClear: () => void;
  }) => {
    if (!attachment) return null;

    return (
      <div className="bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 rounded-md p-2 mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary truncate">
          <FileText className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{attachment.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full hover:bg-vynal-purple-secondary/10"
          onClick={onClear}
        >
          <X className="h-3 w-3 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
        </Button>
      </div>
    );
  },
);

SelectedFile.displayName = "SelectedFile";

// Composant principal pour l'onglet des messages
export function OrderMessagesTab({
  order,
  isFreelance,
}: {
  order: Order;
  isFreelance: boolean;
}) {
  // Convertir les messages existants au format attendu
  const initialMessages = useMemo(
    () =>
      (order.messages || []).map((msg) => ({
        id: msg.id,
        created_at: msg.created_at || new Date().toISOString(),
        order_id: order.id,
        sender_id: msg.sender_id,
        content: msg.content,
        read: msg.read,
        conversation_id: null,
        sender: msg.sender,
        attachment_url: msg.attachment_url || null,
        attachment_type: msg.attachment_type || null,
        attachment_name: msg.attachment_name || null,
        is_typing: false,
      })),
    [order.messages, order.id],
  );

  // États du composant
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  // Identifiants des utilisateurs
  const currentUserId = isFreelance ? order.freelance.id : order.client.id;
  const otherUserId = isFreelance ? order.client.id : order.freelance.id;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fonction pour marquer un message comme lu
  const markMessageAsRead = useCallback(
    async (messageId: string) => {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("id", messageId);
    },
    [supabase],
  );

  // Marquer les messages non lus comme lus
  useEffect(() => {
    const unreadMessages = messages.filter(
      (message) => !message.read && message.sender_id !== currentUserId,
    );

    unreadMessages.forEach((message) => {
      markMessageAsRead(message.id);
    });
  }, [messages, currentUserId, markMessageAsRead]);

  // Abonnement aux mises à jour des messages
  useEffect(() => {
    if (!order.id || !supabase || !currentUserId || !otherUserId) return;

    // Canal pour les nouveaux messages et mises à jour
    const messagesChannel = supabase
      .channel("order-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Marquer comme lu si c'est de l'autre utilisateur
          if (newMessage.sender_id !== currentUserId) {
            markMessageAsRead(newMessage.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;

          // Gérer l'indicateur de frappe
          if (
            updatedMessage.sender_id === otherUserId &&
            updatedMessage.is_typing
          ) {
            setIsTyping(true);

            // Auto-reset de l'indicateur après 3 secondes
            setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }

          // Mettre à jour le message dans la liste
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg,
            ),
          );
        },
      )
      .subscribe();

    // Nettoyage à la désinscription
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [order.id, currentUserId, otherUserId, supabase, markMessageAsRead]);

  // Gérer l'indicateur de frappe
  const handleTyping = useCallback(() => {
    // Effacer le timeout précédent
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Mettre à jour le statut de frappe
    const updateTyping = async () => {
      await supabase
        .from("messages")
        .update({ is_typing: true })
        .eq("sender_id", currentUserId)
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Réinitialiser l'indicateur après 2 secondes
      const timeout = setTimeout(async () => {
        await supabase
          .from("messages")
          .update({ is_typing: false })
          .eq("sender_id", currentUserId)
          .eq("order_id", order.id)
          .order("created_at", { ascending: false })
          .limit(1);
      }, 2000);

      setTypingTimeout(timeout);
    };

    updateTyping();
  }, [supabase, currentUserId, order.id, typingTimeout]);

  // Gérer le changement de fichier
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setAttachment(e.target.files[0]);
      }
    },
    [],
  );

  // Effacer le fichier sélectionné
  const clearAttachment = useCallback(() => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Uploader un fichier joint
  const uploadAttachment = useCallback(
    async (file: File) => {
      try {
        // Uploader le fichier pour le message du tchat
        const result = await uploadOrderMessageAttachment(file, order.id);

        if (!result.success) {
          throw result.error || new Error("Échec de l'upload de fichier");
        }

        // Enregistrer également le fichier dans la table order_files
        try {
          await uploadOrderFile(order.id, file);
        } catch (fileErr) {
          // Ne pas bloquer l'envoi du message si l'enregistrement dans order_files échoue
          console.error(
            "Erreur lors de l'enregistrement du fichier dans order_files:",
            fileErr,
          );
        }

        return {
          url: result.url,
          type: result.type,
          name: result.name,
        };
      } catch (err) {
        console.error("Exception lors de l'upload du fichier:", err);
        throw err;
      }
    },
    [order.id],
  );

  // Gérer l'envoi d'un nouveau message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() && !attachment) return;

    setIsLoading(true);

    try {
      // Valider le message pour bloquer les mots interdits
      let finalContent = newMessage.trim();

      if (finalContent) {
        const validationResult = validateMessage(finalContent, {
          maxLength: 5000,
          minLength: 1,
          censorInsteadOfBlock: true,
          allowQuotedWords: true,
          allowLowSeverityWords: true,
          respectRecommendedActions: true,
        });

        if (!validationResult.isValid) {
          toast({
            title: "Message non valide",
            description: "Ce message est interdit.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (validationResult.warningMessage) {
          toast({
            title: "Attention",
            description: validationResult.warningMessage,
            variant: "warning",
          });
        }

        if (validationResult.censored) {
          finalContent =
            validationResult.message +
            " [Ce message a été modéré automatiquement]";
        }
      }

      let attachmentData = null;

      if (attachment) {
        attachmentData = await uploadAttachment(attachment);
      }

      // Utiliser le message potentiellement censuré
      const messageContent =
        finalContent || (attachment ? `Fichier: ${attachment.name}` : "");

      // Création d'un message avec tous les champs nécessaires
      const messageData = {
        order_id: order.id,
        sender_id: user?.id || currentUserId,
        content: messageContent,
        attachment_url: attachmentData?.url || null,
        attachment_type: attachmentData?.type || null,
        attachment_name: attachmentData?.name || null,
        read: false,
        is_typing: false,
        conversation_id: null,
        created_at: new Date().toISOString(),
      };

      // Envoyer le message à la base de données
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert(messageData)
        .select();

      if (insertError) {
        console.error("Erreur lors de l'envoi du message:", insertError);

        toast({
          title: "Erreur",
          description:
            "Le message n'a pas pu être envoyé: " + insertError.message,
          variant: "destructive",
        });
        return;
      }

      // Ajouter le message à l'état local
      if (data && data.length > 0) {
        const newMessageData = data[0] as Message;
        setMessages((prev) => [...prev, newMessageData]);

        // Envoyer une notification au destinataire
        try {
          const notificationResponse = await fetch(
            "/api/notifications/message",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: otherUserId,
                type: "new_message",
                content: JSON.stringify({
                  messagePreview: messageContent,
                  senderName: isFreelance
                    ? order.freelance.full_name
                    : order.client.full_name,
                  metadata: {
                    orderId: order.id,
                    orderTitle: order.service?.title || "Commande",
                  },
                }),
                conversationId: order.id,
              }),
            },
          );

          if (!notificationResponse.ok) {
            console.error(
              "Erreur lors de l'envoi de la notification:",
              await notificationResponse.text(),
            );
          }
        } catch (notificationError) {
          // Ne pas bloquer le flux principal si la notification échoue
          console.error(
            "Erreur lors de l'envoi de la notification:",
            notificationError,
          );
        }
      }

      // Réinitialiser les champs
      setNewMessage("");
      clearAttachment();

      // Si le message a été censuré, afficher une notification
      if (
        messageContent.includes("[Ce message a été modéré automatiquement]")
      ) {
        toast({
          title: "Modération",
          description: "Certains mots de votre message ont été censurés.",
          variant: "info",
        });
      }
    } catch (err) {
      console.error("Exception lors de l'envoi du message:", err);
      toast({
        title: "Erreur",
        description:
          "Le message n'a pas pu être envoyé: " +
          (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    newMessage,
    attachment,
    order.id,
    user?.id,
    currentUserId,
    supabase,
    toast,
    uploadAttachment,
    clearAttachment,
    isFreelance,
    order,
  ]);

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="space-y-3 sm:space-y-4 h-[450px] sm:h-[500px] overflow-y-auto py-3 px-1 sm:px-2 scrollbar-thin scrollbar-thumb-vynal-purple-secondary/20 scrollbar-track-transparent border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 rounded-md bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10">
        {messages.length > 0 ? (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUserId;
              const sender = isCurrentUser
                ? isFreelance
                  ? order.freelance
                  : order.client
                : isFreelance
                  ? order.client
                  : order.freelance;

              return (
                <MessageItem
                  key={message.id || `msg-${index}`}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  sender={sender}
                  index={index}
                />
              );
            })}
            <div ref={messagesEndRef} />

            {isTyping && <TypingIndicator />}
          </>
        ) : (
          <EmptyMessagesState isFreelance={isFreelance} />
        )}
      </div>

      <div className="border-t border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 pt-3 sm:pt-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        />

        <div className="mt-3 sm:mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[8px] sm:text-[9px] h-7 sm:h-8 rounded-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3 w-3 mr-1" />
              Joindre un fichier
            </Button>
          </div>

          <SelectedFile attachment={attachment} onClear={clearAttachment} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={`Envoyez un message à ${isFreelance ? "votre client" : "votre freelance"}...`}
            className="flex-1 border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 focus-visible:ring-vynal-accent-primary text-[10px] sm:text-xs min-h-[80px]"
            rows={3}
          />
          <div className="flex flex-col justify-end gap-2">
            <Button
              type="submit"
              disabled={(!newMessage.trim() && !attachment) || isLoading}
              size="sm"
              className="bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
