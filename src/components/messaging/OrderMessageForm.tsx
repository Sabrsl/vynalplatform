"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateMessage } from '@/lib/message-validation';
import { uploadOrderMessageAttachment } from '@/lib/supabase/file-upload';
import { OrderMessage } from '@/types/messages';

interface OrderMessageFormProps {
  orderId: string;
  orderDetails: any;
  onMessageSent: (message: any) => void;
}

export function OrderMessageForm({ orderId, orderDetails, onMessageSent }: OrderMessageFormProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    // Limiter la taille du fichier à 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier doit être inférieure à 5 Mo",
        variant: "destructive"
      });
      return;
    }
    
    // Ajouter le fichier
    setAttachment(file);
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !attachment) return;
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Valider le message
      if (message.trim()) {
        try {
          await validateMessage(message);
        } catch (error) {
          toast({
            title: "Message invalide",
            description: error instanceof Error ? error.message : "Le message contient du contenu inapproprié",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Télécharger la pièce jointe si elle existe
      let attachmentUrl = null;
      let attachmentType = null;
      let attachmentName = null;
      
      if (attachment) {
        const uploadResult = await uploadOrderMessageAttachment(attachment, orderId);
        attachmentUrl = uploadResult.url;
        attachmentType = attachment.type;
        attachmentName = attachment.name;
      }
      
      // Créer le message dans la base de données
      const messageContent = message.trim() || (attachment ? `Pièce jointe : ${attachment.name}` : '');
      
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          content: messageContent,
          read: false,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName
        })
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
      }
      
      // Notifier le composant parent du nouveau message
      if (newMessage) {
        onMessageSent(newMessage);
      }
      
      // Réinitialiser les champs
      setMessage('');
      setAttachment(null);
      
      // Scroll vers le bas pour voir le message (à traiter dans le composant parent)
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Envoyer avec Entrée mais pas avec Shift+Entrée
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-950">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      />
      
      {attachment && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 mb-2 flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
            <span className="truncate max-w-[200px]">{attachment.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={removeAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full h-9 w-9 flex-shrink-0"
          disabled={isLoading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="min-h-[40px] resize-none"
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        
        <Button 
          type="button" 
          size="icon" 
          onClick={handleSendMessage}
          className="rounded-full h-9 w-9 bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
          disabled={isLoading || (!message.trim() && !attachment)}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
} 