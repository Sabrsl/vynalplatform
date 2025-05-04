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
  onSelect
}: PaymentMethodCardProps) {
  return (
    <div
      onClick={() => onSelect(id)}
      className={`cursor-pointer rounded-lg border p-3 transition-all ${
        selected
          ? "bg-vynal-purple-600/10 dark:bg-vynal-purple-400/20 border-vynal-purple-600 dark:border-vynal-purple-400"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-vynal-purple-400 dark:hover:border-vynal-purple-500"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white">
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
            <h3 className={`font-medium truncate ${
              selected 
                ? "text-vynal-purple-700 dark:text-vynal-purple-300" 
                : "text-gray-900 dark:text-gray-200"
            }`}>
              {name}
            </h3>
            {selected && (
              <CheckCircle2 className="h-5 w-5 text-vynal-purple-600 dark:text-vynal-purple-400" />
            )}
          </div>
          <p className={`text-xs line-clamp-2 ${
            selected 
              ? "text-vynal-purple-600/80 dark:text-vynal-purple-300/80" 
              : "text-gray-500 dark:text-gray-400"
          }`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
} 