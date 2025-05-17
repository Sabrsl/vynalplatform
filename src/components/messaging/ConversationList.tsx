"use client";

import React, { useState } from 'react';
import { Search, MessagesSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/components/messaging/messaging-types';
import { formatDistanceToNow } from '@/lib/utils';
import UserStatusIndicator from './UserStatusIndicator';
import { useAuth } from '@/hooks/useAuth';
import EnhancedAvatar from '@/components/ui/enhanced-avatar';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation?: () => void;
  isFreelance?: boolean;
  showOrderConversations?: boolean;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name: string): string => {
  if (!name || name === '') return 'U';
  
  return name
    .split(' ')
    .map(part => part && part.length > 0 ? part[0] : '')
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isFreelance = false,
  showOrderConversations = true,
  onRefresh,
  isRefreshing = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  
  // Filtrer les conversations en fonction du terme de recherche
  const filteredConversations = conversations
    .filter(conversation => {
      // Filtrer par le terme de recherche
      if (!searchTerm.trim()) return true;
      
      const otherParticipant = conversation.participants.find(
        p => p.id !== user?.id
      );
      
      const participantName = otherParticipant?.full_name || otherParticipant?.username || '';
      return participantName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* En-tête avec titre et barre de recherche */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {isFreelance 
              ? (showOrderConversations === true 
                  ? "Tous les messages" 
                  : showOrderConversations ? "Messages de commandes" : "Messages directs")
              : (showOrderConversations === true 
                  ? "Tous les freelances" 
                  : showOrderConversations ? "Commandes" : "Freelances")}
          </h2>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh} 
              disabled={isRefreshing}
              className="text-white hover:bg-white/20"
            >
              {isRefreshing ? (
                <div className="h-4 w-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full text-xs text-gray-900 bg-white/90 focus:bg-white border-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
          />
        </div>
      </div>
      
      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-pink-100 dark:bg-pink-900/30 rounded-full p-3 mb-2">
              <MessagesSquare className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-gray-200">
              {searchTerm ? "Aucun résultat" : "Aucune conversation"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs max-w-xs">
              {searchTerm 
                ? "Essayez avec un autre terme de recherche" 
                : "Aucune conversation disponible pour le moment"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {filteredConversations.map((conversation) => {
              // Trouver l'autre participant (en supposant une conversation à 2 personnes)
              const otherParticipant = conversation.participants.find(
                p => p.id !== user?.id
              );
              
              // Récupérer le dernier message
              const lastMessageContent = conversation.last_message?.content || '';
              const lastMessageTime = conversation.last_message_time || conversation.updated_at || conversation.created_at;
              const formattedTime = lastMessageTime 
                ? formatDistanceToNow(new Date(lastMessageTime))
                : '';
              
              // Calculer le nombre total de messages non lus
              const unreadCount = otherParticipant?.unread_count || 0;
              
              // Tronquer le contenu du dernier message s'il est trop long
              const truncatedContent = lastMessageContent.length > 35
                ? `${lastMessageContent.substring(0, 35)}...`
                : lastMessageContent;
              
              // Vérifier que l'autre participant a bien un nom et un avatar
              const participantName = otherParticipant?.full_name || otherParticipant?.username || 'Contact';
              const avatarUrl = otherParticipant?.avatar_url || '';
              const isOnline = Boolean(otherParticipant?.last_seen && new Date(otherParticipant.last_seen).getTime() > Date.now() - 300000);
              
              return (
                <li 
                  key={conversation.id}
                  className={`
                    relative hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors
                    ${conversation.id === activeConversationId ? 'bg-vynal-purple-secondary/10 dark:bg-vynal-purple-secondary/20 border-l-2 border-vynal-purple-secondary' : ''}
                  `}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-center p-3">
                    {/* Avatar avec indicateur de statut */}
                    <div className="relative flex-shrink-0">
                      <EnhancedAvatar 
                        src={avatarUrl} 
                        alt={participantName}
                        fallback={participantName}
                        className="h-10 w-10 border border-gray-200 dark:border-gray-700"
                        fallbackClassName="bg-gradient-to-br from-pink-400 to-purple-500 text-white"
                        onError={() => console.log(`Failed to load avatar for ${participantName}`)}
                      />
                      
                      <UserStatusIndicator 
                        isOnline={isOnline}
                        className="absolute bottom-0 right-0 border-2 border-white dark:border-gray-950"
                      />
                    </div>
                    
                    {/* Information de conversation */}
                    <div className="ml-3 min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {participantName}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                          {formattedTime}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-xs truncate ${
                          unreadCount > 0 
                            ? 'text-gray-900 dark:text-gray-100 font-medium' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {truncatedContent || 'Démarrer une conversation'}
                        </p>
                        
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-pink-600 text-white text-xs font-medium rounded-full h-4 min-w-4 inline-flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
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