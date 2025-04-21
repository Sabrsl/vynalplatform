import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retirer des fonds | Vynal Platform",
  description: "Retirez vos revenus depuis votre portefeuille Vynal Platform vers votre compte bancaire ou mobile.",
};

export default function WithdrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 