"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /**
   * Taille du slider
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  
  /**
   * Afficher les marqueurs
   * @default false
   */
  showMarks?: boolean;
  
  /**
   * Marqueurs personnalisés
   */
  marks?: { value: number; label?: string }[];
  
  /**
   * Afficher la valeur actuelle
   * @default false
   */
  showValue?: boolean;
  
  /**
   * Formater la valeur affichée
   */
  formatValue?: (value: number) => string;
  
  /**
   * Classe CSS pour le thumb
   */
  thumbClassName?: string;
  
  /**
   * Classe CSS pour le track
   */
  trackClassName?: string;
  
  /**
   * Classe CSS pour le range
   */
  rangeClassName?: string;
  
  /**
   * Couleur du slider
   * @default "default"
   */
  color?: "default" | "success" | "info" | "warning" | "error";
}

/**
 * Composant Slider optimisé
 * - Support complet des thèmes clair/sombre
 * - Accessibilité ARIA améliorée
 * - Performance optimisée
 * - Options avancées : marqueurs, valeurs, tailles
 * - Styles dynamiques et variants
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ 
  className, 
  size = "default",
  showMarks = false,
  marks,
  showValue = false,
  formatValue = (value) => `${value}`,
  thumbClassName,
  trackClassName,
  rangeClassName,
  color = "default",
  ...props
}, ref) => {
  // Récupération du thème
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Valeur courante et ref pour connaître le thumb actif
  const [displayValue, setDisplayValue] = React.useState<number[]>(props.defaultValue || props.value || [0]);
  const [activeThumb, setActiveThumb] = React.useState<number | null>(null);
  
  // Mise à jour de la valeur affichée
  React.useEffect(() => {
    if (props.value) {
      setDisplayValue(props.value);
    }
  }, [props.value]);
  
  // Calcul des styles basés sur les props
  const sizeStyles = React.useMemo(() => {
    switch (size) {
      case "sm":
        return {
          track: "h-1",
          thumb: "h-3.5 w-3.5",
          markSize: "h-1.5 w-1.5",
          valueOffset: "-1.5rem"
        };
      case "lg":
        return {
          track: "h-3",
          thumb: "h-6 w-6",
          markSize: "h-2.5 w-2.5",
          valueOffset: "-2rem"
        };
      case "default":
      default:
        return {
          track: "h-2", 
          thumb: "h-5 w-5",
          markSize: "h-2 w-2",
          valueOffset: "-1.75rem"
        };
    }
  }, [size]);
  
  // Styles de couleur dynamiques
  const colorStyles = React.useMemo(() => {
    // Base sur le support du thème
    const colorMap = {
      default: {
        range: isDarkMode 
          ? "bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary" 
          : "bg-gradient-to-r from-indigo-500 to-indigo-600",
        thumb: isDarkMode 
          ? "border-vynal-accent-primary bg-vynal-purple-dark" 
          : "border-indigo-500 bg-white",
        ring: isDarkMode 
          ? "ring-vynal-accent-primary" 
          : "ring-indigo-500"
      },
      success: {
        range: isDarkMode 
          ? "bg-green-600" 
          : "bg-green-500",
        thumb: isDarkMode 
          ? "border-green-500 bg-vynal-purple-dark" 
          : "border-green-500 bg-white",
        ring: isDarkMode 
          ? "ring-green-500" 
          : "ring-green-500"
      },
      info: {
        range: isDarkMode 
          ? "bg-blue-600" 
          : "bg-blue-500",
        thumb: isDarkMode 
          ? "border-blue-500 bg-vynal-purple-dark" 
          : "border-blue-500 bg-white",
        ring: isDarkMode 
          ? "ring-blue-500" 
          : "ring-blue-500"
      },
      warning: {
        range: isDarkMode 
          ? "bg-amber-600" 
          : "bg-amber-500",
        thumb: isDarkMode 
          ? "border-amber-500 bg-vynal-purple-dark" 
          : "border-amber-500 bg-white",
        ring: isDarkMode 
          ? "ring-amber-500" 
          : "ring-amber-500"
      },
      error: {
        range: isDarkMode 
          ? "bg-red-600" 
          : "bg-red-500",
        thumb: isDarkMode 
          ? "border-red-500 bg-vynal-purple-dark" 
          : "border-red-500 bg-white",
        ring: isDarkMode 
          ? "ring-red-500" 
          : "ring-red-500"
      }
    };
    
    return colorMap[color] || colorMap.default;
  }, [color, isDarkMode]);
  
  // Générer les marqueurs
  const renderMarks = React.useMemo(() => {
    if (!showMarks && !marks) return null;
    
    // Valeurs min et max du slider
    const min = props.min || 0;
    const max = props.max || 100;
    const step = props.step || 1;
    const range = max - min;
    
    // Utiliser les marqueurs personnalisés ou générer des marqueurs basés sur step
    const markPositions = marks || Array.from(
      { length: Math.floor(range / step) + 1 },
      (_, i) => ({ value: min + i * step, label: undefined })
    );
    
    return markPositions.map((mark, index) => {
      // Calculer la position en % sur le track
      const position = ((mark.value - min) / range) * 100;
      
      return (
        <div 
          key={`mark-${index}`}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
            sizeStyles.markSize,
            // Couleur du marqueur en fonction de sa position par rapport à la valeur
            position <= ((displayValue[0] - min) / range) * 100 
              ? colorStyles.range.includes('gradient') ? 'bg-white' : 'bg-white'
              : isDarkMode ? 'bg-vynal-purple-secondary/50' : 'bg-gray-300'
          )}
          style={{ 
            left: `${position}%`,
            top: '50%',
            zIndex: 1
          }}
          aria-hidden="true"
        >
          {mark.label && (
            <div 
              className={cn(
                "absolute whitespace-nowrap text-[10px] transform -translate-x-1/2",
                "top-6",
                isDarkMode ? "text-vynal-text-secondary" : "text-gray-500"
              )}
              style={{ left: '50%' }}
            >
              {mark.label}
            </div>
          )}
        </div>
      );
    });
  }, [showMarks, marks, props.min, props.max, props.step, displayValue, sizeStyles.markSize, colorStyles.range, isDarkMode]);
  
  // Gestion des événements
  const handleValueChange = React.useCallback((newValue: number[]) => {
    setDisplayValue(newValue);
    
    // Si un gestionnaire onValueChange est fourni, l'appeler
    if (props.onValueChange) {
      props.onValueChange(newValue);
    }
  }, [props.onValueChange]);
  
  const handleValueCommit = React.useCallback(() => {
    // Fin de l'interaction
    setActiveThumb(null);
  }, []);
  
  return (
    <div className="relative">
      {/* Affichage des valeurs au-dessus */}
      {showValue && (
        <div className="flex w-full justify-between mb-2">
          {displayValue.map((val, idx) => (
            <div 
              key={idx}
              className={cn(
                "text-xs font-medium transition-opacity duration-200",
                activeThumb === idx ? "opacity-100" : "opacity-70",
                isDarkMode ? "text-vynal-text-primary" : "text-gray-700"
              )}
            >
              {formatValue(val)}
            </div>
          ))}
        </div>
      )}
      
      {/* Slider principal */}
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          showMarks && "mt-1.5 mb-4", // Espace pour les marqueurs
          className
        )}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        {...props}
      >
        <SliderPrimitive.Track 
          className={cn(
            "relative w-full grow overflow-hidden rounded-full",
            sizeStyles.track,
            isDarkMode ? "bg-vynal-purple-secondary/20" : "bg-gray-200",
            trackClassName
          )}
        >
          <SliderPrimitive.Range 
            className={cn(
              "absolute h-full",
              colorStyles.range,
              rangeClassName
            )} 
          />
        </SliderPrimitive.Track>
        
        {/* Marqueurs */}
        {renderMarks}
        
        {/* Thumbs */}
        {Array.from({ length: props.value?.length || props.defaultValue?.length || 1 }).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className={cn(
              "block rounded-full border-2 shadow-md transition-all",
              sizeStyles.thumb,
              colorStyles.thumb,
              // Effet d'état focus/hover
              "hover:scale-110 focus-visible:scale-110",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              colorStyles.ring,
              isDarkMode ? "ring-offset-vynal-purple-dark" : "ring-offset-white",
              // État désactivé  
              "disabled:pointer-events-none disabled:opacity-50",
              thumbClassName
            )}
            onFocus={() => setActiveThumb(i)}
            onBlur={() => setActiveThumb(null)}
            onPointerDown={() => setActiveThumb(i)}
            aria-label={
              props['aria-label'] || 
              (props.value?.length || props.defaultValue?.length || 1) > 1 
                ? `Curseur ${i + 1}` 
                : "Curseur"
            }
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };