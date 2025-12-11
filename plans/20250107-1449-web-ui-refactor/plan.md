# Sepolia-Health Web Admin Dashboard UI Refactor Implementation Plan

**Created:** 2025-01-07
**Objective:** Comprehensive refactoring of the Sepolia-Health web admin dashboard with modern design principles, dark/light theme switching, and healthcare-specific accessibility standards.

## Executive Summary

Based on thorough research and current codebase analysis, this plan provides two implementation approaches for modernizing the Sepolia-Health admin dashboard. The project currently uses a well-structured component library with Radix UI primitives, Tailwind CSS v4, and has existing theme infrastructure that can be enhanced.

**Recommended Approach:** Enhanced UI Library Integration (Approach 2) - leveraging the existing component architecture while introducing healthcare-specific design tokens and improved theming.

## Current State Analysis

### Strengths
- **Modern Foundation:** Next.js + TypeScript + Tailwind CSS v4 + Radix UI
- **Comprehensive UI Library:** 50+ components built on accessibility primitives
- **Existing Theme Infrastructure:** CSS custom properties with dark mode support
- **Healthcare Color Scheme:** Medical blue/green theme already established
- **Component Architecture:** Well-organized, accessible, and type-safe

### Gaps Identified
- Missing theme provider implementation (next-themes installed but not configured)
- No theme toggle component
- Limited healthcare-specific design tokens
- Accessibility needs enhancement for WCAG 2.2 compliance
- Theme switching not fully implemented

## Implementation Approaches

### Approach 1: Full Material-UI Healthcare Integration
**Overview:** Replace existing component system with Material-UI healthcare-specific components.

**Pros:**
- Comprehensive healthcare component ecosystem
- WCAG 2.2 AA compliance built-in
- Professional medical design patterns
- Large community and extensive documentation

**Cons:**
- Significant migration effort (replace 50+ components)
- Larger bundle size (~200KB gzipped)
- Loss of current component customization
- Steeper learning curve for team
- Potential disruption to existing workflow

**Effort Estimate:** 6-8 weeks, High Risk
**Bundle Impact:** +180KB
**Migration Complexity:** Very High

### Approach 2: Enhanced UI Library Integration (Recommended)
**Overview:** Enhance existing component library with healthcare-specific design tokens, improved theming, and Material Design inspiration.

**Pros:**
- Leverages existing component architecture
- Minimal disruption to current development
- Smaller bundle footprint
- Faster implementation timeline
- Maintains team familiarity with codebase
- Healthcare-specific enhancements can be targeted

**Cons:**
- Requires custom healthcare component development
- Less comprehensive than Material-UI healthcare
- More design system work required

**Effort Estimate:** 3-4 weeks, Low Risk
**Bundle Impact:** +30KB
**Migration Complexity:** Low

## Detailed Implementation Plan (Approach 2)

### Phase 1: Theme System Enhancement (Week 1)

#### 1.1 Healthcare Design Tokens Implementation
```typescript
// web/packages/ui/src/tokens/healthcare-colors.ts
export const healthcareColors = {
  // Trust Blue Palette - Healthcare Professional
  primary: {
    50: '#e0f2fe',
    100: '#bae6fd',
    500: '#0284c7',  // Medical Blue
    600: '#0369a1',
    900: '#0c4a6e'
  },

  // Health Green - Success/Vital Signs
  success: {
    50: '#ecfdf5',
    100: '#6ee7b7',
    500: '#10b981',  // Health Green
    600: '#059669'
  },

  // Clinical Orange - Warnings/Alerts
  warning: {
    50: '#fff7ed',
    100: '#fed7aa',
    500: '#f97316',  // Clinical Warning
    600: '#ea580c'
  },

  // Emergency Red - Critical Alerts
  destructive: {
    50: '#fef2f2',
    100: '#fecaca',
    500: '#ef4444',  // Emergency Red
    600: '#dc2626'
  },

  // Medical Purple - Special Indicators
  accent: {
    50: '#faf5ff',
    100: '#e9d5ff',
    500: '#9333ea',  // Medical Purple
    600: '#7c3aed'
  }
};
```

#### 1.2 Advanced Theme Provider
```typescript
// web/packages/ui/src/providers/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { createContext, useContext, useEffect, useState } from 'react';

// Healthcare-specific theme context
const HealthcareThemeContext = createContext({
  highContrastMode: false,
  reducedMotion: false,
  largeTextMode: false,
});

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeTextMode, setLargeTextMode] = useState(false);

  // Detect system accessibility preferences
  useEffect(() => {
    const mediaQueries = {
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      largeText: window.matchMedia('(min-resolution: 120dpi)')
    };

    setHighContrastMode(mediaQueries.highContrast.matches);
    setReducedMotion(mediaQueries.reducedMotion.matches);
    setLargeTextMode(mediaQueries.largeText.matches);

    // Listen for preference changes
    const handleChange = () => {
      setHighContrastMode(mediaQueries.highContrast.matches);
      setReducedMotion(mediaQueries.reducedMotion.matches);
      setLargeTextMode(mediaQueries.largeText.matches);
    };

    Object.values(mediaQueries).forEach(mq => mq.addEventListener('change', handleChange));
    return () => Object.values(mediaQueries).forEach(mq => mq.removeEventListener('change', handleChange));
  }, []);

  return (
    <HealthcareThemeContext.Provider value={{
      highContrastMode,
      reducedMotion,
      largeTextMode
    }}>
      <NextThemesProvider
        {...props}
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        storageKey="sepolia-health-theme"
      >
        <div className={`
          ${highContrastMode ? 'high-contrast' : ''}
          ${reducedMotion ? 'reduce-motion' : ''}
          ${largeTextMode ? 'large-text' : ''}
        `}>
          {children}
        </div>
      </NextThemesProvider>
    </HealthcareThemeContext.Provider>
  );
}
```

#### 1.3 Enhanced CSS Theme Variables
```css
/* web/packages/ui/src/styles/globals.css - Enhanced */
:root {
  /* Healthcare Professional Light Theme */
  --background: #ffffff;
  --background-secondary: #f8fafc;
  --background-tertiary: #f1f5f9;
  --foreground: #0f172a;

  /* Medical Blue Hierarchy */
  --primary: #0284c7;
  --primary-light: #bae6fd;
  --primary-dark: #0369a1;
  --primary-foreground: #ffffff;

  /* Health Green System */
  --success: #10b981;
  --success-light: #6ee7b7;
  --success-dark: #059669;
  --success-foreground: #ffffff;

  /* Clinical Warning Colors */
  --warning: #f59e0b;
  --warning-light: #fcd34d;
  --warning-dark: #d97706;
  --warning-foreground: #ffffff;

  /* Emergency Red */
  --destructive: #ef4444;
  --destructive-light: #fca5a5;
  --destructive-dark: #dc2626;
  --destructive-foreground: #ffffff;

  /* Medical Accent */
  --accent: #8b5cf6;
  --accent-light: #c4b5fd;
  --accent-dark: #7c3aed;
  --accent-foreground: #ffffff;

  /* Enhanced Medical Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-scale: 1; /* For accessibility scaling */

  /* Healthcare Spacing System */
  --spacing-unit: 0.25rem;
  --spacing-xs: calc(var(--spacing-unit) * 1);  /* 4px */
  --spacing-sm: calc(var(--spacing-unit) * 2);  /* 8px */
  --spacing-md: calc(var(--spacing-unit) * 4);  /* 16px */
  --spacing-lg: calc(var(--spacing-unit) * 6);  /* 24px */
  --spacing-xl: calc(var(--spacing-unit) * 8);  /* 32px */

  /* Medical Border Radius */
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */

  /* Enhanced Shadow System */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.dark {
  /* Healthcare Professional Dark Theme */
  --background: #0f172a;
  --background-secondary: #1e293b;
  --background-tertiary: #334155;
  --foreground: #f8fafc;

  /* Adjusted colors for dark mode */
  --primary: #0ea5e9;
  --primary-light: #38bdf8;
  --primary-dark: #0284c7;

  --success: #34d399;
  --success-light: #6ee7b7;

  --warning: #fbbf24;
  --warning-light: #fcd34d;

  --destructive: #f87171;
  --destructive-light: #fca5a5;

  --accent: #a78bfa;
  --accent-light: #c4b5fd;

  /* Dark mode enhanced shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6);
}

/* High Contrast Mode for Accessibility */
.high-contrast {
  --background: #ffffff !important;
  --foreground: #000000 !important;
  --primary: #0000ff !important;
  --success: #008000 !important;
  --warning: #ff8c00 !important;
  --destructive: #ff0000 !important;
  --border: #000000 !important;
}

.dark.high-contrast {
  --background: #000000 !important;
  --foreground: #ffffff !important;
  --border: #ffffff !important;
}

/* Reduced Motion */
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* Large Text Mode */
.large-text {
  --font-size-scale: 1.2;
}

.large-text body {
  font-size: calc(1rem * var(--font-size-scale));
}
```

### Phase 2: Healthcare Component Enhancement (Week 2)

#### 2.1 Theme Toggle Component
```typescript
// web/packages/ui/src/components/theme-toggle.tsx
'use client';

import { Moon, Sun, Monitor, Contrast } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          document.documentElement.classList.toggle('high-contrast');
        }}>
          <Contrast className="mr-2 h-4 w-4" />
          <span>High Contrast</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 2.2 Healthcare-Specific Button Variants
```typescript
// web/packages/ui/src/components/button.tsx - Enhanced
import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Healthcare-specific variants
        medical: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
        emergency: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg animate-pulse',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
        // Clinical workflow variants
        clinical: 'bg-accent text-accent-foreground hover:bg-accent/80 border border-border',
        diagnostic: 'bg-background text-foreground border-2 border-primary hover:bg-primary hover:text-primary-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        // Healthcare-specific sizes
        medical: 'h-12 px-6 text-base font-semibold',
        compact: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

#### 2.3 Medical Status Badge Component
```typescript
// web/packages/ui/src/components/medical-badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const medicalBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      status: {
        // Patient Status
        'critical': 'bg-destructive text-destructive-foreground animate-pulse',
        'stable': 'bg-success text-success-foreground',
        'recovery': 'bg-warning text-warning-foreground',
        'observation': 'bg-accent text-accent-foreground',

        // Appointment Status
        'scheduled': 'bg-primary text-primary-foreground',
        'in-progress': 'bg-warning text-warning-foreground animate-pulse',
        'completed': 'bg-success text-success-foreground',
        'cancelled': 'bg-destructive text-destructive-foreground',
        'no-show': 'bg-muted text-muted-foreground',

        // Medical Priority
        'high-priority': 'bg-destructive text-destructive-foreground border border-destructive/50',
        'medium-priority': 'bg-warning text-warning-foreground border border-warning/50',
        'low-priority': 'bg-success text-success-foreground border border-success/50',

        // Clinical Status
        'positive': 'bg-success text-success-foreground',
        'negative': 'bg-muted text-muted-foreground',
        'inconclusive': 'bg-warning text-warning-foreground',
        'pending': 'bg-accent text-accent-foreground',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    defaultVariants: {
      status: 'stable',
      size: 'md',
    },
  }
);

export interface MedicalBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof medicalBadgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

export function MedicalBadge({
  className,
  status,
  size,
  icon,
  pulse,
  children,
  ...props
}: MedicalBadgeProps) {
  return (
    <div
      className={cn(
        medicalBadgeVariants({ status, size }),
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}
```

### Phase 3: Healthcare-Specific Components (Week 3)

#### 3.1 Vital Signs Card Component
```typescript
// web/packages/ui/src/components/vital-signs-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Heart, Activity, Thermometer, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VitalSign {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

interface VitalSignsCardProps {
  vitals: VitalSign[];
  patientName?: string;
  lastUpdated?: string;
  className?: string;
}

export function VitalSignsCard({
  vitals,
  patientName,
  lastUpdated,
  className
}: VitalSignsCardProps) {
  const getStatusColor = (status: VitalSign['status']) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      case 'normal': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card className={cn('medical-card', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Vital Signs
          </span>
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              {lastUpdated}
            </span>
          )}
        </CardTitle>
        {patientName && (
          <p className="text-sm text-muted-foreground">{patientName}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {vitals.map((vital, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-3 rounded-lg bg-background border"
            >
              <div className="flex items-center gap-2 mb-2">
                {vital.icon}
                <Badge variant={getStatusColor(vital.status)}>
                  {vital.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {vital.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {vital.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {vital.label}
              </div>
              {vital.trend && (
                <div className="text-xs mt-1">
                  {vital.trend === 'up' && '↑'}
                  {vital.trend === 'down' && '↓'}
                  {vital.trend === 'stable' && '→'}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3.2 Medical Form Component
```typescript
// web/packages/ui/src/components/medical-form.tsx
import { Form } from './form';
import { Field } from './field';
import { MedicalBadge } from './medical-badge';
import { cn } from '@/lib/utils';

interface MedicalFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: string;
  placeholder?: string;
}

interface MedicalFormSection {
  title: string;
  description?: string;
  fields: MedicalFormField[];
}

interface MedicalFormProps {
  sections: MedicalFormSection[];
  onSubmit: (data: any) => void;
  className?: string;
  title?: string;
  subtitle?: string;
  emergency?: boolean;
}

export function MedicalForm({
  sections,
  onSubmit,
  className,
  title,
  subtitle,
  emergency = false
}: MedicalFormProps) {
  return (
    <div className={cn('medical-form max-w-4xl mx-auto', className)}>
      {title && (
        <div className="mb-6 text-center">
          <h2 className={cn(
            'text-2xl font-bold text-foreground',
            emergency && 'text-destructive'
          )}>
            {emergency && <span className="mr-2">🚨</span>}
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
      )}

      <Form onSubmit={onSubmit} className="space-y-8">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="medical-form-section">
            <div className="mb-6 pb-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {section.fields.map((field, fieldIndex) => (
                <Field
                  key={fieldIndex}
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  required={field.required}
                  options={field.options}
                  validation={field.validation}
                  placeholder={field.placeholder}
                  className="medical-field"
                />
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-4 pt-6 border-t border-border">
          <button
            type="button"
            className="px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={cn(
              'px-6 py-2 text-sm font-medium rounded-md transition-colors',
              emergency
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {emergency ? 'Emergency Submit' : 'Submit'}
          </button>
        </div>
      </Form>
    </div>
  );
}
```

### Phase 4: Accessibility & Healthcare Compliance (Week 4)

#### 4.1 Enhanced Accessibility Utilities
```typescript
// web/packages/ui/src/lib/accessibility.ts
export const healthcareAccessibility = {
  // Screen reader announcements for medical data
  announceVitalChange: (vital: string, value: string, status: string) => {
    const announcement = `Vital sign ${vital} is now ${value}, status: ${status}`;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 1000);
  },

  // Emergency notifications for screen readers
  announceEmergency: (message: string) => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = `Emergency: ${message}`;
    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 5000);
  },

  // Keyboard navigation enhancement for medical forms
  setupMedicalFormNavigation: (formElement: HTMLElement) => {
    const inputs = formElement.querySelectorAll('input, select, textarea, button');

    inputs.forEach((input, index) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextInput = inputs[index + 1] as HTMLElement;
          nextInput?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevInput = inputs[index - 1] as HTMLElement;
          prevInput?.focus();
        }
      });
    });
  },

  // High contrast mode detection
  isHighContrastMode: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Reduced motion detection
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};
```

#### 4.2 Healthcare Accessibility Styles
```css
/* Enhanced accessibility styles for healthcare */
@media (prefers-contrast: high) {
  .medical-card {
    border: 2px solid currentColor;
  }

  .medical-field input,
  .medical-field select,
  .medical-field textarea {
    border: 2px solid currentColor;
    background: Window;
    color: WindowText;
  }

  .vital-signs-card [data-status="critical"] {
    border: 3px solid #ff0000;
    background: #fff0f0;
  }
}

/* Focus enhancements for medical forms */
.medical-field input:focus,
.medical-field select:focus,
.medical-field textarea:focus {
  outline: 3px solid var(--ring);
  outline-offset: 2px;
}

/* Emergency mode styling */
.emergency-mode {
  --primary: var(--destructive);
  --background: #fff0f0;
}

.dark .emergency-mode {
  --background: #2d0a0a;
}

/* Screen reader only content but accessible to voice assistants */
.sr-only:not(:focus):not(:active) {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

/* Large text for medical data */
@media (min-resolution: 120dpi) {
  .vital-signs-card .text-2xl {
    font-size: 1.5rem;
  }

  .medical-form label {
    font-size: 1.1rem;
  }
}
```

## Implementation Timeline

### Week 1: Theme System Enhancement
- **Days 1-2:** Implement healthcare design tokens
- **Days 3-4:** Create enhanced theme provider with accessibility
- **Days 5-7:** Update CSS variables and test theme switching

### Week 2: Component Enhancement
- **Days 1-2:** Develop theme toggle component
- **Days 3-4:** Enhance button and core components with healthcare variants
- **Days 5-7:** Create medical badge and status components

### Week 3: Healthcare-Specific Components
- **Days 1-3:** Develop vital signs and medical data components
- **Days 4-5:** Create medical form components
- **Days 6-7:** Implement clinical workflow components

### Week 4: Accessibility & Testing
- **Days 1-3:** Implement healthcare accessibility features
- **Days 4-5:** WCAG 2.2 compliance testing and fixes
- **Days 6-7:** Performance optimization and documentation

## Technical Specifications

### Bundle Size Management
- Current estimated bundle: ~80KB (UI components only)
- Expected increase: +30KB (healthcare enhancements)
- Total estimated: ~110KB
- Optimization: Code splitting for medical components

### Performance Considerations
- **CSS Custom Properties:** Fast theme switching without re-render
- **Component Lazy Loading:** Medical components loaded on-demand
- **Accessibility Detection:** Client-side only to prevent server-side bloat
- **Icon Optimization:** Lucide React tree-shaking for medical icons

### Browser Support
- Modern browsers (ES2020+)
- Safari 14+
- Firefox 90+
- Chrome 90+
- Edge 90+

### Accessibility Standards
- WCAG 2.2 AA compliance
- HHS healthcare accessibility guidelines
- Section 508 compliance
- Screen reader compatibility (NVDA, JAWS, VoiceOver)

## Testing Strategy

### Automated Testing
```typescript
// web/packages/ui/src/__tests__/theme-provider.test.tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../providers/theme-provider';

describe('ThemeProvider', () => {
  it('renders children correctly', () => {
    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('detects high contrast mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(document.querySelector('.high-contrast')).toBeInTheDocument();
  });
});
```

### Accessibility Testing
1. **Automated:** axe-core integration for WCAG compliance
2. **Manual:** Screen reader testing with NVDA and VoiceOver
3. **Keyboard Navigation:** Full keyboard accessibility validation
4. **Color Contrast:** 7:1 contrast ratio for medical data
5. **Healthcare-Specific:** Medical form usability testing

### Performance Testing
1. **Bundle Analysis:** webpack-bundle-analyzer integration
2. **Load Time:** Lighthouse performance scoring
3. **Theme Switching:** Performance measurement for theme changes
4. **Component Rendering:** React DevTools profiling

## Migration Strategy

### Phase 1: Infrastructure (No Breaking Changes)
- New theme provider alongside existing
- Healthcare design tokens added incrementally
- Backward compatibility maintained

### Phase 2: Gradual Component Enhancement
- Extend existing components with healthcare variants
- New medical components added alongside existing
- Optional adoption for existing components

### Phase 3: Complete Integration
- Full theme provider rollout
- Component migration to healthcare-enhanced versions
- Legacy component deprecation and removal

### Rollback Plan
- Feature flags for healthcare enhancements
- Legacy theme system maintained during migration
- Gradual rollout with fallback options

## Success Metrics

### Technical Metrics
- Bundle size increase < 50KB
- Lighthouse accessibility score: 95+
- Theme switching performance: < 100ms
- Component render performance: < 16ms

### User Experience Metrics
- WCAG 2.2 AA compliance: 100%
- User satisfaction score: 4.5+/5
- Task completion rate: >95%
- Accessibility complaint rate: 0%

### Healthcare-Specific Metrics
- Medical data readability: High contrast compliance
- Clinical workflow efficiency: 20% improvement
- Error reduction in medical forms: 30%
- Emergency response time: < 5 seconds

## Risk Assessment & Mitigation

### High-Risk Items
1. **Accessibility Compliance**
   - Risk: WCAG 2.2 requirements complexity
   - Mitigation: Expert accessibility review, automated testing

2. **Performance Impact**
   - Risk: Bundle size increase affecting load times
   - Mitigation: Code splitting, lazy loading, performance monitoring

### Medium-Risk Items
1. **User Adoption**
   - Risk: Resistance to new theme system
   - Mitigation: Gradual rollout, user training, feedback collection

2. **Cross-Browser Compatibility**
   - Risk: CSS custom properties in older browsers
   - Mitigation: Progressive enhancement, fallbacks

### Low-Risk Items
1. **Development Workflow**
   - Risk: Learning curve for new components
   - Mitigation: Documentation, examples, gradual migration

## Documentation Requirements

### Developer Documentation
1. **Component Library Docs:** Storybook integration with medical examples
2. **Design System Guide:** Healthcare design tokens and usage patterns
3. **Accessibility Guide:** WCAG compliance and healthcare standards
4. **Migration Guide:** Step-by-step component migration instructions

### User Documentation
1. **Theme Switching Guide:** How to use and customize themes
2. **Accessibility Features:** Available options and how to enable
3. **Medical Component Usage:** Healthcare-specific component patterns

## Conclusion

This implementation plan provides a comprehensive approach to modernizing the Sepolia-Health admin dashboard while maintaining the existing component architecture and introducing healthcare-specific enhancements. The recommended approach leverages current investments while addressing the specific needs of healthcare professionals and patients.

The plan prioritizes accessibility, performance, and user experience while ensuring compliance with healthcare industry standards. The phased implementation allows for gradual adoption and testing at each stage, minimizing risk to existing functionality.

**Next Steps:**
1. Stakeholder review and approval of the plan
2. Development environment setup for Phase 1
3. Healthcare design token finalization with medical professionals
4. Accessibility requirements validation with compliance team

---

**File Location:** `plans/20250107-1449-web-ui-refactor/plan.md`
**Implementation Start:** Upon stakeholder approval
**Expected Completion:** 4 weeks from start date