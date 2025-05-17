"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { BentoGridThirdDemo } from "@/components/ui/BentoGridThirdDemo";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition-all duration-200 shadow-md p-4 bg-white dark:bg-slate-900/30 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-700/30 hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 justify-between flex flex-col space-y-4 font-poppins",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition-all duration-200">
        {icon}
        <div className="font-poppins font-medium text-slate-900 dark:text-vynal-text-primary mb-2 mt-2 group-hover/bento:text-vynal-accent-primary dark:group-hover/bento:text-vynal-accent-secondary transition-colors duration-200">
          {title}
        </div>
        <div className="font-poppins font-normal text-slate-700 dark:text-vynal-text-secondary text-[11px] group-hover/bento:text-slate-900 dark:group-hover/bento:text-vynal-text-primary transition-colors duration-200">
          {description}
        </div>
      </div>
    </div>
  );
};