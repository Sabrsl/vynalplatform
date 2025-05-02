"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MessagingInterface from '@/components/messaging/MessagingInterface';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MessagesPageSkeleton } from "@/components/skeletons/MessagesPageSkeleton";

// Chargement dynamique du composant de nouvelle conversation
const NewConversationDialog = dynamic(
  () => import('@/components/messaging/NewConversationDialog'), 
  { 
    loading: () => (
      <div className="h-10 w-[150px] rounded-md bg-vynal-purple-secondary/30 animate-pulse"></div>
    ),
    ssr: false 
  }
);

// Ajouter une constante pour les transitions fluides
const fadeIn = "animate-in fade-in duration-300 ease-in-out";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [isComponentLoaded, setIsComponentLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('conversation');
  const orderId = searchParams?.get('orderId');
  
  // Gérer les erreurs
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Erreur détectée dans la page de messages:", event.error);
      setIsError(true);
      setErrorMessage("Une erreur est survenue lors du chargement des messages. Veuillez rafraîchir la page.");
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Lorsque l'URL change, réinitialiser l'état d'erreur
  useEffect(() => {
    setIsError(false);
    setErrorMessage(null);
  }, [conversationId, orderId]);
  
  // Marquer le composant comme chargé après le montage et ajouter un délai minimal
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentLoaded(true);
    }, 300); // Délai minimal augmenté pour éviter le clignotement
    
    return () => {
      clearTimeout(timer); // Nettoyer le timer si le composant est démonté
      setIsComponentLoaded(false);
    };
  }, []);
  
  // Gérer la création d'une nouvelle conversation
  const handleConversationCreated = useCallback((newConversationId: string) => {
    if (!newConversationId) return;
    
    router.push(`/dashboard/messages?conversation=${newConversationId}`);
  }, [router]);
  
  // Afficher un état de chargement amélioré
  if (authLoading || !isComponentLoaded) {
    return <MessagesPageSkeleton />;
  }
  
  // Afficher un message si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Messagerie Freelance</h1>
        <p className="text-gray-600">Veuillez vous connecter pour accéder à vos messages.</p>
      </div>
    );
  }
  
  // Afficher un message d'erreur si nécessaire
  if (isError && errorMessage) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Erreur</h1>
        <p className="text-red-600">{errorMessage}</p>
        <button 
          onClick={() => router.push('/dashboard/messages')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Retour aux messages
        </button>
      </div>
    );
  }
  
  return (
    <ErrorBoundary fallback={
      <div className="p-6 bg-red-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Une erreur est survenue</h1>
        <p className="text-red-600">Impossible de charger la messagerie. Veuillez rafraîchir la page.</p>
      </div>
    }>
      <div className={`p-4 sm:p-6 ${fadeIn}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messagerie Freelance</h1>
          
          <NewConversationDialog 
            onConversationCreated={handleConversationCreated}
            isFreelance={true}
          />
        </div>
        
        <MessagingInterface 
          initialConversationId={conversationId || undefined} 
          orderId={orderId || undefined}
          isFreelance={true}
          key={`messaging-${conversationId || orderId || 'all'}`}
        />
      </div>
    </ErrorBoundary>
  );
} 