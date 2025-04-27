import React from 'react';
import { DisputeMessage } from '@/lib/supabase/disputes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DisputeMessageListProps {
  messages: DisputeMessage[];
  currentUserId: string | undefined;
  formatDate?: (dateString: string) => string;
}

export function DisputeMessageList({ messages, currentUserId, formatDate }: DisputeMessageListProps) {
  // Formatage de date par défaut au cas où formatDate n'est pas fourni
  const formatMessageDate = (dateString: string) => {
    if (formatDate) return formatDate(dateString);
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (messages.length === 0) {
    return (
      <div className="p-6 text-center text-vynal-purple-secondary dark:text-vynal-text-secondary">
        Aucun message à afficher.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => {
        const isCurrentUser = currentUserId === message.user_id;
        
        return (
          <div 
            key={message.id}
            className={cn(
              "flex",
              isCurrentUser ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "flex max-w-[80%]",
              isCurrentUser ? "flex-row-reverse" : "flex-row",
              "gap-2 items-start"
            )}>
              {!isCurrentUser && (
                <Avatar className="h-8 w-8 border border-slate-200 dark:border-vynal-purple-secondary/40">
                  {message.user?.avatar_url ? (
                    <AvatarImage src={message.user.avatar_url} alt={message.user.full_name || message.user.username || 'User'} />
                  ) : (
                    <AvatarFallback className="text-xs bg-slate-100 text-slate-500 dark:bg-vynal-purple-secondary/20 dark:text-vynal-text-secondary">
                      {(message.user?.full_name || message.user?.username || 'U')?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
              
              <div className={cn(
                "space-y-1",
                isCurrentUser ? "items-end text-right" : "items-start"
              )}>
                <div className={cn(
                  "px-3 py-2 rounded-lg",
                  isCurrentUser 
                    ? "bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/30 text-vynal-purple-dark dark:text-vynal-text-primary" 
                    : "bg-white dark:bg-vynal-purple-dark/50 text-vynal-purple-dark dark:text-vynal-text-primary border border-slate-100 dark:border-vynal-purple-secondary/20",
                  "text-sm break-words"
                )}>
                  {message.message}
                  
                  {message.attachment_url && (
                    <div className="mt-2">
                      <a 
                        href={message.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-vynal-accent-secondary dark:text-vynal-accent-primary text-xs underline"
                      >
                        Voir la pièce jointe
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-xs text-slate-500 dark:text-vynal-text-secondary/70">
                  <span className="mr-1">
                    {isCurrentUser ? 'Vous' : (message.user?.full_name || message.user?.username || 'Utilisateur')}
                  </span>
                  <span>• {formatMessageDate(message.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 