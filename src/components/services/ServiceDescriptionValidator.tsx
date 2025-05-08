import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { 
  DescriptionSection, 
  DescriptionFields,
  validateSectionLength, 
  sanitizeContent,
  SECTION_LIMITS
} from '@/lib/validators/serviceDescription';

interface ServiceDescriptionProps {
  id: string;
  field: DescriptionSection;
  value: string;
  onChange: (field: DescriptionSection, value: string) => void;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  smallText?: string;
}

const ServiceDescriptionValidator: React.FC<ServiceDescriptionProps> = ({
  id,
  field,
  value,
  onChange,
  label,
  placeholder = '',
  rows = 3,
  required = field !== 'intro',
  className = '',
  smallText,
}) => {
  // États locaux
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);
  
  // Déterminer les limites de caractères pour ce champ
  const { min, max } = SECTION_LIMITS[field];
  const currentLength = value?.length || 0;
  
  // Vérifier la validité lorsque la valeur change
  useEffect(() => {
    if (touched) {
      const validationResult = validateSectionLength(field, value);
      setIsValid(validationResult.isValid);
      setError(validationResult.isValid ? null : validationResult.error || null);
    }
  }, [value, field, touched]);
  
  // Gérer le changement dans le champ de texte
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Limiter à la longueur maximale
    if (newValue.length <= max) {
      onChange(field, newValue);
    }
  };
  
  // Marquer comme touché lors de la perte de focus
  const handleBlur = () => {
    setTouched(true);
    // Valider immédiatement
    const validationResult = validateSectionLength(field, value);
    setIsValid(validationResult.isValid);
    setError(validationResult.isValid ? null : validationResult.error || null);
  };
  
  // Calculer le style du compteur de caractères
  const getCounterStyle = () => {
    if (!touched) return '';
    
    if (currentLength === 0 && !required) {
      return 'text-gray-500';
    }
    
    if (currentLength < min && currentLength > 0) {
      return 'text-amber-500';
    }
    
    if (currentLength > max * 0.9) {
      return 'text-red-500';
    }
    
    return isValid ? 'text-green-600' : 'text-red-500';
  };
  
  // Déterminer l'état visuel du champ
  const getFieldState = () => {
    if (!touched) return 'default';
    return isValid ? 'valid' : 'error';
  };
  
  // Créer les classes CSS pour le champ
  const getTextAreaClasses = () => {
    const baseClasses = `w-full p-2 text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary rounded-md transition-colors ${className}`;
    
    const stateClasses = {
      default: 'border-slate-200 dark:border-slate-700 focus:border-vynal-accent-primary dark:focus:border-vynal-accent-primary',
      valid: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10',
      error: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
    };
    
    return `${baseClasses} ${stateClasses[getFieldState()]}`;
  };

  const getCharacterCount = () => {
    return `${value.length}/${max} caractères${min > 0 ? ` (min: ${min})` : ''}`;
  };

  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        name={id}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={getTextAreaClasses()}
        aria-invalid={!isValid}
        aria-describedby={`${id}-feedback`}
      />
      
      {error && touched ? (
        <div className="flex items-start gap-1.5 mt-1" id={`${id}-feedback`}>
          <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-[8px] sm:text-[10px] text-red-500">{error}</p>
        </div>
      ) : isValid && touched ? (
        <div className="flex items-center gap-1.5 mt-1" id={`${id}-feedback`}>
          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
          <p className="text-[8px] sm:text-[10px] text-green-500">
            {getCharacterCount()}
          </p>
        </div>
      ) : (
        <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400">
          {getCharacterCount()}
        </p>
      )}
    </div>
  );
};

export default ServiceDescriptionValidator; 