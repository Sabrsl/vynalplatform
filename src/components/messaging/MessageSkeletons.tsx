import React from 'react';

// Squelette de chargement pour la liste de conversations
export const ConversationListSkeleton = () => (
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
export const ChatWindowSkeleton = () => (
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

// Squelette de chargement pour les messages de commande
export const OrderMessagesSkeleton = () => (
  <div className="h-full flex flex-col">
    <div className="flex items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-600 to-indigo-600">
      <div className="h-10 w-10 rounded-full bg-white/20 animate-pulse"></div>
      <div className="ml-3">
        <div className="h-5 w-28 bg-white/30 rounded animate-pulse"></div>
        <div className="h-3 w-20 bg-white/20 rounded mt-1 animate-pulse"></div>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-4 rounded-full bg-vynal-purple-secondary/10 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30"></div>
        </div>
        <div className="mt-4 h-4 w-40 bg-vynal-purple-secondary/30 rounded"></div>
        <div className="mt-2 h-3 w-60 bg-vynal-purple-secondary/20 rounded"></div>
      </div>
    </div>
    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="h-20 w-full bg-vynal-purple-secondary/10 rounded animate-pulse"></div>
    </div>
  </div>
);

// Squelette de chargement pour un message typique
export const MessageBubbleSkeleton = ({ isOwnMessage = false }: { isOwnMessage?: boolean }) => (
  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
    {!isOwnMessage && <div className="h-8 w-8 rounded-full bg-vynal-purple-secondary/30 mr-2 animate-pulse"></div>}
    <div 
      className={`px-4 py-3 rounded-lg ${
        isOwnMessage ? 'bg-vynal-purple-secondary/20 w-[65%]' : 'bg-white dark:bg-gray-800 w-[70%]'
      } animate-pulse`}
    >
      <div className="h-4 w-4/5 bg-vynal-purple-secondary/30 rounded mb-2"></div>
      <div className="h-4 w-3/5 bg-vynal-purple-secondary/30 rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-vynal-purple-secondary/30 rounded"></div>
      <div className="h-3 w-16 bg-vynal-purple-secondary/20 rounded mt-2 self-end"></div>
    </div>
  </div>
); 