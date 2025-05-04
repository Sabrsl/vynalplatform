"use client";

import { PaymentsContent } from "@/components/payments/PaymentsContent";

export function PaymentsPageClient() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg md:text-xl font-semibold text-vynal-purple-light dark:text-vynal-text-primary">Mes paiements</h1>
      <PaymentsContent />
    </div>
  );
} 