import React, { useState } from 'react';
import { FileText, Image as ImageIcon, ExternalLink, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Message } from '@/lib/stores/useMessagingStore';
import { formatDate } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  isFreelance?: boolean;
}

// Types étendus pour TypeScript
interface ExtendedMessage extends Message {
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser,
  isFreelance = false
}) => {
  // Cast du message pour avoir accès aux propriétés d'attachement
  const typedMessage = message as ExtendedMessage;
  const [avatarError, setAvatarError] = useState(false);
  
  // Ignorer les messages vides ou messages "en train d'écrire"
  if ((typedMessage.content === '' || !typedMessage.content?.trim()) && 
      (!typedMessage.attachment_url || typedMessage.is_typing)) {
    return null;
  }
  
  const formattedTime = typedMessage.created_at 
    ? formatDate(new Date(typedMessage.created_at)) 
    : '';
  
  const hasAttachment = typedMessage.attachment_url && typedMessage.attachment_type;
  const isImageAttachment = typedMessage.attachment_type === 'image';
  
  // Toutes les images sont maintenant visibles par tous les utilisateurs
  const shouldShowAsImage = isImageAttachment;

  // Déterminer s'il s'agit d'un message non lu pour le mettre en évidence
  const isUnread = !typedMessage.read;
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Avatar (seulement si ce n'est pas l'utilisateur courant) */}
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={typedMessage.sender?.avatar_url || ''} 
              alt={typedMessage.sender?.full_name || typedMessage.sender?.username || 'Utilisateur'} 
              onError={() => setAvatarError(true)}
            />
            <AvatarFallback className="bg-indigo-100 text-indigo-700">
              {typedMessage.sender?.full_name?.[0] || typedMessage.sender?.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      {/* Contenu du message */}
      <div className={`flex flex-col max-w-[75%] md:max-w-[60%] lg:max-w-[50%] ${!isCurrentUser && isUnread ? 'relative' : ''}`}>
        {/* Indicateur de message non lu */}
        {!isCurrentUser && isUnread && (
          <div className="absolute -left-3 top-4 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      
        <div className={`
          rounded-2xl py-2 px-4 mb-1 overflow-hidden
          ${isCurrentUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : `bg-gray-100 text-gray-700 rounded-tl-none ${isUnread ? 'ring-2 ring-blue-200' : ''}`}
        `}>
          {/* Texte du message */}
          {typedMessage.content && typedMessage.content.trim() !== '' && (
            <p className="text-sm whitespace-pre-wrap break-all break-words overflow-hidden w-full">
              {typedMessage.content}
            </p>
          )}
          
          {/* Pièce jointe */}
          {hasAttachment && (
            <div className={`mt-2 rounded-lg overflow-hidden ${typedMessage.content ? 'mt-3' : ''}`}>
              {shouldShowAsImage ? (
                <div className="relative">
                  <img 
                    src={typedMessage.attachment_url || ''} 
                    alt={typedMessage.attachment_name || 'Image'} 
                    className="max-w-full w-full rounded-lg max-h-[200px] object-contain bg-gray-800"
                  />
                  <a 
                    href={typedMessage.attachment_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      absolute bottom-2 right-2 p-1.5 rounded-full
                      ${isCurrentUser ? 'bg-indigo-800 hover:bg-indigo-900' : 'bg-gray-200 hover:bg-gray-300'}
                    `}
                  >
                    <ExternalLink className={`h-4 w-4 ${isCurrentUser ? 'text-white' : 'text-gray-700'}`} />
                  </a>
                </div>
              ) : (
                <a 
                  href={typedMessage.attachment_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center gap-2 py-2 px-3 rounded-lg overflow-hidden
                    ${isCurrentUser 
                      ? 'bg-indigo-700 hover:bg-indigo-800 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                  `}
                >
                  {isImageAttachment ? (
                    <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-sm truncate max-w-[150px]">{typedMessage.attachment_name || 'Fichier'}</span>
                  <ExternalLink className="h-4 w-4 ml-auto flex-shrink-0" />
                </a>
              )}
            </div>
          )}
        </div>
        
        {/* Heure et statut de lecture */}
        <div className={`flex items-center text-xs text-gray-500 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <span className="mr-1">{formattedTime}</span>
          {/* Indicateur de lecture - affiché uniquement pour les messages envoyés par l'utilisateur courant */}
          {isCurrentUser && (
            <span>
              {typedMessage.read 
                ? <CheckCheck className="h-3 w-3 text-indigo-600" /> 
                : <Check className="h-3 w-3" />
              }
            </span>
          )}
          {/* Indicateur "non lu" textuel pour les messages reçus */}
          {!isCurrentUser && isUnread && (
            <span className="ml-1 font-medium text-blue-600">• Non lu</span>
          )}
        </div>
      </div>
      
      {/* Espace pour maintenir l'alignement côté utilisateur */}
      {isCurrentUser && <div className="flex-shrink-0 ml-2 w-8"></div>}
    </div>
  );
};

export default MessageBubble; 