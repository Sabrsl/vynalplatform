import React, { useMemo, memo } from 'react';
import { DisputeMessage } from '@/lib/supabase/disputes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Image, CheckCircle } from 'lucide-react';

interface DisputeMessageListProps {
  messages: DisputeMessage[];
  currentUserId: string | undefined;
  formatDate?: (dateString: string) => string;
}

function DisputeMessageList({ messages, currentUserId, formatDate }: DisputeMessageListProps) {
  // Optimiser le formatage de date par défaut (mémorisé)
  const formatMessageDate = useMemo(() => {
    return (dateString: string) => {
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
  }, [formatDate]);
  
  // Composant pour les pièces jointes (mémorisé)
  const AttachmentPreview = useMemo(() => {
    const AttachmentPreviewComponent = ({ url }: { url: string }) => {
      const fileExtension = url.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
      
      return (
        <div className="mt-2">
          {isImage ? (
            <div className="group relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 inline-block max-w-full">
              <img 
                src={url} 
                alt="Pièce jointe" 
                className="w-auto h-auto max-h-40 max-w-full object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-all"
                >
                  <Download className="h-4 w-4 text-white" strokeWidth={2.5} />
                </a>
              </div>
            </div>
          ) : (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs bg-slate-50 py-1.5 px-2.5 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors inline-block"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-500" strokeWidth={2.5} />
              <span className="text-slate-700 font-medium">Voir la pièce jointe</span>
              <Download className="h-3 w-3 text-slate-500" strokeWidth={2.5} />
            </a>
          )}
        </div>
      );
    };
    
    // Ajouter un displayName pour satisfaire ESLint
    AttachmentPreviewComponent.displayName = 'AttachmentPreview';
    
    return AttachmentPreviewComponent;
  }, []);

  // Variables pour regrouper les messages par date
  const messagesByDate = useMemo(() => {
    const groups: { [key: string]: DisputeMessage[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const dateString = date.toDateString();
      
      let dateLabel;
      if (dateString === today) {
        dateLabel = "Aujourd'hui";
      } else if (dateString === yesterday) {
        dateLabel = "Hier";
      } else {
        dateLabel = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
      }
      
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      
      groups[dateLabel].push(msg);
    });
    
    return groups;
  }, [messages]);

  // Affichage état vide
  if (messages.length === 0) {
    return (
      <div className="py-8 px-4 text-center rounded-md bg-slate-50/50 dark:bg-vynal-purple-secondary/10 backdrop-blur-sm my-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-slate-100 dark:bg-vynal-purple-secondary/20 rounded-full">
            <CheckCircle className="h-5 w-5 text-slate-400 dark:text-vynal-text-secondary/70" strokeWidth={2} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-vynal-text-secondary">Aucun message dans ce litige pour le moment</p>
          <p className="text-[10px] text-slate-400 dark:text-vynal-text-secondary/70">Les messages envoyés apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <AnimatePresence initial={false}>
        {Object.entries(messagesByDate).map(([dateLabel, dateMessages]) => (
          <motion.div 
            key={dateLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-vynal-purple-secondary/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white dark:bg-vynal-purple-dark text-[9px] text-slate-500 dark:text-vynal-text-secondary/70 rounded-full">
                  {dateLabel}
                </span>
              </div>
            </div>
            
            {dateMessages.map((message) => {
              const isCurrentUser = currentUserId === message.user_id;
              
              return (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
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
                      <div className="pt-1">
                        <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                          {message.user?.avatar_url ? (
                            <AvatarImage src={message.user.avatar_url} alt={message.user.full_name || message.user.username || 'User'} />
                          ) : (
                            <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600">
                              {(message.user?.full_name || message.user?.username || 'U')?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                    )}
                    
                    <div className={cn(
                      "space-y-1",
                      isCurrentUser ? "items-end text-right" : "items-start"
                    )}>
                      <div className={cn(
                        "px-3 py-2 rounded-lg shadow-sm",
                        isCurrentUser 
                          ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white" 
                          : "bg-white border border-slate-200 text-slate-700 dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 dark:text-vynal-text-primary",
                        "text-xs break-words"
                      )}>
                        {message.message}
                        
                        {message.attachment_url && (
                          <AttachmentPreview url={message.attachment_url} />
                        )}
                      </div>
                      
                      <div className="flex items-center text-[8px] xxs:text-[9px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary/70">
                        <span className="mr-1 font-medium">
                          {isCurrentUser ? 'Vous' : (message.user?.full_name || message.user?.username || 'Utilisateur')}
                        </span>
                        <span>• {formatMessageDate(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Ajouter le displayName pour le composant
DisputeMessageList.displayName = 'DisputeMessageList';

// Exporter le composant mémorisé comme export par défaut
export default memo(DisputeMessageList);