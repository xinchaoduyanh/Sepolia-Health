'use client'

import * as React from 'react'
import { Menu, MenuItem, MenuTrigger, MenuPopover, MenuCollection } from './Menu'
import { Button } from './Button'
import { cn } from '@workspace/ui/lib/utils'

interface DropdownMenuProps {
    children: React.ReactNode
    className?: string
}

interface DropdownMenuTriggerProps {
    children: React.ReactNode
    className?: string
}

interface DropdownMenuContentProps {
    children: React.ReactNode
    className?: string
}

interface DropdownMenuItemProps {
    children: React.ReactNode
    className?: string
    onSelect?: () => void
}

function DropdownMenu({ children, className, ...props }: DropdownMenuProps) {
    return (
        <Menu className={cn('w-56', className)} {...props}>
            {children}
        </Menu>
    )
}

function DropdownMenuTrigger({ children, className, ...props }: DropdownMenuTriggerProps) {
    return (
        <MenuTrigger>
            <Button variant="ghost" className={cn('h-auto p-0 hover:bg-transparent', className)} {...props}>
                {children}
            </Button>
        </MenuTrigger>
    )
}

function DropdownMenuContent({ children, className, ...props }: DropdownMenuContentProps) {
    return (
        <MenuPopover className={cn('w-56', className)} {...props}>
            {children}
        </MenuPopover>
    )
}

function DropdownMenuItem({ children, className, onSelect, ...props }: DropdownMenuItemProps) {
    return (
        <MenuItem className={cn('cursor-pointer', className)} onAction={onSelect} {...props}>
            {children}
        </MenuItem>
    )
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
