import { Metadata } from 'next';
import SignupForm from '@/components/auth/signup-form';
import AuthLayout from '@/components/auth/auth-layout';

export const metadata: Metadata = {
  title: 'Inscription | Vynal Platform',
  description: 'Inscrivez-vous sur Vynal Platform en tant que client ou freelance',
};

export default function SignupPage() {
  return (
    <AuthLayout title="Inscription">
      <SignupForm />
    </AuthLayout>
  );
} 