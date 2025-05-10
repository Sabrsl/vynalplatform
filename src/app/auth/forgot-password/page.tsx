"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/components/auth/auth-layout';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse e-mail');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const { success, error } = await resetPassword(email);
      
      if (success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "Une erreur est survenue lors de l'envoi du lien de réinitialisation.");
      }
    } catch (error) {
      setError((error as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Vynal Platform">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/30 dark:bg-slate-900/30 rounded-xl shadow-sm shadow-slate-200/50 dark:shadow-vynal-accent-secondary/20 border border-slate-200 dark:border-slate-700/30 transition-all duration-200">
        <div className="flex justify-start">
          <Link
            href="/auth/login"
            className="text-sm text-slate-800 dark:text-vynal-text-primary hover:text-vynal-accent-primary dark:hover:text-vynal-accent-secondary transition-colors flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la connexion
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-vynal-text-primary">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-vynal-text-secondary">
            Entrez votre adresse e-mail pour réinitialiser votre mot de passe.
          </p>
        </div>
        
        {success ? (
          <div className="space-y-6">
            <div className="bg-emerald-500/10 border-l-4 border-emerald-500/20 p-4 mb-6">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div className="ml-3">
                  <p className="text-sm text-slate-800 dark:text-vynal-text-primary">
                    Si un compte existe avec cette adresse e-mail, vous recevrez un lien pour réinitialiser votre mot de passe.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-vynal-text-secondary text-center">
              Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
            </p>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full flex justify-center bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all"
            >
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-vynal-text-secondary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-2 bg-white/40 dark:bg-slate-800/40 border border-slate-400 dark:border-slate-700/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-xs text-slate-800 dark:text-vynal-text-primary placeholder:text-xs text-slate-400 dark:placeholder:text-vynal-text-secondary/70"
                  placeholder="Entrez votre adresse email"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-vynal-status-error/20 border border-vynal-status-error/30 rounded-md flex items-start text-vynal-status-error text-sm" role="alert">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
} 