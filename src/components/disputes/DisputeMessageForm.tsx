import React, { useState, FormEvent, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Paperclip, Send, Loader2, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface DisputeMessageFormProps {
  disputeId: string;
  onSendMessage: (message: string, attachmentUrl?: string) => Promise<boolean>;
  disabled?: boolean;
}

export function DisputeMessageForm({ 
  disputeId, 
  onSendMessage, 
  disabled = false 
}: DisputeMessageFormProps) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSending || !message.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(message, file ? file.name : undefined);
      setMessage('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès."
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setError("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsSending(false);
    }
  }, [message, disabled, isSending, onSendMessage, file, toast]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !disabled && !isSending) {
        e.preventDefault();
        handleSubmit(new Event('submit') as any);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, disabled, isSending, handleSubmit]);
  
  // Focus automatique sur le textarea
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);
  
  // Mettre à jour le compteur de caractères
  useEffect(() => {
    setCharCount(message.length);
  }, [message]);
  
  // Déterminer le type de fichier pour l'icône
  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return (
        <span aria-label="Image">
          <Image className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" strokeWidth={2.5} />
        </span>
      );
    }
    return (
      <span aria-label="Document">
        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" strokeWidth={2.5} />
      </span>
    );
  }, []);
  
  // Optimisé le gestionnaire de changement de fichier
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Vérifier la taille du fichier (10 Mo max)
      if (e.target.files[0].size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 10 Mo.",
          variant: "destructive"
        });
        return;
      }
      
      setFile(e.target.files[0]);
      // Focus sur le textarea après la sélection du fichier
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [toast]);
  
  // Gestionnaire pour retirer le fichier
  const handleRemoveFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Focus sur le textarea après la suppression du fichier
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  return (
    <motion.form 
      className="w-full" 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Écrivez votre message ici..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={cn(
              "min-h-[80px] resize-none bg-white/50 backdrop-blur-sm border-slate-200 text-xs rounded-lg shadow-sm transition-all",
              "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50",
              "dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/30 dark:text-vynal-text-primary dark:placeholder:text-vynal-text-secondary/50",
              disabled ? "opacity-60 cursor-not-allowed" : "",
              "pr-12" // Espace pour le compteur de caractères
            )}
            disabled={disabled || isSending}
          />
          
          {/* Compteur de caractères */}
          <div className="absolute bottom-2 right-3 text-[9px] text-slate-400 dark:text-vynal-text-secondary/50">
            {charCount}
          </div>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              className="text-[10px] text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 p-2 rounded-md border border-red-100 dark:border-red-800/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {file ? (
              <motion.div 
                className="flex items-center gap-1 py-1 px-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-md border border-indigo-100 dark:border-indigo-800/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {getFileIcon(file.name)}
                <span className="text-[9px] sm:text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">
                  {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                </span>
                <button 
                  type="button" 
                  onClick={handleRemoveFile}
                  className="ml-1 text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800/20"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </motion.div>
            ) : (
              <label 
                htmlFor="attachment" 
                className="flex items-center text-[9px] sm:text-[10px] text-slate-500 hover:text-slate-700 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary cursor-pointer py-1 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-vynal-purple-secondary/10 transition-colors"
              >
                <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" strokeWidth={2.5} />
                Joindre un fichier
              </label>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id="attachment"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || isSending}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            
            {/* Info raccourci clavier */}
            <div className="hidden sm:flex ml-2 items-center text-[9px] text-slate-400 bg-slate-50 py-0.5 px-1.5 rounded">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[8px] mr-1">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[8px] mx-1">Enter</kbd>
              <span>pour envoyer</span>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={disabled || isSending || !message.trim()}
            className={cn(
              "bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white dark:text-vynal-purple-dark px-3 shadow-sm hover:shadow text-xs sm:text-xs",
              "flex items-center gap-1.5"
            )}
          >
            {isSending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" strokeWidth={2.5} />
            )}
            Envoyer
          </Button>
        </div>
      </div>
    </motion.form>
  );
}