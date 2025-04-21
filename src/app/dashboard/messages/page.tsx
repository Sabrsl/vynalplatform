"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MessagingInterface from '@/components/messaging/MessagingInterface';
import NewConversationDialog from '@/components/messaging/NewConversationDialog';
import { useAuth } from '@/hooks/useAuth';

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Récupérer l'ID de conversation depuis les paramètres d'URL
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId) {
      setConversationId(convId);
    }
  }, [searchParams]);
  
  // Gérer la création d'une nouvelle conversation
  const handleConversationCreated = (newConversationId: string) => {
    router.push(`/dashboard/messages?conversation=${newConversationId}`);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Messagerie</h1>
        <p className="text-gray-600">Veuillez vous connecter pour accéder à vos messages.</p>
      </div>
    );
  }
  
  // Déterminer si l'utilisateur est un freelance
  const isFreelance = user.user_metadata?.role === 'freelance';
  
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messagerie</h1>
        
        <NewConversationDialog 
          onConversationCreated={handleConversationCreated}
          isFreelance={isFreelance}
        />
      </div>
      
      <MessagingInterface 
        initialConversationId={conversationId || undefined} 
        isFreelance={isFreelance}
      />
    </div>
  );
} 