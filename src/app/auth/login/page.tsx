"use client";

import { useMemo } from 'react';
import LoginForm from '@/components/auth/login-form';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/auth-layout';

export default function LoginPage() {
  const searchParams = useSearchParams();
  // Mémoriser le chemin de redirection pour éviter les recalculs inutiles
  const redirect = useMemo(() => 
    searchParams.get('redirect') || '/dashboard', 
    [searchParams]
  );
  
  return (
    <AuthLayout title="Connexion">
      <LoginForm redirectPath={redirect} />
    </AuthLayout>
  );
} 