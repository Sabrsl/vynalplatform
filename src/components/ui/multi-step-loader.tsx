"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-5 h-5 sm:w-6 sm:h-6", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-5 h-5 sm:w-6 sm:h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex relative justify-start max-w-xl mx-auto flex-col">
      <div className="h-[320px] flex flex-col relative overflow-hidden">
        <motion.div 
          className="flex flex-col"
          animate={{ y: -value * 50 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {loadingStates.map((loadingState, index) => {
            const isActive = index === value;
            const isPast = index < value;
            
            return (
              <div 
                key={index} 
                className={cn(
                  "text-left flex gap-3 py-3 items-center",
                  isActive ? "opacity-100" : "opacity-50"
                )}
              >
                <div>
                  {isPast || isActive ? (
                    <CheckFilled
                      className={cn(
                        "text-black dark:text-white",
                        isActive && "text-vynal-accent-primary dark:text-vynal-accent-primary"
                      )}
                    />
                  ) : (
                    <CheckIcon className="text-black dark:text-white" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-black dark:text-white text-[10px] sm:text-xs md:text-sm font-medium font-poppins",
                    isActive && "text-vynal-accent-primary dark:text-vynal-accent-primary"
                  )}
                >
                  {loadingState.text}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  totalDuration,
  showProgress = true,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  onClose?: () => void;
  totalDuration?: number;
  showProgress?: boolean;
}) => {
  const [currentState, setCurrentState] = useState(0);
  const [progress, setProgress] = useState(0);

  // Gérer l'avancement des étapes
  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      setProgress(0);
      return;
    }

    // Calculer le temps entre chaque étape
    const stepsInterval = Math.min(
      duration,
      totalDuration ? totalDuration / loadingStates.length : duration
    );
    
    const timeout = setTimeout(() => {
      if (currentState < loadingStates.length - 1) {
        setCurrentState(currentState + 1);
      }
    }, stepsInterval);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loadingStates.length, duration, totalDuration]);

  // Gérer la barre de progression
  useEffect(() => {
    if (!loading || !showProgress) return;
    
    const totalTime = totalDuration || duration * loadingStates.length;
    const interval = 30; // Mettre à jour toutes les 30ms
    const step = (interval / totalTime) * 100;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + step;
        return next > 100 ? 100 : next;
      });
    }, interval);
    
    return () => clearInterval(progressInterval);
  }, [loading, duration, loadingStates.length, totalDuration, showProgress]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md font-poppins"
        >
          {/* Barre de progression */}
          {showProgress && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-800">
              <motion.div 
                className="h-full bg-vynal-accent-primary" 
                style={{ width: `${progress}%` }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          )}
          
          <div className="w-full max-w-md mx-auto bg-white dark:bg-black rounded-xl p-6 relative">
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 