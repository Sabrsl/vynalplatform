import React, { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Paperclip, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }
    
    if (disabled || isSending) {
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      
      let attachmentUrl: string | undefined = undefined;
      
      // Upload du fichier si présent
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch(`/api/disputes/${disputeId}/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error("Échec de l'upload du fichier");
          }
          
          const data = await response.json();
          attachmentUrl = data.url;
        } catch (uploadError) {
          toast({
            title: "Erreur",
            description: "L'upload du fichier a échoué.",
            variant: "destructive"
          });
          setIsSending(false);
          return;
        }
      }
      
      const success = await onSendMessage(message, attachmentUrl);
      
      if (success) {
        setMessage('');
        setFile(null);
        // Réinitialiser l'input file
        const fileInput = document.getElementById('attachment') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès."
        });
      } else {
        setError("Échec de l'envoi du message. Veuillez réessayer.");
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Textarea
          placeholder="Écrivez votre message ici..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={cn(
            "min-h-[80px] resize-none bg-white dark:bg-vynal-purple-dark/50 border-slate-200 dark:border-vynal-purple-secondary/30 text-sm",
            disabled ? "opacity-60 cursor-not-allowed" : ""
          )}
          disabled={disabled || isSending}
        />
        
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
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
              disabled={disabled || isSending}
            />
          </div>
          
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={!message.trim() || disabled || isSending}
            className="text-xs bg-vynal-accent-secondary hover:bg-vynal-accent-primary text-white flex items-center gap-1"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Envoyer</span>
          </Button>
        </div>
      </div>
    </form>
  );
} 