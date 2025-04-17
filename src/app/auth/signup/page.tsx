import { Metadata } from 'next';
import SignupForm from '@/components/auth/signup-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';

export const metadata: Metadata = {
  title: 'Inscription | Vynal Platform',
  description: 'Inscrivez-vous sur Vynal Platform en tant que client ou freelance',
};

export default function SignupPage() {
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
        <SignupForm />
      </div>
    </PageLayout>
  );
} 