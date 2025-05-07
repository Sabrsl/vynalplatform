"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { useOrderNotifications } from "./OrderNotificationProvider";
import { Bell, Package, CheckCircle2, MailOpen, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from 'next/navigation';
import { useNotificationStore } from "@/lib/stores/useNotificationStore";
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";

interface Notification {
  id: string;
  type: 'message' | 'order';
  content: string;
  link?: string;
  metadata?: {
    conversation_id?: string;
    sender_name?: string;
  };
  created_at: string;
}

interface PendingOrderNotification {
  id: string;
  service?: {
    title: string;
  };
  client?: {
    full_name: string | null;
    username: string;
  };
  created_at: string;
}

/**
 * Composant optimisé pour afficher les notifications de commandes
 * et permettre leur gestion rapide
 */
export function OrderNotificationIndicator() {
  const { unreadCount, lastNotifications, markAllAsRead, isLoading } = useOrderNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Auto-fermeture du menu lors de la navigation entre pages
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Gestion optimisée de la fermeture au clic à l'extérieur
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    // Utiliser la capture pour intercepter les clics avant qu'ils n'atteignent d'autres éléments
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, { capture: true });
      // Gérer également la touche Échap
      document.addEventListener("keydown", handleKeyDown);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Fonction mémorisée pour basculer l'état du menu
  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  // Fonction mémorisée pour marquer toutes les notifications comme lues
  const handleMarkAllAsRead = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await markAllAsRead();
      // Fermer le menu après un court délai pour permettre l'animation
      setTimeout(() => setIsOpen(false), 300);
    } finally {
      setIsProcessing(false);
    }
  }, [markAllAsRead, isProcessing]);

  // Gérer le clic sur une notification
  const handleNotificationClick = useCallback((notification: PendingOrderNotification) => {
    // Marquer la notification comme lue
    useNotificationStore.getState().markAsRead(notification.id);
    setIsOpen(false);
  }, []);

  // Animations pour le menu
  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -5 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -5,
      transition: {
        duration: 0.15
      }
    }
  };

  // Si en chargement, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Loader2 className="h-[1.2rem] w-[1.2rem] text-vynal-purple-secondary dark:text-vynal-text-secondary animate-spin" />
      </Button>
    );
  }

  // Si aucune notification, afficher une cloche simple
  if (unreadCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-[1.2rem] w-[1.2rem] text-vynal-purple-secondary dark:text-vynal-text-secondary" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <div>
        <Button 
          ref={buttonRef}
          variant="ghost" 
          size="icon" 
          className="relative" 
          onClick={toggleMenu}
          aria-label={`${unreadCount} notifications non lues`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Bell className="h-[1.2rem] w-[1.2rem] text-vynal-purple-secondary dark:text-vynal-text-secondary" />
          <div>
            <Badge 
              className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 h-auto min-h-0 min-w-0 rounded-full bg-vynal-accent-primary text-[10px]"
            >
              {unreadCount}
            </Badge>
          </div>
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            ref={menuRef}
            className="absolute right-0 mt-2 w-80 z-50 rounded-lg border border-vynal-purple-secondary/20 bg-white p-1 text-vynal-purple-dark shadow-lg dark:border-vynal-purple-secondary/20 dark:bg-vynal-purple-dark dark:text-vynal-text-primary backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            role="menu"
            aria-orientation="vertical"
          >
            <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold">
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-vynal-accent-primary" strokeWidth={2.5} />
                <span>Notifications</span>
              </span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-[11px] bg-vynal-accent-primary/5 hover:bg-vynal-accent-primary/10 text-vynal-accent-primary flex items-center gap-1.5 rounded-full"
                  onClick={handleMarkAllAsRead}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
                      <span className="truncate">Traitement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                      <span className="truncate">Accepter tout</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="-mx-1 my-1 h-px bg-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/20"></div>
            
            {lastNotifications.length === 0 ? (
              <div className="py-6 px-3 text-sm text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 text-center flex flex-col items-center">
                <MailOpen className="w-8 h-8 mb-2 text-vynal-purple-secondary/50 dark:text-vynal-text-secondary/50" strokeWidth={1.5} />
                <p>Aucune notification</p>
              </div>
            ) : (
              <>
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                  {lastNotifications.map((notification, index) => {
                    const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
                      addSuffix: true,
                      locale: fr
                    });
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.08)" }}
                      >
                        <Link 
                          href={`${FREELANCE_ROUTES.ORDERS}/${notification.id}`}
                          className="relative flex select-none rounded-md px-3 py-2.5 text-sm outline-none transition-colors focus:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/10 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <div className="flex items-center w-full">
                            <Package className="h-4 w-4 mr-2 text-vynal-accent-primary flex-shrink-0" strokeWidth={2} />
                            <div className="flex flex-col flex-grow min-w-0">
                              <span className="font-medium text-sm text-vynal-purple-light dark:text-vynal-text-primary truncate">
                                {notification.service?.title || 'Nouvelle commande'}
                              </span>
                              <span className="text-xs text-vynal-purple-secondary/80 dark:text-vynal-text-secondary/80 truncate">
                                {notification.client?.full_name || notification.client?.username || 'Client'}
                              </span>
                            </div>
                            <span className="ml-auto text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 flex-shrink-0">
                              {timeAgo}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(OrderNotificationIndicator);