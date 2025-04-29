"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debounce } from "lodash";

// Constants for rate limiting
const LAST_SIGNUP_ATTEMPT_KEY = "last_signup_attempt";
const MIN_SIGNUP_INTERVAL = 5000; // 5 seconds
const PASSWORD_MIN_LENGTH = 8;

// Password strength requirements
const passwordRequirements = [
  { id: "length", text: "Au moins 8 caractères", regex: /.{8,}/ },
  { id: "lowercase", text: "Au moins une lettre minuscule", regex: /[a-z]/ },
  { id: "uppercase", text: "Au moins une lettre majuscule", regex: /[A-Z]/ },
  { id: "number", text: "Au moins un chiffre", regex: /[0-9]/ },
  { id: "special", text: "Au moins un caractère spécial", regex: /[!@#$%^&*(),.?":{}|<>]/ }
];

// Validation schema
const signupSchema = z.object({
  email: z.string()
    .email("Veuillez entrer une adresse email valide")
    .min(5, "L'adresse email est trop courte")
    .max(255, "L'adresse email est trop longue"),
  password: z.string()
    .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`)
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Le mot de passe doit contenir au moins un caractère spécial"),
  confirmPassword: z.string()
    .min(1, "Veuillez confirmer votre mot de passe"),
  role: z.enum(["client", "freelance"]),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions d'utilisation"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // React Hook Form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields, dirtyFields },
    setValue,
    watch,
    reset
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: (searchParams.get("role") as "client" | "freelance") || "client",
      termsAccepted: true
    },
    mode: "onChange" // Validate on change for immediate feedback
  });

  const passwordValue = watch("password");
  
  // Password strength calculation
  useEffect(() => {
    if (!passwordValue) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    passwordRequirements.forEach(req => {
      if (req.regex.test(passwordValue)) {
        strength += 20; // 5 requirements = 20% each
      }
    });
    
    setPasswordStrength(strength);
  }, [passwordValue]);

  // Cooldown timer for signup attempts
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    
    const timer = setTimeout(() => {
      setCooldownRemaining(prev => Math.max(0, prev - 1000));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [cooldownRemaining]);

  // Update role from URL params
  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "freelance" || role === "client") {
      setValue("role", role as "client" | "freelance");
    }
  }, [searchParams, setValue]);

  // Create a debounced version of setError to prevent UI flicker
  const debouncedSetError = useMemo(
    () => debounce((message: string | null) => setError(message), 300),
    []
  );

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Role selection handler
  const handleRoleChange = useCallback((role: "client" | "freelance") => {
    setValue("role", role, { shouldValidate: true });
  }, [setValue]);

  // Form submission handler
  const onSubmit = useCallback(async (data: SignupFormData) => {
    // Check cooldown period
    const now = Date.now();
    const lastAttempt = localStorage.getItem(LAST_SIGNUP_ATTEMPT_KEY);
    
    if (lastAttempt) {
      const timeSinceLastAttempt = now - parseInt(lastAttempt, 10);
      
      if (timeSinceLastAttempt < MIN_SIGNUP_INTERVAL) {
        const remainingTime = Math.ceil((MIN_SIGNUP_INTERVAL - timeSinceLastAttempt) / 1000);
        setCooldownRemaining(MIN_SIGNUP_INTERVAL - timeSinceLastAttempt);
        debouncedSetError(`Veuillez patienter ${remainingTime} seconde${remainingTime > 1 ? 's' : ''} avant de réessayer.`);
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Record this attempt timestamp
      localStorage.setItem(LAST_SIGNUP_ATTEMPT_KEY, now.toString());
      
      const { success, error } = await signUp(
        data.email, 
        data.password, 
        data.role
      );
      
      if (success) {
        // Clear form on success
        reset();
        router.push("/auth/verify-email?email=" + encodeURIComponent(data.email));
      } else {
        // Handle signup errors
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : "Une erreur est survenue lors de l'inscription.";
        
        // Detect specific errors
        if (errorMessage.includes("User already registered") || 
            errorMessage.includes("user_repeated_signup") ||
            errorMessage.toLowerCase().includes("already registered")) {
          debouncedSetError("Cet email est déjà utilisé. Veuillez vous connecter ou réinitialiser votre mot de passe.");
        } else {
          debouncedSetError(errorMessage);
        }
        console.error(error);
      }
    } catch (err) {
      debouncedSetError("Une erreur est survenue. Veuillez réessayer.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSetError, 
    reset, 
    router, 
    signUp
  ]);

  // Format remaining cooldown time
  const formattedCooldownTime = useMemo(() => {
    if (cooldownRemaining <= 0) return "";
    return `${Math.ceil(cooldownRemaining / 1000)}s`;
  }, [cooldownRemaining]);

  // Check if each password requirement is met
  const passwordChecks = useMemo(() => {
    return passwordRequirements.map(req => ({
      ...req,
      valid: req.regex.test(passwordValue)
    }));
  }, [passwordValue]);

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-vynal-purple-dark/90 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-vynal-text-primary">Inscription</h1>
        <p className="mt-2 text-sm text-vynal-text-secondary">
          Créez votre compte {watch("role") === "client" ? "client" : "freelance"} et commencez à utiliser notre plateforme.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-vynal-status-error/20 border border-vynal-status-error/30 rounded-md flex items-start text-vynal-status-error text-sm" role="alert">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-vynal-text-primary">
            Je m'inscris en tant que
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleRoleChange("client")}
              className={`flex-1 flex items-center justify-center p-3 border rounded-md transition-colors ${
                watch("role") === "client" 
                  ? "border-vynal-accent-primary bg-vynal-accent-primary/20 text-vynal-accent-primary" 
                  : "border-vynal-purple-secondary/50 text-vynal-text-secondary hover:bg-vynal-purple-secondary/10"
              }`}
              disabled={isLoading}
              aria-pressed={watch("role") === "client"}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("freelance")}
              className={`flex-1 flex items-center justify-center p-3 border rounded-md transition-colors ${
                watch("role") === "freelance" 
                  ? "border-vynal-accent-primary bg-vynal-accent-primary/20 text-vynal-accent-primary" 
                  : "border-vynal-purple-secondary/50 text-vynal-text-secondary hover:bg-vynal-purple-secondary/10"
              }`}
              disabled={isLoading}
              aria-pressed={watch("role") === "freelance"}
            >
              Freelance
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-vynal-text-primary">
            Email
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
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
          <Label htmlFor="password" className="text-sm font-medium text-vynal-text-primary">
            Mot de passe
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby="password-error password-requirements"
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
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          {dirtyFields.password && (
            <div id="password-requirements" className="mt-3 space-y-2">
              <div className="w-full bg-vynal-purple-secondary/30 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength < 40 ? 'bg-red-500' : 
                    passwordStrength < 80 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${passwordStrength}%` }}
                  role="progressbar"
                  aria-valuenow={passwordStrength}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Force du mot de passe"
                />
              </div>
              
              <ul className="space-y-1 text-xs">
                {passwordChecks.map(check => (
                  <li key={check.id} className="flex items-center">
                    {check.valid ? (
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 mr-2" />
                    )}
                    <span className={check.valid ? "text-green-500" : "text-vynal-text-secondary"}>
                      {check.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {errors.password && (
            <p id="password-error" className="text-sm text-vynal-status-error">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-vynal-text-primary">
            Confirmer le mot de passe
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby="confirm-password-error"
              className="block w-full pl-10 pr-10 py-2 bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary text-vynal-text-primary placeholder:text-vynal-text-secondary/70"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="text-vynal-text-secondary hover:text-vynal-text-primary focus:outline-none transition-colors"
                aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-vynal-status-error">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <div className="flex items-start space-x-2">
          <div className="flex items-center h-5 mt-1">
            <input
              id="termsAccepted"
              type="checkbox"
              disabled={isLoading}
              className="h-4 w-4 bg-vynal-purple-secondary/30 border-vynal-purple-secondary/50 rounded focus:ring-vynal-accent-primary text-vynal-accent-primary"
              {...register('termsAccepted')}
              aria-invalid={errors.termsAccepted ? "true" : "false"}
              aria-describedby="terms-error"
            />
          </div>
          <div className="text-sm">
            <label htmlFor="termsAccepted" className="text-vynal-text-secondary">
              J'accepte les{" "}
              <Link href="/terms-of-service" className="text-vynal-accent-primary hover:text-vynal-accent-secondary underline">
                Conditions d'utilisation
              </Link>{" "}
              et la{" "}
              <Link href="/privacy-policy" className="text-vynal-accent-primary hover:text-vynal-accent-secondary underline">
                Politique de confidentialité
              </Link>
            </label>
            {errors.termsAccepted && (
              <p id="terms-error" className="mt-1 text-sm text-vynal-status-error">{errors.termsAccepted.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || cooldownRemaining > 0 || !isValid}
          aria-busy={isLoading}
          className="w-full flex justify-center bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all"
        >
          {isLoading ? (
            <div className="flex items-center">
              <RefreshIndicator 
                isRefreshing={true}
                size="sm"
                text
                variant="accent"
              />
            </div>
          ) : cooldownRemaining > 0 ? (
            `Patientez ${formattedCooldownTime}...`
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

// Mémoisation du composant pour éviter des re-rendus inutiles
export default memo(SignupForm);