import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { validatePrice, validateDeliveryTime, PRICE_LIMITS, DELIVERY_TIME_LIMITS } from '@/lib/validators/servicePricing';

interface ServicePricingValidatorProps {
  id: string;
  type: 'price' | 'deliveryTime';
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const ServicePricingValidator: React.FC<ServicePricingValidatorProps> = ({
  id,
  type,
  value,
  onChange,
  label,
  placeholder = '',
  required = true,
  className = '',
}) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Déterminer les limites selon le type
  const limits = type === 'price' ? PRICE_LIMITS : DELIVERY_TIME_LIMITS;
  const validate = type === 'price' ? validatePrice : validateDeliveryTime;

  // Vérifier la validité lorsque la valeur change
  useEffect(() => {
    if (touched) {
      const validationResult = validate(value);
      setIsValid(validationResult.isValid);
      setError(validationResult.isValid ? null : validationResult.error);
    }
  }, [value, touched, validate]);

  // Gérer le changement dans le champ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Pour le prix, permettre uniquement les chiffres et la virgule
    if (type === 'price') {
      if (!/^[0-9,]*$/.test(newValue)) return;
    }
    // Pour la durée, permettre uniquement les chiffres
    else {
      if (!/^[0-9]*$/.test(newValue)) return;
    }
    
    onChange(newValue);
  };

  // Marquer comme touché lors de la perte de focus
  const handleBlur = () => {
    setTouched(true);
    const validationResult = validate(value);
    setIsValid(validationResult.isValid);
    setError(validationResult.isValid ? null : validationResult.error);
  };

  // Déterminer l'état visuel du champ
  const getFieldState = () => {
    if (!touched) return 'default';
    return isValid ? 'valid' : 'error';
  };

  // Créer les classes CSS pour le champ
  const getInputClasses = () => {
    const baseClasses = `w-full p-2 text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary rounded-md transition-colors ${className}`;
    
    const stateClasses = {
      default: 'border-slate-200 dark:border-slate-700 focus:border-vynal-accent-primary dark:focus:border-vynal-accent-primary',
      valid: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10',
      error: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
    };
    
    return `${baseClasses} ${stateClasses[getFieldState()]}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label 
          htmlFor={id} 
          className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary flex items-center"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <span className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
          {type === 'price' 
            ? `Min: ${limits.min} ${PRICE_LIMITS.currency}`
            : `Min: ${limits.min} ${DELIVERY_TIME_LIMITS.unit}`
          }
        </span>
      </div>
      
      <Input
        id={id}
        name={id}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className={getInputClasses()}
        aria-invalid={!isValid}
        aria-describedby={`${id}-feedback`}
        type="text"
        inputMode={type === 'price' ? 'numeric' : 'numeric'}
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
            Valeur valide
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ServicePricingValidator; 