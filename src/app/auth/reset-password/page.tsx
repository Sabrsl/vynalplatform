"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Vérifier si on a un hash dans l'URL
    const hash = window.location.hash;
    // Vérifier si on a un token dans les paramètres d'URL (cas classique)
    const token = searchParams?.get('token') || searchParams?.get('type');
    
    console.log("Paramètres d'URL:", {
      hash: hash,
      token: token,
      searchParams: Object.fromEntries(searchParams?.entries() || [])
    });
    
    if (hash && hash.includes("access_token")) {
      // Cas où les tokens sont dans le hash
      const params = new URLSearchParams(hash.replace("#", ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }: { error: any }) => {
            if (error) {
              console.error("Erreur setSession Supabase :", error.message);
              setError("Lien invalide ou expiré.");
              return;
            }

            // Supabase doit maintenant avoir une session active
            supabase.auth.getSession().then(({ data }: { data: any }) => {
              if (!data.session) {
                setError("Session invalide ou expirée.");
              } else {
                setIsReady(true);
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            });
          });
      } else {
        setError("Lien incomplet.");
      }
    } else if (token) {
      // Cas où le token est directement dans l'URL
      // Utiliser ce token pour définir une session
      (async () => {
        try {
          // Vérifier que le token est valide
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (error) {
            console.error("Erreur de vérification du token:", error.message);
            setError("Lien invalide ou expiré.");
            return;
          }
          
          setIsReady(true);
        } catch (err) {
          console.error("Erreur lors de la vérification du token:", err);
          setError("Une erreur est survenue lors de la vérification du lien.");
        }
      })();
    } else {
      // Tenter de récupérer la session active
      supabase.auth.getSession().then(({ data, error }: { data: any, error: any }) => {
        if (error || !data.session) {
          setError("Aucun token fourni. Veuillez utiliser le lien envoyé par email.");
        } else {
          setIsReady(true);
        }
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setLoading(true);
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }
    
    try {
      const { success, error } = await updatePassword(password);
      
      if (success) {
        setSuccess(true);
        await supabase.auth.signOut();
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError((error as Error).message || 'Une erreur est survenue');
      }
    } catch (error) {
      setError((error as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

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
            Réinitialisation du mot de passe
          </h2>
          
          {!isReady && !error && (
            <p className="text-center mt-10">Chargement...</p>
          )}

          {error && (
            <div className="text-center mt-10 text-red-600">
              <p>{error}</p>
              <Link href="/auth/login" className="underline text-blue-600 mt-4 inline-block">Retour à la connexion</Link>
            </div>
          )}
          
          {isReady && !error && (
            success ? (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Nouveau mot de passe
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center"
                  >
                    {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
                  </Button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
} 