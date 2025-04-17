"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Send, ArrowLeft, MoreVertical, Image, FileText, X, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Conversation, Message, useMessagingStore } from '@/lib/stores/useMessagingStore';
import { formatDistanceToNow, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import MessageBubble from './MessageBubble';
import { supabase } from '@/lib/supabase/client';
import UserStatusIndicator from './UserStatusIndicator';
import usePreventScrollReset from '@/hooks/usePreventScrollReset';

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
  isFreelance?: boolean;
}

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
  const MESSAGES_PER_PAGE = 20;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibleMessageIdsRef = useRef<Set<string>>(new Set());
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  
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

  // Gérer l'envoi du message
  const handleSendMessage = async () => {
    if ((!messageText || messageText.trim() === '') && attachments.length === 0) return;
    
    if (user?.id) {
      if (attachments.length > 0) {
        // Envoyer des messages avec pièces jointes
        for (const attachment of attachments) {
          await sendMessage(
            conversation.id, 
            user.id, 
            messageText || 'Pièce jointe',
            attachment.url,
            attachment.type,
            attachment.name
          );
        }
        setAttachments([]);
      } else {
        // Envoyer un message texte simple
        await sendMessage(conversation.id, user.id, messageText.trim());
      }
      
      setMessageText('');
      
      // Réinitialiser l'état d'écriture
      updateTypingStatus(conversation.id, user.id, false);
      
      // Réinitialiser le flag de défilement manuel pour permettre le défilement automatique après l'envoi d'un message
      userScrolledUpRef.current = false;
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
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  return (
    <div className="flex flex-col h-full overflow-x-hidden">
      {/* Header du chat */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <button 
          onClick={onBack}
          className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-100"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={otherParticipant?.avatar_url || ''} 
            alt={otherParticipant?.full_name || otherParticipant?.username || 'Utilisateur'} 
            onError={() => setHeaderAvatarError(true)}
          />
          <AvatarFallback className="bg-indigo-100 text-indigo-700">
            {otherParticipant?.full_name?.[0] || otherParticipant?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {otherParticipant?.full_name || otherParticipant?.username || 'Utilisateur'}
          </h3>
          <p className="text-xs text-gray-500 flex items-center">
            {isFreelance ? "Client" : "Freelance"}
            <UserStatusIndicator 
              isOnline={!!otherParticipant?.online} 
              lastSeen={otherParticipant?.last_seen}
              className="ml-1"
            />
          </p>
        </div>
        
        <Button variant="ghost" size="icon" className="text-gray-500">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Zone des messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scrollbar-hide w-full"
      >
        {/* Indicateur de chargement des messages plus anciens */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Bouton "Charger plus" si des messages plus anciens sont disponibles */}
        {hasMoreMessages && !isLoadingMore && (
          <div className="flex justify-center">
            <button 
              type="button"
              onClick={loadMoreMessages}
              className="text-xs text-indigo-600 hover:text-indigo-800 py-1 px-3 rounded-full bg-indigo-50"
            >
              Voir les messages précédents
            </button>
          </div>
        )}
        
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-100 rounded-full p-4 mb-3">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Aucun message dans cette conversation</p>
            <p className="text-sm text-gray-400 mt-1">Envoyez un message pour commencer</p>
          </div>
        ) : (
          <>
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
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={otherParticipant?.avatar_url || ''} 
                    alt={otherParticipant?.full_name || otherParticipant?.username || 'Utilisateur'}
                    onError={() => setTypingAvatarError(true)}
                  />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700">
                    {otherParticipant?.full_name?.[0] || otherParticipant?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2 bg-gray-100 rounded-2xl py-2 px-4 max-w-[75%] text-gray-700">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
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
                onClick={() => removeAttachment(index)}
                className="ml-1 p-0.5 rounded-full bg-gray-200 hover:bg-gray-300"
                type="button"
              >
                <X className="h-3 w-3 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Barre de saisie */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 rounded-full shadow-sm">
            <div className="flex items-center">
              <div className="flex items-center space-x-1 pl-3">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-indigo-600 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez un message..."
                className="flex-1 bg-transparent border-0 resize-none py-3 px-3 focus:ring-0 text-sm min-h-[40px] max-h-[120px]"
                rows={1}
              />
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                className="h-8 w-8 mr-1 text-gray-400 hover:text-indigo-600 rounded-full"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="button"
            onClick={handleSendMessage}
            disabled={(!messageText || messageText.trim() === '') && attachments.length === 0}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-sm"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 