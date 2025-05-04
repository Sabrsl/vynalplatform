import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, ArrowRight, FileText, Upload, AlertTriangle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { motion, AnimatePresence } from "framer-motion";
import { DisputeCreateForm } from '@/components/disputes/DisputeCreateForm';

interface DisputeButtonProps {
  orderId: string;
  clientId: string;
  freelanceId: string;
  disabled?: boolean;
}

export function DisputeButton({ 
  orderId, 
  clientId, 
  freelanceId, 
  disabled = false
}: DisputeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSuccess = () => {
    setIsOpen(false);
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-950/30"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        <AlertTriangle className="mr-1 h-4 w-4" />
        Signaler un problème
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="max-w-md w-full bg-white dark:bg-vynal-purple-darkest rounded-lg shadow-lg"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div 
                className="p-4 border-b border-vynal-purple-secondary/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.h2 
                  className="text-lg font-semibold text-vynal-text-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Ouvrir un litige
                </motion.h2>
                <motion.p 
                  className="text-sm text-vynal-text-secondary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Signalez un problème concernant cette commande. Notre équipe l'examinera afin de trouver une solution.
                </motion.p>
              </motion.div>
              
              <div className="p-4">
                <DisputeCreateForm 
                  clientId={clientId} 
                  freelanceId={freelanceId} 
                  orderId={orderId} 
                  onSuccess={handleSuccess}
                />
              </div>

              <motion.div 
                className="flex justify-between sm:justify-between px-4 py-3 bg-vynal-purple-secondary/10 border-t border-vynal-purple-secondary/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                
                <Button 
                  className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
                >
                  Envoyer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 