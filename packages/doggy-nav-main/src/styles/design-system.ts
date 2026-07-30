// Design System for Doggy Nav
// Centralized styling variables and utilities

// Color Palette
export const colors = {
  // Primary Colors
  primary: {
    50: '#f1f5ef',
    100: '#e2eadf',
    200: '#c7d6c3',
    300: '#a7bda1',
    400: '#819c7b',
    500: '#607c5f',
    600: '#496348',
    700: '#304638',
    800: '#273a2e',
    900: '#1c2a22',
  },

  // Secondary Colors
  secondary: {
    50: '#fbfaf7',
    100: '#f4f0e8',
    200: '#e7e0d3',
    300: '#d3c8b6',
    400: '#b5a78f',
    500: '#94856d',
    600: '#776a57',
    700: '#5d5345',
    800: '#453e35',
    900: '#302c27',
  },

  // Neutral Colors
  neutral: {
    50: '#fbfaf7',
    100: '#f4f1ea',
    200: '#e1ddd3',
    300: '#cbc5b9',
    400: '#9e9b90',
    500: '#74786f',
    600: '#5a5f56',
    700: '#41463f',
    800: '#2d312b',
    900: '#20231d',
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
    primary: '#20231d',
    secondary: '#5a5f56',
    tertiary: '#74786f',
    disabled: '#9e9b90',
    inverse: '#ffffff',
  },
};

// Dark Mode Color Mappings
export const darkColors = {
  // Neutral Colors (inverted for dark mode)
  neutral: {
    50: '#11130f',
    100: '#1b1e19',
    200: '#30352e',
    300: '#454b42',
    400: '#747a6f',
    500: '#a8ab9f',
    600: '#c7c9bf',
    700: '#dcddd5',
    800: '#eeece5',
    900: '#f7f4ed',
  },

  // Dark Mode Glass Effects
  glass: {
    light: 'rgba(0, 0, 0, 0.2)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  // Dark Mode Text Colors
  text: {
    primary: '#f4f0e8',
    secondary: '#c7c9bf',
    tertiary: '#a8ab9f',
    disabled: '#747a6f',
    inverse: '#20231d',
  },

  // Dark Mode Background Colors
  background: {
    primary: '#11130f',
    secondary: '#1b1e19',
    tertiary: '#252a23',
    card: '#171a15',
    sidebar: '#121811',
  },
};

// Theme-aware color tokens
export const themeColors = {
  light: {
    background: '#f6f3ec',
    foreground: '#20231d',
    card: '#fffdf9',
    cardForeground: '#20231d',
    popover: '#fffdf9',
    popoverForeground: '#20231d',
    primary: colors.primary[700],
    primaryForeground: '#ffffff',
    secondary: colors.primary[100],
    secondaryForeground: colors.primary[800],
    muted: colors.neutral[100],
    mutedForeground: colors.neutral[500],
    accent: colors.primary[100],
    accentForeground: colors.primary[800],
    destructive: colors.status.error,
    destructiveForeground: '#ffffff',
    border: colors.neutral[200],
    input: colors.neutral[300],
    ring: colors.primary[500],
    sidebar: '#f1efe8',
    sidebarForeground: colors.neutral[700],
  },
  dark: {
    background: darkColors.background.primary,
    foreground: darkColors.text.primary,
    card: darkColors.background.card,
    cardForeground: darkColors.text.primary,
    popover: darkColors.background.secondary,
    popoverForeground: darkColors.text.primary,
    primary: '#dce8d8',
    primaryForeground: darkColors.background.primary,
    secondary: '#252b23',
    secondaryForeground: darkColors.text.primary,
    muted: darkColors.neutral[100],
    mutedForeground: darkColors.neutral[400],
    accent: darkColors.neutral[100],
    accentForeground: darkColors.text.primary,
    destructive: colors.status.error,
    destructiveForeground: '#ffffff',
    border: darkColors.neutral[200],
    input: darkColors.neutral[300],
    ring: '#9caf96',
    sidebar: darkColors.background.sidebar,
    sidebarForeground: darkColors.neutral[700],
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
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
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
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
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
    sm: '0.125rem', // 2px
    md: '0.25rem', // 4px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
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
  glassCard: `bg-glass-light backdrop-blur-glass-lg backdrop-saturate-150 border border-glass-border`,
  darkGlassCard: `dark:bg-black/20 dark:border-white/10`,
};

// Theme utility functions
export const getThemeColor = (colorPath: string, theme: 'light' | 'dark' = 'light') => {
  const colorMap = theme === 'dark' ? themeColors.dark : themeColors.light;
  return colorMap[colorPath as keyof typeof colorMap] || colorPath;
};

// CSS variable helpers for dynamic theming
export const cssVariables = {
  light: {
    '--color-background': themeColors.light.background,
    '--color-foreground': themeColors.light.foreground,
    '--color-card': themeColors.light.card,
    '--color-card-foreground': themeColors.light.cardForeground,
    '--color-primary': themeColors.light.primary,
    '--color-primary-foreground': themeColors.light.primaryForeground,
    '--color-secondary': themeColors.light.secondary,
    '--color-secondary-foreground': themeColors.light.secondaryForeground,
    '--color-muted': themeColors.light.muted,
    '--color-muted-foreground': themeColors.light.mutedForeground,
    '--color-accent': themeColors.light.accent,
    '--color-accent-foreground': themeColors.light.accentForeground,
    '--color-destructive': themeColors.light.destructive,
    '--color-destructive-foreground': themeColors.light.destructiveForeground,
    '--color-border': themeColors.light.border,
    '--color-input': themeColors.light.input,
    '--color-ring': themeColors.light.ring,
    '--color-sidebar': themeColors.light.sidebar,
    '--color-sidebar-foreground': themeColors.light.sidebarForeground,
  },
  dark: {
    '--color-background': themeColors.dark.background,
    '--color-foreground': themeColors.dark.foreground,
    '--color-card': themeColors.dark.card,
    '--color-card-foreground': themeColors.dark.cardForeground,
    '--color-primary': themeColors.dark.primary,
    '--color-primary-foreground': themeColors.dark.primaryForeground,
    '--color-secondary': themeColors.dark.secondary,
    '--color-secondary-foreground': themeColors.dark.secondaryForeground,
    '--color-muted': themeColors.dark.muted,
    '--color-muted-foreground': themeColors.dark.mutedForeground,
    '--color-accent': themeColors.dark.accent,
    '--color-accent-foreground': themeColors.dark.accentForeground,
    '--color-destructive': themeColors.dark.destructive,
    '--color-destructive-foreground': themeColors.dark.destructiveForeground,
    '--color-border': themeColors.dark.border,
    '--color-input': themeColors.dark.input,
    '--color-ring': themeColors.dark.ring,
    '--color-sidebar': themeColors.dark.sidebar,
    '--color-sidebar-foreground': themeColors.dark.sidebarForeground,
  },
};
