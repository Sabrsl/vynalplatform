/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        'xs': '480px',
      },
      fontFamily: {
        poppins: ["var(--font-poppins)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        vynal: {
          purple: {
            light: "#340374",
            mid: "#20014a",
            dark: "#100422",
            darkest: "#0e0021",
            secondary: "#2A0C57",
          },
          accent: {
            primary: "#FF66B2",
            secondary: "#FF007F",
          },
          text: {
            primary: "#FFFFFF",
            secondary: "#D6D6D6",
          },
          status: {
            success: "#5BE49B",
            warning: "#FCD34D",
            error: "#EF4444",
          },
          gradient: {
            primary: "linear-gradient(180deg, #100422 0%, #0e0021 100%)",
            button: "linear-gradient(90deg, #FF66B2 0%, #FF007F 100%)",
            card: "linear-gradient(135deg, #2A0C57 0%, #100422 100%)",
          }
        },
      },
      backgroundImage: {
        'gradient-vynal': 'linear-gradient(180deg, #100422 0%, #0e0021 100%)',
        'gradient-vynal-horizontal': 'linear-gradient(90deg, #100422 0%, #0e0021 100%)',
        'gradient-card': 'linear-gradient(135deg, #2A0C57 0%, #100422 100%)',
        'gradient-button': 'linear-gradient(90deg, #FF66B2 0%, #FF007F 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-out-to-top": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-100%)" },
        },
        "slide-out-to-bottom": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fade-out 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-from-top": "slide-in-from-top 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-from-bottom": "slide-in-from-bottom 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-to-top": "slide-out-to-top 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-to-bottom": "slide-out-to-bottom 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-from-left": "slide-in-from-left 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-from-right": "slide-in-from-right 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-to-left": "slide-out-to-left 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-to-right": "slide-out-to-right 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('tailwind-scrollbar-hide')
  ],
} 