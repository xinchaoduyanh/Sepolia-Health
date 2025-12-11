# Phase 2: Component Enhancement

**Duration:** Week 2 (7 days)
**Objective:** Enhance existing UI components with healthcare-specific variants, improved accessibility, and medical workflow optimizations.

## Day 1-2: Theme Toggle & Navigation Components

### 1.1 Theme Toggle Component
Create `web/packages/ui/src/components/theme-toggle.tsx`:

```typescript
'use client';

import { Moon, Sun, Monitor, Contrast, Accessibility, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useHealthcareTheme } from '../providers/healthcare-theme-context';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { config, updateConfig } = useHealthcareTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    // Auto-enable emergency mode for emergency theme
    if (newTheme === 'emergency') {
      updateConfig({ emergencyMode: true });
    } else {
      updateConfig({ emergencyMode: false });
    }
  };

  const handleColorBlindMode = (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => {
    updateConfig({ colorBlindMode: mode });
  };

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'clinical': return <Palette className="h-4 w-4" />;
      case 'emergency': return <Contrast className="h-4 w-4 text-destructive" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Theme Selection */}
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('clinical')}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Clinical</span>
          {theme === 'clinical' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('emergency')}>
          <Contrast className="mr-2 h-4 w-4 text-destructive" />
          <span className="text-destructive">Emergency</span>
          {theme === 'emergency' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Accessibility Options */}
        <DropdownMenuLabel>Accessibility</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => updateConfig({ highContrastMode: !config.highContrastMode })}
        >
          <Accessibility className="mr-2 h-4 w-4" />
          <span>High Contrast</span>
          {config.highContrastMode && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateConfig({ reducedMotion: !config.reducedMotion })}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Reduced Motion</span>
          {config.reducedMotion && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateConfig({ largeTextMode: !config.largeTextMode })}
        >
          <span className="mr-2 h-4 w-4">A+</span>
          <span>Large Text</span>
          {config.largeTextMode && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Color Blind Support */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Color Vision</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleColorBlindMode('none')}>
              <span>Normal</span>
              {config.colorBlindMode === 'none' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleColorBlindMode('protanopia')}>
              <span>Protanopia (Red-Blind)</span>
              {config.colorBlindMode === 'protanopia' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleColorBlindMode('deuteranopia')}>
              <span>Deuteranopia (Green-Blind)</span>
              {config.colorBlindMode === 'deuteranopia' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleColorBlindMode('tritanopia')}>
              <span>Tritanopia (Blue-Blind)</span>
              {config.colorBlindMode === 'tritanopia' && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 1.2 Healthcare-Enhanced Button Component
Update `web/packages/ui/src/components/button.tsx`:

```typescript
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',

        // Healthcare-specific variants
        medical: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-95 font-semibold',
        emergency: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg active:scale-95 font-bold animate-pulse',
        success: 'bg-success text-success-foreground hover:bg-success/90 active:scale-95',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90 active:scale-95',

        // Clinical workflow variants
        clinical: 'bg-accent text-accent-foreground hover:bg-accent/80 border border-border active:scale-95',
        diagnostic: 'bg-background text-foreground border-2 border-primary hover:bg-primary hover:text-primary-foreground active:scale-95',
        therapeutic: 'bg-success text-success-foreground hover:bg-success/90 active:scale-95',

        // Vital signs variants
        vital: 'bg-background text-foreground border border-border hover:border-primary active:scale-95',
        'vital-normal': 'bg-success/10 text-success border border-success/30 hover:bg-success/20',
        'vital-warning': 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20',
        'vital-critical': 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 animate-pulse',

        // Patient status variants
        'patient-stable': 'bg-success/20 text-success-foreground hover:bg-success/30',
        'patient-critical': 'bg-destructive/20 text-destructive-foreground hover:bg-destructive/30 animate-pulse',
        'patient-recovering': 'bg-warning/20 text-warning-foreground hover:bg-warning/30',

        // Appointment variants
        'appointment-scheduled': 'bg-primary/20 text-primary hover:bg-primary/30',
        'appointment-in-progress': 'bg-warning/20 text-warning hover:bg-warning/30',
        'appointment-completed': 'bg-success/20 text-success hover:bg-success/30',
        'appointment-cancelled': 'bg-destructive/20 text-destructive hover:bg-destructive/30',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',

        // Healthcare-specific sizes
        medical: 'h-12 px-6 text-base font-semibold',
        compact: 'h-8 px-3 text-xs',
        vital: 'h-14 px-4 text-lg font-bold',
        emergency: 'h-14 px-8 text-lg font-bold animate-pulse',
      },
      priority: {
        low: 'opacity-70',
        medium: 'opacity-85',
        high: 'opacity-100',
        urgent: 'opacity-100 animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      priority: 'medium',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  medicalData?: {
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    category?: 'diagnostic' | 'therapeutic' | 'administrative' | 'emergency';
    patientSafety?: boolean;
  };
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, priority, asChild = false, loading, medicalData, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // Determine final variant based on medical data
    const finalVariant = medicalData ? (
      medicalData.patientSafety ? 'emergency' :
      medicalData.category === 'emergency' ? 'emergency' :
      medicalData.category === 'diagnostic' ? 'diagnostic' :
      medicalData.category === 'therapeutic' ? 'therapeutic' :
      medicalData.urgency === 'urgent' ? 'emergency' :
      medicalData.urgency === 'high' ? 'warning' :
      variant
    ) : variant;

    const finalPriority = medicalData?.urgency || priority;

    // ARIA labels for medical context
    const ariaLabel = medicalData ? (
      `${medicalData.patientSafety ? 'Critical safety: ' : ''}${children as string}`
    ) : undefined;

    return (
      <Comp
        className={cn(buttonVariants({ variant: finalVariant, size, priority: finalPriority }), className)}
        ref={ref}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-busy={loading}
        data-medical-category={medicalData?.category}
        data-patient-safety={medicalData?.patientSafety}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {medicalData?.patientSafety && (
          <span className="mr-2 text-xs">⚠️</span>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

## Day 3-4: Medical Badge & Status Components

### 2.1 Enhanced Medical Badge Component
Update `web/packages/ui/src/components/medical-badge.tsx`:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, XCircle, Activity } from 'lucide-react';

const medicalBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      status: {
        // Patient Status
        'patient-critical': 'bg-destructive/20 text-destructive border border-destructive/30 animate-pulse',
        'patient-serious': 'bg-destructive/10 text-destructive border border-destructive/20',
        'patient-stable': 'bg-success/20 text-success border border-success/30',
        'patient-recovering': 'bg-warning/20 text-warning border border-warning/30',
        'patient-discharged': 'bg-muted text-muted-foreground border border-border',
        'patient-admitted': 'bg-primary/20 text-primary border border-primary/30',

        // Appointment Status
        'appointment-scheduled': 'bg-primary/15 text-primary border border-primary/25',
        'appointment-confirmed': 'bg-success/15 text-success border border-success/25',
        'appointment-in-progress': 'bg-warning/20 text-warning border border-warning/30 animate-pulse',
        'appointment-completed': 'bg-success/20 text-success border border-success/30',
        'appointment-cancelled': 'bg-destructive/15 text-destructive border border-destructive/25',
        'appointment-no-show': 'bg-muted text-muted-foreground border border-border',

        // Medical Priority
        'priority-urgent': 'bg-destructive/20 text-destructive border border-destructive/30 animate-pulse font-semibold',
        'priority-high': 'bg-warning/20 text-warning border border-warning/30 font-semibold',
        'priority-medium': 'bg-accent/20 text-accent-foreground border border-accent/30',
        'priority-low': 'bg-muted text-muted-foreground border border-border',
        'priority-routine': 'bg-primary/10 text-primary border border-primary/20',

        // Clinical Status
        'clinical-positive': 'bg-success/20 text-success border border-success/30',
        'clinical-negative': 'bg-muted text-muted-foreground border border-border',
        'clinical-inconclusive': 'bg-warning/20 text-warning border border-warning/30',
        'clinical-pending': 'bg-accent/20 text-accent-foreground border border-accent/30',
        'clinical-abnormal': 'bg-destructive/20 text-destructive border border-destructive/30',
        'clinical-normal': 'bg-success/20 text-success border border-success/30',

        // Vital Signs Status
        'vital-critical': 'bg-destructive/30 text-destructive border border-destructive/50 animate-pulse font-bold',
        'vital-warning': 'bg-warning/25 text-warning border border-warning/40 font-semibold',
        'vital-normal': 'bg-success/20 text-success border border-success/30',
        'vital-elevated': 'bg-warning/15 text-warning border border-warning/25',
        'vital-low': 'bg-primary/15 text-primary border border-primary/25',

        // Medication Status
        'medication-active': 'bg-success/20 text-success border border-success/30',
        'medication-paused': 'bg-warning/20 text-warning border border-warning/30',
        'medication-discontinued': 'bg-destructive/20 text-destructive border border-destructive/30',
        'medication-scheduled': 'bg-primary/20 text-primary border border-primary/30',
        'medication-overdue': 'bg-destructive/30 text-destructive border border-destructive/50 animate-pulse',

        // Lab Results
        'lab-critical': 'bg-destructive/25 text-destructive border border-destructive/40 animate-pulse font-semibold',
        'lab-abnormal': 'bg-warning/20 text-warning border border-warning/30',
        'lab-borderline': 'bg-accent/20 text-accent-foreground border border-accent/30',
        'lab-normal': 'bg-success/20 text-success border border-success/30',
        'lab-pending': 'bg-muted text-muted-foreground border border-border',

        // Emergency Status
        'emergency-active': 'bg-destructive text-destructive-foreground animate-pulse font-bold',
        'emergency-resolved': 'bg-success/20 text-success border border-success/30',
        'emergency-monitoring': 'bg-warning/20 text-warning border border-warning/30 animate-pulse',

        // Treatment Status
        'treatment-in-progress': 'bg-primary/20 text-primary border border-primary/30 animate-pulse',
        'treatment-completed': 'bg-success/20 text-success border border-success/30',
        'treatment-scheduled': 'bg-accent/20 text-accent-foreground border border-accent/30',
        'treatment-cancelled': 'bg-destructive/20 text-destructive border border-destructive/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
        xl: 'px-5 py-2 text-base',
      },
      pulse: {
        true: 'animate-pulse',
        false: '',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-80',
        false: '',
      },
    },
    defaultVariants: {
      status: 'clinical-normal',
      size: 'md',
      pulse: false,
      interactive: false,
    },
  }
);

export interface MedicalBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof medicalBadgeVariants> {
  icon?: 'none' | 'default' | React.ReactNode;
  value?: string | number;
  timestamp?: string;
  accessibleLabel?: string;
}

const getStatusIcon = (status: string) => {
  const iconMap = {
    // Patient Status
    'patient-critical': AlertTriangle,
    'patient-serious': AlertTriangle,
    'patient-stable': CheckCircle,
    'patient-recovering': Activity,

    // Appointment Status
    'appointment-in-progress': Clock,
    'appointment-completed': CheckCircle,
    'appointment-cancelled': XCircle,

    // Priority
    'priority-urgent': AlertTriangle,
    'priority-high': AlertTriangle,

    // Clinical Status
    'clinical-positive': CheckCircle,
    'clinical-negative': XCircle,
    'clinical-pending': Clock,
    'clinical-abnormal': AlertTriangle,

    // Vital Signs
    'vital-critical': AlertTriangle,
    'vital-warning': AlertTriangle,
    'vital-normal': CheckCircle,

    // Medication
    'medication-overdue': AlertTriangle,
    'medication-active': CheckCircle,
    'medication-paused': Clock,

    // Lab Results
    'lab-critical': AlertTriangle,
    'lab-abnormal': AlertTriangle,
    'lab-normal': CheckCircle,

    // Emergency
    'emergency-active': AlertTriangle,
    'emergency-monitoring': AlertTriangle,
    'emergency-resolved': CheckCircle,
  };

  return iconMap[status as keyof typeof iconMap] || null;
};

const MedicalBadge = forwardRef<HTMLDivElement, MedicalBadgeProps>(
  ({
    className,
    status,
    size,
    pulse,
    interactive,
    icon = 'default',
    value,
    timestamp,
    accessibleLabel,
    children,
    ...props
  }, ref) => {
    const IconComponent = icon === 'default' ? getStatusIcon(status || '') : null;

    const ariaLabel = accessibleLabel || (
      `${status?.replace(/-/g, ' ')}${value ? `: ${value}` : ''}${timestamp ? ` (updated ${timestamp})` : ''}`
    );

    return (
      <div
        ref={ref}
        className={cn(medicalBadgeVariants({ status, size, pulse, interactive }), className)}
        role="status"
        aria-label={ariaLabel}
        aria-live={status?.includes('critical') || status?.includes('urgent') ? 'assertive' : 'polite'}
        {...props}
      >
        {icon === 'default' && IconComponent && (
          <IconComponent className="h-3 w-3" />
        )}
        {icon && icon !== 'default' && (
          <span className="h-3 w-3">{icon}</span>
        )}
        {children}
        {value && (
          <span className="font-semibold">{value}</span>
        )}
        {timestamp && (
          <span className="text-xs opacity-70 ml-1">{timestamp}</span>
        )}
      </div>
    );
  }
);

MedicalBadge.displayName = 'MedicalBadge';

export { MedicalBadge, medicalBadgeVariants };
```

## Day 5-7: Enhanced Form & Input Components

### 3.1 Medical-Enhanced Field Component
Update `web/packages/ui/src/components/field.tsx`:

```typescript
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { FieldError } from './field-error';
import { FieldHint } from './field-hint';
import { AlertTriangle, Info } from 'lucide-react';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  medical?: {
    category?: 'vital' | 'medication' | 'diagnosis' | 'treatment' | 'lab' | 'general';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    validation?: string;
    units?: string;
    range?: { min: number; max: number };
  };
}

const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ className, label, error, hint, required, disabled, medical, children, ...props }, ref) => {
    const fieldId = props.id || `field-${Math.random().toString(36).substr(2, 9)}`;

    const getCategoryIcon = () => {
      switch (medical?.category) {
        case 'vital': return '❤️';
        case 'medication': return '💊';
        case 'diagnosis': return '🩺';
        case 'treatment': return '⚕️';
        case 'lab': return '🧪';
        default: return null;
      }
    };

    const getUrgencyBorder = () => {
      switch (medical?.urgency) {
        case 'critical': return 'border-destructive';
        case 'high': return 'border-warning';
        case 'medium': return 'border-primary';
        case 'low': return 'border-border';
        default: return '';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2 p-4 rounded-lg border bg-background transition-colors',
          getUrgencyBorder(),
          medical?.urgency === 'critical' && 'animate-pulse',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        data-medical-category={medical?.category}
        data-medical-urgency={medical?.urgency}
        {...props}
      >
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              'flex items-center gap-2 text-sm font-medium',
              error && 'text-destructive',
              medical?.urgency === 'critical' && 'text-destructive font-bold'
            )}
          >
            {getCategoryIcon()}
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
            {medical?.urgency === 'critical' && (
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            )}
          </Label>
        )}

        <div className="relative">
          {children}
          {medical?.units && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
              {medical.units}
            </span>
          )}
        </div>

        {/* Medical Validation Display */}
        {medical?.range && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>Normal range: {medical.range.min} - {medical.range.max}</span>
          </div>
        )}

        {medical?.validation && (
          <div className="text-xs text-muted-foreground italic">
            {medical.validation}
          </div>
        )}

        {hint && <FieldHint>{hint}</FieldHint>}
        {error && <FieldError>{error}</FieldError>}
      </div>
    );
  }
);

Field.displayName = 'Field';

export { Field };
```

### 3.2 Medical-Enhanced Input Component
Update `web/packages/ui/src/components/textfield.tsx`:

```typescript
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextfieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  medical?: {
    type?: 'vital' | 'medication' | 'diagnosis' | 'treatment' | 'lab';
    validation?: {
      pattern?: RegExp;
      min?: number;
      max?: number;
      required?: boolean;
    };
    autoComplete?: 'off' | 'on' | 'medical-vital' | 'medical-medication';
    placeholder?: string;
  };
  error?: boolean;
}

const Textfield = forwardRef<HTMLInputElement, TextfieldProps>(
  ({ className, type, medical, error, ...props }, ref) => {
    const getMedicalInputType = () => {
      switch (medical?.type) {
        case 'vital':
          return {
            inputMode: 'decimal' as const,
            pattern: '[0-9]*\\.?[0-9]*',
            step: '0.1',
          };
        case 'medication':
          return {
            autoComplete: medical?.autoComplete || 'off',
            list: 'medications',
          };
        case 'lab':
          return {
            inputMode: 'decimal' as const,
            pattern: '[0-9]*\\.?[0-9]*',
          };
        default:
          return {};
      }
    };

    const medicalAttrs = getMedicalInputType();

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // Medical-specific styles
          error && 'border-destructive focus-visible:ring-destructive',
          medical?.type === 'vital' && 'font-mono text-center text-lg font-bold',
          medical?.type === 'medication' && 'font-medium',
          medical?.type === 'diagnosis' && 'font-medium',
          className
        )}
        ref={ref}
        aria-invalid={error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        data-medical-type={medical?.type}
        {...medicalAttrs}
        {...props}
      />
    );
  }
);

Textfield.displayName = 'Textfield';

export { Textfield };
```

### 3.3 Medical-Enhanced Select Component
Update `web/packages/ui/src/components/select.tsx`:

```typescript
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    medical?: {
      category?: 'patient-status' | 'appointment' | 'medication' | 'diagnosis' | 'priority';
      showIcon?: boolean;
    };
  }
>(({ className, children, medical, ...props }, ref) => {
  const getCategoryIcon = () => {
    switch (medical?.category) {
      case 'patient-status': return '👤';
      case 'appointment': return '📅';
      case 'medication': return '💊';
      case 'diagnosis': return '🩺';
      case 'priority': return '🚨';
      default: return null;
    }
  };

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        medical?.category && 'pl-10',
        className
      )}
      {...props}
    >
      {medical?.showIcon && getCategoryIcon() && (
        <span className="absolute left-3 text-sm">
          {getCategoryIcon()}
        </span>
      )}
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    medical?: {
      status?: 'normal' | 'warning' | 'critical' | 'success' | 'disabled';
      icon?: string;
    };
  }
>(({ className, children, medical, ...props }, ref) => {
  const getStatusColor = () => {
    switch (medical?.status) {
      case 'critical': return 'text-destructive bg-destructive/10';
      case 'warning': return 'text-warning bg-warning/10';
      case 'success': return 'text-success bg-success/10';
      case 'normal': return '';
      case 'disabled': return 'text-muted-foreground opacity-50';
      default: return '';
    }
  };

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        getStatusColor(),
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>
        <span className="flex items-center gap-2">
          {medical?.icon && <span>{medical?.icon}</span>}
          {children}
        </span>
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
```

## Implementation Checklist

### Day 1-2 Tasks
- [ ] Create comprehensive theme toggle component
- [ ] Implement healthcare-specific button variants
- [ ] Add medical data handling to buttons
- [ ] Test theme switching functionality
- [ ] Validate accessibility features

### Day 3-4 Tasks
- [ ] Enhance medical badge with comprehensive status variants
- [ ] Implement status icons and animations
- [ ] Add accessibility labels and ARIA attributes
- [ ] Test badge rendering across different themes
- [ ] Validate WCAG compliance

### Day 5-7 Tasks
- [ ] Enhance form components with medical features
- [ ] Implement validation and range checking
- [ ] Add medical category icons and styling
- [ ] Create enhanced select with medical options
- [ ] Test form accessibility and usability

## Success Criteria

### Technical Success
- [ ] All components maintain backward compatibility
- [ ] Healthcare variants work with existing theming
- [ ] Bundle size increase < 20KB
- [ ] No breaking changes to existing components
- [ ] TypeScript types are comprehensive

### Accessibility Success
- [ ] All medical status indicators are screen reader accessible
- [ ] High contrast mode works with all variants
- [ ] Keyboard navigation enhanced for medical workflows
- [ ] ARIA labels provide context for medical data
- [ ] Focus management optimized for clinical use

### Healthcare Success
- [ ] Medical status indicators are clinically appropriate
- [ ] Emergency modes provide clear visual hierarchy
- [ ] Patient safety indicators are prominent
- [ ] Medical data entry optimized for accuracy
- [ ] Color choices work for color blind users

## Testing Requirements

### Component Testing
```typescript
// tests/medical-badge.test.tsx
import { render, screen } from '@testing-library/react';
import { MedicalBadge } from '../src/components/medical-badge';

describe('MedicalBadge', () => {
  it('should display critical status with animation', () => {
    render(<MedicalBadge status="patient-critical" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('animate-pulse');
    expect(badge).toHaveAttribute('aria-live', 'assertive');
  });

  it('should show appropriate icon for vital signs', () => {
    render(<MedicalBadge status="vital-critical" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
```

### Accessibility Testing
- [ ] Screen reader testing with NVDA, JAWS, VoiceOver
- [ ] Keyboard navigation testing
- [ ] Color contrast validation
- [ ] Focus management verification
- [ ] ARIA attribute validation

### Healthcare Usability Testing
- [ ] Medical professional feedback sessions
- [ ] Emergency scenario testing
- [ ] Clinical workflow validation
- [ ] Patient safety scenario testing
- [ ] Cross-platform medical device testing

---

**Next Phase Preview:** Phase 3 will create specialized healthcare components like vital signs displays, medical forms, and clinical workflow components that build upon the enhanced foundation established in this phase.