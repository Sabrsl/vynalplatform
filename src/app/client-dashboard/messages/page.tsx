"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import MessagingInterface from "@/components/messaging/MessagingInterface";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { MessageSquare } from "lucide-react";

export default function ClientMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  if (loading) {
    return <ClientDashboardPageSkeleton />;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 flex items-center dark:text-vynal-text-primary">
            <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
            Mes Messages
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-vynal-text-secondary">
            Gérez vos conversations avec les prestataires
          </p>
        </div>
      </div>

      <MessagingInterface 
        isFreelance={false}
        className="h-[calc(100vh-12rem)]"
      />
    </div>
  );
} 