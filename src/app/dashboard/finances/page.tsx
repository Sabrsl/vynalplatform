import { Metadata } from "next";
import { FinancesPageClient } from ".";

export const metadata: Metadata = {
  title: "Mes finances | Vynal",
  description: "Gérez vos finances et transactions sur la plateforme Vynal",
};

// Empêcher la génération statique de cette page
export const dynamic = 'force-dynamic';

export default function FinancesPage() {
  return <FinancesPageClient />;
} 