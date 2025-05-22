"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, FileCheck, RefreshCw, Clock, CheckCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import React from 'react';
import { formatDate, formatPrice } from '@/lib/utils';
import { Order } from '@/hooks/useOrders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

interface OrderCardProps {
  order: Order;
  className?: string;
  isFreelance?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  className = '', 
  isFreelance = false 
}) => {
  const statusColors = {
    pending: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:hover:border-red-500/40",
    in_progress: "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/15 hover:border-vynal-accent-primary/30 dark:bg-vynal-accent-primary/10 dark:border-vynal-accent-primary/20 dark:hover:bg-vynal-accent-primary/20 dark:hover:border-vynal-accent-primary/40",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500/40",
    delivered: "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/15 hover:border-vynal-accent-primary/30 dark:bg-vynal-accent-primary/10 dark:border-vynal-accent-primary/20 dark:hover:bg-vynal-accent-primary/20 dark:hover:border-vynal-accent-primary/40",
    revision_requested: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:hover:border-red-500/40",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:hover:border-red-500/40",
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

  // Vérifier si c'est une commande de test (ID commençant par "test_")
  const isTestOrder = order.id.startsWith('test_');

  return (
    <Card className={`border border-slate-200 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-200 bg-white/30 dark:bg-slate-900/30 overflow-hidden rounded-lg relative backdrop-blur-sm ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-vynal-accent-primary/5 to-vynal-accent-secondary/5 opacity-30 dark:opacity-20 pointer-events-none"></div>
      <div className="w-full h-1.5 bg-slate-100/30 dark:bg-slate-800/30">
        <div 
          className={`h-full bg-gradient-to-r ${gradientColors[order.status]} transition-all duration-500 ease-out`}
          style={{ width: `${statusProgress[order.status]}%` }}
        ></div>
      </div>
      <CardContent className="p-3 sm:p-4 md:p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-800 dark:text-vynal-text-primary text-[10px] sm:text-xs md:text-sm line-clamp-1 group-hover:text-vynal-accent-primary transition-colors">
              {order.service.title}
              {isTestOrder && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100/30 text-slate-800 dark:bg-slate-800/30 dark:text-slate-200">
                  TEST
                </span>
              )}
            </h3>
            <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-600 dark:text-vynal-text-secondary mt-1 sm:mt-1.5">
              {isFreelance ? 
                `Client: ${order.client.full_name || order.client.username}` : 
                `Freelance: ${order.freelance.full_name || order.freelance.username}`}
            </p>
            <div className="flex items-center mt-1.5 sm:mt-2 md:mt-3 text-[9px] sm:text-[10px] md:text-xs text-slate-600 dark:text-vynal-text-secondary/60">
              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 mr-1 sm:mr-1.5 md:mr-2" />
              <span>Commande passée {timeAgo}</span>
            </div>
          </div>
          <div className="flex flex-col items-end ml-2 sm:ml-3 md:ml-4">
            <div className="flex items-center">
              <div className="hidden sm:flex sm:items-center sm:justify-center sm:h-4 sm:w-4 md:h-5 md:w-5 sm:rounded-full sm:bg-slate-100/30 dark:bg-slate-800/30">
                {statusIcons[order.status]}
              </div>
              <Badge variant="outline" className={`ml-0 sm:ml-1.5 text-[8px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </Badge>
            </div>
            <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold mt-1.5 sm:mt-2 md:mt-2.5 text-slate-700 dark:text-vynal-text-primary">
              <CurrencyDisplay amount={order.total_amount ?? order.service.price} />
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border-t border-slate-200/10 dark:border-slate-700/20 flex justify-between gap-1.5 sm:gap-2 md:gap-3 bg-white/25 dark:bg-slate-900/20">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 text-slate-700 hover:text-vynal-accent-primary hover:bg-slate-100/30 dark:text-vynal-text-primary dark:hover:text-vynal-accent-primary dark:hover:bg-slate-800/30 rounded-lg font-medium"
        >
          <Link href={`${FREELANCE_ROUTES.ORDERS}/${order.id}`}>
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
            <span className="inline-block">Détails</span>
          </Link>
        </Button>
        
        {order.status === "delivered" && isFreelance && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/15 hover:border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500/40 font-medium rounded-lg"
            asChild
          >
            <Link href={`${CLIENT_ROUTES.ORDERS}/${order.id}`}>
              <FileCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
              <span className="inline-block">Accepter</span>
            </Link>
          </Button>
        )}
        
        {order.status === "delivered" && isFreelance && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/15 hover:border-red-500/30 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:border-red-500/40 font-medium rounded-lg"
            asChild
          >
            <Link href={`${CLIENT_ROUTES.ORDERS}/${order.id}`}>
              <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
              <span className="inline-block">Demander révision</span>
            </Link>
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="text-[8px] sm:text-[10px] md:text-xs h-7 sm:h-8 md:h-9 text-slate-600 hover:text-vynal-accent-primary hover:bg-slate-100/30 dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary dark:hover:bg-slate-800/30 rounded-lg font-medium"
        >
          <Link href={`${FREELANCE_ROUTES.MESSAGES}?orderId=${order.id}`}>
            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
            <span className="inline-block">Message</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 