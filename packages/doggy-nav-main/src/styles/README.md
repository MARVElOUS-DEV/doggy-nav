# Doggy Nav Design System

This document outlines the design system for the Doggy Nav project. Following these guidelines ensures consistency and maintainability across the application.

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Borders](#borders)
5. [Shadows](#shadows)
6. [Glassmorphism Effects](#glassmorphism-effects)
7. [Best Practices](#best-practices)

## Color Palette

We use a consistent color palette with semantic naming:

### Primary Colors (Blue-based)
- Primary 500: `#0ea5e9` - Main brand color
- Variations from 50 (lightest) to 900 (darkest)

### Secondary Colors (Purple-based)
- Secondary 500: `#8b5cf6` - Secondary brand color
- Variations from 50 (lightest) to 900 (darkest)

### Neutral Colors
- Neutral 500: `#737373` - Default text color
- Variations from 50 (lightest) to 900 (darkest)

### Status Colors
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Error: `#ef4444` (red)
- Info: `#3b82f6` (blue)

### Glassmorphism Colors
- Light Glass: `rgba(255, 255, 255, 0.2)`
- Medium Glass: `rgba(255, 255, 255, 0.3)`
- Dark Glass: `rgba(255, 255, 255, 0.4)`
- Glass Border: `rgba(255, 255, 255, 0.3)`

## Typography

### Font Families
- Sans-serif: `Helvetica Neue, Microsoft Yahei, system-ui, sans-serif`
- Monospace: `SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace`

### Font Sizes
| Class | Size | REM | Pixels |
|-------|------|-----|--------|
| text-xs | 0.75rem | 12px |
| text-sm | 0.875rem | 14px |
| text-base | 1rem | 16px |
| text-lg | 1.125rem | 18px |
| text-xl | 1.25rem | 20px |
| text-2xl | 1.5rem | 24px |
| text-3xl | 1.875rem | 30px |
| text-4xl | 2.25rem | 36px |

### Font Weights
- thin (100), extralight (200), light (300)
- normal (400), medium (500), semibold (600)
- bold (700), extrabold (800), black (900)

## Spacing

We use an 8-point grid system:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

## Borders

### Border Widths
- none: 0
- sm: 1px
- md: 2px
- lg: 4px

### Border Radius
- none: 0
- sm: 2px
- md: 4px
- lg: 8px
- xl: 12px
- 2xl: 16px
- full: 9999px

## Shadows

| Class | Shadow |
|-------|--------|
| shadow-sm | 0 1px 2px 0 rgba(0, 0, 0, 0.05) |
| shadow-md | 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) |
| shadow-lg | 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) |
| shadow-xl | 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) |
| shadow-2xl | 0 25px 50px -12px rgba(0, 0, 0, 0.25) |

## Glassmorphism Effects

### Backdrop Blur
- sm: blur(4px)
- md: blur(8px)
- lg: blur(12px)
- xl: blur(16px)

### Backdrop Saturate
- 180%

## Best Practices

### 1. Use Design Tokens
Instead of hardcoding values, use the design system tokens:

```tsx
// Good
import { colors, typography, spacing } from '@/styles/design-system';

const styles = {
  backgroundColor: colors.primary[500],
  color: colors.text.primary,
  fontSize: typography.fontSize.base,
  padding: spacing.md,
};

// Avoid
const styles = {
  backgroundColor: '#0ea5e9',
  color: '#171717',
  fontSize: '16px',
  padding: '16px',
};
```

### 2. Maintain Consistent Spacing
- Use the 8-point grid system for all spacing
- Apply consistent padding and margins using the spacing scale

### 3. Typography Hierarchy
- Use appropriate font sizes for headings and body text
- Maintain consistent line heights
- Use semantic HTML elements with appropriate styling

### 4. Color Usage
- Use primary colors for main actions and branding
- Use secondary colors for secondary actions
- Use status colors for feedback and alerts
- Ensure sufficient contrast for accessibility

### 5. Glassmorphism Guidelines
- Use glass effects sparingly for important UI elements
- Ensure content remains readable with glass backgrounds
- Combine backdrop blur with appropriate opacity levels

### 6. Responsive Design
- Use responsive utility classes for different screen sizes
- Test components across various device widths
- Maintain consistent spacing and typography at all breakpoints

### 7. CSS Utility Classes
We provide CSS utility classes for common styling needs:
- Glass effects: `.glass-light`, `.glass-medium`, `.glass-dark`
- Typography: `.text-xs` through `.text-4xl`
- Spacing: `.p-*`, `.m-*` classes
- Layout: `.flex-center`, `.flex-between`, etc.

### 8. Component Consistency
When creating new components:
1. Reference existing components for styling patterns
2. Use the design system tokens for colors, spacing, and typography
3. Follow the established naming conventions
4. Ensure components work well with the glassmorphism theme