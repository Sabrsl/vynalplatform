"use client";

import React from 'react';
import { Search, Plus, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/lib/stores/useMessagingStore';
import { formatDistanceToNow } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation?: () => void;
  isFreelance?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isFreelance = false
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header avec barre de recherche et bouton nouveau message */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">
          {isFreelance ? "Conversations avec clients" : "Conversations avec freelances"}
        </h2>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {onNewConversation && (
            <Button 
              onClick={onNewConversation}
              variant="outline" 
              size="icon" 
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="bg-gray-100 rounded-full p-3 mb-3">
              <User className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-gray-500 text-sm">Pas de conversations</p>
            {onNewConversation && (
              <Button
                onClick={onNewConversation}
                variant="link" 
                className="mt-2 text-indigo-600 text-sm"
              >
                Démarrer une conversation
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              // Trouver l'autre participant (en supposant une conversation à 2 personnes)
              const otherParticipant = conversation.participants.find(
                p => p.id !== activeConversationId
              );
              
              // Récupérer le dernier message
              const lastMessage = conversation.last_message?.content || '';
              const lastMessageTime = conversation.last_message?.created_at 
                ? formatDistanceToNow(new Date(conversation.last_message.created_at)) 
                : '';

              // Calculer le nombre total de messages non lus
              const unreadCount = otherParticipant?.unread_count || 0;
              
              return (
                <li 
                  key={conversation.id}
                  className={`
                    hover:bg-gray-50 cursor-pointer
                    ${conversation.id === activeConversationId ? 'bg-indigo-50' : ''}
                  `}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-center p-4">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={otherParticipant?.avatar_url || ''} 
                          alt={otherParticipant?.full_name || otherParticipant?.username || 'Utilisateur'} 
                        />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">
                          {otherParticipant?.full_name?.[0] || otherParticipant?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Indicateur en ligne */}
                      {otherParticipant?.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                      )}
                    </div>
                    
                    {/* Information de conversation */}
                    <div className="ml-3 min-w-0 flex-1">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.full_name || otherParticipant?.username || 'Utilisateur'}
                        </h3>
                        <span className="text-xs text-gray-500">{lastMessageTime}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-500 truncate max-w-[180px]">
                          {lastMessage || 'Aucun message'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-indigo-600 text-white text-xs font-medium rounded-full h-5 min-w-5 inline-flex items-center justify-center px-1.5">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 