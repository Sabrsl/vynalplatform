import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Paperclip, Send, Loader2 } from 'lucide-react';
import { addDisputeMessage, uploadDisputeAttachment } from '@/lib/supabase/disputes';

interface DisputeMessageFormProps {
  disputeId: string;
  userId: string;
  onMessageSent: () => void;
  disabled?: boolean;
}

export function DisputeMessageForm({ 
  disputeId, 
  userId, 
  onMessageSent,
  disabled = false 
}: DisputeMessageFormProps) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !file) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir un message ou joindre un fichier.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let attachmentUrl: string | undefined = undefined;
      
      // Upload du fichier si présent
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const uploadedUrl = await uploadDisputeAttachment(disputeId, fileName, file);
        
        if (!uploadedUrl) {
          toast({
            title: "Erreur",
            description: "L'upload du fichier a échoué.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        attachmentUrl = uploadedUrl;
      }
      
      // Ajout du message
      const success = await addDisputeMessage(
        disputeId,
        userId,
        message.trim(),
        attachmentUrl
      );
      
      if (success) {
        setMessage('');
        setFile(null);
        // Réinitialiser l'input file
        const fileInput = document.getElementById('attachment') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        onMessageSent();
        
        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès."
        });
      } else {
        toast({
          title: "Erreur",
          description: "L'envoi du message a échoué.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-vynal-purple-dark p-3 sm:p-4 border-t border-slate-100 dark:border-vynal-purple-secondary/20">
      <div className="flex flex-col space-y-1.5 sm:space-y-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="resize-none text-xs sm:text-sm min-h-[60px] sm:min-h-[80px] border-slate-200 bg-white text-slate-700 focus:border-blue-200 focus-visible:ring-blue-400/30 dark:border-vynal-purple-secondary/30 dark:bg-transparent dark:text-vynal-text-primary"
          disabled={disabled || isSubmitting}
        />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <label 
              htmlFor="attachment" 
              className="flex items-center text-[10px] sm:text-xs text-slate-500 hover:text-slate-700 cursor-pointer dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary"
            >
              <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              {file ? (file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name) : "Joindre un fichier"}
            </label>
            <input
              type="file"
              id="attachment"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || isSubmitting}
            />
          </div>
          
          <Button
            type="submit"
            disabled={disabled || isSubmitting || (!message.trim() && !file)}
            className="flex items-center h-7 sm:h-8 text-[10px] sm:text-xs bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 text-white"
            size="sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1 animate-spin" />
            ) : (
              <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
            )}
            Envoyer
          </Button>
        </div>
      </div>
    </form>
  );
} 