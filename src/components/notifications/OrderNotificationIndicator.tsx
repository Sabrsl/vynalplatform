"use client";

import React, { useState, useRef, useEffect } from "react";
import { useOrderNotifications } from "./OrderNotificationProvider";
import { Bell, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function OrderNotificationIndicator() {
  const { unreadCount, lastNotifications, markAllAsRead } = useOrderNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Gestion de la fermeture au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fonction pour basculer l'état du menu
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (unreadCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-[1.2rem] w-[1.2rem] text-vynal-purple-secondary dark:text-vynal-text-secondary" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="icon" 
        className="relative" 
        onClick={toggleMenu}
      >
        <Bell className="h-[1.2rem] w-[1.2rem] text-vynal-purple-secondary dark:text-vynal-text-secondary" />
        <Badge 
          className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 h-auto min-h-0 min-w-0 rounded-full bg-vynal-accent-primary text-[10px]"
        >
          {unreadCount}
        </Badge>
      </Button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 mt-2 w-80 z-50 rounded-md border border-vynal-purple-secondary/20 bg-white p-1 text-vynal-purple-dark shadow-md dark:border-vynal-purple-secondary/20 dark:bg-vynal-purple-dark dark:text-vynal-text-primary"
        >
          <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold">
            <span>Nouvelles commandes</span>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => {
                  markAllAsRead();
                  setTimeout(() => setIsOpen(false), 300);
                }}
              >
                Tout accepter
              </Button>
            )}
          </div>
          <div className="-mx-1 my-1 h-px bg-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/20"></div>
          
          {lastNotifications.length === 0 ? (
            <div className="py-2 px-2 text-sm text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 text-center">
              Aucune nouvelle commande
            </div>
          ) : (
            <>
              {lastNotifications.map((notification) => {
                const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true,
                  locale: fr
                });
                
                return (
                  <Link 
                    key={notification.id}
                    href={`/dashboard/orders/${notification.id}`} 
                    className="relative flex select-none rounded-sm px-3 py-2.5 text-sm outline-none transition-colors hover:bg-vynal-purple-secondary/5 focus:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/10 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center w-full">
                      <Package className="h-4 w-4 mr-2 text-vynal-accent-primary" />
                      <span className="font-medium text-sm text-vynal-purple-light dark:text-vynal-text-primary">
                        Nouvelle commande
                      </span>
                      <span className="ml-auto text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70">
                        {timeAgo}
                      </span>
                    </div>
                  </Link>
                );
              })}
              
              <div className="-mx-1 my-1 h-px bg-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/20"></div>
              <Link 
                href="/dashboard/orders?tab=pending" 
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-vynal-purple-secondary/10 focus:text-vynal-purple-dark data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-vynal-accent-primary/20 dark:focus:text-vynal-text-primary text-xs text-center justify-center cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Voir toutes les commandes en attente
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
} 