"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface MessagingInterfaceProps {
  initialConversationId?: string;
  receiverId?: string;
  className?: string;
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  initialConversationId,
  receiverId,
  className = ''
}) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { 
    activeConversation,
    conversations, 
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    setupRealtimeSubscriptions,
    createConversation
  } = useMessagingStore();

  // Déterminer si l'utilisateur est un freelance ou un client
  const isFreelance = user?.user_metadata?.role === 'freelance';

  // Création d'une nouvelle conversation si receiverId est fourni
  useEffect(() => {
    const initializeMessaging = async () => {
      if (!user?.id) return;
      
      // Initialiser les abonnements en temps réel
      const cleanup = setupRealtimeSubscriptions(user.id);
      
      // Charger toutes les conversations de l'utilisateur
      await fetchConversations(user.id);
      
      // Si nous avons un ID de conversation initial, le charger
      if (initialConversationId) {
        await fetchMessages(initialConversationId);
      }
      // Si nous avons un ID de récepteur mais pas de conversation active,
      // vérifier si une conversation existe déjà
      else if (receiverId && conversations.length > 0) {
        // Rechercher une conversation existante avec le récepteur
        const existingConversation = conversations.find(conv => 
          conv.participants.some(p => p.id === receiverId)
        );
        
        if (existingConversation) {
          await fetchMessages(existingConversation.id);
        } else if (receiverId !== user.id) {
          // Créer une nouvelle conversation si elle n'existe pas déjà
          const newConversationId = await createConversation([user.id, receiverId]);
          if (newConversationId) {
            await fetchMessages(newConversationId);
          }
        }
      }
      
      // Indiquer que le composant est monté
      setMounted(true);
      
      // Nettoyer les abonnements à la déconnexion
      return cleanup;
    };
    
    initializeMessaging();
  }, [user?.id, initialConversationId, receiverId, conversations.length]);
  
  // Si nous sommes en chargement initial
  if (isLoading && !mounted) {
    return (
      <div className="flex items-center justify-center w-full h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  // Si une erreur s'est produite
  if (error && !isLoading) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row w-full h-[calc(100vh-8rem)] bg-black/5 dark:bg-gray-950 rounded-lg shadow-sm border border-purple-800/20 overflow-hidden overflow-x-hidden ${className}`}>
      {/* Sidebar des conversations - caché sur mobile si une conversation est active */}
      <div className={`${showMobileMenu || !activeConversation ? 'flex' : 'hidden'} md:flex md:w-80 lg:w-96 border-r border-purple-800/10 flex-col h-full`}>
        <ConversationList 
          conversations={[...conversations].sort((a, b) => {
            // Trier par la date du dernier message, du plus récent au plus ancien
            const aTime = a.last_message_time || a.updated_at || a.created_at;
            const bTime = b.last_message_time || b.updated_at || b.created_at;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          })} 
          onSelectConversation={(id) => {
            fetchMessages(id);
            setShowMobileMenu(false);
          }}
          activeConversationId={activeConversation?.id}
          isFreelance={isFreelance}
        />
      </div>
      
      {/* Fenêtre de chat - montrée sur mobile uniquement si une conversation est active */}
      <div className={`${!showMobileMenu && activeConversation ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
        {activeConversation ? (
          <ChatWindow 
            conversation={activeConversation}
            onBack={() => setShowMobileMenu(true)}
            isFreelance={isFreelance}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Sélectionnez une conversation pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingInterface; 