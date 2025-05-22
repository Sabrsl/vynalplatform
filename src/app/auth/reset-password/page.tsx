"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { FREELANCE_ROUTES, CLIENT_ROUTES, AUTH_ROUTES } from '@/config/routes';
import AuthLayout from '@/components/auth/auth-layout';

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Vérifier si on a un hash dans l'URL
    const hash = window.location.hash;
    // Vérifier tous les paramètres possibles pour le token
    const token = searchParams?.get('token') || 
                 searchParams?.get('type') || 
                 searchParams?.get('access_token');
    
    console.log("Paramètres d'URL:", {
      hash: hash,
      token: token,
      allParams: Object.fromEntries(searchParams?.entries() || []),
      fullUrl: typeof window !== 'undefined' ? window.location.href : 'unavailable'
    });
    
    if (hash && hash.includes("access_token")) {
      // Cas où les tokens sont dans le hash
      const params = new URLSearchParams(hash.replace("#", ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        console.log("Tokens trouvés dans le hash, tentative de connexion...");
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
                console.log("Session établie avec succès via les tokens du hash");
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
      console.log("Token trouvé dans les paramètres:", token);
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
          
          console.log("Vérification OTP réussie");
          setIsReady(true);
        } catch (err) {
          console.error("Erreur lors de la vérification du token:", err);
          setError("Une erreur est survenue lors de la vérification du lien.");
        }
      })();
    } else {
      // Tenter de récupérer la session active
      console.log("Aucun token trouvé, vérification d'une session active...");
      supabase.auth.getSession().then(({ data, error }: { data: any, error: any }) => {
        if (error || !data.session) {
          console.error("Aucune session trouvée:", error);
          setError("Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien de réinitialisation.");
        } else {
          console.log("Session active trouvée:", data.session.user.id);
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
        // Récupérer l'information de l'utilisateur avant déconnexion
        const { data: sessionData } = await supabase.auth.getSession();
        const detectedUserRole = sessionData?.session?.user?.user_metadata?.role;
        
        console.log("Rôle utilisateur détecté:", detectedUserRole);
        
        // Stocker le rôle pour l'affichage du message
        setUserRole(detectedUserRole);
        
        // Indiquer le succès
        setSuccess(true);
        
        // Se déconnecter en utilisant la fonction centralisée
        const { signOut } = await import('@/lib/auth');
        await signOut();
        
        // Rediriger l'utilisateur vers la page appropriée en fonction de son rôle
        setTimeout(() => {
          setRedirecting(true);
          setTimeout(() => {
            if (detectedUserRole === 'admin') {
              router.push('/admin');
            } else if (detectedUserRole === 'freelance') {
              router.push(FREELANCE_ROUTES.DASHBOARD);
            } else if (detectedUserRole === 'client') {
              router.push(CLIENT_ROUTES.DASHBOARD);
            } else {
              // Par défaut, rediriger vers la page de connexion
              router.push(AUTH_ROUTES.LOGIN);
            }
          }, 500); // Petit délai pour que l'animation soit visible
        }, 2500);
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-vynal-text-primary">Réinitialisation du mot de passe</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-vynal-text-secondary">
            Créez un nouveau mot de passe pour votre compte.
          </p>
        </div>
        
        {!isReady && !error && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-vynal-accent-primary" />
            <p className="mt-4 text-sm text-slate-600 dark:text-vynal-text-secondary">Chargement...</p>
          </div>
        )}

        {error && (
          <div className="text-center space-y-4">
            <div className="p-3 bg-vynal-status-error/20 border border-vynal-status-error/30 rounded-md text-vynal-status-error text-sm">
              {error}
            </div>
            <Link 
              href="/auth/login" 
              className="text-vynal-accent-primary hover:text-vynal-accent-secondary transition-colors inline-block"
            >
              Retour à la connexion
            </Link>
          </div>
        )}
        
        {isReady && !error && (
          success ? (
            <div className="bg-emerald-500/10 border-l-4 border-emerald-500/20 p-4 mb-6">
              <div className="flex flex-col items-center">
                <div className="ml-3">
                  <p className="text-sm text-slate-800 dark:text-vynal-text-primary">
                    {userRole === 'admin' && "Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers votre console d'administration..."}
                    {userRole === 'freelance' && "Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers votre tableau de bord freelance..."}
                    {userRole === 'client' && "Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers votre espace client..."}
                    {!userRole && "Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion..."}
                  </p>
                </div>
                {redirecting && (
                  <div className="mt-4">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-500" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 dark:text-vynal-text-secondary" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-3 py-2 bg-white/40 dark:bg-slate-800/40 border border-slate-400 dark:border-slate-700/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-400 dark:placeholder:text-vynal-text-secondary/70"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 dark:text-vynal-text-secondary" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-3 py-2 bg-white/40 dark:bg-slate-800/40 border border-slate-400 dark:border-slate-700/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-400 dark:placeholder:text-vynal-text-secondary/70"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-vynal-status-error/20 border border-vynal-status-error/30 rounded-md flex items-start text-vynal-status-error text-sm" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all"
              >
                {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          )
        )}
      </div>
    </AuthLayout>
  );
} 