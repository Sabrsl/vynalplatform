"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Send, ArrowLeft, MoreVertical, Image, FileText, X, Smile, Check, Circle, Trash, Upload, RefreshCw, ChevronUp, MessageSquare, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import { Message } from '@/types/messages';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatDate, formatFileSize } from '@/lib/utils';
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
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { UserProfile } from '@/hooks/useUser';
import { Conversation as BaseConversation } from '@/components/messaging/messaging-types';
import EnhancedAvatar from '@/components/ui/enhanced-avatar';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { UnreadBadge } from '@/components/ui/UnreadBadge';
import { motion, AnimatePresence } from "framer-motion";

// Extension du type Conversation pour inclure other_user et order_id
interface Conversation extends BaseConversation {
  other_user?: {
    id: string;
    name: string;
    image?: string;
    email?: string;
    unread_count?: number;
  };
  order_id?: string | null;
  service_title?: string;
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

// Fonction pour normaliser les données de l'expéditeur dans le format attendu
const normalizeSender = (sender: any): UserProfile | { id: string, username: string, full_name?: string, avatar_url?: string } => {
  if (!sender) return { id: 'unknown', username: 'Utilisateur' };
  
  if ('role' in sender && 'created_at' in sender) {
    // C'est déjà un UserProfile
    return sender as UserProfile;
  }
  
  // Créer un objet conforme au format attendu
  return {
    id: sender.id,
    username: sender.username || 'Utilisateur',
    full_name: sender.full_name || undefined,
    avatar_url: sender.avatar_url || undefined
  };
};

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversation, 
  onBack,
  isFreelance = false
}) => {
  const { user } = useAuth();
  const { unreadCounts, markAsRead: markConversationAsRead } = useUnreadMessages(user?.id);
  const [messageText, setMessageText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<{url: string, type: string, name: string}[]>([]);
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
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const MESSAGES_PER_PAGE = 20;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<VirtuosoHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibleMessageIdsRef = useRef<Set<string>>(new Set());
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollDebounceRef = useRef<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages,
    isTyping,
    sendMessage,
    markMessagesAsRead,
    markSpecificMessagesAsRead,
    setIsTyping: updateTypingStatus,
    setMessages,
    fetchMessages,
    updateConversationParticipant
  } = useMessagingStore();

  // Charger les messages au montage du composant
  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id);
    }
  }, [conversation?.id, fetchMessages]);

  // Initialiser les messages visibles
  useEffect(() => {
    if (messages.length > 0) {
      // Afficher les messages les plus récents (limité à MESSAGES_PER_PAGE)
      const startIdx = Math.max(0, messages.length - MESSAGES_PER_PAGE);
      setHasMoreMessages(startIdx > 0);
    } else {
      setHasMoreMessages(false);
    }
  }, [messages]);

  // Trouver l'autre participant (dans une conversation à 2 personnes)
  const otherParticipant = conversation.participants.find(
    p => p.id !== user?.id
  );
  
  // Si l'autre participant est en train d'écrire
  const isOtherParticipantTyping = otherParticipant?.id ? isTyping[otherParticipant.id] : false;
  
  // Obtenir le nombre de messages non lus dans cette conversation
  const unreadCount = otherParticipant?.unread_count || 0;

  // Fonction pour récupérer des informations supplémentaires sur l'autre participant si nécessaire
  const getParticipantDetails = useCallback(() => {
    if (!conversation?.participants || conversation.participants.length === 0) {
      return null;
    }
    
    // Trouver l'autre participant (celui qui n'est pas l'utilisateur actuel)
    const participant = conversation.participants.find(p => p.id !== user?.id);
    
    // Si l'autre participant n'a pas toutes ses informations, essayer de les obtenir
    if (participant && (!participant.avatar_url || !participant.full_name)) {
      console.log("Informations manquantes pour l'autre participant, tentative de récupération...");
      
      // Essayer de récupérer plus d'informations à partir de la base de données
      (async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', participant.id)
            .single();
            
          if (profile) {
            // Mettre à jour le participant localement
            Object.assign(participant, {
              username: profile.username || participant.username,
              full_name: profile.full_name || participant.full_name,
              avatar_url: profile.avatar_url || participant.avatar_url
            });
            
            // Forcer une mise à jour du composant
            setConversationTitle(profile.full_name || profile.username || "Discussion");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du profil:", error);
        }
      })();
    }
    
    return participant;
  }, [conversation?.participants, user?.id]);

  // Obtenir et utiliser les informations détaillées de l'autre participant
  const participantDetails = getParticipantDetails();
  
  // Définir le titre de la conversation basé sur l'autre participant
  useEffect(() => {
    if (otherParticipant) {
      setConversationTitle(otherParticipant.full_name || otherParticipant.username || "Discussion");
    }
  }, [otherParticipant]);

  // Fonction pour vérifier quels messages sont actuellement visibles à l'écran
  const checkVisibleMessages = useCallback(() => {
    if (!user) return;
    
    // Accumuler les IDs pour n'effectuer qu'une seule mise à jour
    const unreadVisibleMessageIds = messages
      .filter((msg: Message) => !msg.read && msg.sender_id !== user.id)
      .map((msg: Message) => msg.id);
    
    // Mettre à jour la référence des messages visibles
    visibleMessageIdsRef.current = new Set(messages.map((msg: Message) => msg.id));
    
    // Marquer les messages visibles non lus comme lus après un court délai
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
      markAsReadTimeoutRef.current = null;
    }
    
    if (unreadVisibleMessageIds.length > 0 && user.id) {
      // Regrouper les opérations de marquage pour éviter les reflows multiples
      markAsReadTimeoutRef.current = setTimeout(() => {
        // Utiliser la fonction qui met à jour complètement les indicateurs
        markMessagesAsRead(conversation.id, user.id);
        
        // Aussi mettre à jour les compteurs globaux
        markConversationAsRead(conversation.id);
      }, 1000);
    }
  }, [conversation.id, user, messages, markMessagesAsRead, markConversationAsRead]);

  // Fonction pour charger plus de messages (scroll vers le haut)
  const loadMoreMessages = useCallback(() => {
    if (!hasMoreMessages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const startIdx = Math.max(0, messages.length - (nextPage * MESSAGES_PER_PAGE));
    const endIdx = messages.length - ((nextPage - 1) * MESSAGES_PER_PAGE);
    
    setPage(nextPage);
    setHasMoreMessages(startIdx > 0);
    
    // Utiliser scrollToIndex pour maintenir la position de défilement
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollToIndex({
          index: endIdx - startIdx,
          align: 'start'
        });
      }
      setIsLoadingMore(false);
    }, 10);
  }, [hasMoreMessages, isLoadingMore, messages, page]);

  // Utiliser Virtuoso pour gérer le scroll
  const handleVirtuosoScroll = useCallback((e: any) => {
    // Utiliser un debounce simple pour réduire les reflows forcés
    if (!scrollDebounceRef.current) {
      scrollDebounceRef.current = true;
      
      // Exécuter le code de défilement dans requestAnimationFrame
      requestAnimationFrame(() => {
        // Mettre à jour le flag de défilement manuel
        userScrolledUpRef.current = e.scrollTop < e.scrollHeight - e.clientHeight - 100;
        
        if (e.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
          loadMoreMessages();
        }
        
        // Vérifier les messages visibles
        checkVisibleMessages();
        
        // Réinitialiser après un délai
        setTimeout(() => {
          scrollDebounceRef.current = false;
        }, 100);
      });
    }
  }, [loadMoreMessages, hasMoreMessages, isLoadingMore, checkVisibleMessages]);

  // Gérer le scroll vers le haut pour charger plus de messages
  const handleScroll = useCallback(() => {
    // Charger plus de messages si on approche du haut
    if (hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
    
    // Vérifier quels messages sont visibles lors du défilement
    checkVisibleMessages();
  }, [loadMoreMessages, hasMoreMessages, isLoadingMore, checkVisibleMessages]);
  
  // Utiliser le hook simplement - il ignore automatiquement les pages de messagerie
  usePreventScrollReset();
  
  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    // Ne pas défiler automatiquement lors du chargement d'anciens messages
    if (!isLoadingMore && messages.length > 0) {
      // Vérifier si le dernier message est de l'utilisateur actuel
      const isNewMessageFromUser = messages[messages.length - 1]?.sender_id === user?.id;
      
      // Défiler vers le bas seulement si :
      // 1. C'est un nouveau message de l'utilisateur
      // 2. L'utilisateur n'a pas scrollé vers le haut manuellement
      // 3. Le dernier message est visible
      const lastMessage = messages[messages.length - 1];
      const isLastMessageVisible = lastMessage && visibleMessageIdsRef.current.has(lastMessage.id);
      
      if (isNewMessageFromUser && !userScrolledUpRef.current && isLastMessageVisible) {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollToIndex({
              index: messages.length - 1,
              align: 'end',
              behavior: 'smooth'
            });
          }
        });
      }
    }
    
    // Vérifier les messages visibles après le rendu des messages
    setTimeout(checkVisibleMessages, 100);
  }, [messages, checkVisibleMessages, isLoadingMore, user?.id]);

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

  // Fonction pour marquer les messages comme non lus
  const markAsUnread = useCallback(() => {
    if (!user || !conversation) return;
    // Implémentation fictive - à remplacer par votre logique réelle
    
    // Afficher une notification de succès
    showNotification("Messages marqués comme non lus", "success");
  }, [conversation, user]);

  // Fonction pour supprimer une conversation
  const handleDelete = useCallback(() => {
    if (!conversation) return;
    // Implémentation fictive - à remplacer par votre logique réelle
    
    // Afficher une notification de succès
    showNotification("Conversation supprimée", "success");
    
    // Rediriger vers la liste des conversations
    onBack();
  }, [conversation, onBack]);

  // Fonction pour activer les notifications
  const enableNotifications = useCallback(async () => {
    try {
      // Implémenter la logique d'activation des notifications
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

  // Mettre à jour la fonction handleMarkAsRead
  const handleMarkAsRead = useCallback(() => {
    if (user?.id && conversation?.id) {
      // Marquer les messages comme lus
      markMessagesAsRead(conversation.id, user.id);
      
      // Également mettre à jour les compteurs globaux
      markConversationAsRead(conversation.id);
      
      // Déclencher un événement pour forcer la mise à jour des interfaces
      if (typeof window !== 'undefined') {
        // Événement spécifique pour les messages
        window.dispatchEvent(new CustomEvent('vynal:messages-read', { 
          detail: { conversationId: conversation.id, timestamp: Date.now() } 
        }));
      }
    }
  }, [user, conversation, markMessagesAsRead, markConversationAsRead]);

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
        
        // Vérifier si c'est une conversation liée à une commande
        const isOrderConversation = conversation.id.startsWith('order-') || conversation.order_id;
        const orderId = conversation.order_id || (isOrderConversation ? conversation.id.replace('order-', '') : null);

        if (isOrderConversation && orderId) {
          
          // Pour les messages de commande, utiliser directement l'API Supabase
          if (attachments.length > 0) {
            // Message avec pièce jointe
            const attachment = attachments[0]; // On prend la première pièce jointe
            const { error } = await supabase
              .from('messages')
              .insert({
                order_id: orderId,
                sender_id: user.id,
                content: finalMessageText || 'Pièce jointe',
                read: false,
                attachment_url: attachment.url,
                attachment_type: attachment.type,
                attachment_name: attachment.name
              });
              
            if (error) {
              console.error("Erreur lors de l'envoi du message pour la commande:", error);
              throw error;
            }
          } else {
            // Message texte simple
            const { error } = await supabase
              .from('messages')
              .insert({
                order_id: orderId,
                sender_id: user.id,
                content: finalMessageText.trim(),
                read: false
              });
              
            if (error) {
              console.error("Erreur lors de l'envoi du message pour la commande:", error);
              throw error;
            }
          }
          
          // Récupérer les messages mis à jour après l'envoi
          const { data: updatedMessages, error: fetchError } = await supabase
            .from('messages')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
            
          if (fetchError) {
            console.error("Erreur lors de la récupération des messages:", fetchError);
            throw fetchError;
          }
          
          // Mettre à jour les messages dans le store
          if (updatedMessages) {
            setMessages(updatedMessages);
          }
          
        } else {
          // Pour les conversations normales, utiliser le store
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
          } else {
            // Envoyer un message texte simple
            await sendMessage(conversation.id, user.id, finalMessageText.trim());
          }
        }
        
        // Réinitialiser tous les états liés aux fichiers
        setAttachments([]);
        setAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setMessageText('');
        
        // Réinitialiser l'état d'écriture
        updateTypingStatus(conversation.id, user.id, false);
        
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
      setAttachment(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Supprimer une pièce jointe
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (attachments.length === 1) {
      setAttachment(null);
    }
  };

  // Gérer la fermeture du menu lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Ajout de la fonction pour synchroniser les informations du participant
  const syncParticipantWithMessages = useCallback(() => {
    if (otherParticipant && messages.length > 0) {
      // Chercher un message de l'autre participant
      const participantMessage = messages.find(msg => 
        msg.sender_id === otherParticipant.id && msg.sender
      );
      
      if (participantMessage?.sender) {
        // Vérifier si on a des données manquantes dans otherParticipant
        if ((!otherParticipant.avatar_url && participantMessage.sender.avatar_url) || 
            (!otherParticipant.full_name && participantMessage.sender.full_name)) {
              
          // Mettre à jour les informations du participant
          if (typeof updateConversationParticipant === 'function') {
            updateConversationParticipant(conversation.id, {
              id: otherParticipant.id,
              username: participantMessage.sender.username || otherParticipant.username,
              full_name: participantMessage.sender.full_name || otherParticipant.full_name,
              avatar_url: participantMessage.sender.avatar_url || otherParticipant.avatar_url,
              last_seen: otherParticipant.last_seen
            });
          }
          
          // Mettre à jour le titre immédiatement pour une mise à jour visuelle rapide
          setConversationTitle(
            participantMessage.sender.full_name || 
            participantMessage.sender.username || 
            otherParticipant.full_name ||
            otherParticipant.username ||
            "Discussion"
          );
        }
      }
    }
  }, [otherParticipant, messages, conversation.id, updateConversationParticipant]);

  // Appeler la fonction quand les messages changent
  useEffect(() => {
    syncParticipantWithMessages();
  }, [syncParticipantWithMessages]);

  // Mettre le focus sur la zone de texte quand la conversation est ouverte
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [conversation.id]);

  return (
    <div className="flex flex-col h-full bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 backdrop-blur-sm shadow-sm transition-all duration-200 rounded-lg">
      {/* En-tête du chat */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700/30 bg-white/20 dark:bg-slate-900/20">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {otherParticipant && otherParticipant.avatar_url ? (
            <EnhancedAvatar 
              src={otherParticipant.avatar_url} 
              alt={otherParticipant.full_name || otherParticipant.username || ""}
              fallback={(otherParticipant.full_name || otherParticipant.username || '?') as string}
              className="h-8 w-8"
              onError={() => setHeaderAvatarError(true)}
            />
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarFallback>{conversationTitle.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <h2 className="text-sm font-semibold">{conversationTitle}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {otherParticipant?.last_seen 
                ? `Vu ${formatDistanceToNow(new Date(otherParticipant.last_seen), { addSuffix: true, locale: fr })}` 
                : 'Hors ligne'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <UnreadBadge count={unreadCounts.byConversation[conversation.id] || 0} />
          <div className="relative" ref={menuRef}>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Options de la conversation</span>
            </Button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 z-50 rounded-lg border border-vynal-purple-secondary/20 bg-white p-1 text-vynal-purple-dark shadow-lg dark:border-vynal-purple-secondary/20 dark:bg-vynal-purple-dark dark:text-vynal-text-primary backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/10 rounded-md transition-colors opacity-50 cursor-not-allowed"
                    onClick={markAsUnread}
                    disabled
                    whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.08)" }}
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Marquer comme non lu</span>
                  </motion.button>
                  <div className="h-px bg-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/20 my-1" />
                  <motion.button
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-50 cursor-not-allowed"
                    onClick={handleDelete}
                    disabled
                    whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.08)" }}
                  >
                    <Trash className="h-3 w-3" />
                    <span>Supprimer la conversation</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Corps de la conversation avec la zone de défilement */}
      <div className="flex-1 overflow-hidden bg-white/20 dark:bg-slate-800/25 relative">
        <Virtuoso
          ref={messagesContainerRef}
          style={{ height: '100%', overflow: 'auto' }}
          totalCount={messages.length}
          data={messages}
          alignToBottom={true}
          initialTopMostItemIndex={messages.length - 1}
          followOutput={"auto"}
          onScroll={handleVirtuosoScroll}
          components={{
            Header: () => (
              <>
                {/* Bouton pour charger plus de messages */}
                {loadMoreVisible && hasMoreMessages && (
                  <div className="flex justify-center mb-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadMoreMessages}
                      disabled={isLoadingMore}
                      className="rounded-full text-xs bg-white shadow-sm hover:bg-gray-100 text-gray-700 flex items-center gap-1 h-6 px-2 py-0"
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
                {isLoadingMessages && messages.length === 0 && (
                  <div className="flex justify-center items-center h-[150px] animate-in fade-in duration-300 ease-in-out">
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
                              <div className="h-6 w-6 rounded-full bg-vynal-purple-secondary/30 mr-2"></div>
                            )}
                            <div 
                              className={`h-[50px] rounded-2xl ${i % 2 === 0 ? 'bg-vynal-purple-secondary/30 w-[65%]' : 'bg-vynal-purple-secondary/30 w-[70%]'}`}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Liste des messages */}
                {messages.length === 0 && !isLoadingMessages && (
                  <div className="flex flex-col items-center justify-center h-[250px] p-3 text-center">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-3 mb-2">
                      <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Aucun message</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-xs">
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
                  <div className="flex items-start mb-2 animate-fade-in">
                    <div className="flex items-end">
                      <EnhancedAvatar
                        src={otherParticipant?.avatar_url || ''} 
                        alt={otherParticipant?.full_name || 'Contact'}
                        fallback={getInitials(otherParticipant?.full_name || otherParticipant?.username || 'User')}
                        className="h-6 w-6 mr-2"
                        fallbackClassName="bg-indigo-100 text-indigo-800 text-xs"
                        onError={() => setTypingAvatarError(true)}
                      />
                      <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-1 shadow-sm flex items-center">
                        <div className="flex space-x-1">
                          <span className="bg-vynal-purple-secondary/30 rounded-full h-1.5 w-1.5 animate-bounce" style={{ animationDelay: '0s' }}></span>
                          <span className="bg-vynal-purple-secondary/30 rounded-full h-1.5 w-1.5 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="bg-vynal-purple-secondary/30 rounded-full h-1.5 w-1.5 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-0" />
              </>
            )
          }}
          itemContent={(index, message) => {
            // Vérifier si le message a toutes les informations nécessaires
            if (!message || !message.sender_id) {
              console.error("Message invalide:", message);
              return null;
            }

            // Déterminer si le message est de l'utilisateur actuel
            const isCurrentUser = message.sender_id === user?.id;
            
            // Créer une clé de données unique pour ce message
            const messageKey = `msg-${message.id}`;
            
            // Déterminer si nous devons afficher l'avatar (pour les messages groupés)
            const showAvatar = !isCurrentUser && 
              (index === 0 || 
                messages[index - 1].sender_id !== message.sender_id);
            
            // Obtenir les messages précédent et suivant pour le groupement
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
            
            // Obtenir les informations de l'expéditeur
            const sender = message.sender || (isCurrentUser ? {
              id: user?.id || message.sender_id || '',
              username: user?.user_metadata?.username || 'Vous',
              full_name: user?.user_metadata?.full_name,
              avatar_url: user?.user_metadata?.avatar_url,
            } : {
              id: otherParticipant?.id || message.sender_id || '',
              username: otherParticipant?.username || 'Utilisateur',
              full_name: otherParticipant?.full_name,
              avatar_url: otherParticipant?.avatar_url
            });
            
            // Vérifier si le message est valide avant de le rendre
            if (!sender.id && message.sender_id) {
              // Si sender.id est manquant mais que sender_id existe, on utilise sender_id
              sender.id = message.sender_id;
            }
            
            if (!sender.id) {
              console.error("Informations de l'expéditeur manquantes:", message);
              return null;
            }
            
            return (
              <div 
                data-message-id={message.id}
                data-key={messageKey}
                className="mb-2 px-3 min-h-[20px]"
              >
                <MessageBubble 
                  key={messageKey}
                  message={{
                    ...message,
                    sender
                  }}
                  isCurrentUser={isCurrentUser}
                  showAvatar={showAvatar}
                  otherParticipant={sender}
                  isFreelance={isFreelance}
                  previousMessage={previousMessage}
                  nextMessage={nextMessage}
                />
              </div>
            );
          }}
        />
      </div>
      
      {/* Zone de saisie du message */}
      <div className="border-t border-slate-200 dark:border-slate-700/30 p-3 bg-white/40 dark:bg-slate-800/40">
        {notification && (
          <div className={`mb-2 p-1.5 text-xs rounded-md ${
            notification.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          }`}>
            <div className="flex items-center">
              {notification.type === 'error' && <X className="h-3 w-3 mr-1 flex-shrink-0" />}
              {notification.type === 'warning' && <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />}
              {notification.type === 'success' && <Check className="h-3 w-3 mr-1 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="h-3 w-3 mr-1 flex-shrink-0" />}
              {notification.message}
            </div>
        </div>
      )}
      
        {attachment && (
          <div className="mb-2 p-1.5 bg-white/20 dark:bg-slate-800/25 rounded-md border border-slate-200/50 dark:border-slate-700/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileIcon 
                  fileName={attachment.name} 
                  className="h-5 w-5 mr-2" 
                />
                <div>
                  <p className="text-xs font-medium truncate max-w-[200px]">{attachment.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setAttachment(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <div className="flex space-x-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/20 dark:bg-slate-800/25 hover:bg-white/25 dark:hover:bg-slate-800/30 text-slate-700 dark:text-vynal-text-secondary h-8 w-8 p-0 transition-all duration-200"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-vynal-accent-primary" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
          
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full bg-white/20 dark:bg-slate-800/25 hover:bg-white/25 dark:hover:bg-slate-800/30 text-slate-700 dark:text-vynal-text-secondary h-8 w-8 p-0 transition-all duration-200"
              onClick={() => window.alert("La fonction emoji sera implémentée prochainement")}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
      
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              className="resize-none py-2 px-3 rounded-full bg-white/20 dark:bg-slate-800/25 border border-slate-200/50 dark:border-slate-700/15 focus-visible:ring-vynal-accent-primary/20 min-h-8 text-sm text-slate-800 dark:text-vynal-text-primary placeholder-slate-600 dark:placeholder-vynal-text-secondary"
              rows={1}
              style={{ minHeight: '36px', maxHeight: '100px', paddingRight: '40px' }}
            />
            
            <Button
              type="button"
              size="sm"
              className={`absolute right-1 bottom-1 rounded-full ${
                messageText.trim() || attachment ? 'bg-vynal-accent-primary hover:bg-vynal-accent-primary/90' : 'bg-slate-300 dark:bg-slate-700'
              } text-white h-6 w-6 p-0 transition-all duration-200`}
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && !attachment) || isSending}
            >
              {isSending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SendHorizontal className="h-3 w-3" />
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
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Activer les notifications?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Recevez des notifications lorsque vous recevez de nouveaux messages, même lorsque l'application est en arrière-plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Plus tard</AlertDialogCancel>
            <AlertDialogAction onClick={enableNotifications} className="text-xs">
              Activer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatWindow; 