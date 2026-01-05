'use client'
import { CalendarIcon } from 'lucide-react'
import React from 'react'
import {
    DatePicker as AriaDatePicker,
    composeRenderProps,
} from 'react-aria-components'
import { cn } from '../lib/utils'
import { parseDate, today, getLocalTimeZone } from '@internationalized/date'
import { Button } from './Button'
import {
    Calendar,
    CalendarCell,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHeader,
    CalendarHeaderCell,
    CalendarHeading,
} from './Calendar'
import { DateInput } from './Datefield'
import { FieldGroup } from './Field'
import { Popover } from './Popover'

interface FormDatePickerProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    maxValue?: string
    minValue?: string
    disabled?: boolean
    className?: string
}

export function FormDatePicker({
    value,
    onChange,
    maxValue,
    minValue,
    disabled = false,
    className,
}: FormDatePickerProps) {
    return (
        <AriaDatePicker
            aria-label="Date Picker"
            className={composeRenderProps(className, (className) => cn('group w-full', className))}
            value={value ? parseDate(value) : null}
            onChange={(value) => onChange?.(value?.toString() ?? '')}
            maxValue={maxValue ? parseDate(maxValue) : today(getLocalTimeZone())}
            minValue={minValue ? parseDate(minValue) : undefined}
            isDisabled={disabled}
        >
            <FieldGroup
                className={cn(
                    'w-full flex items-center justify-between px-4 py-2 h-auto',
                    'bg-gradient-to-r from-background to-muted/20 text-foreground',
                    'border-2 border-border rounded-xl',
                    'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary',
                    'hover:border-primary/50 hover:from-primary/5 hover:to-primary/10',
                    'transition-all duration-200 shadow-sm',
                    disabled && 'opacity-60 cursor-not-allowed',
                )}
            >
                <DateInput
                    className={cn(
                        'flex-1 flex gap-0.5',
                        '[&_span]:px-0.5 [&_span]:text-foreground [&_span]:text-sm',
                        '[&_span[data-placeholder]]:text-muted-foreground',
                    )}
                    variant="ghost"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-primary/10 rounded-lg data-[focus-visible]:ring-offset-0"
                >
                    <CalendarIcon className="size-4 text-primary opacity-70" />
                </Button>
            </FieldGroup>
            <Popover
                placement="bottom start"
                className={cn(
                    'z-50 p-3',
                    'bg-card text-foreground rounded-xl border-2 border-border shadow-xl',
                    'entering:animate-in entering:fade-in-0 entering:zoom-in-95',
                    'exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95',
                )}
            >
                <Calendar className="w-fit">
                    <CalendarHeading />
                    <CalendarGrid>
                        <CalendarGridHeader>
                            {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                        </CalendarGridHeader>
                        <CalendarGridBody>
                            {(date) => <CalendarCell date={date} />}
                        </CalendarGridBody>
                    </CalendarGrid>
                </Calendar>
            </Popover>
        </AriaDatePicker>
    )
}

