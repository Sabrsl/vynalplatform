"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Settings, FileText, ShoppingBag, MessageSquare, Home } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold">
            NionFar.sn
          </Link>
        </div>
        <div className="p-4">
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Home className="mr-3 h-5 w-5" />
              Tableau de bord
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <User className="mr-3 h-5 w-5" />
              Mon profil
            </Link>
            {user?.user_metadata?.role === "freelance" && (
              <Link
                href="/dashboard/services"
                className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FileText className="mr-3 h-5 w-5" />
                Mes services
              </Link>
            )}
            <Link
              href="/dashboard/orders"
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ShoppingBag className="mr-3 h-5 w-5" />
              {user?.user_metadata?.role === "freelance" 
                ? "Commandes reçues" 
                : "Mes commandes"}
            </Link>
            <Link
              href="/dashboard/messages"
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              Messages
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Settings className="mr-3 h-5 w-5" />
              Paramètres
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm h-16 flex items-center px-6 md:hidden">
          <Link href="/" className="text-xl font-bold">
            NionFar.sn
          </Link>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
} 