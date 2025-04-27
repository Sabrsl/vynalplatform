"use client";

import { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Order, OrderStatus } from "@/types/orders";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { OrderSidebar } from "@/components/orders/OrderSidebar";
import { OrderMessagesTab } from "./OrderMessagesTab";
import { OrderFilesTab } from "@/components/orders/OrderFilesTab";
import { OrderTimelineTab } from "@/components/orders/OrderTimelineTab";
import { OrderReviewsTab } from "@/components/orders/OrderReviewsTab";

import {
  FileCheck,
  FileText,
  MessageSquare,
  FileType,
  Star
} from "lucide-react";

// Type d'onglet pour la navigation
type TabValue = "details" | "messages" | "files" | "reviews";

interface OrderDetailContentProps {
  order: Order;
  isFreelance: boolean;
  navigateToOrdersList: (status: OrderStatus) => void;
}

export function OrderDetailContent({ order, isFreelance, navigateToOrdersList }: OrderDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("details");
  const { toast } = useToast();

  // Utilitaires pour les couleurs et labels basés sur le statut
  const statusColors = {
    pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30",
    delivered: "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 dark:bg-vynal-accent-primary/20 dark:border-vynal-accent-primary/30",
    revision_requested: "bg-vynal-purple-secondary/10 text-vynal-purple-secondary border-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30",
    cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30",
    in_dispute: "bg-red-100 text-red-600 border-red-200 dark:bg-red-700/30 dark:text-red-400 dark:border-red-500/40",
  };
    
  const statusLabels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    delivered: "Livrée",
    revision_requested: "Révision demandée",
    cancelled: "Annulée",
    in_dispute: "En litige",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {/* Panneau Latéral - Détails de la commande */}
      <OrderSidebar 
        order={order} 
        isFreelance={isFreelance} 
        statusColors={statusColors} 
        statusLabels={statusLabels}
        navigateToOrdersList={navigateToOrdersList} 
      />

      {/* Contenu principal avec onglets */}
      <div className="lg:col-span-2">
        <Card className="border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
          <CardHeader className="pb-2 sm:pb-3 border-b border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 p-3 sm:p-4">
            <Tabs defaultValue="details" value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
              <TabsList className="bg-vynal-purple-secondary/10 dark:bg-vynal-purple-secondary/20 grid w-full grid-cols-4 h-9 sm:h-10">
                <TabsTrigger value="details" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Détails
                </TabsTrigger>
                <TabsTrigger value="messages" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                  <FileType className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Fichiers
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-vynal-accent-primary data-[state=active]:to-vynal-accent-secondary data-[state=active]:text-white">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Avis
                </TabsTrigger>
              </TabsList>
          
              <div className="mt-0">
                <TabsContent value="details" className="m-0">
                  <OrderTimelineTab order={order} />
                </TabsContent>
                
                <TabsContent value="messages" className="m-0">
                  <OrderMessagesTab order={order} isFreelance={isFreelance} />
                </TabsContent>
                
                <TabsContent value="files" className="m-0">
                  <OrderFilesTab order={order} />
                </TabsContent>
                
                <TabsContent value="reviews" className="m-0">
                  <OrderReviewsTab order={order} />
                </TabsContent>
              </div>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
} 