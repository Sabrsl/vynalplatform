"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Package, 
  AlertCircle, 
  MessageSquare,
  Settings
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/unauthorized');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-4">
          <h2 className="text-xl font-bold text-primary">Administration</h2>
        </div>
        <Separator />
        <nav className="p-2">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/admin" 
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Tableau de bord</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/users" 
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Utilisateurs</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/validations" 
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <CheckSquare className="h-5 w-5" />
                <span>Validations</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/services" 
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>Services</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/alerts" 
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <AlertCircle className="h-5 w-5" />
                <span>Alertes système</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/messages" 
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Messagerie</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/settings" 
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Paramètres</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 bg-background">
        {children}
      </div>
    </div>
  );
} 