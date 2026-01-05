'use client'

import { cn } from '../lib/utils'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import React from 'react'
import {
    Select,
    SelectValue,
    Button,
    Popover,
    ListBox,
    ListBoxItem,
    Key,
} from 'react-aria-components'

interface FormSelectOption {
    value: string | number
    label: string
}

interface FormSelectProps {
    value: string | number
    onChange: (value: string) => void
    options: FormSelectOption[]
    placeholder?: string
    disabled?: boolean
    required?: boolean
    className?: string
}

export function FormSelect({
    value,
    onChange,
    options,
    placeholder = 'Chọn...',
    disabled = false,
    className,
}: FormSelectProps) {
    return (
        <Select
            selectedKey={String(value)}
            onSelectionChange={(key: Key) => onChange(String(key))}
            isDisabled={disabled}
            className={cn('group w-full', className)}
        >
            <Button
                className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5',
                    'bg-gradient-to-r from-background to-muted/20 text-foreground',
                    'border-2 border-border rounded-xl',
                    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    'hover:border-primary/50 hover:from-primary/5 hover:to-primary/10',
                    'transition-all duration-200 outline-none shadow-sm cursor-pointer',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    'data-[placeholder]:text-muted-foreground',
                )}
            >
                <SelectValue className="truncate">
                    {({ selectedText }: { selectedText: string | null }) => (
                        <span className={!selectedText ? 'text-muted-foreground' : ''}>
                            {selectedText || placeholder}
                        </span>
                    )}
                </SelectValue>
                <ChevronDownIcon className="h-4 w-4 text-primary opacity-70" />
            </Button>

            <Popover
                className={cn(
                    'z-50 overflow-hidden',
                    'bg-card text-foreground rounded-xl border-2 border-border shadow-xl',
                    'min-w-[var(--trigger-width)]',
                    'max-h-[300px] overflow-y-auto',
                    'entering:animate-in entering:fade-in-0 entering:zoom-in-95',
                    'exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95',
                )}
                offset={4}
            >
                <ListBox className="p-1.5 outline-none" items={options.map((o) => ({ id: String(o.value), ...o }))}>
                    {(item: { id: string; value: string | number; label: string }) => (
                        <ListBoxItem
                            id={item.id}
                            textValue={item.label}
                            className={cn(
                                'relative flex items-center justify-between',
                                'px-3 py-2.5 rounded-lg cursor-pointer select-none outline-none',
                                'text-sm font-medium text-foreground',
                                'focus:bg-primary focus:text-primary-foreground',
                                'selected:bg-primary/10 selected:text-primary',
                                'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
                                'transition-colors duration-150',
                            )}
                        >
                            {({ isSelected }: { isSelected: boolean }) => (
                                <>
                                    <span className="truncate">{item.label}</span>
                                    {isSelected && <CheckIcon className="h-4 w-4 flex-shrink-0" />}
                                </>
                            )}
                        </ListBoxItem>
                    )}
                </ListBox>
            </Popover>
        </Select>
    )
}
