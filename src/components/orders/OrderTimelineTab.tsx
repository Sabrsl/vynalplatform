"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Order } from "@/types/orders";

interface OrderTimelineTabProps {
  order: Order;
}

export function OrderTimelineTab({ order }: OrderTimelineTabProps) {
  return (
    <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Cahier des charges */}
      <div>
        <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">Cahier des charges</h3>
        <div className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary p-3 sm:p-4 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10">
          {order.requirements || "Aucun cahier des charges spécifié."}
        </div>
      </div>
      
      {/* Chronologie */}
      <div>
        <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2 sm:mb-3">Chronologie</h3>
        <div className="relative pl-5 sm:pl-6 border-l border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/30">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-accent-primary"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commande créée</p>
            <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
              {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          
          {order.status !== "pending" && order.status !== "cancelled" && (
            <div className="relative">
              <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-accent-secondary/20 dark:bg-vynal-accent-secondary/30">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-accent-secondary"></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Projet en cours</p>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                {format(new Date(new Date(order.created_at).getTime() + 1 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}
          
          {order.status === "cancelled" && (
            <div className="relative">
              <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-red-500/20 dark:bg-red-500/30">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500"></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commande annulée</p>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}
          
          {order.status === "in_dispute" && (
            <div className="relative">
              <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-amber-500/20 dark:bg-amber-500/30">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500"></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Litige ouvert</p>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}
          
          {(order.status === "delivered" || order.status === "revision_requested" || order.status === "completed") ? (
            <div className="relative">
              <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/30">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-accent-primary"></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Livraison</p>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                {order.delivery ? format(new Date(order.delivery.delivered_at), 'dd MMMM yyyy', { locale: fr }) : "N/A"}
              </p>
            </div>
          ) : null}
          
          {order.status === "revision_requested" && (
            <div className="relative">
              <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/30">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-vynal-purple-secondary"></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Révision demandée</p>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}
          
          {order.status === "completed" && (
            <div className="relative">
              <div className="absolute -left-[20px] sm:-left-[25px] p-0.5 sm:p-1 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500"></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Commande terminée</p>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Instructions de livraison */}
      {order.delivery && (
        <div>
          <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">Message de livraison</h3>
          <div className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary p-3 sm:p-4 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10">
            {order.delivery.message}
          </div>
        </div>
      )}
    </div>
  );
} 