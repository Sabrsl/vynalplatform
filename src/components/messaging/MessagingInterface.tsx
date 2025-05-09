"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useInView } from 'react-intersection-observer';
import { MessagingInterfaceProps } from './messaging-types';

// Squelette de chargement pour la liste de conversations
const ConversationListSkeleton = () => (
  <div className="flex flex-col h-full">
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
      <div className="h-7 w-32 bg-vynal-purple-secondary/30 rounded mb-4 animate-pulse"></div>
      <div className="h-10 w-full bg-vynal-purple-secondary/30 rounded-full animate-pulse"></div>
    </div>
    <div className="flex-1 p-2 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center p-3 mb-1 rounded-lg bg-white dark:bg-gray-850">
          <div className="h-12 w-12 rounded-full bg-vynal-purple-secondary/30 flex-shrink-0 animate-pulse"></div>
          <div className="ml-3 flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-vynal-purple-secondary/30 rounded animate-pulse"></div>
            <div className="h-3 w-4/5 bg-vynal-purple-secondary/30 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Squelette de chargement pour la fenêtre de chat
const ChatWindowSkeleton = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-pink-600 to-purple-600">
      <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30"></div>
      <div className="ml-3">
        <div className="h-4 w-32 bg-vynal-purple-secondary/30 rounded mb-1"></div>
        <div className="h-3 w-24 bg-vynal-purple-secondary/30 rounded"></div>
      </div>
    </div>
    <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
      <div className="space-y-4 w-full max-w-md mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex items-start ${i % 2 === 0 ? 'justify-end' : ''}`}>
            {i % 2 !== 0 && (
              <div className="h-8 w-8 rounded-full bg-vynal-purple-secondary/30 mr-2"></div>
            )}
            <div 
              className={`h-[60px] rounded-2xl ${i % 2 === 0 ? 'bg-vynal-purple-secondary/30 w-[65%]' : 'bg-vynal-purple-secondary/30 w-[70%]'}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
    <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex">
        <div className="flex space-x-2 mr-2">
          <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30"></div>
          <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30"></div>
        </div>
        <div className="h-10 flex-1 bg-vynal-purple-secondary/30 rounded-full"></div>
      </div>
    </div>
  </div>
);

// Chargement dynamique des composants pour réduire la taille du bundle initial
const DirectMessagingInterface = dynamic(() => import('./DirectMessagingInterface'), {
  loading: () => <div className="flex-1"><Loader size="lg" className="mx-auto my-4" /></div>,
  ssr: false
});

const OrderMessagingInterface = dynamic(() => import('./OrderMessagingInterface'), {
  loading: () => <div className="flex-1"><Loader size="lg" className="mx-auto my-4" /></div>,
  ssr: false
});

// Classe de transition pour les animations
const slideIn = "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out";

/**
 * Interface principale de messagerie qui sert de routeur vers les sous-interfaces spécifiques
 * Prend une décision simple: rediriger vers DirectMessagingInterface ou OrderMessagingInterface
 */
const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  initialConversationId,
  receiverId,
  orderId,
  className = '',
  isFreelance: propIsFreelance
}) => {
  const { user } = useAuth();
  const { isFreelance: userIsFreelance } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Intersection Observer pour détecter quand l'interface est visible
  const { ref: interfaceRef } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Utiliser la prop isFreelance si fournie, sinon utiliser la valeur du hook useUser
  const isFreelance = useMemo(() => {
    if (propIsFreelance !== undefined) return propIsFreelance;
    return userIsFreelance;
  }, [propIsFreelance, userIsFreelance]);

  // Initialisation simple 
  useEffect(() => {
    if (user?.id) {
      setMounted(true);
      setTimeout(() => setIsInitialLoad(false), 300);
    }
  }, [user?.id]);

  // Gérer le cas où l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Vous devez être connecté pour accéder à la messagerie.</p>
      </div>
    );
  }
  
  // Si nous avons une erreur
  if (loadError) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{loadError}</p>
        <button 
          onClick={() => {
            setLoadError(null);
            window.location.reload();
          }}
          className="mt-4 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }
  
  // Afficher un message si l'utilisateur n'est pas monté
  if (!mounted || isInitialLoad) {
    return (
      <div className={`h-[calc(100vh-200px)] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0 bg-white dark:bg-gray-950 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${slideIn}`}>
        <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-800 h-full">
          <ConversationListSkeleton />
        </div>
        <div className="hidden md:block md:col-span-2 lg:col-span-3 h-full">
          <ChatWindowSkeleton />
        </div>
      </div>
    );
  }
  
  // Router vers l'interface appropriée (ordres ou directs)
  return (
    <div ref={interfaceRef} className={className}>
      {orderId ? (
        <OrderMessagingInterface 
          orderId={orderId}
          isFreelance={isFreelance}
          className={className}
        />
      ) : (
        <DirectMessagingInterface 
          initialConversationId={initialConversationId}
          receiverId={receiverId}
          isFreelance={isFreelance}
          className={className}
        />
      )}
    </div>
  );
};

export default React.memo(MessagingInterface);