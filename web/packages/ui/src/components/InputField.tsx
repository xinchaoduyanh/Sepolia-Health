'use client'

import * as React from 'react'
import { cva } from 'class-variance-authority'
import {
    TextField as AriaTextField,
    TextFieldProps as AriaTextFieldProps,
    Input as AriaInput,
    InputProps as AriaInputProps,
    TextArea as AriaTextArea,
    TextAreaProps as AriaTextAreaProps,
    composeRenderProps,
} from 'react-aria-components'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'

// Input variants
const inputVariants = cva([
    'shadow-sm flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400',
    'ring-inset ring ring-border transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-invalid:ring-destructive aria-invalid:focus-visible:ring-destructive',
])

// Textarea variants
const textareaVariants = cva([
    'flex min-h-[80px] w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background',
    'placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    'aria-invalid:ring-destructive aria-invalid:focus-visible:ring-destructive',
])

// Input component
interface InputFieldProps extends Omit<AriaInputProps, 'size'> {
    className?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'error' | 'success'
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
    ({ className, size = 'md', variant = 'default', ...props }, ref) => {
        return (
            <AriaInput
                ref={ref}
                className={composeRenderProps(className, className =>
                    cn(
                        inputVariants(),
                        {
                            'h-8 px-2 py-1 text-xs': size === 'sm',
                            'h-10 px-3 py-2 text-sm': size === 'md',
                            'h-12 px-4 py-3 text-base': size === 'lg',
                            'ring-destructive focus-visible:ring-destructive': variant === 'error',
                            'ring-green-500 focus-visible:ring-green-500': variant === 'success',
                        },
                        className,
                    ),
                )}
                {...props}
            />
        )
    },
)

InputField.displayName = 'InputField'

// Textarea component
interface TextareaFieldProps extends Omit<AriaTextAreaProps, 'size'> {
    className?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'error' | 'success'
    resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
    ({ className, size = 'md', variant = 'default', resize = 'vertical', ...props }, ref) => {
        return (
            <AriaTextArea
                ref={ref}
                className={composeRenderProps(className, className =>
                    cn(
                        textareaVariants(),
                        {
                            'min-h-[60px] px-2 py-1 text-xs': size === 'sm',
                            'min-h-[80px] px-3 py-2 text-sm': size === 'md',
                            'min-h-[100px] px-4 py-3 text-base': size === 'lg',
                            'ring-destructive focus-visible:ring-destructive': variant === 'error',
                            'ring-green-500 focus-visible:ring-green-500': variant === 'success',
                            'resize-none': resize === 'none',
                            'resize-y': resize === 'vertical',
                            'resize-x': resize === 'horizontal',
                            resize: resize === 'both',
                        },
                        className,
                    ),
                )}
                {...props}
            />
        )
    },
)

TextareaField.displayName = 'TextareaField'

// Password input component
interface PasswordFieldProps extends Omit<AriaTextFieldProps, 'type'> {
    placeholder?: string
    showPasswordLabel?: string
    hidePasswordLabel?: string
    className?: string
    inputClassName?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'error' | 'success'
    disabled?: boolean
    id?: string
}

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
    (
        {
            placeholder = 'Nhập mật khẩu',
            showPasswordLabel = 'Hiện mật khẩu',
            hidePasswordLabel = 'Ẩn mật khẩu',
            className,
            inputClassName,
            size = 'md',
            variant = 'default',
            disabled = false,
            id,
            ...props
        },
        ref,
    ) => {
        const [showPassword, setShowPassword] = React.useState(false)

        return (
            <AriaTextField {...props}>
                <div className={cn('relative', className)}>
                    <InputField
                        ref={ref}
                        id={id}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={placeholder}
                        size={size}
                        variant={variant}
                        disabled={disabled}
                        className={inputClassName}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                        aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
                    >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                </div>
            </AriaTextField>
        )
    },
)

PasswordField.displayName = 'PasswordField'

export {
    InputField,
    TextareaField,
    PasswordField,
    type InputFieldProps,
    type TextareaFieldProps,
    type PasswordFieldProps,
}
