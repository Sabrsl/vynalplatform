"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Send, ArrowLeft, MoreVertical, Image, FileText, X, Smile, Check, Circle, Trash, Upload, RefreshCw, ChevronUp, MessageSquare, Loader2, AlertTriangle, Info } from 'lucide-react';
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
import { Virtuoso } from 'react-virtuoso';

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
    
    const file = e.target.files[0];
    
    // Vérifier la taille du fichier (10 Mo max)
    if (file.size > 10 * 1024 * 1024) {
      showNotification("Le fichier est trop volumineux (maximum 10 Mo)", 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setIsUploading(true);
    setAttachment({
      name: file.name,
      size: file.size
    });
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `messages/${fileName}`;
      
      // Upload du fichier vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);
      
      if (error) {
        console.error('Erreur lors de l\'upload du fichier:', error);
        showNotification("Erreur lors de l'upload du fichier", 'error');
        setAttachment(null);
        throw error;
      }
      
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
      
      showNotification("Fichier ajouté avec succès", 'success');
      
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      showNotification("Erreur lors de l'upload du fichier", 'error');
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* En-tête de la conversation avec l'avatar et le nom */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
          className="md:hidden mr-2 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
        <div className="flex items-center flex-1">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage 
                src={otherParticipant?.avatar_url || ''} 
                alt={otherParticipant?.full_name || 'Contact'}
                onError={() => setHeaderAvatarError(true)}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                {getInitials(otherParticipant?.full_name || otherParticipant?.username || 'User')}
            </AvatarFallback>
          </Avatar>
            <UserStatusIndicator 
              isOnline={otherParticipant?.online || false} 
              className="absolute bottom-0 right-0 border-2 border-white"
            />
          </div>
          
          <div className="ml-3 overflow-hidden">
            <h2 className="text-base font-semibold truncate">
              {otherParticipant?.full_name || otherParticipant?.username || 'Contact'}
            </h2>
            {isOtherParticipantTyping ? (
              <p className="text-xs text-white/80">En train d'écrire...</p>
            ) : otherParticipant?.last_seen ? (
              <p className="text-xs text-white/80">
                {formatDistanceToNow(new Date(otherParticipant.last_seen))}
              </p>
            ) : (
              <p className="text-xs text-white/80">
                {otherParticipant?.online ? 'En ligne' : 'Hors ligne'}
              </p>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="ml-2 text-white hover:bg-white/20"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Marquer comme non lu</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-500 flex items-center gap-2">
              <Trash className="h-4 w-4" />
              <span>Supprimer la conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Zone des messages avec virtualisation pour optimiser les performances */}
      <Virtuoso
        ref={messagesContainerRef as any}
        className="flex-1 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 bg-opacity-90 overflow-x-hidden no-scrollbar"
        style={{
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjY2NjIiBzdHJva2Utb3BhY2l0eT0iMC4xIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZ3JpZCkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')",
          backgroundSize: "20px 20px",
          backgroundRepeat: "repeat"
        }}
        overscan={200}
        totalCount={visibleMessages.length}
        data={visibleMessages}
        followOutput={"auto"}
        atBottomStateChange={(isAtBottom) => {
          userScrolledUpRef.current = !isAtBottom;
        }}
        components={{
          Header: () => (
            <>
              {/* Bouton pour charger plus de messages */}
              {loadMoreVisible && hasMoreMessages && (
                <div className="flex justify-center mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadMoreMessages}
                    disabled={isLoadingMore}
                    className="rounded-full text-xs bg-white shadow-sm hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ChevronUp className="h-3 w-3 mr-1" />
                    )}
                    Messages précédents
                  </Button>
                </div>
              )}
              
              {/* Loader lors du chargement initial des messages - Amélioration de l'animation */}
              {isLoadingMessages && visibleMessages.length === 0 && (
                <div className="flex justify-center items-center h-[200px] animate-in fade-in duration-300 ease-in-out">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex flex-col space-y-3 w-3/4 max-w-md">
                      {/* Skeleton message items avec animation douce */}
                      {[...Array(3)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex items-start ${i % 2 === 0 ? 'justify-end' : ''} animate-pulse`}
                          style={{ animationDelay: `${i * 150}ms`, opacity: 1 - (i * 0.15) }}
                        >
                          {i % 2 !== 0 && (
                            <div className="h-8 w-8 rounded-full bg-vynal-purple-secondary/30 mr-2"></div>
                          )}
                          <div 
                            className={`h-[60px] rounded-2xl ${i % 2 === 0 ? 'bg-vynal-purple-secondary/30 w-[65%]' : 'bg-vynal-purple-secondary/30 w-[70%]'}`}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Liste des messages */}
              {visibleMessages.length === 0 && !isLoadingMessages && (
                <div className="flex flex-col items-center justify-center h-[300px] p-4 text-center">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-4 mb-3">
                    <MessageSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Aucun message</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                    Démarrez la conversation avec {otherParticipant?.full_name || 'votre contact'} en envoyant un message ci-dessous.
                  </p>
                </div>
              )}
            </>
          ),
          Footer: () => (
            <>
              {/* Indicateur de frappe */}
              {isOtherParticipantTyping && (
                <div className="flex items-start mb-4 animate-fade-in">
                  <div className="flex items-end">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage 
                        src={otherParticipant?.avatar_url || ''} 
                        alt={otherParticipant?.full_name || 'Contact'} 
                        onError={() => setTypingAvatarError(true)}
                      />
                      <AvatarFallback className="bg-indigo-100 text-indigo-800">
                        {getInitials(otherParticipant?.full_name || otherParticipant?.username || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-sm flex items-center">
                      <div className="flex space-x-1">
                        <span className="bg-vynal-purple-secondary/30 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="bg-vynal-purple-secondary/30 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="bg-vynal-purple-secondary/30 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )
        }}
        itemContent={(index, message) => {
          const isCurrentUser = message.sender_id === user?.id;
          // Créer une clé de données unique pour ce message
          const messageKey = `msg-${message.id}`;
          // Déterminer si nous devons afficher l'avatar (pour les messages groupés)
          const showAvatar = !isCurrentUser && 
            (index === 0 || 
              visibleMessages[index - 1].sender_id !== message.sender_id);
            
          return (
            <div 
              data-message-id={message.id}
              data-key={messageKey}
              className="mb-2"
            >
              <MessageBubble 
                key={messageKey}
                message={message}
                isCurrentUser={isCurrentUser}
                showAvatar={showAvatar}
                otherParticipant={otherParticipant}
                isFreelance={isFreelance}
                previousMessage={index > 0 ? visibleMessages[index - 1] : undefined}
                nextMessage={index < visibleMessages.length - 1 ? visibleMessages[index + 1] : undefined}
              />
            </div>
          );
        }}
        onScroll={handleScroll}
      />
      
      {/* Zone de saisie du message */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-950">
        {notification && (
          <div className={`mb-2 p-2 text-sm rounded-md ${
            notification.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          }`}>
            <div className="flex items-center">
              {notification.type === 'error' && <X className="h-4 w-4 mr-1 flex-shrink-0" />}
              {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />}
              {notification.type === 'success' && <Check className="h-4 w-4 mr-1 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="h-4 w-4 mr-1 flex-shrink-0" />}
              {notification.message}
            </div>
        </div>
      )}
      
        {attachment && (
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileIcon 
                  fileName={attachment.name} 
                  className="h-8 w-8 mr-2" 
                />
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{attachment.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setAttachment(null)}
            >
              <X className="h-4 w-4" />
              </Button>
          </div>
        </div>
      )}
      
        <div className="flex items-end">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <div className="flex space-x-2 mr-2">
              <Button
                type="button"
                size="icon"
              variant="ghost"
              className="rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              ) : (
                <Paperclip className="h-5 w-5" />
              )}
              </Button>
          
          <Button
            type="button"
            size="icon"
              variant="ghost"
              className="rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              onClick={() => window.alert("La fonction emoji sera implémentée prochainement")}
            >
              <Smile className="h-5 w-5" />
          </Button>
      </div>
      
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              className="resize-none py-3 px-4 rounded-full bg-gray-100 dark:bg-gray-900 border-none focus-visible:ring-pink-500 min-h-10"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px', paddingRight: '48px' }}
            />
            
          <Button
            type="button"
            size="icon"
              className={`absolute right-1 bottom-1 rounded-full ${
                messageText.trim() ? 'bg-pink-600 hover:bg-pink-700' : 'bg-gray-300 dark:bg-gray-700'
              } text-white h-8 w-8`}
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && !attachment) || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
          </Button>
        </div>
        </div>
        
        {messageError && (
          <p className="mt-1 text-xs text-red-500">{messageError}</p>
        )}
      </div>

      {/* Boîte de dialogue de confirmation pour les notifications */}
      <AlertDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer les notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              Recevez des notifications lorsque vous recevez de nouveaux messages, même lorsque l'application est en arrière-plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Plus tard</AlertDialogCancel>
            <AlertDialogAction onClick={enableNotifications}>
              Activer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatWindow; 