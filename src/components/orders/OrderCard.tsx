"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, FileCheck, RefreshCw } from "lucide-react";
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
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    completed: "bg-green-100 text-green-800 hover:bg-green-200",
    delivered: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
    revision_requested: "bg-vynal-purple-100 text-vynal-purple-800 hover:bg-vynal-purple-200",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
  };
  
  const statusLabels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    delivered: "Livrée",
    revision_requested: "Révision demandée",
    cancelled: "Annulée",
  };

  const createdDate = new Date(order.created_at);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: fr });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium line-clamp-1">{order.service.title}</h3>
            <p className="text-sm text-slate-500">
              {order.is_client_view ? `Freelance: ${order.freelance.full_name || order.freelance.username}` : `Client: ${order.client.full_name || order.client.username}`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Commande passée {timeAgo}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant="outline" className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
            <span className="text-sm font-medium mt-1">
              {order.service.price.toFixed(2)} €
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 border-t flex justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/orders/${order.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Link>
        </Button>
        
        {order.status === "delivered" && order.is_client_view && (
          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
            <FileCheck className="h-4 w-4 mr-1" />
            Accepter
          </Button>
        )}
        
        {order.status === "delivered" && order.is_client_view && (
          <Button variant="outline" size="sm" className="text-vynal-purple-600 border-vynal-purple-200 hover:bg-vynal-purple-50">
            <RefreshCw className="h-4 w-4 mr-1" />
            Demander révision
          </Button>
        )}
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/messages?orderId=${order.id}`}>
            <MessageSquare className="h-4 w-4 mr-1" />
            Message
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 