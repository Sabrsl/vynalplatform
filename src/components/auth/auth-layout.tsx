import { memo, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';

// Interface pour les props du composant
interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
}

// Composant de header mémorisé pour éviter les rendus inutiles
const AuthHeader = memo(({ title }: { title?: string }) => (
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
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
          {title || "Vynal Platform"}
        </h2>
      </Link>
    </div>
  </div>
));

AuthHeader.displayName = 'AuthHeader';

/**
 * Composant de mise en page réutilisable pour les pages d'authentification
 * Optimisé pour réduire les rendus et améliorer les performances
 */
const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  // Mémoriser les props pour éviter les recalculs inutiles
  const headerTitle = useMemo(() => title, [title]);
  
  return (
    <PageLayout 
      fullGradient={true} 
      withPadding={true}
      wrapperClassName="min-h-screen flex flex-col justify-center"
    >
      <AuthHeader title={headerTitle} />
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {children}
      </div>
    </PageLayout>
  );
};

export default memo(AuthLayout); 