"use client";

import { Check } from "lucide-react";
import Image from "next/image";

interface PaymentMethodCardProps {
  id: string;
  name: string;
  description: string;
  logo: string;
  selected: boolean;
  onSelect: (id: string) => void;
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
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
          : "border-slate-200 hover:border-slate-300"
      }`}
      onClick={() => onSelect(id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src={logo}
              alt={name}
              fill
              className="object-contain"
            />
          </div>
          
          <div>
            <h3 className="font-medium text-sm">{name}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        
        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
          selected ? "bg-indigo-500 text-white" : "border border-slate-300"
        }`}>
          {selected && <Check className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
} 