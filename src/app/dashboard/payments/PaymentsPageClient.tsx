"use client";

import { PaymentsContent } from "@/components/payments/PaymentsContent";

export function PaymentsPageClient() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-bold">Mes paiements</h1>
      <PaymentsContent />
    </div>
  );
} 