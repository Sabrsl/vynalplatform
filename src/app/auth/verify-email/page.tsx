"use client";

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = useMemo(() =>
    searchParams?.get('email') || '',
    [searchParams]
  );
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Link href="/auth/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la connexion
          </Link>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
            Vérifiez votre email
          </h2>
          
          <div className="text-center space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Un email de confirmation a été envoyé à <strong>{email}</strong>.
                    <br />
                    Veuillez cliquer sur le lien dans l'email pour activer votre compte.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier spam.
            </p>
            
            <Button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 