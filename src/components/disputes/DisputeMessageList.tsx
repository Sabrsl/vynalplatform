import React, { useRef, useEffect } from 'react';
import { DisputeMessage } from '@/lib/supabase/disputes';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DisputeMessageListProps {
  messages: DisputeMessage[];
  currentUserId: string;
}

export function DisputeMessageList({ messages, currentUserId }: DisputeMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Faire défiler jusqu'au dernier message lorsque les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Formatage de la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Vérifie si le message est de l'utilisateur courant
  const isCurrentUserMessage = (message: DisputeMessage) => {
    return message.user_id === currentUserId;
  };

  if (messages.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-slate-500 dark:text-vynal-text-secondary text-xs sm:text-sm">Aucun message dans cette dispute.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 overflow-y-auto max-h-[500px] p-3 sm:p-4 custom-scrollbar bg-white dark:bg-transparent">
      {messages.map((message) => (
        <div 
          key={message.id}
          className={`flex ${isCurrentUserMessage(message) ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`flex max-w-[85%] sm:max-w-[80%] ${isCurrentUserMessage(message) ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mr-1.5 sm:mr-2 flex-shrink-0">
              <AvatarImage 
                src={message.user?.avatar_url || ''} 
                alt={message.user?.full_name || message.user?.username || 'User'} 
              />
              <AvatarFallback className="bg-white text-slate-700 text-[10px] sm:text-xs dark:bg-vynal-purple-secondary/40 dark:text-vynal-text-primary">
                {(message.user?.full_name || message.user?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <Card 
                className={`p-2 sm:p-3 ${
                  isCurrentUserMessage(message) 
                    ? 'bg-blue-50 border-blue-100 dark:bg-vynal-accent-primary/20 dark:border-vynal-accent-primary/30' 
                    : 'bg-white border-slate-200 dark:bg-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-vynal-text-secondary mb-0.5 sm:mb-1">
                    {message.user?.full_name || message.user?.username || 'Utilisateur'} • {formatDate(message.created_at)}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-vynal-text-primary whitespace-pre-wrap">
                    {message.message}
                  </p>
                  
                  {message.attachment_url && (
                    <div className="mt-1 sm:mt-2">
                      <a 
                        href={message.attachment_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 dark:text-vynal-accent-secondary dark:hover:text-vynal-accent-primary"
                      >
                        <Paperclip className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Pièce jointe
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
} 