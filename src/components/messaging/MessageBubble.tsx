"use client";

import React from 'react';
import { formatDate } from '@/lib/utils';
import { Message } from '@/lib/stores/useMessagingStore';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileIcon } from '@/components/ui/icons/FileIcon';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
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
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={senderInfo?.avatar_url || ''} 
                alt={senderInfo?.full_name || 'Contact'} 
              />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                {getInitials(senderInfo?.full_name || senderInfo?.username || 'User')}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Espace réservé pour maintenir l'alignement */}
        {!isCurrentUser && !showAvatar && <div className="w-8"></div>}
        
        {/* Contenu du message */}
        <div className={`${bubbleMaxWidth} ${bubbleColor} ${bubbleShape} px-3 py-1.5 shadow-sm`}>
          {/* Contenu texte */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words text-xs">
              {message.content}
            </p>
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
                  />
                </div>
              ) : (
                <a 
                  href={attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-1.5 rounded-md bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
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
            <span>{formattedTime}</span>
            {isCurrentUser && (
              message.read ? 
                <CheckCheck className="h-3 w-3 ml-0.5" /> : 
                <Check className="h-3 w-3 ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageBubble; 