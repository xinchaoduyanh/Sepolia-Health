'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@workspace/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'

const buttonVariants = cva(
    [
        'cursor-pointer font-medium inline-flex items-center gap-1.5 justify-center whitespace-nowrap text-sm ring-offset-background transition-all no-underline',
        'hover:opacity-90 active:opacity-100',
        /* SVGs */
        '[&_svg]:pointer-events-none [&_svg]:size-[14px] [&_svg]:shrink-0 [&_svg]:stroke-2',
        /* Disabled */
        'disabled:pointer-events-none disabled:opacity-60',
        /* Focus Visible */
        'focus-visible:outline-none focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:ring-offset-2',
        /* Resets */
        'focus-visible:outline-none',
    ],
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground button-3d shadow-md hover:shadow-lg',
                destructive: 'bg-destructive text-destructive-foreground button-3d shadow-md hover:shadow-lg',
                outline: 'border-2 text-foreground hover:bg-primary hover:text-primary-foreground shadow-sm transition-all',
                outlineDestructive:
                    'border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm transition-all',
                secondary: 'bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80',
                ghost: 'hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors',
                link: 'text-primary underline-offset-4 hover:underline px-0! py-0! h-auto! font-medium',
                unstyled: '',
            },
            size: {
                default: 'h-9 px-4 py-2 rounded-lg',
                sm: 'h-8 px-3 text-[13px] rounded-md',
                lg: 'h-10 px-5 rounded-lg text-base gap-2',
                xl: 'h-12 px-6 text-base rounded-lg gap-2',
                icon: 'size-9 rounded-lg',
                iconSm: 'size-6',
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
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
    const Comp = (asChild ? Slot : AriaButton) as typeof AriaButton

    return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
export type { ButtonProps }
