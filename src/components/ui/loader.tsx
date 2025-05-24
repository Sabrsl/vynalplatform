import { cn } from "@/lib/utils";

// Styles CSS extraits pour éviter la réinjection à chaque rendu
const loaderStyles = `
  .loader-path {
    fill: none;
    stroke-miterlimit: 10;
    stroke-width: 2.5px;
    opacity: 0.3;
    animation: loader-dash 1.75s ease-out infinite;
    stroke-linecap: round;
  }
  .loader-path-secondary {
    stroke-width: 1.75px;
    opacity: 0.4;
  }
  @keyframes loader-dash {
    0% {
      stroke-dasharray: 0, 158;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 79, 158;
      stroke-dashoffset: -30px;
    }
    100% {
      stroke-dasharray: 0, 158;
      stroke-dashoffset: -158px;
    }
  }
`;

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "white";
  showText?: boolean;
  text?: string;
}

export function Loader({
  size = "md",
  variant = "primary",
  showText = false,
  text = "Chargement en cours...",
  className,
  ...props
}: LoaderProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const textColorClasses = {
    primary: "text-slate-800 dark:text-vynal-text-primary",
    secondary: "text-slate-600 dark:text-vynal-text-secondary",
    white: "text-white",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)} {...props}>
      <style>{loaderStyles}</style>
      <div className="relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="59.072" 
          height="26.388" 
          viewBox="0 0 59.072 26.388" 
          className={sizeClasses[size]}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="grad2" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#e23838" />
              <stop offset="33%" stopColor="#973999" />
              <stop offset="67%" stopColor="#009cdf" />
              <stop offset="100%" stopColor="#5ebd3e" />
            </linearGradient>
          </defs>
          <path 
            className="loader-path" 
            stroke="url(#grad2)" 
            d="M281.3,267.819a11.944,11.944,0,0,1,0-23.888c10.85,0,21.834,23.888,32.684,23.888a11.944,11.944,0,0,0,0-23.888C303.171,243.931,292.109,267.819,281.3,267.819Z" 
            transform="translate(-268.104 -242.681)" 
          />
        </svg>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="59.072" 
          height="26.388" 
          viewBox="0 0 59.072 26.388" 
          className={cn("absolute top-0 left-0", sizeClasses[size])}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#705bff" />
              <stop offset="33%" stopColor="#322c7e" />
              <stop offset="67%" stopColor="#7881da" />
              <stop offset="100%" stopColor="#52dfac" />
            </linearGradient>
          </defs>
          <path 
            className="loader-path loader-path-secondary" 
            stroke="url(#grad1)" 
            d="M281.3,267.819a11.944,11.944,0,0,1,0-23.888c10.85,0,21.834,23.888,32.684,23.888a11.944,11.944,0,0,0,0-23.888C303.171,243.931,292.109,267.819,281.3,267.819Z" 
            transform="translate(-268.104 -242.681)" 
          />
        </svg>
      </div>
      
      {showText && (
        <p className={cn(
          "mt-3 transition-colors duration-200",
          textSizeClasses[size],
          textColorClasses[variant]
        )}>
          {text}
        </p>
      )}
    </div>
  );
} 