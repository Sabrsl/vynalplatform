"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  text: string;
  position?: "top" | "right" | "bottom" | "left";
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function InfoTooltip({ 
  text, 
  position = "top", 
  size = "sm",
  className 
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4"
  };

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    let top = 0;
    let left = 0;
    
    switch(position) {
      case "top":
        top = rect.top + scrollTop - 8;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + scrollTop + 8;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "left":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 8;
        break;
      case "right":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 8;
        break;
    }
    
    setTooltipPosition({ top, left });
  }, [position]);

  // Calculer la position uniquement quand isVisible change
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const positionStyles = {
    top: position === "bottom" ? `${tooltipPosition.top}px` : position === "top" ? `${tooltipPosition.top - 40}px` : `${tooltipPosition.top - 16}px`,
    left: position === "right" ? `${tooltipPosition.left}px` : position === "left" ? `${tooltipPosition.left - 160}px` : `${tooltipPosition.left - 80}px`
  };

  const arrowPositionStyles = {
    top: position === "top" ? "100%" : position === "bottom" ? "0" : "50%",
    left: position === "left" ? "100%" : position === "right" ? "0" : "50%",
    transform: 
      position === "top" ? "translate(-50%, -50%)" :
      position === "bottom" ? "translate(-50%, -50%)" :
      position === "left" ? "translate(-50%, -50%)" :
      "translate(-50%, -50%)"
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "text-vynal-accent-primary/70 dark:text-vynal-accent-primary/90 hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary transition-colors", 
          sizeClasses[size]
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-label="Information"
      >
        <Info className="w-full h-full" />
      </button>
      
      {isVisible && typeof window !== 'undefined' && createPortal(
        <div 
          style={positionStyles}
          className="fixed shadow-xl z-[9999] px-3 py-2 text-xs max-w-[160px] font-normal bg-slate-800 dark:bg-slate-900 text-white rounded-md whitespace-normal"
        >
          {text}
          <div 
            style={arrowPositionStyles}
            className="absolute w-2 h-2 bg-slate-800 dark:bg-slate-900 rotate-45"
          />
        </div>,
        document.body
      )}
    </div>
  );
} 