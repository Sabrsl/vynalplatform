"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

// Import dynamique pour éviter les problèmes au build
const FinancesPageClient = dynamic(() => import("./FinancesPageClient").then(mod => ({ default: mod.FinancesPageClient })), {
  ssr: false,
  loading: () => <div>Chargement...</div>
});

export function ClientLoader() {
  return <FinancesPageClient />;
} 