"use client";

import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Paperclip, X, Loader2, FileText, Image, FileIcon } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Order } from "@/types/orders";
import { Message, Messages } from "@/types/supabase/messages.types";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { uploadOrderMessageAttachment } from "@/lib/supabase/file-upload";
import { uploadOrderFile } from "@/lib/supabase/order-files";
import { validateMessage } from "@/lib/message-validation";
import ImageNext from 'next/image';

interface OrderMessagesTabProps {
  order: Order;
  isFreelance: boolean;
}

export function OrderMessagesTab({ order, isFreelance }: OrderMessagesTabProps) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    // Convert existing OrderMessage[] to Message[]
    return (order.messages || []).map(msg => ({
      id: msg.id,
      created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
      order_id: order.id,
      sender_id: msg.sender_id,
      content: msg.content,
      read: msg.is_read !== undefined ? msg.is_read : false,
      conversation_id: null,
      attachment_url: msg.attachment_url || null,
      attachment_type: msg.attachment_type || null,
      attachment_name: msg.attachment_name || null,
      is_typing: msg.is_typing || false
    }));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  
  const currentUserId = isFreelance ? order.freelance.id : order.client.id;
  const otherUserId = isFreelance ? order.client.id : order.freelance.id;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Consolidated subscriptions for messages and typing indicators
  useEffect(() => {
    if (!order.id || !supabase || !currentUserId || !otherUserId) return;
    
    // Channel for message updates and new messages
    const messagesChannel = supabase
      .channel('order-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${order.id}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        
        // Mark as read if it's from the other user
        if (newMessage.sender_id !== currentUserId) {
          markMessageAsRead(newMessage.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${order.id}`
      }, (payload) => {
        const updatedMessage = payload.new as Message;
        
        // Handle typing indicator
        if (updatedMessage.sender_id === otherUserId && updatedMessage.is_typing) {
          setIsTyping(true);
          
          // Auto-clear typing status after 3 seconds
          setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
        
        // Update message in the list
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      })
      .subscribe();

    // Clean up subscriptions on unmount
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [order.id, currentUserId, otherUserId, supabase]);

  // Mark message as read
  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
  };

  // Handle typing indicator
  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Update typing status
    const updateTyping = async () => {
      await supabase
        .from('messages')
        .update({ is_typing: true })
        .eq('sender_id', currentUserId)
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Auto reset typing indicator after 2 seconds
      const timeout = setTimeout(async () => {
        await supabase
          .from('messages')
          .update({ is_typing: false })
          .eq('sender_id', currentUserId)
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1);
      }, 2000);
      
      setTypingTimeout(timeout);
    };
    
    updateTyping();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  // Clear selected file
  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Uploader un fichier joint
  const uploadAttachment = async (file: File) => {
    try {
      console.log(`Tentative d'upload de fichier pour la commande: ${order.id}`);
      
      // Uploader le fichier pour le message du tchat
      const result = await uploadOrderMessageAttachment(file, order.id);
      
      if (!result.success) {
        console.error("Échec de l'upload du fichier:", result.error);
        throw result.error || new Error("Échec de l'upload de fichier");
      }
      
      console.log(`Upload pour le tchat réussi:`, result);
      
      // Enregistrer également le fichier dans la table order_files pour qu'il apparaisse dans l'onglet Fichiers
      try {
        console.log(`Enregistrement du fichier dans la table order_files`);
        // Utiliser le même fichier déjà uploadé mais créer une entrée dans order_files
        const orderFile = await uploadOrderFile(order.id, file);
        console.log(`Fichier enregistré avec succès dans order_files:`, orderFile);
      } catch (fileErr) {
        // Ne pas bloquer l'envoi du message si l'enregistrement dans order_files échoue
        console.error("Erreur lors de l'enregistrement du fichier dans order_files:", fileErr);
        // On continue le processus même en cas d'erreur ici
      }
      
      return {
        url: result.url,
        type: result.type,
        name: result.name
      };
    } catch (err) {
      console.error("Exception lors de l'upload du fichier:", err);
      throw err;
    }
  };

  // Gérer l'envoi d'un nouveau message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;
    
    setIsLoading(true);
    
    try {
      // Valider le message pour bloquer les mots interdits
      if (newMessage.trim()) {
        const validationResult = validateMessage(newMessage.trim(), {
          maxLength: 5000,
          minLength: 1,
          censorInsteadOfBlock: true,
          allowQuotedWords: true,      // Autorise les mots interdits dans les citations/signalements
          allowLowSeverityWords: true,  // Autorise les mots de faible gravité
          respectRecommendedActions: true  // Utiliser les actions recommandées
        });
        
        if (!validationResult.isValid) {
          // Afficher un message d'erreur si le message contient des mots interdits
          toast({
            title: "Message non valide",
            description: "Ce message est interdit.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Afficher un avertissement si nécessaire mais laisser l'utilisateur envoyer le message
        if (validationResult.warningMessage) {
          toast({
            title: "Attention",
            description: validationResult.warningMessage,
            variant: "warning"
          });
        }
        
        // Si le message a été censuré, on le remplace par la version censurée
        if (validationResult.censored) {
          setNewMessage(validationResult.message + " [Ce message a été modéré automatiquement]");
        }
      }
      
      let attachmentData = null;
      
      if (attachment) {
        attachmentData = await uploadAttachment(attachment);
      }
      
      // Utiliser le message potentiellement censuré
      const finalContent = newMessage.trim() || (attachment ? `Fichier: ${attachment.name}` : '');
      
      // Création d'un message avec tous les champs nécessaires pour passer la politique RLS
      const messageData = {
        order_id: order.id,
        sender_id: user?.id || currentUserId,
        content: finalContent,
        attachment_url: attachmentData?.url || null,
        attachment_type: attachmentData?.type || null,
        attachment_name: attachmentData?.name || null,
        read: false,
        is_typing: false,
        conversation_id: null,  // Assurez-vous que ce champ est explicitement null
        created_at: new Date().toISOString()  // Fournir explicitement created_at
      };
      
      // Log des données que nous allons insérer pour le débogage
      console.log("Tentative d'insertion avec les données:", messageData);
      
      // Envoyer le message à la base de données en utilisant une insertion directe
      // plutôt que le helper createOrderMessage pour être sûr des champs exacts
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert(messageData)
        .select();
      
      if (insertError) {
        console.error("Erreur lors de l'envoi du message:", insertError);
        
        // Information détaillée pour le débogage
        if (insertError.message && insertError.message.includes('violates row-level security policy')) {
          console.error("Erreur de politique RLS détectée. Détails:", {
            table: 'messages',
            operation: 'INSERT',
            userId: user?.id,
            currentUserId,
            orderId: order.id
          });
        }
        
        toast({
          title: "Erreur",
          description: "Le message n'a pas pu être envoyé: " + insertError.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log("Message envoyé avec succès:", data);
      
      // Ajouter le message localement à l'état pour assurer un affichage immédiat
      // même si la souscription real-time a un délai
      if (data && data.length > 0) {
        const newMessageData = data[0] as Message;
        setMessages(prev => [...prev, newMessageData]);
      }
      
      // Réinitialiser les champs
      setNewMessage("");
      clearAttachment();
      
      // Si le message a été censuré, afficher une notification
      if (messageData.content.includes("[Ce message a été modéré automatiquement]")) {
        toast({
          title: "Modération",
          description: "Certains mots de votre message ont été censurés.",
          variant: "info"
        });
      }
      
    } catch (err) {
      console.error("Exception lors de l'envoi du message:", err);
      toast({
        title: "Erreur",
        description: "Le message n'a pas pu être envoyé: " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu d'une pièce jointe
  const renderAttachment = (message: Message) => {
    if (!message.attachment_url) return null;
    
    const isImage = message.attachment_type?.startsWith('image/');
    
    return (
      <div className="mt-2 border rounded-md overflow-hidden">
        {isImage ? (
          <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
            <ImageNext 
              src={message.attachment_url} 
              alt={message.attachment_name || "Pièce jointe"} 
              className="max-h-[200px] max-w-full object-contain"
              width={200}
              height={200}
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
            <FileIcon className="h-5 w-5 mr-2" />
            <div className="text-xs truncate">{message.attachment_name}</div>
          </a>
        )}
      </div>
    );
  };

  // Récupérer l'avatar de l'utilisateur
  const getUserAvatar = (userId: string) => {
    // Utiliser un avatar par défaut si aucun n'est trouvé
    const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(
      userId === user?.id ? "Vous" : 
      userId === order.freelance.id ? "Freelance" : 
      "Client"
    ) + "&background=random";
    
    // Si c'est l'utilisateur actuel
    if (userId === user?.id) {
      // Pour l'utilisateur actuel, chercher dans l'objet client ou freelance selon le rôle
      if (isFreelance && order.freelance.id === user?.id) {
        return order.freelance.avatar_url || defaultAvatar;
      } else if (!isFreelance && order.client.id === user?.id) {
        return order.client.avatar_url || defaultAvatar;
      }
      return defaultAvatar;
    }
    
    // Si c'est le freelance
    if (userId === order.freelance.id) {
      return order.freelance.avatar_url || defaultAvatar;
    }
    
    // Si c'est le client
    if (userId === order.client.id) {
      return order.client.avatar_url || defaultAvatar;
    }
    
    return defaultAvatar;
  };

  // Mark unread messages as read
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach(message => {
        if (!message.read && message.sender_id !== currentUserId) {
          markMessageAsRead(message.id);
        }
      });
    }
  }, [messages, currentUserId, markMessageAsRead]);

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-vynal-purple-secondary/20 scrollbar-track-transparent no-scrollbar">
        {messages.length > 0 ? (
          <>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={clsx(
                  "flex flex-col py-3 px-4 rounded-lg mb-4 max-w-[80%]",
                  message.sender_id === user?.id
                    ? "bg-primary-50 ml-auto dark:bg-primary-800"
                    : "bg-gray-100 mr-auto dark:bg-gray-800"
                )}
              >
                <div className="flex items-center mb-1">
                  <div className="w-5 h-5 rounded-full overflow-hidden mr-2 flex-shrink-0 bg-gray-200">
                    <ImageNext 
                      src={getUserAvatar(message.sender_id)} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      width={20}
                      height={20}
                      unoptimized
                      onError={(e) => {
                        // En cas d'erreur, utiliser l'avatar par défaut
                        const target = e.target as HTMLImageElement;
                        const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(
                          message.sender_id === user?.id ? "Vous" : "Utilisateur"
                        ) + "&background=random";
                        
                        if (target.src !== defaultAvatar) {
                          target.src = defaultAvatar;
                        } else {
                          // Si l'avatar par défaut échoue aussi, masquer l'image
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium">
                    {message.sender_id === user?.id ? "Vous" : "Freelance"}
                  </div>
                </div>
                <div className="text-sm">
                  {message.content || ""}
                  {message.attachment_url && renderAttachment(message)}
                </div>
                <div className="text-xs text-gray-500 mt-1 self-end">
                  {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: fr }) : ""}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[60%] rounded-lg p-2 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 text-vynal-purple-secondary dark:text-vynal-text-secondary">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-vynal-purple-secondary/30 dark:text-vynal-text-secondary/30" />
            <p className="mt-2 text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucun message pour le moment</p>
            <p className="text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">Envoyez un message pour communiquer avec {isFreelance ? "le client" : "le freelance"}</p>
          </div>
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
        
        {attachment && (
          <div className="mb-2 p-2 bg-vynal-purple-secondary/5 rounded-md flex items-center justify-between">
            <div className="flex items-center text-xs truncate">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              <span className="truncate">{attachment.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={clearAttachment}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={`Envoyez un message à ${isFreelance ? "votre client" : "votre freelance"}...`}
            className="flex-1 border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 focus-visible:ring-vynal-accent-primary text-xs sm:text-sm"
            rows={3}
          />
          <div className="flex flex-col justify-end gap-2">
            <Button 
              type="button"
              variant="outline"
              size="sm"
              className="border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button 
              type="submit"
              disabled={(!newMessage.trim() && !attachment) || isLoading}
              size="sm"
              className="bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 