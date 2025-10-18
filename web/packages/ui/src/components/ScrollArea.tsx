'use client'

import React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

import { cn } from '@workspace/ui/lib/utils'

interface ScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
    showHorizontalScrollbar?: boolean
    showVerticalScrollbar?: boolean
}

function ScrollArea({
    className,
    children,
    showHorizontalScrollbar = true,
    showVerticalScrollbar = true,
    ...props
}: ScrollAreaProps) {
    return (
        <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn('relative', className)} {...props}>
            <ScrollAreaPrimitive.Viewport
                data-slot="scroll-area-viewport"
                className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            {showHorizontalScrollbar && <ScrollBar orientation="horizontal" />}
            {showVerticalScrollbar && <ScrollBar orientation="vertical" />}
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    )
}

function ScrollBar({
    className,
    orientation = 'vertical',
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            className={cn(
                'flex touch-none p-px transition-colors select-none',
                orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
                orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
                className,
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb
                data-slot="scroll-area-thumb"
                className="bg-neutral-400/50 relative flex-1 rounded-full"
            />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    )
}

export { ScrollArea, ScrollBar }
