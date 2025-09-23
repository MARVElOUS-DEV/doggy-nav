// Design System for Doggy Nav
// Centralized styling variables and utilities

// Color Palette
export const colors = {
  // Primary Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Secondary Colors
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },

  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Glassmorphism Colors
  glass: {
    light: 'rgba(255, 255, 255, 0.2)',
    medium: 'rgba(255, 255, 255, 0.3)',
    dark: 'rgba(255, 255, 255, 0.4)',
    border: 'rgba(255, 255, 255, 0.3)',
  },

  // Text Colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#737373',
    disabled: '#a3a3a3',
    inverse: '#ffffff',
  },
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    sans: 'Helvetica Neue, Microsoft Yahei, system-ui, sans-serif',
    mono: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

// Spacing
export const spacing = {
  xs: '0.25rem',      // 4px
  sm: '0.5rem',       // 8px
  md: '1rem',         // 16px
  lg: '1.5rem',       // 24px
  xl: '2rem',         // 32px
  '2xl': '3rem',      // 48px
  '3xl': '4rem',      // 64px
};

// Borders
export const borders = {
  width: {
    none: '0',
    sm: '1px',
    md: '2px',
    lg: '4px',
  },
  radius: {
    none: '0',
    sm: '0.125rem',     // 2px
    md: '0.25rem',      // 4px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    full: '9999px',
  },
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Glassmorphism Effects
export const glassEffects = {
  backdropBlur: {
    sm: 'backdrop-filter: blur(4px);',
    md: 'backdrop-filter: blur(8px);',
    lg: 'backdrop-filter: blur(12px);',
    xl: 'backdrop-filter: blur(16px);',
  },
  backdropSaturate: 'backdrop-filter: saturate(180%);',
};

// Transitions
export const transitions = {
  default: 'transition: all 0.2s ease-in-out;',
  slow: 'transition: all 0.3s ease-in-out;',
  fast: 'transition: all 0.1s ease-in-out;',
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-Indices
export const zIndex = {
  auto: 'auto',
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
};

// Export utility classes for Tailwind-like usage
export const utils = {
  center: 'flex items-center justify-center',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexColumn: 'flex flex-col',
  fullSize: 'w-full h-full',
  rounded: `rounded-${borders.radius.lg}`,
  glassCard: `bg-${colors.glass.light} backdrop-filter backdrop-blur-lg backdrop-saturate-150 border border-${colors.glass.border}`,
};