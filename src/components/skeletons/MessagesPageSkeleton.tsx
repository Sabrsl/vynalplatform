import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function MessagesPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Skeleton className="h-8 w-48 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-[150px] bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          </div>
          
          {/* Panneau de messagerie */}
          <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] border rounded-lg border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/20 overflow-hidden">
            {/* Sidebar - liste des conversations */}
            <div className="w-full md:w-80 border-r border-vynal-purple-secondary/20 flex flex-col">
              <div className="p-4 border-b border-vynal-purple-secondary/20">
                <Skeleton className="h-9 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30 rounded-full" />
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-3 w-40 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    </div>
                    <Skeleton className="h-2 w-2 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Zone principale de chat */}
            <div className="flex-1 flex flex-col">
              {/* Header du chat */}
              <div className="border-b border-vynal-purple-secondary/20 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <div>
                    <Skeleton className="h-4 w-32 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-3 w-24 bg-gray-100 dark:bg-vynal-purple-secondary/30 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 bg-gray-100 dark:bg-vynal-purple-secondary/30 rounded-full" />
              </div>
              
              {/* Zone des messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    {i % 2 !== 0 && (
                      <Skeleton className="h-8 w-8 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30 mr-2 flex-shrink-0" />
                    )}
                    <Skeleton 
                      className={`rounded-2xl ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'} 
                        h-[60px] ${i % 2 === 0 ? 'w-[65%]' : 'w-[70%]'} bg-gray-100 dark:bg-vynal-purple-secondary/30`}
                    />
                  </div>
                ))}
              </div>
              
              {/* Zone de saisie */}
              <div className="border-t border-vynal-purple-secondary/20 p-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 rounded-full flex-1 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 