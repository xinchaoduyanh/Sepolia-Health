'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@workspace/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import { useHealthcareTheme } from '@/providers/healthcare-theme-context'

const buttonVariants = cva(
    [
        'cursor-pointer font-medium inline-flex items-center gap-1.5 justify-center whitespace-nowrap rounded-sm text-sm ring-offset-background transition-all no-underline',
        'hover:opacity-90 active:opacity-100',
        /* SVGs */
        '[&_svg]:pointer-events-none [&_svg]:size-[14px] [&_svg]:shrink-0 [&_svg]:stroke-2',
        /* Disabled */
        'disabled:pointer-events-none disabled:opacity-60',
        /* Focus Visible */
        'focus-visible:outline-none focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:ring-offset-2',
        /* Resets */
        'focus-visible:outline-none',
        /* Healthcare-specific base styles */
        'relative overflow-hidden group',
    ],
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground button-3d',
                destructive: 'bg-destructive text-destructive-foreground button-3d',
                outline: 'bg-background-secondary shadow-sm border text-foreground hover:bg-background-tertiary/70 ',
                outlineDestructive:
                    'bg-background-secondary shadow-sm border text-destructive-foreground hover:bg-background-tertiary/70 ',
                secondary: 'hover:opacity-80 border-transparent bg-neutral-500/15 text-secondary-foreground',
                ghost: 'hover:bg-neutral-500/10 hover:text-accent-foreground active:bg-accent/50 text-secondary-foreground',
                link: 'text-primary-foreground underline-offset-4 hover:underline px-0! py-0! h-auto! underline',
                unstyled: '',

                // Enhanced Healthcare-specific variants
                medical: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md button-3d border border-primary/20',
                'medical-outline': 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground',
                'medical-soft': 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30',

                emergency: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg button-3d border border-destructive/30',
                'emergency-outline': 'bg-transparent border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground',
                'emergency-pulse': 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg button-3d border border-destructive/30 animate-pulse',

                success: 'bg-success text-success-foreground hover:bg-success/90 button-3d border border-success/20',
                'success-outline': 'bg-transparent border-2 border-success text-success hover:bg-success hover:text-success-foreground',

                warning: 'bg-warning text-warning-foreground hover:bg-warning/90 button-3d border border-warning/20',
                'warning-outline': 'bg-transparent border-2 border-warning text-warning hover:bg-warning hover:text-warning-foreground',

                clinical: 'bg-accent text-accent-foreground hover:bg-accent/80 border border-border',
                'clinical-sterile': 'bg-background text-foreground border-2 border-border hover:border-accent',

                diagnostic: 'bg-background text-foreground border-2 border-primary hover:bg-primary hover:text-primary-foreground',
                'diagnostic-active': 'bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90',

                vital: 'bg-background text-foreground border border-muted-foreground hover:border-primary hover:bg-primary/5',
                'vital-normal': 'bg-success/10 text-success-foreground border border-success/30 hover:bg-success/20',
                'vital-warning': 'bg-warning/10 text-warning-foreground border border-warning/30 hover:bg-warning/20',
                'vital-critical': 'bg-destructive/10 text-destructive-foreground border border-destructive/30 hover:bg-destructive/20 pulse-critical',

                // Status-specific buttons with enhanced styling
                critical: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg border border-destructive/50 pulse-critical button-3d',
                urgent: 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-md border border-warning/50 animate-pulse',
                stable: 'bg-success text-success-foreground hover:bg-success/90 border border-success/30',
                pending: 'bg-accent text-accent-foreground hover:bg-accent/90 border border-accent/30',
                'in-progress': 'bg-warning text-warning-foreground hover:bg-warning/90 border border-warning/30 animate-pulse',

                // Telemedicine variants
                telemedicine: 'bg-primary text-primary-foreground hover:bg-primary/90 button-3d border border-primary/20',
                'telemedicine-connecting': 'bg-warning text-warning-foreground hover:bg-warning/90 border border-warning/30 animate-pulse',
                'telemedicine-active': 'bg-success text-success-foreground hover:bg-success/90 border border-success/30',

                // Treatment variants
                treatment: 'bg-accent text-accent-foreground hover:bg-accent/80 border border-accent/30',
                'treatment-active': 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/30',
                'treatment-completed': 'bg-success text-success-foreground hover:bg-success/90 border border-success/30',
            },
            size: {
                default: 'h-8 px-3 py-2',
                sm: 'h-7 px-2 text-[13px]',
                lg: 'h-9 px-4 rounded-md gap-2',
                xl: 'h-11 px-5 text-base rounded-md gap-2',
                icon: 'size-8',
                iconSm: 'size-6',

                // Enhanced Healthcare-specific sizes
                medical: 'h-12 px-6 text-base font-semibold rounded-md gap-3',
                'medical-sm': 'h-10 px-4 text-sm font-medium rounded-md gap-2',
                'medical-lg': 'h-14 px-8 text-lg font-bold rounded-lg gap-4',

                compact: 'h-8 px-3 text-xs rounded-sm gap-1',
                'compact-sm': 'h-6 px-2 text-xs rounded gap-1',

                vital: 'h-14 px-8 text-lg font-bold rounded-lg gap-4',
                'vital-sm': 'h-10 px-6 text-base font-semibold rounded-md gap-2',
                'vital-lg': 'h-16 px-10 text-xl font-bold rounded-xl gap-5',

                diagnostic: 'h-10 px-5 text-sm font-medium rounded-md gap-2',
                'diagnostic-compact': 'h-8 px-3 text-xs font-medium rounded-sm gap-1',

                emergency: 'h-14 px-8 text-lg font-bold rounded-lg gap-4 shadow-lg',
                'emergency-lg': 'h-16 px-10 text-xl font-bold rounded-xl gap-5 shadow-xl',

                telemedicine: 'h-12 px-6 text-base font-medium rounded-lg gap-3',
                telemedicineIcon: 'size-12 rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

interface ButtonProps
    extends AriaButtonProps,
        React.RefAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
    // Healthcare-specific props
    showRealtimeIndicator?: boolean
    criticalAlert?: boolean
    colorBlindFriendly?: boolean
    accessibilityLabel?: string
    treatmentStatus?: 'pending' | 'active' | 'completed' | 'cancelled'
    connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error'
    loading?: boolean
}

function Button({
    className,
    variant,
    size,
    asChild = false,
    showRealtimeIndicator = false,
    criticalAlert = false,
    colorBlindFriendly = false,
    accessibilityLabel,
    treatmentStatus,
    connectionStatus,
    loading = false,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const { highContrastMode, reducedMotion, colorBlindMode, emergencyMode } = useHealthcareTheme()

    const Comp = (asChild ? Slot : AriaButton) as typeof AriaButton

    // Determine if we should apply color blind friendly styles
    const shouldUseColorBlindFriendly = colorBlindFriendly || colorBlindMode !== 'none'

    // Determine final variant based on healthcare theme and props
    const getFinalVariant = () => {
        // Emergency mode takes precedence
        if (emergencyMode && (variant === 'emergency' || variant === 'critical' || criticalAlert)) {
            return 'emergency-pulse'
        }

        // Color blind adjustments
        if (shouldUseColorBlindFriendly) {
            if (variant === 'medical') return 'clinical'
            if (variant === 'vital-critical') return 'vital-warning'
            if (variant === 'success') return 'clinical'
        }

        // High contrast adjustments
        if (highContrastMode) {
            if (variant?.includes('outline')) return variant.replace('outline', '') as any
            if (variant?.includes('soft')) return variant.replace('soft', 'outline') as any
        }

        return variant
    }

    const finalVariant = getFinalVariant()
    const isDisabled = disabled || loading

    return (
        <Comp
            data-slot="button"
            className={cn(
                buttonVariants({ variant: finalVariant, size, className }),
                // Healthcare accessibility classes
                highContrastMode && 'high-contrast-button',
                reducedMotion && 'reduce-motion-animation',
                showRealtimeIndicator && 'realtime-indicator',
                criticalAlert && 'critical-alert-button',
                loading && 'cursor-wait',
                // Connection status indicators
                connectionStatus === 'connecting' && 'animate-pulse',
                connectionStatus === 'error' && 'border-destructive animate-pulse',
                connectionStatus === 'connected' && 'border-success',
                // Treatment status indicators
                treatmentStatus === 'active' && 'ring-2 ring-primary ring-offset-2',
                treatmentStatus === 'completed' && 'border-success',
                treatmentStatus === 'cancelled' && 'border-destructive opacity-60',
            )}
            disabled={isDisabled}
            aria-label={accessibilityLabel}
            aria-busy={loading}
            aria-live={loading || criticalAlert ? 'polite' : undefined}
            {...props}
        >
            {/* Real-time indicator dot */}
            {showRealtimeIndicator && !loading && (
                <span
                    className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full animate-pulse"
                    aria-hidden="true"
                />
            )}

            {/* Critical alert indicator */}
            {criticalAlert && (
                <span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping"
                    aria-hidden="true"
                />
            )}

            {/* Loading spinner */}
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}

            {children}
        </Comp>
    )
}

export { Button, buttonVariants }
export type { ButtonProps }

// Specialized Healthcare Button Components

/**
 * EmergencyButton - For critical medical emergency actions
 * Automatically uses high-priority styling and animations
 */
export function EmergencyButton({ children, ...props : Omit<ButtonProps, 'variant'>) {
    return (
        <Button
            variant="emergency-pulse"
            size="emergency"
            criticalAlert
            accessibilityLabel={`Emergency: ${typeof children === 'string' ? children : 'Emergency action'}`}
            {...props}
        >
            {children}
        </Button>
    )
}

/**
 * MedicalActionButton - For standard medical procedures and actions
 */
export function MedicalActionButton({ children, ...props }: Omit<ButtonProps, 'variant'>) {
    return (
        <Button
            variant="medical"
            size="medical"
            {...props}
        >
            {children}
        </Button>
    )
}

/**
 * VitalSignButton - For vital sign monitoring and updates
 */
export function VitalSignButton({
    status,
    children,
    showRealtimeIndicator = true,
    ...props
}: Omit<ButtonProps, 'variant' | 'showRealtimeIndicator'> & {
    status: 'normal' | 'warning' | 'critical'
}) {
    const variant = status === 'critical' ? 'vital-critical' :
                   status === 'warning' ? 'vital-warning' : 'vital-normal'

    return (
        <Button
            variant={variant}
            size="vital"
            showRealtimeIndicator={showRealtimeIndicator}
            criticalAlert={status === 'critical'}
            accessibilityLabel={`Vital sign: ${status} - ${typeof children === 'string' ? children : 'Vital sign'}`}
            {...props}
        >
            {children}
        </Button>
    )
}

/**
 * TelemedicineButton - For telemedicine connections and calls
 */
export function TelemedicineButton({
    connectionStatus,
    children,
    ...props
}: Omit<ButtonProps, 'variant' | 'connectionStatus'> & {
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}) {
    const getVariant = () => {
        switch (connectionStatus) {
            case 'connecting': return 'telemedicine-connecting'
            case 'connected': return 'telemedicine-active'
            case 'error': return 'emergency-outline'
            default: return 'telemedicine'
        }
    }

    return (
        <Button
            variant={getVariant()}
            size="telemedicine"
            connectionStatus={connectionStatus}
            accessibilityLabel={`Telemedicine: ${connectionStatus} - ${typeof children === 'string' ? children : 'Telemedicine'}`}
            {...props}
        >
            {children}
        </Button>
    )
}

/**
 * TreatmentButton - For treatment plan actions
 */
export function TreatmentButton({
    treatmentStatus,
    children,
    ...props
}: Omit<ButtonProps, 'variant' | 'treatmentStatus'> & {
    treatmentStatus: 'pending' | 'active' | 'completed' | 'cancelled'
}) {
    const getVariant = () => {
        switch (treatmentStatus) {
            case 'active': return 'treatment-active'
            case 'completed': return 'treatment-completed'
            case 'cancelled': return 'clinical'
            default: return 'treatment'
        }
    }

    return (
        <Button
            variant={getVariant()}
            size="medical"
            treatmentStatus={treatmentStatus}
            accessibilityLabel={`Treatment: ${treatmentStatus} - ${typeof children === 'string' ? children : 'Treatment'}`}
            {...props}
        >
            {children}
        </Button>
    )
}

/**
 * DiagnosticButton - For diagnostic tools and tests
 */
export function DiagnosticButton({
    active = false,
    children,
    ...props
}: Omit<ButtonProps, 'variant'> & {
    active?: boolean
}) {
    return (
        <Button
            variant={active ? 'diagnostic-active' : 'diagnostic'}
            size="diagnostic"
            accessibilityLabel={`Diagnostic tool: ${active ? 'active' : 'inactive'} - ${typeof children === 'string' ? children : 'Diagnostic tool'}`}
            {...props}
        >
            {children}
        </Button>
    )
}

/**
 * ClinicalButton - For clinical workflow actions
 * Supports sterile mode and accessibility features
 */
export function ClinicalButton({
    sterile = false,
    children,
    ...props
}: Omit<ButtonProps, 'variant'> & {
    sterile?: boolean
}) {
    return (
        <Button
            variant={sterile ? 'clinical-sterile' : 'clinical'}
            size="medical-sm"
            colorBlindFriendly
            accessibilityLabel={`Clinical action: ${sterile ? 'sterile mode' : 'standard'} - ${typeof children === 'string' ? children : 'Clinical action'}`}
            {...props}
        >
            {children}
        </Button>
    )
}

/**
 * CompactMedicalButton - For space-constrained medical interfaces
 */
export function CompactMedicalButton({ children, ...props }: Omit<ButtonProps, 'variant' | 'size'>) {
    return (
        <Button
            variant="medical-soft"
            size="compact-sm"
            {...props}
        >
            {children}
        </Button>
    )
}
