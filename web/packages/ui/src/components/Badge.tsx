import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

import { cn } from '@workspace/ui/lib/utils'

const badgeVariants = cva(
    'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden backdrop-blur-sm',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary/90 text-primary-foreground backdrop-blur-sm [a&]:hover:bg-primary/80',
                secondary:
                    'border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-semibold shadow-sm',
                destructive:
                    'border-rose-200 bg-rose-500 text-white dark:bg-rose-600 dark:border-rose-500 shadow-sm font-semibold',
                success:
                    'border-emerald-200 bg-emerald-500 text-white dark:bg-emerald-600 dark:border-emerald-500 shadow-sm font-semibold',
                warning:
                    'border-amber-200 bg-amber-500 text-white dark:bg-amber-600 dark:border-amber-500 shadow-sm font-semibold',
                info: 'border-sky-200 bg-sky-500 text-white dark:bg-sky-600 dark:border-sky-500 shadow-sm font-semibold',
                outline:
                    'border-slate-200/50 bg-white/60 backdrop-blur-sm text-slate-600 hover:bg-white/80 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/40 font-medium',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
)

function Badge({
    className,
    variant,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
