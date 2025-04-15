"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Vérifiez votre e-mail</h2>
          </div>
          
          <p className="text-center text-gray-600 mb-6">
            Un e-mail de confirmation a été envoyé à <strong>{email}</strong>. 
            Veuillez cliquer sur le lien dans cet e-mail pour activer votre compte.
          </p>
          
          <div className="text-center mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 text-left">
                    Si vous ne trouvez pas l'e-mail dans votre boîte de réception, 
                    vérifiez également vos dossiers de spam ou courrier indésirable.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <Button
              className="w-full flex items-center justify-center"
              asChild
            >
              <Link href="/auth/login">
                Aller à la page de connexion <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <p className="text-center text-sm text-gray-600">
              Besoin d'aide ? <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-500">Contactez-nous</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 