"use client";

import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileIcon } from '@/components/ui/icons/FileIcon';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getProfileImage } from '@/lib/utils/get-profile-image';
import { Message } from '@/types/messages';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/hooks/useUser';
import EnhancedAvatar from '@/components/ui/enhanced-avatar';

interface MessageBubbleProps {
  message: Omit<Message, 'sender'> & { 
    sender?: any 
  };
  isCurrentUser: boolean;
  isFreelance?: boolean;
  showAvatar?: boolean;
  otherParticipant?: any;
  previousMessage?: Message;
  nextMessage?: Message;
}

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Fonction pour déterminer si deux messages sont du même jour
const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear();
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser,
  isFreelance = false,
  showAvatar = true,
  otherParticipant,
  previousMessage,
  nextMessage
}) => {
  const [messageState, setMessageState] = useState<'sent' | 'delivered' | 'read' | 'error'>('sent');
  const [hover, setHover] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    message.sender?.avatar_url || otherParticipant?.avatar_url || null
  );
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Récupérer l'image de profil si elle est manquante
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!avatarUrl && !avatarError && message.sender?.id) {
        try {
          const profileImage = await getProfileImage(message.sender.id);
          if (profileImage) {
            setAvatarUrl(profileImage);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'image de profil:", error);
          setAvatarError(true);
        }
      }
    };
    
    fetchProfileImage();
  }, [avatarUrl, avatarError, message.sender?.id]);
  
  // Déterminer l'état du message
  useEffect(() => {
    // Pour le moment, nous utiliserons seulement l'état "lu" car c'est la seule propriété
    // garantie d'exister sur le type Message
    if (message.read) {
      setMessageState('read');
    } else {
      // Par défaut, considérer comme envoyé
      setMessageState('sent');
    }
  }, [message.read]);
  
  const messageDate = new Date(message.created_at);
  const formattedTime = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Vérifier si nous devons afficher un séparateur de date
  const showDateSeparator = previousMessage && 
    !isSameDay(message.created_at, previousMessage.created_at);
  
  // Déterminer l'alignement et le style de la bulle en fonction de l'expéditeur
  const bubbleAlignment = isCurrentUser ? 'justify-end' : 'justify-start';
  
  // Déterminer s'il faut arrondir tous les coins ou laisser un coin plat
  // pour les messages groupés du même expéditeur
  const isGroupedWithPrevious = previousMessage && 
    previousMessage.sender_id === message.sender_id && 
    isSameDay(message.created_at, previousMessage.created_at);
  
  const isGroupedWithNext = nextMessage && 
    nextMessage.sender_id === message.sender_id && 
    isSameDay(message.created_at, nextMessage.created_at);
  
  // Déterminer la forme de la bulle
  const bubbleShape = isCurrentUser
    ? `rounded-2xl ${!isGroupedWithPrevious ? 'rounded-tr-md' : ''} ${!isGroupedWithNext ? 'rounded-br-md' : ''}`
    : `rounded-2xl ${!isGroupedWithPrevious ? 'rounded-tl-md' : ''} ${!isGroupedWithNext ? 'rounded-bl-md' : ''}`;
  
  // Ajouter une marge plus petite pour les messages groupés
  const bubbleMargin = isGroupedWithPrevious ? 'mt-1' : 'mt-3';
  
  // Déterminer la couleur de la bulle
  const bubbleColor = isCurrentUser
    ? 'bg-pink-600 text-white dark:bg-pink-700'
    : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700';
  
  // Largeur maximale de la bulle (65% pour mobile, 50% pour desktop)
  const bubbleMaxWidth = 'max-w-[65%] sm:max-w-[50%]';
  
  // Vérifier si le message a une pièce jointe
  const hasAttachment = message.attachment_url && message.attachment_type;
  const isImageAttachment = hasAttachment && message.attachment_type?.startsWith('image/');
  
  // Traiter les valeurs potentiellement nulles avant de les passer aux composants
  const attachmentUrl = message.attachment_url || '';
  const attachmentName = message.attachment_name || 'Fichier';

  // Utiliser les informations de l'expéditeur du message si disponibles
  const senderInfo = message.sender || otherParticipant;
  
  const formattedDate = message.created_at
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: fr })
    : '';
  
  const senderName = message.sender?.full_name || message.sender?.username || otherParticipant?.full_name || otherParticipant?.username || 'Utilisateur';
  const initials = getInitials(senderName).substring(0, 2);
  
  return (
    <>
      {/* Séparateur de date si nécessaire */}
      {showDateSeparator && (
        <div className="flex justify-center my-3">
          <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-500 dark:text-gray-400">
            {formatDate(messageDate)}
          </div>
        </div>
      )}
      
      {/* Message */}
      <div className={`flex ${bubbleAlignment} ${bubbleMargin} group`}>
        {/* Avatar (seulement pour les messages reçus et le premier d'un groupe) */}
        {!isCurrentUser && showAvatar && (
          <div className="flex-shrink-0 mr-2 self-end">
            <EnhancedAvatar 
              src={avatarUrl} 
              alt={senderName}
              fallback={initials}
              className="h-8 w-8"
              fallbackClassName="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs"
              onError={() => setAvatarError(true)}
            />
          </div>
        )}
        
        {/* Espace réservé pour maintenir l'alignement */}
        {!isCurrentUser && !showAvatar && <div className="w-8"></div>}
        
        {/* Contenu du message */}
        <div className={`${bubbleMaxWidth} ${bubbleColor} ${bubbleShape} px-3 py-1.5 shadow-sm min-h-[24px]`}>
          {/* Contenu texte */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words text-xs">
              {message.content}
            </p>
          )}
          
          {/* S'assurer qu'il y a toujours du contenu dans la bulle */}
          {!message.content && !hasAttachment && (
            <p className="whitespace-pre-wrap break-words text-xs opacity-0">.</p>
          )}
          
          {/* Pièce jointe */}
          {hasAttachment && (
            <div className={`mt-1 ${message.content ? 'pt-1 border-t border-white/10' : ''}`}>
              {isImageAttachment ? (
                <div className="rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                  <Image 
                    src={attachmentUrl} 
                    alt={attachmentName} 
                    className="max-w-full h-auto max-h-60 object-contain" 
                    width={300}
                    height={300}
                    style={{ maxHeight: '240px' }}
                    unoptimized={attachmentUrl.startsWith('data:')}
                    decoding="async"
                    loading="lazy"
                    quality={85}
                    sizes="(max-width: 768px) 65vw, 50vw"
                  />
                </div>
              ) : (
                <a 
                  href={attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-1.5 rounded-md bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                  aria-label={`Télécharger le fichier ${attachmentName}`}
                >
                  <FileIcon 
                    fileName={attachmentName} 
                    className="h-6 w-6 mr-2 flex-shrink-0" 
                  />
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-medium truncate">
                      {attachmentName}
                    </p>
                    <p className="text-[10px] opacity-70">
                      Télécharger
                    </p>
                  </div>
                </a>
              )}
            </div>
          )}
          
          {/* Horodatage et statut de lecture */}
          <div className={`flex items-center justify-end mt-0.5 space-x-1 text-[10px] ${
            isCurrentUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span 
                    className="text-gray-500 dark:text-gray-400 text-[10px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Message envoyé le ${formattedDate}`}
                  >
                    {formattedTime}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {formattedDate}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isCurrentUser && (
              <span className="ml-1 flex items-center text-gray-500 dark:text-gray-400">
                {messageState === 'error' && (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
                {messageState === 'sent' && (
                  <Check className="h-3 w-3" />
                )}
                {messageState === 'delivered' && (
                  <CheckCheck className="h-3 w-3" />
                )}
                {messageState === 'read' && (
                  <CheckCheck className="h-3 w-3 text-green-500" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageBubble; 