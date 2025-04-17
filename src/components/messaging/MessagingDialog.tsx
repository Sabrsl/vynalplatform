"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface MessagingDialogProps {
  freelanceId: string;
  freelanceName: string;
  trigger?: React.ReactNode;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const MessagingDialog: React.FC<MessagingDialogProps> = ({
  freelanceId,
  freelanceName,
  trigger,
  buttonVariant = 'default',
  className = '',
  size
}) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const { createConversation, isLoading, error: storeError } = useMessagingStore();
  
  // Effet pour gérer les erreurs du store
  useEffect(() => {
    if (storeError) {
      setError(storeError);
      console.error("Erreur du store:", storeError);
    }
  }, [storeError]);
  
  const handleSendMessage = async () => {
    try {
      setError(null);
      
      if (!user?.id) {
        const errMsg = "Vous devez être connecté pour envoyer un message.";
        setError(errMsg);
        console.error(errMsg);
        return;
      }
      
      if (message.trim() === '') {
        const errMsg = "Le message ne peut pas être vide.";
        setError(errMsg);
        console.error(errMsg);
        return;
      }
      
      console.log("Préparation de l'envoi du message");
      console.log("De:", user.id);
      console.log("À:", freelanceId);
      console.log("Message:", message.trim());
      
      // Vérifier que les IDs sont valides
      if (!user.id.match(/^[0-9a-fA-F-]{36}$/) || !freelanceId.match(/^[0-9a-fA-F-]{36}$/)) {
        const errMsg = "Format d'identifiant utilisateur invalide.";
        setError(errMsg);
        console.error(errMsg, { user: user.id, freelance: freelanceId });
        return;
      }
      
      // Vérification supplémentaire de l'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id !== user.id) {
        const errMsg = "Session utilisateur invalide. Veuillez vous reconnecter.";
        setError(errMsg);
        console.error(errMsg);
        return;
      }
      
      // Créer une conversation avec un message initial
      console.log("Appel à createConversation avec les participants:", [user.id, freelanceId]);
      const conversationId = await createConversation(
        [user.id, freelanceId],
        message.trim()
      );
      
      if (!conversationId) {
        throw new Error("La création de conversation a échoué: pas d'ID de conversation retourné");
      }
      
      console.log("✅ Conversation créée avec succès, ID:", conversationId);
      
      // Fermer le dialogue et réinitialiser l'état
      setIsOpen(false);
      setMessage('');
      setError(null);
      
      // Notification de succès
      toast({
        title: "Message envoyé",
        description: `Votre message à ${freelanceName} a été envoyé.`,
      });
      
      // Rediriger vers la conversation
      console.log("Redirection vers la conversation dans 500ms");
      setTimeout(() => {
        const url = `/dashboard/messages?conversation=${conversationId}`;
        console.log("Redirection vers:", url);
        router.push(url);
      }, 500);
    } catch (err: any) {
      console.error("❌ Erreur lors de l'envoi du message:", err);
      const errorMessage = err?.message || "Une erreur s'est produite. Veuillez réessayer.";
      setError(errorMessage);
      
      toast({
        title: "Échec de l'envoi",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleOpen = () => {
    console.log("➡️ Ouverture de la boîte de dialogue demandée");
    
    // Réinitialiser les états
    setError(null);
    setMessage('');
    
    // Vérifier les paramètres d'entrée
    console.log("Vérification des paramètres - freelanceId:", freelanceId);
    
    if (!freelanceId || typeof freelanceId !== 'string') {
      console.error("❌ freelanceId invalide:", freelanceId);
      toast({
        title: "Erreur",
        description: "Impossible de contacter ce vendeur. Données invalides.",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier si l'utilisateur est connecté
    if (authLoading) {
      console.log("Vérification de l'authentification en cours...");
      toast({
        title: "Chargement",
        description: "Vérification de votre session...",
      });
      return;
    }
    
    if (!user || !user.id) {
      console.log("❌ Utilisateur non connecté, redirection vers login");
      
      toast({
        title: "Connexion requise",
        description: "Vous devez vous connecter pour contacter un freelance",
      });
      
      // Stocker l'URL pour redirection après connexion
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      console.log("URL de redirection:", loginUrl);
      
      router.push(loginUrl);
      return;
    }
    
    console.log("✅ Utilisateur connecté:", user.id);
    
    // Vérifier que l'utilisateur ne contacte pas lui-même
    if (user.id === freelanceId) {
      console.log("⚠️ L'utilisateur essaie de se contacter lui-même");
      
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous envoyer de message à vous-même.",
        variant: "destructive"
      });
      return;
    }
    
    // Vérification supplémentaire du format UUID
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!uuidRegex.test(user.id) || !uuidRegex.test(freelanceId)) {
      console.error("❌ Format d'ID invalide - userId:", user.id, "freelanceId:", freelanceId);
      
      toast({
        title: "Erreur technique",
        description: "Impossible de contacter ce vendeur pour le moment.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("✅ Ouverture du dialogue pour contacter", freelanceName, "(ID:", freelanceId, ")");
    setIsOpen(true);
  };
  
  return (
    <>
      {/* Bouton déclencheur */}
      <Button 
        variant={buttonVariant} 
        className={className} 
        onClick={handleOpen}
        disabled={authLoading}
        size={size}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Contacter
      </Button>
      
      {/* Contenu du dialogue */}
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Envoyer un message à {freelanceName}</DialogTitle>
            </DialogHeader>
            
            {error && (
              <Alert variant="destructive" className="mt-2">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="pt-4 pb-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message ici..."
                className="min-h-[120px] resize-none"
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || message.trim() === ''}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MessagingDialog; 