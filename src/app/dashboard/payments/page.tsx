"use client";

import { Suspense } from "react";
import { Metadata } from "next";
import { PaymentsContent } from "@/components/payments/PaymentsContent";
import { PaymentsPageSkeleton } from "@/components/skeletons/PaymentsPageSkeleton";

export const metadata: Metadata = {
  title: "Mes paiements | Vynal",
  description: "Gérez vos paiements et retraits sur la plateforme Vynal",
};

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-bold">Mes paiements</h1>
      <Suspense fallback={<PaymentsPageSkeleton />}>
        <PaymentsContent />
      </Suspense>
    </div>
  );
} 