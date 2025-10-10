import type { Config } from "tailwindcss";
import { colors, typography, spacing, borders, shadows, breakpoints } from "./src/styles/design-system";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Design system colors
        primary: colors.primary,
        secondary: colors.secondary,
        neutral: colors.neutral,
        status: colors.status,
        glass: colors.glass,
        text: colors.text,
        // Theme-aware colors using CSS variables
        'theme-background': 'var(--color-background)',
        'theme-foreground': 'var(--color-foreground)',
        'theme-card': 'var(--color-card)',
        'theme-card-foreground': 'var(--color-card-foreground)',
        'theme-primary': 'var(--color-primary)',
        'theme-primary-foreground': 'var(--color-primary-foreground)',
        'theme-secondary': 'var(--color-secondary)',
        'theme-secondary-foreground': 'var(--color-secondary-foreground)',
        'theme-muted': 'var(--color-muted)',
        'theme-muted-foreground': 'var(--color-muted-foreground)',
        'theme-border': 'var(--color-border)',
        'theme-sidebar': 'var(--color-sidebar)',
        'theme-sidebar-foreground': 'var(--color-sidebar-foreground)',
        // Legacy colors for backward compatibility
        link: '#3a8ee6',
        btn: '#4700f0',
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      spacing: {
        ...spacing,
        // Keep default Tailwind spacing and add custom ones
      },
      borderRadius: borders.radius,
      borderWidth: borders.width,
      boxShadow: shadows,
      screens: breakpoints,
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(-45deg, #2563eb, #7c3aed, #db2777, #059669, #0891b2, #4f46e5)",
      },
      animation: {
        'hero-gradient-flow': 'hero-gradient-flow 12s ease infinite',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'fade-in-simple': 'fade-in-simple 0.3s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'sway': 'sway 4s ease-in-out infinite',
      },
      keyframes: {
        'hero-gradient-flow': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-simple': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'sway': {
          '0%, 100%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateX(-8px) translateY(-2px) rotate(8deg)' },
          '50%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '75%': { transform: 'translateX(8px) translateY(-2px) rotate(-8deg)' },
        },
      },
      backdropBlur: {
        'glass-sm': '4px',
        'glass-md': '8px',
        'glass-lg': '12px',
        'glass-xl': '16px',
      },
      backdropSaturate: {
        150: '150%',
      },
    },
  },
  plugins: [],
};
export default config;
