"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Send, ArrowLeft, MoreVertical, Image, FileText, X, Smile, Check, Circle, Trash, Upload, RefreshCw, ChevronUp, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { Conversation as BaseConversation, Message, useMessagingStore } from '@/lib/stores/useMessagingStore';
import { formatDistanceToNow, formatDate, formatFileSize } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import MessageBubble from './MessageBubble';
import { supabase } from '@/lib/supabase/client';
import UserStatusIndicator from './UserStatusIndicator';
import usePreventScrollReset from '@/hooks/usePreventScrollReset';
import { validateMessage } from '@/lib/message-validation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileIcon } from '@/components/ui/icons/FileIcon';
import { SendHorizontal } from 'lucide-react';

// Extension du type Conversation pour inclure other_user
interface Conversation extends BaseConversation {
  other_user?: {
    id: string;
    name: string;
    image?: string;
    email?: string;
    unread_count?: number;
  };
}

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
  isFreelance?: boolean;
}

// Fonction utilitaire pour obtenir les initiales d'un nom
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversation, 
  onBack,
  isFreelance = false
}) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<{url: string, type: string, name: string}[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [headerAvatarError, setHeaderAvatarError] = useState(false);
  const [typingAvatarError, setTypingAvatarError] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'warning' | 'error' | 'info' | 'success', id: number} | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [notificationPermissionDialog, setNotificationPermissionDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [loadMoreVisible, setLoadMoreVisible] = useState(false);
  const [attachment, setAttachment] = useState<{name: string, size: number} | null>(null);
  const MESSAGES_PER_PAGE = 20;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibleMessageIdsRef = useRef<Set<string>>(new Set());
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    messages,
    isTyping,
    sendMessage,
    markAsRead,
    markSpecificMessagesAsRead,
    setIsTyping: updateTypingStatus
  } = useMessagingStore();

  // Trouver l'autre participant (dans une conversation à 2 personnes)
  const otherParticipant = conversation.participants.find(
    p => p.id !== user?.id
  );
  
  // Si l'autre participant est en train d'écrire
  const isOtherParticipantTyping = otherParticipant?.id ? isTyping[otherParticipant.id] : false;
  
  // Obtenir le nombre de messages non lus dans cette conversation
  const unreadCount = otherParticipant?.unread_count || 0;

  // Initialiser les messages visibles
  useEffect(() => {
    if (messages.length > 0) {
      // Afficher les messages les plus récents (limité à MESSAGES_PER_PAGE)
      const startIdx = Math.max(0, messages.length - MESSAGES_PER_PAGE);
      setVisibleMessages(messages.slice(startIdx));
      setPage(1);
      setHasMoreMessages(startIdx > 0);
    } else {
      setVisibleMessages([]);
      setHasMoreMessages(false);
    }
  }, [messages]);

  // Fonction pour vérifier quels messages sont actuellement visibles à l'écran
  const checkVisibleMessages = useCallback(() => {
    if (!messagesContainerRef.current || !user) return;
    
    const messageElements = messagesContainerRef.current.querySelectorAll('[data-message-id]');
    const containerRect = messagesContainerRef.current.getBoundingClientRect();
    const newVisibleMessageIds = new Set<string>();
    const unreadVisibleMessageIds: string[] = [];
    
    messageElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      // Un message est considéré comme visible s'il est au moins partiellement visible dans le conteneur
      if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
        const messageId = element.getAttribute('data-message-id');
        if (messageId) {
          newVisibleMessageIds.add(messageId);
          
          // Vérifier si c'est un message non lu reçu (pas envoyé par l'utilisateur actuel)
          const message = messages.find(msg => msg.id === messageId);
          if (message && !message.read && message.sender_id !== user.id) {
            unreadVisibleMessageIds.push(messageId);
          }
        }
      }
    });
    
    // Mettre à jour la référence des messages visibles
    visibleMessageIdsRef.current = newVisibleMessageIds;
    
    // Marquer les messages visibles non lus comme lus après un court délai
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
      markAsReadTimeoutRef.current = null;
    }
    
    if (unreadVisibleMessageIds.length > 0 && user.id) {
      markAsReadTimeoutRef.current = setTimeout(() => {
        markSpecificMessagesAsRead(conversation.id, user.id, unreadVisibleMessageIds);
      }, 1000); // Attendre 1 seconde pour éviter trop d'appels API
    }
  }, [conversation.id, user, messages, markSpecificMessagesAsRead]);

  // Fonction pour charger plus de messages (scroll vers le haut)
  const loadMoreMessages = useCallback(() => {
    if (!hasMoreMessages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const startIdx = Math.max(0, messages.length - (nextPage * MESSAGES_PER_PAGE));
    const endIdx = messages.length - ((nextPage - 1) * MESSAGES_PER_PAGE);
    const moreMessages = messages.slice(startIdx, endIdx);
    
    // Prévenir le scroll automatique lors du chargement des anciens messages
    const scrollHeight = messagesContainerRef.current?.scrollHeight || 0;
    const scrollTop = messagesContainerRef.current?.scrollTop || 0;
    
    setVisibleMessages(prev => [...moreMessages, ...prev]);
    setPage(nextPage);
    setHasMoreMessages(startIdx > 0);
    
    // Après avoir ajouté les nouveaux messages, restaurer la position de défilement
    // et empêcher le défilement vers le bas
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const newScrollHeight = messagesContainerRef.current.scrollHeight;
        // Maintient de la position relative de défilement
        messagesContainerRef.current.scrollTop = newScrollHeight - scrollHeight + scrollTop;
      }
      setIsLoadingMore(false);
    }, 10);
  }, [hasMoreMessages, isLoadingMore, messages, page]);

  // Gérer le scroll vers le haut pour charger plus de messages
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // Détecter si l'utilisateur a scrollé vers le haut
    userScrolledUpRef.current = scrollTop < scrollHeight - clientHeight - 10;
    
    // Charger plus de messages si on approche du haut
    if (scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
    
    // Vérifier quels messages sont visibles lors du défilement
    checkVisibleMessages();
  }, [loadMoreMessages, hasMoreMessages, isLoadingMore, checkVisibleMessages]);

  // Ajouter un écouteur d'événement de défilement
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Utiliser le hook simplement - il ignore automatiquement les pages de messagerie
  usePreventScrollReset();

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    // Ne pas défiler automatiquement lors du chargement d'anciens messages
    if (!isLoadingMore && messages.length > 0 && visibleMessages.length > 0) {
      // Vérifier si le dernier message visible est aussi le dernier message de tous les messages
      const lastVisibleMessageId = visibleMessages[visibleMessages.length - 1].id;
      const lastMessageId = messages[messages.length - 1].id;
      
      // Défiler vers le bas seulement si l'utilisateur n'a pas scrollé vers le haut manuellement
      // ou si c'est le premier chargement ou un nouveau message de l'utilisateur
      const isNewMessageFromUser = messages[messages.length - 1]?.sender_id === user?.id;
      
      if ((lastVisibleMessageId === lastMessageId && !userScrolledUpRef.current) || isNewMessageFromUser) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // Vérifier les messages visibles après le rendu des messages
    setTimeout(checkVisibleMessages, 100);
  }, [visibleMessages, messages, checkVisibleMessages, isLoadingMore, user?.id]);

  // Marquer les messages comme lus lors du montage du composant uniquement s'il y a un grand nombre de messages non lus
  useEffect(() => {
    if (user?.id && unreadCount > 10) {
      // Marquer tous les messages comme lus seulement s'il y a beaucoup de messages non lus
      // Cela évite de surcharger le serveur avec des requêtes inutiles
      markAsRead(conversation.id, user.id);
    } else {
      // Sinon, vérifier quels messages sont visibles et les marquer comme lus
      setTimeout(checkVisibleMessages, 100);
    }
    
    return () => {
      // Nettoyer le timeout lors du démontage
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
        markAsReadTimeoutRef.current = null;
      }
    };
  }, [conversation.id, markAsRead, user, unreadCount, checkVisibleMessages]);

  // Mettre à jour le statut "last_seen" quand l'utilisateur est actif sur le chat
  useEffect(() => {
    const updateLastSeen = async () => {
      if (user?.id) {
        try {
          // Utiliser la date actuelle
          const now = new Date();
          
          await supabase
            .from('profiles')
            .update({ last_seen: now.toISOString() })
            .eq('id', user.id);
        } catch (error) {
          console.error('Erreur lors de la mise à jour du last_seen:', error);
        }
      }
    };

    // Mettre à jour le statut immédiatement quand le chat est ouvert
    updateLastSeen();

    // Puis mettre à jour périodiquement toutes les 5 minutes
    const interval = setInterval(updateLastSeen, 5 * 60 * 1000);

    // Et aussi lors d'événements d'activité
    const handleActivity = () => {
      updateLastSeen();
      // Également vérifier les messages visibles lors de l'activité de l'utilisateur
      checkVisibleMessages();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [user, checkVisibleMessages]);

  // Fonction pour afficher une notification temporaire
  const showNotification = (message: string, type: 'warning' | 'error' | 'info' | 'success') => {
    setNotification({
      message,
      type,
      id: Date.now()
    });
    
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Nettoyer le timeout de notification lorsque le composant est démonté
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    };
  }, []);

  // Fonction pour récupérer les messages
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    setMessageError(null);
    try {
      // Ici, implémentez la logique de chargement des messages
      // Par exemple, vous pourriez appeler un service ou un API
      console.log("Chargement des messages pour la conversation:", conversationId);
      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Si l'implémentation est incomplète, vous pouvez simplement ne rien faire
      setIsLoadingMessages(false);
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
      setMessageError("Impossible de charger les messages. Veuillez réessayer.");
      setIsLoadingMessages(false);
    }
  }, []);

  // Fonction pour marquer les messages comme non lus
  const markAsUnread = useCallback(() => {
    if (!user || !conversation) return;
    // Implémentation fictive - à remplacer par votre logique réelle
    console.log("Marquer comme non lu:", conversation.id);
    
    // Afficher une notification de succès
    showNotification("Messages marqués comme non lus", "success");
  }, [conversation, user]);

  // Fonction pour supprimer une conversation
  const handleDelete = useCallback(() => {
    if (!conversation) return;
    // Implémentation fictive - à remplacer par votre logique réelle
    console.log("Supprimer la conversation:", conversation.id);
    
    // Afficher une notification de succès
    showNotification("Conversation supprimée", "success");
    
    // Rediriger vers la liste des conversations
    onBack();
  }, [conversation, onBack]);

  // Fonction pour activer les notifications
  const enableNotifications = useCallback(async () => {
    try {
      // Implémenter la logique d'activation des notifications
      console.log("Activer les notifications");
      setShowNotificationDialog(false);
    } catch (error) {
      console.error("Erreur lors de l'activation des notifications:", error);
    }
  }, []);

  // Fonction pour charger plus de messages
  const handleLoadMore = useCallback(() => {
    loadMoreMessages();
  }, [loadMoreMessages]);

  // Valider si un message peut être envoyé
  const canSend = messageText.trim().length > 0 || attachments.length > 0;

  // Convertir la fonction markAsRead pour être utilisable comme un handler d'événement
  const handleMarkAsRead = useCallback(() => {
    if (user?.id && conversation?.id) {
      markAsRead(conversation.id, user.id);
    }
  }, [user, conversation, markAsRead]);

  // Modifier la fonction removeAttachment pour être compatible avec un handler d'événement
  const handleRemoveAttachment = useCallback(() => {
    if (attachment) {
      setAttachment(null);
    }
  }, [attachment]);

  // Fonction pour supprimer un élément des pièces jointes par index
  const handleRemoveAttachmentByIndex = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    removeAttachment(index);
  }, []);

  // Gérer l'envoi du message
  const handleSendMessage = async () => {
    if ((!messageText || messageText.trim() === '') && attachments.length === 0) return;
    
    if (user?.id) {
      try {
        // Valider directement le message avec la fonction locale au lieu d'un appel API
        const validationResult = validateMessage(messageText.trim(), {
          maxLength: 5000,
          minLength: 1,
          censorInsteadOfBlock: true,
          allowQuotedWords: true,      // Autorise les mots interdits dans les citations/signalements
          allowLowSeverityWords: true,  // Autorise les mots de faible gravité
          respectRecommendedActions: true  // Utiliser les actions recommandées
        });
        
        if (!validationResult.isValid) {
          // Afficher un message d'erreur si le message contient des mots interdits
          showNotification(validationResult.errors.join(', '), 'error');
          return;
        }
        
        // Afficher un avertissement si nécessaire mais laisser l'utilisateur envoyer le message
        if (validationResult.warningMessage) {
          showNotification(validationResult.warningMessage, 'warning');
        }
        
        // Ajouter une note aux messages censurés
        let finalMessageText = validationResult.message; // Utiliser toujours le message potentiellement censuré
        
        // Si le message a été censuré, ajouter un marqueur spécial
        if (validationResult.censored) {
          finalMessageText += " [Ce message a été modéré automatiquement]";
        }
        
        // Si un modérateur doit être notifié
        if (validationResult.shouldNotifyModerator) {
          // Ici vous pourriez implémenter une notification à un modérateur
          // Par exemple, enregistrer dans une table "reports" ou envoyer un webhook
          console.log("Ce message nécessiterait une vérification par un modérateur:", messageText);
          // Afficher une notification à l'utilisateur que son message sera examiné
          showNotification("Votre message contient des éléments qui nécessitent une vérification et pourrait être examiné par un modérateur.", 'info');
        }
        
        if (attachments.length > 0) {
          // Envoyer des messages avec pièces jointes
          for (const attachment of attachments) {
            await sendMessage(
              conversation.id, 
              user.id, 
              finalMessageText || 'Pièce jointe',
              attachment.url,
              attachment.type,
              attachment.name
            );
          }
          setAttachments([]);
        } else {
          // Envoyer un message texte simple
          await sendMessage(conversation.id, user.id, finalMessageText.trim());
        }
        
        setMessageText('');
        
        // Réinitialiser l'état d'écriture
        updateTypingStatus(conversation.id, user.id, false);
        
        // Réinitialiser le flag de défilement manuel pour permettre le défilement automatique après l'envoi d'un message
        userScrolledUpRef.current = false;
        
        // Si le message a été censuré, on affiche une notification
        if (validationResult.censored) {
          showNotification("Certains mots de votre message ont été censurés.", 'info');
        }
      } catch (error) {
        console.error("Erreur lors de la validation ou de l'envoi du message:", error);
        showNotification("Une erreur est survenue lors de l'envoi du message.", 'error');
      }
    }
  };

  // Détecter quand l'utilisateur est en train d'écrire
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    
    if (user?.id && e.target.value.trim() !== '') {
      updateTypingStatus(conversation.id, user.id, true);
    }
  };

  // Gérer la pression des touches (Enter pour envoyer, Shift+Enter pour nouvelle ligne)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Gérer l'upload des fichiers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `messages/${fileName}`;
      
      // Upload du fichier vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Récupérer l'URL publique du fichier
      const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);
      
      // Déterminer le type de fichier
      const isImage = file.type.startsWith('image/');
      
      setAttachments([...attachments, {
        url: publicUrlData.publicUrl,
        type: isImage ? 'image' : 'file',
        name: file.name
      }]);
      
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Supprimer une pièce jointe
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="relative flex flex-col flex-1 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-800/10 bg-gradient-to-r from-purple-900/10 to-indigo-900/10 text-gray-800 dark:text-gray-200">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2" 
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-9 w-9">
            <AvatarImage src={conversation.other_user?.image || ''} />
            <AvatarFallback className="bg-vynal-purple-100 text-vynal-purple-700">
              {getInitials(conversation.other_user?.name || "User")}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-medium">
              {conversation.other_user?.name || "User"}
            </h3>
            {conversation.other_user?.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{conversation.other_user.email}</p>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMarkAsRead}>
              <Check className="mr-2 h-4 w-4" />
              <span>Marquer comme lu</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={markAsUnread}>
              <Circle className="mr-2 h-4 w-4" />
              <span>Marquer comme non lu</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={handleDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Supprimer la conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Message List */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth bg-gray-50 dark:bg-gray-900"
      >
        {isLoadingMessages ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : messageError ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{messageError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => fetchMessages(conversation.id)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
            <p>Aucun message</p>
          </div>
        ) : (
          <>
            {loadMoreVisible && (
              <div className="flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300" 
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ChevronUp className="h-4 w-4 mr-2" />
                  )}
                  Charger les messages précédents
                </Button>
              </div>
            )}
            
            {visibleMessages
              .filter(message => 
                (message.content?.trim() || 
                 (message as any).attachment_url) && 
                !(message as any).is_typing
              )
              .map((message) => (
                <div key={message.id} data-message-id={message.id}>
                  <MessageBubble 
                    message={message}
                    isCurrentUser={message.sender_id === user?.id}
                    isFreelance={isFreelance}
                  />
                </div>
              ))
            }
            
            {/* Indicateur "en train d'écrire" */}
            {isOtherParticipantTyping && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <span>{otherParticipant?.full_name || "L'autre utilisateur"} est en train d'écrire</span>
                <span className="flex space-x-0.5">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                </span>
              </div>
            )}
            
            {/* Référence pour le scroll automatique */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Zone des pièces jointes */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div 
              key={index} 
              className="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2"
            >
              {attachment.type === 'image' ? (
                <Image className="h-4 w-4 text-indigo-600" />
              ) : (
                <FileText className="h-4 w-4 text-indigo-600" />
              )}
              <span className="text-xs truncate max-w-[120px]">{attachment.name}</span>
              <button 
                onClick={(e) => handleRemoveAttachmentByIndex(e, index)}
                className="ml-1 p-0.5 rounded-full bg-gray-200 hover:bg-gray-300"
                type="button"
              >
                <X className="h-3 w-3 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Système de notification positionné juste au-dessus de la zone de saisie */}
      {notification && (
        <div className={`px-4 py-2 text-sm animate-fadeIn ${
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">{notification.message}</div>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Barre de saisie */}
      <div className="border-t border-purple-800/10 bg-white dark:bg-gray-950 p-4">
        <div className="flex items-center space-x-2">
          {notificationPermissionDialog && (
            <AlertDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Activer les notifications</AlertDialogTitle>
                  <AlertDialogDescription>
                    Recevez des notifications quand vous recevez de nouveaux messages, même lorsque vous n'êtes pas sur la page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Non merci</AlertDialogCancel>
                  <AlertDialogAction onClick={enableNotifications}>
                    Activer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              className="resize-none overflow-hidden min-h-[40px] max-h-[120px] pr-10 focus:ring-purple-600/10 focus:border-purple-600/30"
              disabled={isSending}
            />
            {isUploading && (
              <div className="absolute right-3 bottom-3">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="flex-shrink-0 text-gray-500"
                disabled={isSending || isUploading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Ajouter un fichier</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            type="button"
            size="icon"
            className="flex-shrink-0 bg-vynal-purple-600 hover:bg-vynal-purple-700 text-white"
            disabled={!canSend || isSending}
            onClick={handleSendMessage}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      
      {/* File preview */}
      {attachment && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 border border-purple-800/10 rounded-md flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 truncate">
            <FileIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{attachment.name}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {formatFileSize(attachment.size)}
            </span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-red-500"
            onClick={handleRemoveAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow; 