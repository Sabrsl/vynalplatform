import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { 
  DescriptionSection, 
  DescriptionFields,
  validateSectionLength, 
  sanitizeContent,
  SECTION_LIMITS,
  findMatchPositions,
  MatchPosition
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
  const [highlightedMatches, setHighlightedMatches] = useState<string[]>([]);
  const [matchPositions, setMatchPositions] = useState<MatchPosition[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Déterminer les limites de caractères pour ce champ
  const { min, max } = SECTION_LIMITS[field];
  const currentLength = value?.length || 0;
  
  // Vérifier la validité lorsque la valeur change
  useEffect(() => {
    if (touched) {
      const validationResult = validateSectionLength(field, value);
      setIsValid(validationResult.isValid);
      setError(validationResult.isValid ? null : validationResult.error || null);
      setHighlightedMatches(validationResult.highlightedMatches || []);
      
      // Trouver les positions des mots problématiques dans le texte
      if (validationResult.highlightedMatches && validationResult.highlightedMatches.length > 0) {
        const positions = findMatchPositions(value, validationResult.highlightedMatches);
        setMatchPositions(positions);
      } else {
        setMatchPositions([]);
      }
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
    setHighlightedMatches(validationResult.highlightedMatches || []);
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

  // Fonction pour mettre en évidence visuellement un mot problématique dans le texte
  const highlightWordInTextarea = (position: number, length: number) => {
    if (textareaRef.current) {
      // Mettre le focus sur la textarea
      textareaRef.current.focus();
      
      // Sélectionner le mot problématique
      textareaRef.current.setSelectionRange(position, position + length);
      
      // Faire défiler la textarea pour que le mot soit visible
      const textareaLines = value.substr(0, position).split('\n');
      const lineNumber = textareaLines.length - 1;
      const lineHeight = 20; // Hauteur approximative d'une ligne en pixels
      textareaRef.current.scrollTop = lineNumber * lineHeight;
    }
  };

  // Fonction pour mettre en évidence les mots problématiques
  const highlightProblematicWords = () => {
    if (!highlightedMatches || highlightedMatches.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 p-2 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 rounded-md">
        <p className="text-[10px] sm:text-xs text-amber-800 dark:text-amber-300 font-medium mb-1">
          <Info className="h-3 w-3 inline-block mr-1" /> 
          Mots potentiellement inappropriés détectés:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {matchPositions.map((posInfo, index) => (
            <button 
              key={index}
              type="button"
              onClick={() => highlightWordInTextarea(posInfo.positions[0], posInfo.match.length)}
              className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-[8px] sm:text-[10px] font-medium hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors"
            >
              {posInfo.match} {posInfo.positions.length > 1 ? `(${posInfo.positions.length})` : ''}
            </button>
          ))}
        </div>
        <p className="text-[8px] sm:text-[10px] text-amber-700 dark:text-amber-400 mt-1">
          Cliquez sur un mot pour le localiser dans le texte. Veuillez modifier le contenu si nécessaire.
        </p>
      </div>
    );
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
        ref={textareaRef}
      />
      
      {/* Afficher les mots problématiques s'il y en a */}
      {!isValid && highlightedMatches.length > 0 && highlightProblematicWords()}
      
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