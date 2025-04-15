"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "./header";
import Footer from "./footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  // Déterminer si le chemin actuel fait partie des routes d'authentification
  const isAuthPage = pathname?.startsWith('/auth/');
  
  // Ne pas afficher le header et le footer sur les pages d'authentification
  if (isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
} 