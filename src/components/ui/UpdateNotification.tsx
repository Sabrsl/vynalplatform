import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateNotificationProps {
  show: boolean;
  onUpdate: () => void;
  version?: string | null;
  className?: string;
}

export function UpdateNotification({ 
  show, 
  onUpdate, 
  version = null,
  className
}: UpdateNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed top-4 right-4 z-50 max-w-xs",
            className
          )}
        >
          <div 
            onClick={onUpdate}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-vynal-purple-dark border border-indigo-100 dark:border-vynal-purple-secondary/30 shadow-md rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex-shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-indigo-500 dark:text-indigo-400"
              >
                <RefreshCw size={18} />
              </motion.div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-vynal-accent-primary dark:text-vynal-accent-secondary">
                Mise à jour disponible
              </h3>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary mt-0.5">
                Cliquez pour recharger et appliquer les nouveautés
              </p>
              {version && (
                <span className="inline-block mt-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">
                  v{version || '0.1.163'}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 