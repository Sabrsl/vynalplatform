"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

// Clé pour le stockage local du dernier timestamp d'inscription
const LAST_SIGNUP_ATTEMPT_KEY = "last_signup_attempt";
// Délai minimum entre deux tentatives d'inscription (en millisecondes)
const MIN_SIGNUP_INTERVAL = 5000; // 5 secondes

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: searchParams.get("role") || "client",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Effet pour vérifier si une inscription récente a eu lieu et gérer le cooldown
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  // Mettre à jour le rôle si le paramètre d'URL change
  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "freelance" || role === "client") {
      setFormData((prev) => ({ ...prev, role }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Vérifier si les conditions d'utilisation ont été acceptées
    if (!termsAccepted) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité pour vous inscrire.");
      return;
    }
    
    // Vérifier le délai entre deux tentatives d'inscription
    const now = Date.now();
    const lastAttempt = localStorage.getItem(LAST_SIGNUP_ATTEMPT_KEY);
    
    if (lastAttempt) {
      const timeSinceLastAttempt = now - parseInt(lastAttempt, 10);
      
      if (timeSinceLastAttempt < MIN_SIGNUP_INTERVAL) {
        const remainingTime = Math.ceil((MIN_SIGNUP_INTERVAL - timeSinceLastAttempt) / 1000);
        setCooldownRemaining(MIN_SIGNUP_INTERVAL - timeSinceLastAttempt);
        setError(`Veuillez patienter ${remainingTime} seconde${remainingTime > 1 ? 's' : ''} avant de réessayer.`);
        return;
      }
    }
    
    setIsLoading(true);
    setError("");

    // Enregistrer le timestamp de cette tentative
    localStorage.setItem(LAST_SIGNUP_ATTEMPT_KEY, now.toString());

    // Vérification des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    // Vérification de la complexité du mot de passe
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setIsLoading(false);
      return;
    }

    try {
      const { success, error } = await signUp(
        formData.email, 
        formData.password, 
        formData.role as "client" | "freelance"
      );
      
      if (success) {
        router.push("/auth/verify-email?email=" + encodeURIComponent(formData.email));
      } else {
        // Vérifier si l'erreur concerne un email déjà utilisé
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : "Une erreur est survenue lors de l'inscription.";
        
        // Détecter les erreurs liées à un email déjà enregistré
        if (errorMessage.includes("User already registered") || 
            errorMessage.includes("user_repeated_signup") ||
            errorMessage.toLowerCase().includes("already registered")) {
          setError("Cet email est déjà utilisé. Veuillez vous connecter ou réinitialiser votre mot de passe.");
        } else {
          setError(errorMessage);
        }
        console.error(error);
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-vynal-purple-dark/90 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-vynal-text-primary">Inscription</h1>
        <p className="mt-2 text-sm text-vynal-text-secondary">
          Créez votre compte {formData.role === "client" ? "client" : "freelance"} et commencez à utiliser notre plateforme.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-vynal-status-error/20 border border-vynal-status-error/30 rounded-md flex items-center text-vynal-status-error text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-vynal-text-primary">
            Je m'inscris en tant que
          </label>
          <div className="flex space-x-4">
            <label className={`flex-1 flex items-center p-3 border rounded-md cursor-pointer ${
              formData.role === "client" 
                ? "border-vynal-accent-primary bg-vynal-accent-primary/20" 
                : "border-vynal-purple-secondary/50 hover:bg-vynal-purple-secondary/10"
            }`}>
              <input
                type="radio"
                name="role"
                value="client"
                checked={formData.role === "client"}
                onChange={handleChange}
                className="sr-only"
              />
              <span className={`ml-2 ${
                formData.role === "client" ? "text-vynal-accent-primary" : "text-vynal-text-secondary"
              }`}>
                Client
              </span>
            </label>
            <label className={`flex-1 flex items-center p-3 border rounded-md cursor-pointer ${
              formData.role === "freelance" 
                ? "border-vynal-accent-primary bg-vynal-accent-primary/20" 
                : "border-vynal-purple-secondary/50 hover:bg-vynal-purple-secondary/10"
            }`}>
              <input
                type="radio"
                name="role"
                value="freelance"
                checked={formData.role === "freelance"}
                onChange={handleChange}
                className="sr-only"
              />
              <span className={`ml-2 ${
                formData.role === "freelance" ? "text-vynal-accent-primary" : "text-vynal-text-secondary"
              }`}>
                Freelance
              </span>
            </label>
          </div>
        </div>

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
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2 bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-vynal-text-primary placeholder:text-vynal-text-secondary/70"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-vynal-text-primary">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="block w-full pl-10 pr-10 py-2 bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-vynal-text-primary placeholder:text-vynal-text-secondary/70"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className="text-vynal-text-secondary hover:text-vynal-text-primary focus:outline-none transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-vynal-text-secondary">
            Minimum 8 caractères
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-vynal-text-primary">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2 bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-vynal-text-primary placeholder:text-vynal-text-secondary/70"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        {/* Ajout de la case à cocher pour les conditions d'utilisation */}
        <div className="flex items-start space-x-2 mt-4">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="h-4 w-4 bg-vynal-purple-secondary/30 border-vynal-purple-secondary/50 rounded focus:ring-vynal-accent-primary text-vynal-accent-primary"
              required
            />
          </div>
          <div className="ml-2 text-sm">
            <label htmlFor="terms" className="text-vynal-text-secondary">
              J'accepte les{" "}
              <Link href="/terms" className="text-vynal-accent-primary hover:text-vynal-accent-secondary underline">
                Conditions d'utilisation
              </Link>{" "}
              et la{" "}
              <Link href="/privacy" className="text-vynal-accent-primary hover:text-vynal-accent-secondary underline">
                Politique de confidentialité
              </Link>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || cooldownRemaining > 0}
          className="w-full flex justify-center bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inscription en cours...
            </>
          ) : cooldownRemaining > 0 ? (
            `Patientez ${Math.max(1, Math.ceil(cooldownRemaining / 1000))}s...`
          ) : (
            "S'inscrire"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-vynal-text-secondary">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-vynal-accent-primary hover:text-vynal-accent-secondary transition-colors"
        >
          Connectez-vous
        </Link>
      </p>
    </div>
  );
} 