"use client";

import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle, XCircle } from "lucide-react";

interface ServiceRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function ServiceRulesModal({ isOpen, onClose, onAccept }: ServiceRulesModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-slate-200 bg-white/30 p-3 sm:p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/30 dark:bg-slate-900/30">
          <Dialog.Title className="text-sm sm:text-base font-semibold text-slate-800 dark:text-vynal-text-primary">
            📝 Règles pour rédiger la description de votre service
          </Dialog.Title>
          
          <Dialog.Description className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">
            Pour garantir la clarté et la qualité des services proposés sur notre plateforme, veuillez respecter les règles suivantes.
          </Dialog.Description>

          <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
            <div className="rounded-lg border border-slate-200/50 bg-white/25 p-2 sm:p-3 dark:border-slate-700/20 dark:bg-slate-900/20">
              <h3 className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                Ce que vous devez inclure :
              </h3>
              <ul className="mt-1 sm:mt-1.5 list-disc pl-3 sm:pl-4 text-[10px] sm:text-xs text-slate-600 space-y-0.5 dark:text-vynal-text-secondary">
                <li>Une introduction claire : Ecrivez ce que vous proposez.</li> 
                <li>Le contenu détaillé du service : Expliquez précisément ce que le client recevra.</li>
                <li>Les conditions de livraison : Délai, format, nombre de révisions incluses.</li>
                <li>Ce qui est exclu : Mentionnez ce qui n'est pas compris dans la prestation.</li>
                <li>Vos outils ou méthodes (si pertinent) : pour rassurer le client sur votre expertise.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200/50 bg-white/25 p-2 sm:p-3 dark:border-slate-700/20 dark:bg-slate-900/20">
              <h3 className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">
                <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
                Ce que vous devez éviter :
              </h3>
              <ul className="mt-1 sm:mt-1.5 list-disc pl-3 sm:pl-4 text-[10px] sm:text-xs text-slate-600 space-y-0.5 dark:text-vynal-text-secondary">
                <li>Les promesses vagues ou non vérifiables (ex : "résultats garantis", "meilleur service").</li>
                <li>Le langage familier, les fautes d'orthographe ou les abréviations de type SMS.</li>
                <li>Les liens externes ou coordonnées personnelles (email, téléphone, réseaux sociaux).</li>
                <li>Les descriptions copiées-collées d'internet ou d'autres freelances.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200/50 bg-amber-50/30 p-2 sm:p-3 dark:border-amber-800/20 dark:bg-amber-900/20">
              <p className="text-[10px] sm:text-xs text-amber-800 dark:text-amber-400">
                📌 Conseil : Une bonne description rassure le client et augmente vos chances de vente. Prenez le temps de la soigner !
              </p>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="h-7 sm:h-8 text-[10px] sm:text-xs text-slate-700 hover:bg-slate-100/30 dark:text-vynal-text-secondary dark:hover:bg-slate-800/30"
            >
              Annuler
            </Button>
            <Button 
              onClick={onAccept} 
              className="h-7 sm:h-8 text-[10px] sm:text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/80 text-white transition-all duration-200 hover:shadow-md"
            >
              Je suis d'accord
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 