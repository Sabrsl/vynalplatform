"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const TextRevealCard = ({
  text,
  revealText,
  children,
  className,
}: {
  text: string;
  revealText: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "bg-vynal-purple-dark/80 border border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/10 p-8 md:p-12 rounded-xl w-full max-w-3xl mx-auto",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col space-y-4">
        <div className="text-3xl md:text-5xl font-bold text-center relative overflow-hidden">
          <div
            className={`${
              isHovered ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
            } transform transition-transform duration-500 ease-in-out text-vynal-text-primary`}
          >
            {text}
          </div>
          <div
            className={`${
              isHovered ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
            } transform transition-transform duration-500 ease-in-out absolute inset-0 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent`}
          >
            {revealText}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export const TextRevealCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("text-xl md:text-2xl font-medium text-center text-vynal-text-primary mt-4", className)}>
      {children}
    </div>
  );
};

export const TextRevealCardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("text-base md:text-lg text-center text-vynal-text-secondary mt-4", className)}>
      {children}
    </div>
  );
}; 