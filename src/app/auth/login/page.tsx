"use client";

import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link 
          href="/" 
          className="flex items-center text-sm text-gray-600 mb-6 mx-auto w-fit"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour à l'accueil
        </Link>
        
        <div className="text-center">
          <Link href="/">
            <h2 className="text-3xl font-extrabold text-gray-900">Vynal Platform</h2>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm redirectPath={redirect} />
      </div>
    </div>
  );
} 