'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { TextField as AriaTextField, TextFieldProps as AriaTextFieldProps } from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'
import { InputField, TextareaField, PasswordField } from './InputField'
import { Label } from './Label'

// Alert message variants
const alertVariants = cva(['text-sm', 'transition-all duration-200'], {
    variants: {
        variant: {
            error: 'text-destructive',
            warning: 'text-yellow-600',
            success: 'text-green-600',
            info: 'text-blue-600',
        },
        size: {
            sm: 'text-xs',
            md: 'text-sm',
            lg: 'text-base',
        },
    },
    defaultVariants: {
        variant: 'error',
        size: 'md',
    },
})

// Field container variants
const fieldVariants = cva(['space-y-2'], {
    variants: {
        layout: {
            vertical: 'flex flex-col',
            horizontal: 'flex flex-row items-center gap-4',
        },
    },
    defaultVariants: {
        layout: 'vertical',
    },
})

// Alert message component for FormField
interface FormAlertMessageProps extends VariantProps<typeof alertVariants> {
    children?: React.ReactNode
    className?: string
}

const FormAlertMessage = ({ variant, size, className, children, ...props }: FormAlertMessageProps) => {
    if (!children) return null

    return (
        <p className={cn(alertVariants({ variant, size }), className)} {...props}>
            {children}
        </p>
    )
}

// Main FormField component
interface FormFieldProps extends AriaTextFieldProps, VariantProps<typeof fieldVariants> {
    label?: string
    placeholder?: string
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
    errorMessage?: string
    description?: string
    required?: boolean
    disabled?: boolean
    className?: string
    inputClassName?: string
    labelClassName?: string
    messageClassName?: string
}

const FormField = ({
    label,
    placeholder,
    type = 'text',
    errorMessage,
    description,
    required = false,
    disabled = false,
    className,
    inputClassName,
    labelClassName,
    messageClassName,
    layout = 'vertical',
    ...props
}: FormFieldProps) => {
    const fieldId = React.useId()
    const inputId = `${fieldId}-input`

    const renderInput = () => {
        if (type === 'textarea') {
            return (
                <TextareaField id={inputId} placeholder={placeholder} disabled={disabled} className={inputClassName} />
            )
        }

        if (type === 'password') {
            return (
                <PasswordField id={inputId} placeholder={placeholder} disabled={disabled} className={inputClassName} />
            )
        }

        return (
            <InputField
                id={inputId}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                className={inputClassName}
            />
        )
    }

    return (
        <div className={cn(fieldVariants({ layout }), className)}>
            <AriaTextField {...props}>
                <div className="space-y-2">
                    {label && (
                        <Label htmlFor={inputId} className={labelClassName} required={required}>
                            {label}
                        </Label>
                    )}

                    {renderInput()}

                    {description && !errorMessage && (
                        <FormAlertMessage variant="info" size="sm" className={messageClassName}>
                            {description}
                        </FormAlertMessage>
                    )}

                    {errorMessage && (
                        <FormAlertMessage variant="error" size="sm" className={messageClassName}>
                            {errorMessage}
                        </FormAlertMessage>
                    )}
                </div>
            </AriaTextField>
        </div>
    )
}

export { FormField, FormAlertMessage, type FormFieldProps, type FormAlertMessageProps }
