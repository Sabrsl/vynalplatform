import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Types de validation disponibles
export type ValidationTiming = 'onChange' | 'onBlur' | 'onSubmit';
export type ValidatorType = 'text' | 'email' | 'password' | 'textarea' | 'number' | 'phone' | 'url';

// Interface pour les messages d'erreur personnalisés
interface ValidationMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  email?: string;
  password?: string;
  number?: string;
  phone?: string;
  url?: string;
  custom?: string;
}

// Interface pour les fonctions de validation asynchrone
interface AsyncValidation {
  validator: (value: string) => Promise<boolean>;
  message: string;
  debounceMs?: number;
}

// Props du composant
interface InputValidatorProps {
  // Propriétés de base
  type: ValidatorType;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  name?: string;
  id?: string;
  
  // Validation
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  validationTiming?: ValidationTiming;
  customValidator?: (value: string) => boolean;
  asyncValidator?: AsyncValidation;
  validationMessages?: ValidationMessages;
  showSuccessIndicator?: boolean;
  
  // Messages d'erreur
  error?: string;
  
  // Intégration Supabase
  supabaseTable?: string;
  supabaseColumn?: string;
  supabaseUniqueCheck?: boolean;
}

export const InputValidator: React.FC<InputValidatorProps> = ({
  // Propriétés de base
  type,
  value,
  onChange,
  onValidationChange,
  label,
  placeholder,
  className = '',
  rows = 3,
  disabled = false,
  name,
  id = `input-${Math.random().toString(36).substring(2, 9)}`,
  
  // Validation
  required = false,
  minLength,
  maxLength,
  pattern,
  validationTiming = 'onBlur',
  customValidator,
  asyncValidator,
  validationMessages = {},
  showSuccessIndicator = false,
  
  // Messages d'erreur
  error: externalError,
  
  // Intégration Supabase
  supabaseTable,
  supabaseColumn,
  supabaseUniqueCheck = false
}) => {
  // États
  const [dirty, setDirty] = useState<boolean>(false);
  const [touched, setTouched] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [internalValue, setInternalValue] = useState<string>(value || '');
  const [isValid, setIsValid] = useState<boolean>(!required || !!value);
  
  // Effet pour synchroniser la valeur externe et interne
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);
  
  // Effet pour notifier les changements de validation
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  // Messages d'erreur par défaut
  const defaultMessages = {
    required: 'Ce champ est requis',
    minLength: `Minimum ${minLength} caractères requis`,
    maxLength: `Maximum ${maxLength} caractères autorisés`,
    pattern: 'Format invalide',
    email: 'Adresse email invalide',
    password: 'Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux',
    number: 'Veuillez entrer un nombre valide',
    phone: 'Numéro de téléphone invalide',
    url: 'URL invalide',
    custom: 'Entrée invalide',
    async: 'Vérification en cours...',
    unique: 'Cette valeur existe déjà'
  };
  
  // Fonction de nettoyage des données
  const sanitizeInput = (input: string): string => {
    // Adaptation selon le type
    switch (type) {
      case 'email':
        // Normaliser les emails (tout en minuscules)
        return input.toLowerCase().trim().replace(/\s+/g, '');
      
      case 'url':
        // Normaliser les URLs
        return input.trim().replace(/\s+/g, '');
        
      case 'number':
        // Ne garder que les chiffres et le point/virgule décimal
        return input.replace(/[^\d.,]/g, '').replace(',', '.');
        
      case 'phone':
        // Ne garder que les chiffres et quelques caractères autorisés
        return input.replace(/[^\d+\-\s()]/g, '');
        
      default:
        // Supprimer les balises HTML et scripts
        let sanitized = input.replace(/<[^>]*>/g, '');
        
        // Échapper les caractères spéciaux (sauf pour les mots de passe)
        if (type !== 'password') {
          sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }
        
        // Supprimer les caractères de contrôle
        sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        
        return sanitized;
    }
  };

  // Fonction de validation synchrone
  const validateInput = (input: string): { isValid: boolean; error: string | null } => {
    // Vérification si vide
    if (required && !input.trim()) {
      return { isValid: false, error: validationMessages.required || defaultMessages.required };
    }
    
    // Si vide mais non requis, c'est valide
    if (!input.trim() && !required) {
      return { isValid: true, error: null };
    }

    // Validation de longueur minimale
    if (minLength && input.length < minLength) {
      return { isValid: false, error: validationMessages.minLength || defaultMessages.minLength };
    }

    // Validation de longueur maximale
    if (maxLength && input.length > maxLength) {
      return { isValid: false, error: validationMessages.maxLength || defaultMessages.maxLength };
    }

    // Validation par expression régulière personnalisée
    if (pattern && !new RegExp(pattern).test(input)) {
      return { isValid: false, error: validationMessages.pattern || defaultMessages.pattern };
    }

    // Validations spécifiques selon le type
    switch (type) {
      case 'email':
        // Validation email plus robuste (RFC 5322)
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailRegex.test(input)) {
          return { isValid: false, error: validationMessages.email || defaultMessages.email };
        }
        break;
      
      case 'password':
        // Validation de mot de passe plus robuste (majuscule, minuscule, chiffre, caractère spécial)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(input)) {
          return { isValid: false, error: validationMessages.password || defaultMessages.password };
        }
        break;
      
      case 'number':
        if (isNaN(Number(input)) || input.trim() === '') {
          return { isValid: false, error: validationMessages.number || defaultMessages.number };
        }
        break;
        
      case 'phone':
        // Validation basique de numéro de téléphone (peut être améliorée selon les besoins)
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(input)) {
          return { isValid: false, error: validationMessages.phone || defaultMessages.phone };
        }
        break;
        
      case 'url':
        // Validation d'URL
        try {
          new URL(input);
        } catch {
          return { isValid: false, error: validationMessages.url || defaultMessages.url };
        }
        break;
    }
    
    // Validation personnalisée
    if (customValidator && !customValidator(input)) {
      return { isValid: false, error: validationMessages.custom || defaultMessages.custom };
    }

    // Si toutes les validations sont passées
    return { isValid: true, error: null };
  };
  
  // Fonction pour gérer la validation asynchrone
  const performAsyncValidation = async (input: string): Promise<{ isValid: boolean; error: string | null }> => {
    if (!asyncValidator || !input.trim()) {
      return { isValid: true, error: null };
    }
    
    setIsValidating(true);
    
    try {
      // Vérification d'unicité Supabase si configurée
      if (supabaseUniqueCheck && supabaseTable && supabaseColumn) {
        // Note: Cette partie nécessiterait l'importation du client Supabase
        // et la logique d'accès à la base de données
        console.log(`Vérification d'unicité dans ${supabaseTable}.${supabaseColumn} pour la valeur ${input}`);
        
        // Code de vérification Supabase (à implémenter selon votre configuration)
        // const { data } = await supabase
        //   .from(supabaseTable)
        //   .select('id')
        //   .eq(supabaseColumn, input)
        //   .maybeSingle();
        
        // if (data) {
        //   return { isValid: false, error: defaultMessages.unique };
        // }
      }
      
      // Validation asynchrone personnalisée
      const isValid = await asyncValidator.validator(input);
      return { 
        isValid, 
        error: isValid ? null : asyncValidator.message
      };
    } catch (err) {
      console.error('Erreur de validation asynchrone:', err);
      return { isValid: false, error: 'Erreur lors de la validation' };
    } finally {
      setIsValidating(false);
    }
  };
  
  // Gestionnaire principal de validation
  const validate = async (input: string, timing: ValidationTiming) => {
    // Ignorer la validation si le timing ne correspond pas
    if (validationTiming !== timing && timing !== 'onSubmit') {
      return;
    }
    
    // Validation synchrone
    const syncValidation = validateInput(input);
    
    // Si la validation synchrone échoue, pas besoin d'aller plus loin
    if (!syncValidation.isValid) {
      setInternalError(syncValidation.error);
      setIsValid(false);
      return false;
    }
    
    // Validation asynchrone si nécessaire
    if (asyncValidator) {
      const asyncValidation = await performAsyncValidation(input);
      if (!asyncValidation.isValid) {
        setInternalError(asyncValidation.error);
        setIsValid(false);
        return false;
      }
    }
    
    // Tout est valide
    setInternalError(null);
    setIsValid(true);
    return true;
  };

  // Gestionnaire de changement de valeur
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = sanitizeInput(e.target.value);
    setInternalValue(newValue);
    setDirty(true);
    
    // Mettre à jour la valeur externe si elle est différente
    if (newValue !== value) {
      onChange(newValue);
    }
    
    // Valider si le timing est onChange
    validate(newValue, 'onChange');
  };
  
  // Gestionnaire de perte de focus
  const handleBlur = () => {
    setTouched(true);
    validate(internalValue, 'onBlur');
  };
  
  // Fonction pour récupérer l'erreur à afficher
  const getDisplayError = (): string | null => {
    // Priorité à l'erreur externe
    if (externalError) {
      return externalError;
    }
    
    // Ensuite l'erreur interne, mais seulement si le champ est dirty ou touched
    // selon le timing de validation
    if (internalError && ((validationTiming === 'onChange' && dirty) || 
                         (validationTiming === 'onBlur' && touched))) {
      return internalError;
    }
    
    return null;
  };

  // Rendu du composant d'entrée
  const renderInput = () => {
    const displayError = getDisplayError();
    const isInvalid = !!displayError;
    
    const commonProps = {
      value: internalValue,
      onChange: handleChange,
      onBlur: handleBlur,
      placeholder,
      required,
      disabled,
      name,
      id,
      className: `w-full ${isInvalid ? 'border-red-500' : isValid && touched && showSuccessIndicator ? 'border-green-500' : ''} ${className}`,
      'aria-invalid': isInvalid,
      'aria-describedby': isInvalid ? `${id}-error` : undefined
    };

    if (type === 'textarea') {
      return <Textarea {...commonProps} rows={rows} />;
    }

    return <Input {...commonProps} type={type === 'password' ? 'password' : type === 'number' ? 'text' : type} inputMode={type === 'number' ? 'decimal' : type === 'phone' ? 'tel' : undefined} />;
  };

  // Rendu du message d'erreur ou de l'indicateur d'état
  const renderFeedback = () => {
    const displayError = getDisplayError();
    
    if (isValidating) {
      return (
        <div className="flex items-center gap-1 text-blue-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{defaultMessages.async}</span>
        </div>
      );
    }
    
    if (displayError) {
      return (
        <div className="flex items-center gap-1 text-red-500 text-sm" role="alert">
          <AlertCircle className="h-4 w-4" />
          <span id={`${id}-error`}>{displayError}</span>
        </div>
      );
    }
    
    if (isValid && touched && showSuccessIndicator) {
      return (
        <div className="flex items-center gap-1 text-green-500 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Valide</span>
        </div>
      );
    }
    
    return null;
  };

  // Rendu du composant complet
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {renderInput()}
      
      {renderFeedback()}
    </div>
  );
};

export default InputValidator;