'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Label as AriaLabel, LabelProps as AriaLabelProps } from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'

// Label variants
const labelVariants = cva(
    [
        'text-sm font-medium text-foreground',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70',
        'transition-colors duration-200',
    ],
    {
        variants: {
            size: {
                sm: 'text-xs',
                md: 'text-sm',
                lg: 'text-base',
            },
            weight: {
                normal: 'font-normal',
                medium: 'font-medium',
                semibold: 'font-semibold',
                bold: 'font-bold',
            },
            variant: {
                default: 'text-foreground',
                muted: 'text-muted-foreground',
                destructive: 'text-destructive',
                success: 'text-green-600',
                warning: 'text-yellow-600',
                info: 'text-blue-600',
            },
            required: {
                true: "after:content-['*'] after:text-destructive after:ml-1",
                false: '',
            },
        },
        defaultVariants: {
            size: 'md',
            weight: 'medium',
            variant: 'default',
            required: false,
        },
    },
)

interface LabelProps extends AriaLabelProps, VariantProps<typeof labelVariants> {
    className?: string
    children: React.ReactNode
    required?: boolean
    htmlFor?: string
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, size, weight, variant, required = false, children, ...props }, ref) => {
        return (
            <AriaLabel
                ref={ref}
                className={cn(labelVariants({ size, weight, variant, required }), className)}
                {...props}
            >
                {children}
            </AriaLabel>
        )
    },
)

Label.displayName = 'Label'

// Form Label component with enhanced features
interface FormLabelProps extends LabelProps {
    helperText?: string
    error?: boolean
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
    ({ className, helperText, error = false, children, ...props }, ref) => {
        return (
            <div className="space-y-1">
                <Label ref={ref} variant={error ? 'destructive' : 'default'} className={className} {...props}>
                    {children}
                </Label>
                {helperText && (
                    <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
                )}
            </div>
        )
    },
)

FormLabel.displayName = 'FormLabel'

// Label Group component for complex layouts
interface LabelGroupProps {
    className?: string
    children: React.ReactNode
    layout?: 'vertical' | 'horizontal'
    spacing?: 'sm' | 'md' | 'lg'
}

const LabelGroup = React.forwardRef<HTMLDivElement, LabelGroupProps>(
    ({ className, children, layout = 'vertical', spacing = 'md' }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex',
                    {
                        'flex-col': layout === 'vertical',
                        'flex-row items-center': layout === 'horizontal',
                        'space-y-1': layout === 'vertical' && spacing === 'sm',
                        'space-y-2': layout === 'vertical' && spacing === 'md',
                        'space-y-3': layout === 'vertical' && spacing === 'lg',
                        'space-x-1': layout === 'horizontal' && spacing === 'sm',
                        'space-x-2': layout === 'horizontal' && spacing === 'md',
                        'space-x-3': layout === 'horizontal' && spacing === 'lg',
                    },
                    className,
                )}
            >
                {children}
            </div>
        )
    },
)

LabelGroup.displayName = 'LabelGroup'

export { Label, FormLabel, LabelGroup, type LabelProps, type FormLabelProps, type LabelGroupProps }
