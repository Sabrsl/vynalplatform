"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

// Constantes pour la limitation des tentatives
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
const LOGIN_ATTEMPTS_KEY = "login_attempts";
const LOCKOUT_TIME_KEY = "login_lockout_time";

export default function LoginForm() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Récupérer les tentatives de connexion et le statut de verrouillage au chargement
  useEffect(() => {
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
        // Si le verrouillage est expiré, réinitialiser
        localStorage.removeItem(LOCKOUT_TIME_KEY);
      }
    }
  }, []);

  // Mise à jour du décompte du temps de verrouillage
  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setTimeout(() => {
        setLockoutRemaining(prev => {
          const newValue = prev - 1000;
          if (newValue <= 0) {
            setIsLocked(false);
            localStorage.removeItem(LOCKOUT_TIME_KEY);
            return 0;
          }
          return newValue;
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [lockoutRemaining]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const incrementLoginAttempts = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, newAttempts.toString());
    
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION;
      setIsLocked(true);
      setLockoutRemaining(LOCKOUT_DURATION);
      localStorage.setItem(LOCKOUT_TIME_KEY, lockoutTime.toString());
    }
  };

  const resetLoginAttempts = () => {
    setLoginAttempts(0);
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIME_KEY);
    setIsLocked(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Vérifier si le compte est verrouillé
    if (isLocked) {
      setError(`Trop de tentatives échouées. Réessayez dans ${Math.ceil(lockoutRemaining / 60000)} minutes.`);
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const { success, error } = await signIn(formData.email, formData.password, rememberMe);
      
      if (success) {
        // Réinitialiser les tentatives en cas de succès
        resetLoginAttempts();
        router.push("/dashboard");
      } else {
        // Incrémenter les tentatives en cas d'échec
        incrementLoginAttempts();
        setError("Identifiants invalides. Veuillez réessayer.");
        console.error(error);
      }
    } catch (err) {
      // Incrémenter les tentatives en cas d'erreur
      incrementLoginAttempts();
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await signInWithGoogle();
      // La redirection est gérée par le provider OAuth
    } catch (err) {
      setError("Une erreur est survenue avec la connexion Google.");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="mt-2 text-sm text-gray-600">
          Bienvenue ! Connectez-vous pour accéder à votre compte.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-200 rounded-md flex items-center text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Se souvenir de moi
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading || isLocked}
          className="w-full flex justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion...
            </>
          ) : isLocked ? (
            `Compte temporairement bloqué (${Math.ceil(lockoutRemaining / 60000)} min)`
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full"
      >
        <svg
          className="w-5 h-5 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z"
            fill="#4285F4"
          />
          <path
            d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3276 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z"
            fill="#34A853"
          />
          <path
            d="M5.50253 14.3003C4.99987 12.8099 4.99987 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z"
            fill="#FBBC04"
          />
          <path
            d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </Button>

      <p className="mt-6 text-center text-sm text-gray-600">
        Vous n'avez pas de compte ?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
} 