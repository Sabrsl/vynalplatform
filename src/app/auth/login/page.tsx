"use client";

import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PageLayout from '@/components/ui/PageLayout';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  return (
    <PageLayout 
      fullGradient={true} 
      withPadding={true}
      wrapperClassName="min-h-screen flex flex-col justify-center"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link 
          href="/" 
          className="flex items-center text-sm text-vynal-text-secondary hover:text-vynal-text-primary transition-colors mb-6 mx-auto w-fit"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour à l'accueil
        </Link>
        
        <div className="text-center">
          <Link href="/">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">Vynal Platform</h2>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm redirectPath={redirect} />
      </div>
    </PageLayout>
  );
} 