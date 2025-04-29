"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debounce } from "lodash";

// Constants for rate limiting
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const LOGIN_ATTEMPTS_KEY = "login_attempts";
const LOCKOUT_TIME_KEY = "login_lockout_time";

// Validation schema
const loginSchema = z.object({
  email: z.string()
    .email("Veuillez entrer une adresse email valide")
    .min(5, "L'adresse email est trop courte")
    .max(255, "L'adresse email est trop longue"),
  password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(100, "Le mot de passe est trop long"),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectPath?: string;
}

function LoginForm({ redirectPath = "/dashboard" }: LoginFormProps) {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // React Hook Form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    },
    mode: "onBlur" // Validate on blur for better UX
  });

  // Load login attempts and lockout status on mount
  useEffect(() => {
    try {
      const storedAttempts = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
      const storedLockoutTime = localStorage.getItem(LOCKOUT_TIME_KEY);
      
      if (storedAttempts) {
        setLoginAttempts(parseInt(storedAttempts, 10));
      }
      
      if (storedLockoutTime) {
        const lockoutTime = parseInt(storedLockoutTime, 10);
        const now = Date.now();
        
        if (lockoutTime > now) {
          setIsLocked(true);
          setLockoutRemaining(lockoutTime - now);
        } else {
          // Reset if lockout has expired
          localStorage.removeItem(LOCKOUT_TIME_KEY);
          localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      // Graceful degradation if localStorage is not available
    }
  }, []);

  // Lockout timer countdown
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    
    const timerInterval = setInterval(() => {
      setLockoutRemaining(prev => {
        const newValue = prev - 1000;
        if (newValue <= 0) {
          setIsLocked(false);
          try {
            localStorage.removeItem(LOCKOUT_TIME_KEY);
          } catch (error) {
            console.error("Error accessing localStorage:", error);
          }
          return 0;
        }
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [lockoutRemaining]);

  // Format remaining lockout time
  const formattedLockoutTime = useMemo(() => {
    if (lockoutRemaining <= 0) return "";
    
    const minutes = Math.floor(lockoutRemaining / 60000);
    const seconds = Math.floor((lockoutRemaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [lockoutRemaining]);

  // Handle login attempts counter
  const incrementLoginAttempts = useCallback(() => {
    try {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, newAttempts.toString());
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_DURATION;
        setIsLocked(true);
        setLockoutRemaining(LOCKOUT_DURATION);
        localStorage.setItem(LOCKOUT_TIME_KEY, lockoutTime.toString());
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, [loginAttempts]);

  const resetLoginAttempts = useCallback(() => {
    try {
      setLoginAttempts(0);
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_TIME_KEY);
      setIsLocked(false);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  // Create a debounced version of setError to prevent UI flicker on rapid errors
  const debouncedSetError = useMemo(
    () => debounce((message: string | null) => setError(message), 300),
    []
  );

  // Form submission handler
  const onSubmit = useCallback(async (data: LoginFormData) => {
    // Check if account is locked
    if (isLocked) {
      setError(`Trop de tentatives échouées. Réessayez dans ${formattedLockoutTime}.`);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { success, error } = await signIn(
        data.email, 
        data.password, 
        data.rememberMe || false
      );
      
      if (success) {
        // Reset login attempts on successful login
        resetLoginAttempts();
        router.push(redirectPath);
      } else {
        incrementLoginAttempts();
        debouncedSetError(
          typeof error === 'object' && error !== null && 'message' in error
            ? String(error.message)
            : "Identifiants invalides. Veuillez réessayer."
        );
      }
    } catch (err) {
      incrementLoginAttempts();
      debouncedSetError("Une erreur est survenue. Veuillez réessayer.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLocked, 
    formattedLockoutTime, 
    signIn, 
    resetLoginAttempts, 
    router, 
    redirectPath, 
    incrementLoginAttempts, 
    debouncedSetError
  ]);

  // Social login handlers with error handling and rate limiting
  const handleSocialSignIn = useCallback(async (provider: 'google' | 'github' | 'linkedin') => {
    if (isLocked) {
      setError(`Trop de tentatives échouées. Réessayez dans ${formattedLockoutTime}.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin + '/auth/callback'
          }
        });
        
        if (error) throw error;
      }
      // Redirection is handled by the OAuth provider
    } catch (err) {
      incrementLoginAttempts();
      debouncedSetError(`Une erreur est survenue avec la connexion ${provider}.`);
      console.error(`${provider} login error:`, err);
      setIsLoading(false);
    }
  }, [
    isLocked,
    formattedLockoutTime,
    signInWithGoogle,
    incrementLoginAttempts,
    debouncedSetError
  ]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Toggle remember me
  const toggleRememberMe = useCallback(() => {
    setValue('rememberMe', !getValues('rememberMe'));
  }, [setValue, getValues]);

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-vynal-purple-dark/90 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-vynal-text-primary">Connexion</h1>
        <p className="mt-2 text-sm text-vynal-text-secondary">
          Bienvenue ! Connectez-vous pour accéder à votre compte.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-vynal-status-error/20 border border-vynal-status-error/30 rounded-md flex items-center text-vynal-status-error text-sm" role="alert">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-vynal-text-primary">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading || isLocked}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby="email-error"
              className="block w-full pl-10 pr-3 py-2 bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-vynal-text-primary placeholder:text-vynal-text-secondary/70"
              placeholder="votre@email.com"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-sm text-vynal-status-error">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-vynal-text-primary">
              Mot de passe
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-vynal-accent-primary hover:text-vynal-accent-secondary transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isLoading || isLocked}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby="password-error"
              className="block w-full pl-10 pr-10 py-2 bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-vynal-text-primary placeholder:text-vynal-text-secondary/70"
              placeholder="••••••••"
              {...register('password')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-vynal-text-secondary hover:text-vynal-text-primary focus:outline-none transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                disabled={isLoading || isLocked}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-vynal-status-error">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            disabled={isLoading || isLocked}
            className="h-4 w-4 bg-vynal-purple-secondary/30 border-vynal-purple-secondary/50 rounded focus:ring-vynal-accent-primary text-vynal-accent-primary"
            {...register('rememberMe')}
          />
          <label 
            htmlFor="rememberMe" 
            className="ml-2 block text-sm text-vynal-text-secondary cursor-pointer"
            onClick={toggleRememberMe}
          >
            Se souvenir de moi
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading || isLocked} 
          aria-busy={isLoading}
          className="w-full py-5 flex items-center justify-center text-sm"
        >
          {isLoading ? (
            <div className="flex items-center">
              <RefreshIndicator 
                isRefreshing={true}
                size="sm"
                text={true}
                variant="accent"
              />
            </div>
          ) : isLocked ? (
            `Compte temporairement bloqué (${formattedLockoutTime})`
          ) : (
            <span>Se connecter</span>
          )}
        </Button>
      </form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-vynal-purple-secondary/40" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-vynal-purple-dark/90 text-vynal-text-secondary">Ou continuer avec</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleSocialSignIn('google')} 
          disabled={isLoading || isLocked}
          aria-label="Se connecter avec Google"
          className="w-full py-5 flex items-center justify-center gap-2 text-sm"
        >
          {isLoading ? (
            <RefreshIndicator 
              isRefreshing={true}
              size="sm"
              variant="secondary"
            />
          ) : (
            <>
              <svg className="h-4 w-4 flex-shrink-0" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              <span className="md:hidden">Continuer avec Google</span>
              <span className="hidden md:inline">Google</span>
            </>
          )}
        </Button>

        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleSocialSignIn('github')} 
          disabled={isLoading || isLocked}
          aria-label="Se connecter avec GitHub"
          className="w-full py-5 flex items-center justify-center gap-2 text-sm"
        >
          {isLoading ? (
            <RefreshIndicator 
              isRefreshing={true}
              size="sm"
              variant="secondary"
            />
          ) : (
            <>
              <svg className="h-4 w-4 flex-shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="md:hidden">Continuer avec GitHub</span>
              <span className="hidden md:inline">GitHub</span>
            </>
          )}
        </Button>

        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleSocialSignIn('linkedin')} 
          disabled={isLoading || isLocked}
          aria-label="Se connecter avec LinkedIn"
          className="w-full py-5 flex items-center justify-center gap-2 text-sm hover:bg-blue-50/5"
        >
          {isLoading ? (
            <RefreshIndicator 
              isRefreshing={true}
              size="sm"
              variant="secondary"
            />
          ) : (
            <>
              <svg className="h-4 w-4 flex-shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="md:hidden">Continuer avec LinkedIn</span>
              <span className="hidden md:inline">LinkedIn</span>
            </>
          )}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-vynal-text-secondary">
        Vous n'avez pas de compte ?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-vynal-accent-primary hover:text-vynal-accent-secondary transition-colors"
        >
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
}

// Mémoisation du composant pour éviter des re-rendus inutiles
export default memo(LoginForm)