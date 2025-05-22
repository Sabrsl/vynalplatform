"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash, Loader2, X } from "lucide-react";

interface CacheClearConfirmationDialogProps {
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
  userType?: "client" | "admin" | "freelance";
}

export default function CacheClearConfirmationDialog({
  onConfirm,
  isLoading = false,
  userType = "client"
}: CacheClearConfirmationDialogProps) {
  const [open, setOpen] = useState(false);

  // Messages différents selon le type d'utilisateur
  const getMessages = () => {
    switch (userType) {
      case "admin":
        return {
          title: "Effacer le cache administrateur ?",
          description: "Cette action effacera toutes les données en cache administrateur, ce qui peut temporairement ralentir la navigation dans le tableau de bord administrateur.",
          consequences: [
            "Les services, utilisateurs et statistiques seront rechargés depuis le serveur",
            "Les validations et configurations système seront rechargées",
            "Les performances du tableau de bord administrateur seront temporairement ralenties",
            "Les données utilisateurs et leur cache ne seront pas affectés"
          ]
        };
      case "freelance":
        return {
          title: "Effacer le cache freelance ?",
          description: "Cette action effacera toutes les données en cache de votre compte freelance, ce qui peut temporairement ralentir votre tableau de bord.",
          consequences: [
            "Vos services, statistiques et commandes seront rechargés depuis le serveur",
            "Les prix et conversions de devises seront recalculés",
            "Les performances de votre tableau de bord seront temporairement ralenties",
            "Vos préférences d'affichage seront préservées"
          ]
        };
      default: // client
        return {
          title: "Effacer le cache client ?",
          description: "Cette action effacera toutes les données en cache de votre compte client, ce qui peut temporairement ralentir votre tableau de bord.",
          consequences: [
            "Vos commandes, statistiques et activités seront rechargées depuis le serveur",
            "Les prix et conversions de devises seront recalculés",
            "Les performances de votre tableau de bord seront temporairement ralenties",
            "Vos préférences d'affichage seront préservées"
          ]
        };
    }
  };

  const messages = getMessages();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'effacement du cache:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-[9px] mt-2 border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
        >
          <Trash className="mr-2 h-3 w-3" />
          Effacer le cache
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] p-0">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b dark:border-vynal-purple-secondary/20 flex items-center justify-between">
            <h3 className="text-red-600 dark:text-red-400 flex items-center gap-2 text-sm sm:text-[11px] font-medium">
              <Trash className="h-4 w-4" />
              {messages.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-vynal-purple-secondary dark:text-vynal-text-secondary text-[9px] sm:text-[10px] mb-4">
              {messages.description}
            </p>
            <div className="p-2.5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 rounded-md">
              <h4 className="text-[9px] sm:text-[10px] font-medium text-amber-800 dark:text-amber-300 mb-1.5">Conséquences :</h4>
              <ul className="text-[8px] sm:text-[9px] text-amber-700 dark:text-amber-400/80 space-y-1 list-disc ml-4">
                {messages.consequences.map((consequence, index) => (
                  <li key={index}>{consequence}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="p-4 border-t dark:border-vynal-purple-secondary/20">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-[9px] sm:text-[10px] border-vynal-border dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/10 dark:text-vynal-text-primary"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirm}
                disabled={isLoading}
                className="text-[9px] sm:text-[10px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Effacement...
                  </>
                ) : (
                  "Effacer le cache"
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 