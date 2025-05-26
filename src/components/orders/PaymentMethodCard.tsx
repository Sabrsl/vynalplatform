"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { PaymentMethodType } from "@/lib/constants/payment";

interface PaymentMethodCardProps {
  id: PaymentMethodType;
  name: string;
  description: string;
  logo: string;
  selected: boolean;
  onSelect: (id: PaymentMethodType) => void;
}

export function PaymentMethodCard({
  id,
  name,
  description,
  logo,
  selected,
  onSelect,
}: PaymentMethodCardProps) {
  return (
    <div
      onClick={() => onSelect(id)}
      className={`cursor-pointer rounded-lg border transition-all ${
        selected
          ? "bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10 border-vynal-accent-primary/40 dark:border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/25 dark:hover:bg-vynal-accent-primary/20 hover:border-vynal-accent-primary/50 dark:hover:border-vynal-accent-primary/40"
          : "bg-white/70 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white/60 dark:bg-slate-800/40">
          <Image
            src={logo}
            alt={name}
            width={40}
            height={40}
            className="object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={`font-medium truncate ${
                selected
                  ? "text-vynal-accent-primary dark:text-vynal-accent-primary"
                  : "text-slate-800 dark:text-vynal-text-primary"
              }`}
            >
              {name}
            </h3>
            {selected && (
              <CheckCircle2 className="h-5 w-5 text-vynal-accent-primary dark:text-vynal-accent-primary" />
            )}
          </div>
          <p
            className={`text-xs line-clamp-2 ${
              selected
                ? "text-vynal-accent-primary/90 dark:text-vynal-accent-primary/80"
                : "text-slate-700 dark:text-vynal-text-secondary"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
