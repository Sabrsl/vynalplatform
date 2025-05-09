"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, X } from 'lucide-react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { validateMessage } from '@/lib/message-validation';
import { Loader } from '@/components/ui/loader';
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";
import { useUser } from '@/hooks/useUser';

interface MessagingDialogProps {
  freelanceId: string;
  freelanceName: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onConversationCreated?: (conversationId: string) => void;
}

const MessagingDialog = ({
  freelanceId,
  freelanceName,
  buttonVariant = 'default',
  className = '',
  size,
  onConversationCreated
}: MessagingDialogProps) => {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFreelance } = useUser();
  const { toast } = useToast();
  
  const { createConversation, isLoading, error: storeError, sendMessage } = useMessagingStore();
  
  // Effet pour gérer les erreurs du store
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  // Gérer l'échappement avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModal]);
  
  const handleOpenModal = () => {
    // Réinitialiser
    setMessage('');
    setError(null);
    
    // Vérifications de base
    if (!user?.id) {
      toast({
        title: "Connexion requise",
        description: "Vous devez vous connecter pour contacter un vendeur",
      });
      
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    if (user.id === freelanceId) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous envoyer de message à vous-même.",
        variant: "destructive"
      });
      return;
    }
    
    // Ouvrir modal
    setShowModal(true);
  };
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setError(null);
      
      if (!user?.id) {
        setError("Vous devez être connecté pour envoyer un message.");
        return;
      }
      
      // Valider message
      const validationResult = validateMessage(message.trim(), {
        maxLength: 5000,
        minLength: 1,
        censorInsteadOfBlock: true,
        allowQuotedWords: true,
        allowLowSeverityWords: true,
        respectRecommendedActions: true
      });
      
      if (!validationResult.isValid) {
        setError(validationResult.errors.join(', '));
        return;
      }
      
      // Envoyer message
      const conversationId = await createConversation([user.id, freelanceId]);
      
      if (conversationId) {
        // Envoyer le message initial
        await sendMessage(conversationId, user.id, validationResult.message);
        
        if (onConversationCreated) {
          onConversationCreated(conversationId);
        }
      }
      
      // Succès
      setShowModal(false);
      setMessage('');
      
      toast({
        title: "Message envoyé",
        description: `Votre message à ${freelanceName} a été envoyé.`,
      });
      
      // Déterminer la route de redirection en fonction du rôle de l'utilisateur
      const messagesRoute = isFreelance ? FREELANCE_ROUTES.MESSAGES : CLIENT_ROUTES.MESSAGES;
      
      // Redirection
      setTimeout(() => {
        router.push(`${messagesRoute}?conversation=${conversationId}`);
      }, 500);
      
    } catch (err: any) {
      setError(err?.message || "Une erreur s'est produite");
    }
  };
  
  return (
    <>
      <Button 
        variant={buttonVariant} 
        className={className} 
        onClick={handleOpenModal}
        disabled={authLoading}
        size={size}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Contacter
      </Button>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal content */}
          <div className="relative bg-white dark:bg-vynal-purple-dark/90 border border-gray-200 dark:border-vynal-purple-secondary/30 rounded-xl shadow-lg p-6 w-full max-w-[425px] z-50 transition-all transform scale-100">
            {/* Close button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vynal-purple-light rounded-full"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </button>
            
            {/* Header */}
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-vynal-text-primary">
                Envoyer un message à {freelanceName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-vynal-text-secondary mt-1.5">
                Utilisez ce formulaire pour envoyer un message direct au freelance.
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-2 mb-4">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="pt-2 pb-5">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message ici..."
                className="min-h-[120px] resize-none bg-gray-50 dark:bg-vynal-purple-darkest/50 border-gray-300 dark:border-vynal-purple-mid/30 focus:border-vynal-purple-light focus:ring-vynal-purple-light/20 transition-colors"
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-vynal-purple-light/50 dark:text-white dark:hover:bg-vynal-purple-dark/20 transition-colors"
              >
                Annuler
              </Button>
              
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || message.trim() === ''}
                className="bg-gradient-to-r from-vynal-purple-light to-vynal-purple-mid hover:from-vynal-purple-mid hover:to-vynal-purple-dark text-white shadow-md transition-all dark:from-pink-400 dark:to-pink-600 dark:hover:from-pink-500 dark:hover:to-pink-700"
              >
                {isLoading ? (
                  <Loader size="xs" variant="primary" className="mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagingDialog; 