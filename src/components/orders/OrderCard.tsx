"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, FileCheck, RefreshCw, Clock, CheckCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface OrderCardProps {
  order: {
    id: string;
    created_at: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled';
    service: {
      id: string;
      title: string;
      price: number;
    };
    freelance: {
      id: string;
      username: string;
      full_name: string | null;
    };
    client: {
      id: string;
      username: string;
      full_name: string | null;
    };
    is_client_view: boolean;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30",
    delivered: "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 dark:bg-vynal-accent-primary/20 dark:border-vynal-accent-primary/30",
    revision_requested: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40",
    cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30",
  };
  
  const statusLabels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    delivered: "Livrée",
    revision_requested: "Révision demandée",
    cancelled: "Annulée",
  };

  const statusProgress = {
    pending: 10,
    in_progress: 40,
    revision_requested: 60,
    delivered: 80,
    completed: 100,
    cancelled: 100,
  };

  const statusIcons = {
    pending: <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 dark:text-amber-400" />,
    in_progress: <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400" />,
    completed: <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 dark:text-emerald-400" />,
    delivered: <FileCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-vynal-accent-primary dark:text-vynal-accent-primary" />,
    revision_requested: <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />,
    cancelled: <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 dark:text-red-400" />,
  };

  const gradientColors = {
    pending: "from-amber-400 to-amber-500",
    in_progress: "from-blue-400 to-blue-500", 
    completed: "from-emerald-400 to-emerald-500",
    delivered: "from-vynal-accent-primary to-vynal-accent-secondary",
    revision_requested: "from-red-400 to-red-500",
    cancelled: "from-gray-400 to-gray-500",
  };

  const createdDate = new Date(order.created_at);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: fr });

  return (
    <Card className="border border-vynal-purple-secondary/10 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-vynal-purple-dark/20 overflow-hidden rounded-xl relative">
      <div className="absolute inset-0 bg-gradient-to-r from-vynal-accent-primary/5 to-vynal-accent-secondary/5 opacity-30 dark:opacity-20 pointer-events-none"></div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-vynal-purple-dark/40">
        <div 
          className={`h-full bg-gradient-to-r ${gradientColors[order.status]} transition-all duration-500 ease-out`}
          style={{ width: `${statusProgress[order.status]}%` }}
        ></div>
      </div>
      <CardContent className="p-3 sm:p-4 md:p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-vynal-purple-light dark:text-vynal-text-primary text-[10px] sm:text-xs md:text-sm line-clamp-1 group-hover:text-vynal-accent-primary transition-colors">{order.service.title}</h3>
            <p className="text-[10px] sm:text-[11px] md:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1 sm:mt-1.5">
              {order.is_client_view ? 
                `Freelance: ${order.freelance.full_name || order.freelance.username}` : 
                `Client: ${order.client.full_name || order.client.username}`}
            </p>
            <div className="flex items-center mt-1.5 sm:mt-2 md:mt-3 text-[9px] sm:text-[10px] md:text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/60">
              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 mr-1 sm:mr-1.5 md:mr-2" />
              <span>Commande passée {timeAgo}</span>
            </div>
          </div>
          <div className="flex flex-col items-end ml-2 sm:ml-3 md:ml-4">
            <div className="flex items-center">
              <div className="hidden sm:flex sm:items-center sm:justify-center sm:h-4 sm:w-4 md:h-5 md:w-5 sm:rounded-full sm:bg-gray-100 dark:bg-vynal-purple-dark/40">
                {statusIcons[order.status]}
              </div>
              <Badge variant="outline" className={`ml-0 sm:ml-1.5 text-[8px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </Badge>
            </div>
            <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold mt-1.5 sm:mt-2 md:mt-2.5 text-vynal-purple-light dark:text-vynal-text-primary">
              {order.service.price.toFixed(2)} €
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border-t border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 flex justify-between gap-1.5 sm:gap-2 md:gap-3 bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-dark/40 dark:to-vynal-purple-dark/30">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 text-vynal-accent-primary hover:text-vynal-accent-primary/90 hover:bg-vynal-accent-primary/10 dark:text-vynal-accent-primary dark:hover:text-vynal-accent-primary/90 rounded-lg font-medium"
        >
          <Link href={order.is_client_view ? `/client-dashboard/orders/${order.id}` : `/dashboard/orders/${order.id}`}>
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
            <span className="inline-block">Détails</span>
          </Link>
        </Button>
        
        {order.status === "delivered" && order.is_client_view && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 bg-emerald-50 border-emerald-400 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-200 font-medium rounded-lg"
            asChild
          >
            <Link href={`/client-dashboard/orders/${order.id}`}>
              <FileCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
              <span className="inline-block">Accepter</span>
            </Link>
          </Button>
        )}
        
        {order.status === "delivered" && order.is_client_view && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 bg-amber-50 border-amber-400 text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:border-amber-500 dark:text-amber-300 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:hover:text-amber-200 font-medium rounded-lg"
            asChild
          >
            <Link href={`/client-dashboard/orders/${order.id}`}>
              <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
              <span className="inline-block">Demander révision</span>
            </Link>
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 text-vynal-purple-secondary hover:text-vynal-accent-secondary hover:bg-vynal-accent-secondary/10 dark:text-vynal-text-secondary dark:hover:text-vynal-accent-secondary rounded-lg font-medium"
        >
          <Link href={order.is_client_view ? `/client-dashboard/messages?orderId=${order.id}` : `/dashboard/messages?orderId=${order.id}`}>
            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
            <span className="inline-block">Message</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 