'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@workspace/ui/lib/utils'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

// Alert message variants
const alertVariants = cva(['text-sm transition-all duration-200 flex items-start gap-2'], {
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
        type: {
            inline: 'inline-flex',
            block: 'block',
            banner: 'rounded-md border p-3',
        },
    },
    defaultVariants: {
        variant: 'error',
        size: 'md',
        type: 'inline',
    },
})

// Icon variants
const iconVariants = cva(['flex-shrink-0'], {
    variants: {
        size: {
            sm: 'h-3 w-3',
            md: 'h-4 w-4',
            lg: 'h-5 w-5',
        },
    },
    defaultVariants: {
        size: 'md',
    },
})

// Banner variants
const bannerVariants = cva(['border rounded-md p-3'], {
    variants: {
        variant: {
            error: 'border-destructive bg-destructive/10 text-destructive',
            warning: 'border-yellow-500 bg-yellow-50 text-yellow-700',
            success: 'border-green-500 bg-green-50 text-green-700',
            info: 'border-blue-500 bg-blue-50 text-blue-700',
        },
    },
})

interface AlertMessageProps extends VariantProps<typeof alertVariants> {
    children?: React.ReactNode
    className?: string
    showIcon?: boolean
    dismissible?: boolean
    onDismiss?: () => void
}

const AlertMessage = React.forwardRef<HTMLDivElement, AlertMessageProps>(
    (
        {
            variant = 'error',
            size = 'md',
            type = 'inline',
            showIcon = true,
            dismissible = false,
            onDismiss,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        if (!children) return null

        const getIcon = () => {
            if (!showIcon) return null

            const iconProps = {
                className: cn(iconVariants({ size })),
            }

            switch (variant) {
                case 'error':
                    return <AlertCircle {...iconProps} />
                case 'warning':
                    return <AlertTriangle {...iconProps} />
                case 'success':
                    return <CheckCircle {...iconProps} />
                case 'info':
                    return <Info {...iconProps} />
                default:
                    return <AlertCircle {...iconProps} />
            }
        }

        const content = (
            <>
                {getIcon()}
                <span className="flex-1">{children}</span>
                {dismissible && onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
                        aria-label="Đóng thông báo"
                    >
                        <X className={cn(iconVariants({ size }))} />
                    </button>
                )}
            </>
        )

        if (type === 'banner') {
            return (
                <div
                    ref={ref}
                    className={cn(alertVariants({ variant, size, type }), bannerVariants({ variant }), className)}
                    {...props}
                >
                    {content}
                </div>
            )
        }

        return (
            <div ref={ref} className={cn(alertVariants({ variant, size, type }), className)} {...props}>
                {content}
            </div>
        )
    },
)

AlertMessage.displayName = 'AlertMessage'

// Alert Banner component
interface AlertBannerProps extends Omit<AlertMessageProps, 'type'> {
    title?: string
    description?: string
}

const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
    ({ title, description, children, className, ...props }, ref) => {
        return (
            <AlertMessage ref={ref} type="banner" className={className} {...props}>
                <div className="flex-1">
                    {title && <h4 className="font-medium mb-1">{title}</h4>}
                    {description && <p className="text-sm opacity-90">{description}</p>}
                    {children}
                </div>
            </AlertMessage>
        )
    },
)

AlertBanner.displayName = 'AlertBanner'

// Alert List component for multiple messages
interface AlertListProps {
    className?: string
    children: React.ReactNode
    variant?: 'error' | 'warning' | 'success' | 'info'
    size?: 'sm' | 'md' | 'lg'
}

const AlertList = React.forwardRef<HTMLDivElement, AlertListProps>(
    ({ className, children, variant = 'error', size = 'md' }, ref) => {
        return (
            <div ref={ref} className={cn('space-y-2', className)}>
                {React.Children.map(children, (child, index) => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child, {
                            variant,
                            size,
                            key: index,
                        } as any)
                    }
                    return child
                })}
            </div>
        )
    },
)

AlertList.displayName = 'AlertList'

export { AlertMessage, AlertBanner, AlertList, type AlertMessageProps, type AlertBannerProps, type AlertListProps }
