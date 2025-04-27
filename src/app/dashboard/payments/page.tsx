import { Suspense } from "react";
import { Metadata } from "next";
import { PaymentsPageClient } from "./PaymentsPageClient";
import { PaymentsPageSkeleton } from "@/components/skeletons/PaymentsPageSkeleton";

export const metadata: Metadata = {
  title: "Mes paiements | Vynal",
  description: "Gérez vos paiements et retraits sur la plateforme Vynal",
};

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PaymentsPageSkeleton />}>
      <PaymentsPageClient />
    </Suspense>
  );
} 