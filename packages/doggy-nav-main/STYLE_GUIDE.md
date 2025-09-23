# Doggy Nav Style Guide

This document provides guidelines for maintaining consistency in the Doggy Nav project. Following these guidelines ensures a cohesive user experience and makes the codebase easier to maintain.

## Table of Contents
1. [Design System Overview](#design-system-overview)
2. [Color Usage](#color-usage)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Component Design](#component-design)
6. [Glassmorphism Guidelines](#glassmorphism-guidelines)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)

## Design System Overview

We maintain a centralized design system with the following key components:

### Color Palette
- **Primary**: Blue-based palette (#0ea5e9 and variations)
- **Secondary**: Purple-based palette (#8b5cf6 and variations)
- **Neutrals**: Grayscale palette for text and backgrounds
- **Status**: Colors for success, warning, error, and info states

### File Structure
```
src/
├── styles/
│   ├── design-system.ts     # Design tokens and constants
│   ├── utilities.css        # CSS utility classes
│   └── README.md            # Design system documentation
└── components/
    └── AppNavItem.tsx       # Example component using design system
```

## Color Usage

### Primary Colors
Use for main actions, links, and primary branding elements:
```css
/* CSS */
background-color: #0ea5e9; /* Primary 500 */
color: #0ea5e9; /* Primary 500 */

/* Or use CSS utility classes */
.bg-primary-500 { background-color: #0ea5e9; }
.text-primary-500 { color: #0ea5e9; }
```

```tsx
/* React/TypeScript */
import { colors } from '@/styles/design-system';

const styles = {
  backgroundColor: colors.primary[500],
  color: colors.primary[500]
};
```

### Status Colors
Use for feedback and state indicators:
- Success: #10b981 (green)
- Warning: #f59e0b (amber)
- Error: #ef4444 (red)
- Info: #3b82f6 (blue)

## Typography

### Font Families
- **Sans-serif**: `Helvetica Neue, Microsoft Yahei, system-ui, sans-serif`
- **Monospace**: `SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace`

### Font Sizes
Use the standardized scale:
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

### Font Weights
- thin (100), extralight (200), light (300)
- normal (400), medium (500), semibold (600)
- bold (700), extrabold (800), black (900)

## Spacing

We use an 8-point grid system for consistent spacing:
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)

Always use these values instead of arbitrary spacing:
```css
/* Good */
margin: 1rem; /* md */
padding: 0.5rem; /* sm */

/* Avoid */
margin: 15px;
padding: 12px;
```

## Component Design

### Consistency Principles
1. **Reusability**: Components should be generic enough to be reused
2. **Predictability**: Similar components should look and behave similarly
3. **Accessibility**: All components must be keyboard navigable and screen reader friendly
4. **Responsive**: Components should adapt to different screen sizes

### Component Structure
Follow this pattern for React components:
```tsx
import { useState } from 'react';
import { colors, spacing, typography } from '@/styles/design-system';

interface ComponentNameProps {
  // Props definition
}

export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  const [state, setState] = useState(initialValue);

  return (
    <div className="component-root">
      {/* Component content */}
    </div>
  );
}
```

### CSS Classes
1. Use utility classes from `utilities.css` when possible
2. Create semantic class names:
   ```css
   /* Good */
   .nav-card {}
   .nav-card__title {}
   .nav-card__content {}

   /* Avoid */
   .card {}
   .title {}
   .content {}
   ```

## Glassmorphism Guidelines

### When to Use
Apply glass effects to:
- Main content containers
- Cards and panels
- Navigation elements
- Modal dialogs

### Implementation
Use predefined utility classes:
```html
<!-- Light glass effect -->
<div class="glass-light"></div>

<!-- Medium glass effect (default) -->
<div class="glass-medium"></div>

<!-- Dark glass effect -->
<div class="glass-dark"></div>
```

Or use CSS variables directly:
```css
.glass-element {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px) saturate(150%);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Best Practices
1. Ensure content remains readable with glass backgrounds
2. Use appropriate contrast ratios for text
3. Avoid heavy glass effects on small text
4. Test glass effects across different background colors

## Responsive Design

### Breakpoints
- Small (sm): 640px
- Medium (md): 768px
- Large (lg): 1024px
- Extra Large (xl): 1280px
- 2X Large (2xl): 1536px

### Responsive Utilities
Use mobile-first approach:
```html
<!-- Visible on all screens -->
<div class="block"></div>

<!-- Visible only on medium screens and up -->
<div class="hidden md:block"></div>

<!-- Visible only on small screens -->
<div class="block md:hidden"></div>
```

### Flexible Layouts
1. Use CSS Grid and Flexbox for layouts
2. Implement responsive spacing with our spacing scale
3. Ensure touch targets are at least 44px

## Accessibility

### Color Contrast
- Maintain a contrast ratio of at least 4.5:1 for normal text
- Maintain a contrast ratio of at least 3:1 for large text
- Test with accessibility tools

### Keyboard Navigation
- Ensure all interactive elements are focusable
- Provide visible focus indicators
- Implement logical tab order

### Screen Reader Support
- Use semantic HTML elements
- Provide alt text for images
- Use ARIA attributes when necessary
- Test with screen readers

### Example Implementation
```tsx
// Good accessibility practices
<button
  aria-label="Close dialog"
  onClick={handleClose}
>
  <span className="icon-close" aria-hidden="true">×</span>
</button>

<img
  src="/logo.png"
  alt="Doggy Nav Logo"
  width={100}
  height={50}
/>
```

## Maintenance

### Updating the Design System
1. Make changes to `design-system.ts` first
2. Update `utilities.css` to reflect changes
3. Update components that use the changed tokens
4. Document breaking changes in release notes

### Adding New Components
1. Check existing components for patterns
2. Use design system tokens for colors, spacing, and typography
3. Follow the component structure guidelines
4. Ensure responsive and accessible design

This style guide is a living document. As the project evolves, update this guide to reflect new patterns and best practices.