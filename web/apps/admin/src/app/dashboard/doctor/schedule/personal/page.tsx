'use client'

import { useState, useMemo } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Popover, PopoverTrigger, PopoverDialog } from '@workspace/ui/components/Popover'
import { BsSelect } from '@workspace/ui/components/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { ChevronLeft, ChevronRight, Clock, User, Stethoscope, CalendarIcon, RefreshCw } from 'lucide-react'
import {
    format,
    startOfWeek,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    parseISO,
    isSameDay,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameMonth,
    isAfter,
    startOfDay,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { useDoctorWeeklySchedule, useDoctorMonthlySchedule } from '@/shared/hooks'
import type { BookedTimeSlot } from '@/shared/lib/api-services/doctor-schedule.service'
import { getStatusColor } from './utils/status-colors'

// Generate time slots from 7:00 to 18:00 (every hour)
const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 7; hour <= 18; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
}

// Check if a time slot is within working hours
const isWithinWorkingHours = (timeSlot: string, startTime: string | null, endTime: string | null): boolean => {
    if (!startTime || !endTime) return false
    const slotParts = timeSlot.split(':')
    if (slotParts.length !== 2) return false
    const slotMinutes = parseInt(slotParts[0] || '0', 10) * 60 + parseInt(slotParts[1] || '0', 10)

    const startParts = startTime.split(':')
    if (startParts.length !== 2) return false
    const startMinutes = parseInt(startParts[0] || '0', 10) * 60 + parseInt(startParts[1] || '0', 10)

    const endParts = endTime.split(':')
    if (endParts.length !== 2) return false
    const endMinutes = parseInt(endParts[0] || '0', 10) * 60 + parseInt(endParts[1] || '0', 10)

    return slotMinutes >= startMinutes && slotMinutes < endMinutes
}

// Check if a time slot has a booked appointment
const getBookedSlotForTime = (timeSlot: string, bookedSlots: BookedTimeSlot[]) => {
    const slotParts = timeSlot.split(':')
    if (slotParts.length !== 2) return undefined
    const slotMinutes = parseInt(slotParts[0] || '0', 10) * 60 + parseInt(slotParts[1] || '0', 10)

    return bookedSlots.find(slot => {
        const startParts = slot.startTime.split(':')
        if (startParts.length !== 2) return false
        const startMinutes = parseInt(startParts[0] || '0', 10) * 60 + parseInt(startParts[1] || '0', 10)

        const endParts = slot.endTime.split(':')
        if (endParts.length !== 2) return false
        const endMinutes = parseInt(endParts[0] || '0', 10) * 60 + parseInt(endParts[1] || '0', 10)

        return slotMinutes >= startMinutes && slotMinutes < endMinutes
    })
}

type ViewMode = 'day' | 'week' | 'month'

export default function DoctorPersonalSchedulePage() {
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const timeSlots = useMemo(() => generateTimeSlots(), [])

    // Week View Data - API
    const weekStartDateStr = useMemo(() => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // Sunday
        return format(weekStart, 'yyyy-MM-dd')
    }, [currentDate])

    const {
        data: weeklySchedule,
        isLoading: isWeeklyLoading,
        refetch: refetchWeekly,
    } = useDoctorWeeklySchedule({ weekStartDate: weekStartDateStr }, viewMode === 'week' || viewMode === 'day')

    // Month View Data - API
    const monthDateRange = useMemo(() => {
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)
        return {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd'),
        }
    }, [currentDate])

    const {
        data: monthlySchedule,
        isLoading: isMonthlyLoading,
        refetch: refetchMonthly,
    } = useDoctorMonthlySchedule(monthDateRange, viewMode === 'month')

    const handleRefresh = () => {
        if (viewMode === 'month') {
            refetchMonthly()
        } else {
            refetchWeekly()
        }
    }

    const isLoading = viewMode === 'month' ? isMonthlyLoading : isWeeklyLoading

    const handlePrevious = () => {
        if (viewMode === 'day') {
            setCurrentDate(subDays(currentDate, 1))
        } else if (viewMode === 'week') {
            setCurrentDate(subWeeks(currentDate, 1))
        } else {
            setCurrentDate(subMonths(currentDate, 1))
        }
    }

    const handleNext = () => {
        if (viewMode === 'day') {
            setCurrentDate(addDays(currentDate, 1))
        } else if (viewMode === 'week') {
            setCurrentDate(addWeeks(currentDate, 1))
        } else {
            setCurrentDate(addMonths(currentDate, 1))
        }
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    // Calculate today's and upcoming appointments
    const todayAppointments = useMemo(() => {
        if (!weeklySchedule) return []
        const today = format(new Date(), 'yyyy-MM-dd')
        const todayData = weeklySchedule.days.find(d => d.date === today)
        return todayData?.bookedTimeSlots || []
    }, [weeklySchedule])

    const upcomingAppointments = useMemo(() => {
        if (!weeklySchedule) return []
        const today = startOfDay(new Date())
        const appointments: Array<{ date: string; slot: BookedTimeSlot }> = []

        weeklySchedule.days.forEach(day => {
            const dayDate = parseISO(day.date)
            if (isAfter(dayDate, today) || isSameDay(dayDate, today)) {
                day.bookedTimeSlots?.forEach(slot => {
                    appointments.push({ date: day.date, slot })
                })
            }
        })

        return appointments
            .sort((a, b) => {
                const dateA = parseISO(a.date)
                const dateB = parseISO(b.date)
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime()
                }
                return a.slot.startTime.localeCompare(b.slot.startTime)
            })
            .slice(0, 5) // Limit to 5 upcoming
    }, [weeklySchedule])

    // Generate calendar days for month view
    const calendarDays = useMemo(() => {
        if (viewMode !== 'month') return []

        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
        const end = endOfMonth(currentDate)
        const endWeek = new Date(end)
        endWeek.setDate(endWeek.getDate() + (6 - endWeek.getDay()))

        return eachDayOfInterval({ start, end: endWeek })
    }, [currentDate, viewMode])

    const today = new Date()

    // Format date display
    const dateDisplay = useMemo(() => {
        if (viewMode === 'month') {
            return format(currentDate, "'tháng' M yyyy", { locale: vi })
        } else if (viewMode === 'day') {
            return format(currentDate, "d 'tháng' M, yyyy", { locale: vi })
        } else {
            return format(currentDate, "d 'tháng' M, yyyy", { locale: vi })
        }
    }, [currentDate, viewMode])

    // Skeleton components for loading states
    const WeekViewSkeleton = () => (
        <Card className="border-2 shadow-lg">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="border-b-2 border-r-2 p-2 w-20 bg-background sticky left-0 z-10">
                                    <Skeleton className="h-4 w-12 mx-auto" />
                                </th>
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <th key={i} className="border-b-2 border-r-2 p-2 text-center min-w-[140px]">
                                        <Skeleton className="h-4 w-16 mx-auto mb-1" />
                                        <Skeleton className="h-3 w-12 mx-auto" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 12 }).map((_, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className="border-r-2 border-b-2 p-2 text-center bg-background sticky left-0 z-10">
                                        <Skeleton className="h-3 w-10 mx-auto" />
                                    </td>
                                    {Array.from({ length: 7 }).map((_, colIndex) => (
                                        <td key={colIndex} className="border-r-2 border-b-2 p-1.5 h-[60px]">
                                            <Skeleton className="h-full w-full rounded" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )

    const MonthViewSkeleton = () => (
        <Card className="border-2 shadow-lg">
            <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-px bg-muted/20 rounded-lg overflow-hidden border">
                    {/* Weekday Headers */}
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="p-2 text-center bg-muted/50 border-b">
                            <Skeleton className="h-4 w-16 mx-auto" />
                        </div>
                    ))}
                    {/* Calendar Days */}
                    {Array.from({ length: 42 }).map((_, i) => (
                        <div key={i} className="min-h-[100px] p-2 bg-background border-r border-b">
                            <div className="flex justify-between items-start mb-1">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="mt-2 space-y-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    const DayViewSkeleton = () => (
        <Card className="border-2 shadow-lg overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex min-h-[100px]">
                            <div className="w-24 flex-none p-4 border-r bg-muted/5">
                                <Skeleton className="h-4 w-12 mx-auto" />
                            </div>
                            <div className="flex-1 p-2">
                                <Skeleton className="h-full w-full rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
                {/* Navigation Bar Skeleton */}
                <Card className="border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-9 w-9" />
                                <Skeleton className="h-9 w-40" />
                                <Skeleton className="h-9 w-9" />
                                <Skeleton className="h-9 w-20" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <Skeleton className="h-9 w-[120px]" />
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Calendar Skeleton */}
                {viewMode === 'week' && <WeekViewSkeleton />}
                {viewMode === 'month' && <MonthViewSkeleton />}
                {viewMode === 'day' && <DayViewSkeleton />}
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
            {/* Navigation Bar */}
            <Card className="border">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* Left: Date Navigation */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevious}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 min-w-[140px] justify-center">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium capitalize">{dateDisplay}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleToday}>
                                Hôm nay
                            </Button>
                        </div>

                        {/* Right: Filter and View Mode */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={handleRefresh} className="rounded-full">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <BsSelect
                                selectedKey="all"
                                options={[
                                    { id: 'all', name: 'Tất cả' },
                                    { id: 'bs1', name: 'BS. Nguyễn Văn A' },
                                    { id: 'bs2', name: 'BS. Trần Thị B' },
                                ]}
                                className="w-[120px]"
                            />

                            <div className="flex bg-muted rounded-lg p-1">
                                <Button
                                    variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('day')}
                                    className="h-8 px-3"
                                >
                                    Ngày
                                </Button>
                                <Button
                                    variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('week')}
                                    className="h-8 px-3"
                                >
                                    Tuần
                                </Button>
                                <Button
                                    variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('month')}
                                    className="h-8 px-3"
                                >
                                    Tháng
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content: Calendar + Sidebar */}
            <div className={`grid grid-cols-1 gap-6 ${viewMode === 'day' ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
                {/* Calendar View */}
                <div>
                    {/* Week View */}
                    {viewMode === 'week' && weeklySchedule && (
                        <Card className="border-2 shadow-lg">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse min-w-[800px]">
                                        {/* Header - Days of week */}
                                        <thead>
                                            <tr className="bg-muted/50">
                                                <th className="border-b-2 border-r-2 p-2 w-20 bg-background sticky left-0 z-10">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        Giờ
                                                    </span>
                                                </th>
                                                {weeklySchedule.days.map(day => {
                                                    const date = parseISO(day.date)
                                                    const isToday = isSameDay(date, today)
                                                    return (
                                                        <th
                                                            key={day.date}
                                                            className={`border-b-2 border-r-2 p-2 text-center font-semibold min-w-[140px] transition-colors ${
                                                                isToday
                                                                    ? 'bg-primary/10 dark:bg-primary/20 border-primary/40'
                                                                    : 'bg-background'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-sm font-bold capitalize">
                                                                    {day.dayName}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground font-normal">
                                                                    {format(date, 'dd/MM', { locale: vi })}
                                                                </span>
                                                            </div>
                                                        </th>
                                                    )
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Time slots rows */}
                                            {timeSlots.map(timeSlot => (
                                                <tr
                                                    key={timeSlot}
                                                    className="group hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="border-r-2 border-b-2 p-2 text-xs font-medium text-muted-foreground text-center bg-background sticky left-0 z-10">
                                                        {timeSlot}
                                                    </td>
                                                    {/* Day columns */}
                                                    {weeklySchedule.days.map(day => {
                                                        const date = parseISO(day.date)
                                                        const isToday = isSameDay(date, today)
                                                        const isWorkingHour =
                                                            !day.isOff && day.actualSchedule
                                                                ? isWithinWorkingHours(
                                                                      timeSlot,
                                                                      day.actualSchedule.startTime,
                                                                      day.actualSchedule.endTime,
                                                                  )
                                                                : false
                                                        const bookedSlot = getBookedSlotForTime(
                                                            timeSlot,
                                                            day.bookedTimeSlots || [],
                                                        )

                                                        return (
                                                            <td
                                                                key={day.date}
                                                                className={`border-r-2 border-b-2 p-1.5 align-top transition-colors h-[60px] ${
                                                                    isToday
                                                                        ? 'bg-primary/5 dark:bg-primary/10'
                                                                        : 'bg-background'
                                                                } ${
                                                                    isWorkingHour
                                                                        ? 'bg-blue-50/50 dark:bg-blue-950/10'
                                                                        : 'bg-muted/20 dark:bg-muted/10'
                                                                }`}
                                                            >
                                                                {bookedSlot ? (
                                                                    <PopoverTrigger>
                                                                        <div className="group/appointment relative bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/30 dark:border-primary/40 rounded-md p-2 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 hover:border-primary/50 dark:hover:border-primary/60 h-full">
                                                                            <div className="text-xs font-semibold text-primary dark:text-primary mb-1 truncate">
                                                                                {bookedSlot.displayTime}
                                                                            </div>
                                                                            <div className="text-xs font-medium text-foreground truncate">
                                                                                {bookedSlot.patientName}
                                                                            </div>
                                                                        </div>
                                                                        <Popover placement="right" offset={8}>
                                                                            <PopoverDialog className="w-80 p-4">
                                                                                <div className="space-y-3">
                                                                                    <div className="flex items-center gap-2 pb-2 border-b">
                                                                                        <div className="p-2 bg-primary/10 rounded-lg">
                                                                                            <Clock className="h-4 w-4 text-primary" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-xs text-muted-foreground">
                                                                                                Thời gian
                                                                                            </div>
                                                                                            <div className="text-sm font-semibold text-foreground">
                                                                                                {bookedSlot.displayTime}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                                                                            <User className="h-4 w-4 text-blue-500" />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <div className="text-xs text-muted-foreground">
                                                                                                Bệnh nhân
                                                                                            </div>
                                                                                            <div className="text-sm font-medium text-foreground">
                                                                                                {bookedSlot.patientName}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="p-2 bg-green-500/10 rounded-lg">
                                                                                            <Stethoscope className="h-4 w-4 text-green-500" />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <div className="text-xs text-muted-foreground">
                                                                                                Dịch vụ
                                                                                            </div>
                                                                                            <div className="text-sm font-medium text-foreground">
                                                                                                {bookedSlot.serviceName}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </PopoverDialog>
                                                                        </Popover>
                                                                    </PopoverTrigger>
                                                                ) : isWorkingHour ? (
                                                                    <div className="h-full w-full group-hover:bg-primary/5 transition-colors rounded-sm" />
                                                                ) : (
                                                                    <div className="h-full w-full bg-muted/30 dark:bg-muted/20" />
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Month View */}
                    {viewMode === 'month' && monthlySchedule && (
                        <Card className="border-2 shadow-lg">
                            <CardContent className="p-4">
                                <div className="grid grid-cols-7 gap-px bg-muted/20 rounded-lg overflow-hidden border">
                                    {/* Weekday Headers */}
                                    {['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(
                                        (day, index) => (
                                            <div
                                                key={index}
                                                className="p-2 text-center font-semibold text-sm bg-muted/50 border-b"
                                            >
                                                {day}
                                            </div>
                                        ),
                                    )}

                                    {/* Calendar Days - Full month grid */}
                                    {calendarDays.map(date => {
                                        const dateStr = format(date, 'yyyy-MM-dd')
                                        const dayData = monthlySchedule.days.find(d => d.date === dateStr)
                                        const isCurrentMonth = isSameMonth(date, currentDate)
                                        const isToday = isSameDay(date, today)
                                        const hasSchedule = dayData && !dayData.isOff && dayData.actualSchedule
                                        const appointmentCount = dayData?.bookedTimeSlots?.length || 0

                                        return (
                                            <div
                                                key={dateStr}
                                                className={`min-h-[100px] p-2 bg-background border-r border-b relative transition-colors hover:bg-muted/10 ${
                                                    !isCurrentMonth ? 'opacity-50 bg-muted/5' : ''
                                                } ${isToday ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span
                                                        className={`text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                                                            isToday
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {format(date, 'd')}
                                                    </span>
                                                    {hasSchedule && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                                                            {dayData.actualSchedule?.startTime?.slice(0, 5)} -{' '}
                                                            {dayData.actualSchedule?.endTime?.slice(0, 5)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1 mt-2">
                                                    {appointmentCount > 0 ? (
                                                        <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {appointmentCount} bệnh nhân
                                                        </div>
                                                    ) : hasSchedule ? (
                                                        <div className="text-[10px] text-muted-foreground text-center mt-4">
                                                            Trống lịch
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-muted-foreground/50 text-center mt-4">
                                                            Nghỉ
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Day View - Timeline Style */}
                    {viewMode === 'day' &&
                        weeklySchedule &&
                        (() => {
                            const todayData = weeklySchedule.days.find(d => isSameDay(parseISO(d.date), currentDate))

                            // Nếu không có dữ liệu ngày, vẫn gen lịch trống ra
                            return (
                                <Card className="border-2 shadow-lg overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col divide-y">
                                            {timeSlots.map(timeSlot => {
                                                // Nếu không có dữ liệu, tất cả slots đều trống
                                                const isWorkingHour = todayData
                                                    ? !todayData.isOff && todayData.actualSchedule
                                                        ? isWithinWorkingHours(
                                                              timeSlot,
                                                              todayData.actualSchedule.startTime,
                                                              todayData.actualSchedule.endTime,
                                                          )
                                                        : false
                                                    : false
                                                const bookedSlot = todayData
                                                    ? getBookedSlotForTime(timeSlot, todayData.bookedTimeSlots || [])
                                                    : undefined

                                                // Hiển thị tất cả các khung giờ để giữ layout timeline đẹp
                                                return (
                                                    <div key={timeSlot} className="flex min-h-[100px] group">
                                                        {/* Cột giờ bên trái */}
                                                        <div className="w-24 flex-none p-4 border-r bg-muted/5 text-sm font-medium text-muted-foreground text-center pt-6">
                                                            {timeSlot}
                                                        </div>

                                                        {/* Khu vực nội dung bên phải */}
                                                        <div
                                                            className={`flex-1 p-2 relative transition-colors ${
                                                                isWorkingHour
                                                                    ? 'bg-background hover:bg-muted/20'
                                                                    : 'bg-muted/10'
                                                            }`}
                                                        >
                                                            {bookedSlot ? (
                                                                <PopoverTrigger>
                                                                    <div className="absolute top-2 left-2 right-2 bottom-2 bg-primary/10 border-l-4 border-primary rounded-r-md p-3 cursor-pointer hover:bg-primary/15 transition-colors">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-sm font-bold text-primary">
                                                                                {bookedSlot.displayTime}
                                                                            </span>
                                                                            {(() => {
                                                                                const statusColor = getStatusColor(
                                                                                    bookedSlot.status,
                                                                                )
                                                                                return (
                                                                                    <span
                                                                                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor.bg} ${statusColor.text}`}
                                                                                    >
                                                                                        {statusColor.label}
                                                                                    </span>
                                                                                )
                                                                            })()}
                                                                        </div>
                                                                        <div className="font-medium text-foreground">
                                                                            {bookedSlot.patientName}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                                            <Stethoscope className="h-3 w-3" />
                                                                            {bookedSlot.serviceName}
                                                                        </div>
                                                                    </div>
                                                                    <Popover placement="right" offset={8}>
                                                                        <PopoverDialog className="w-80 p-4">
                                                                            <div className="space-y-3">
                                                                                <div className="flex items-center gap-2 pb-2 border-b">
                                                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                                                        <Clock className="h-4 w-4 text-primary" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            Thời gian
                                                                                        </div>
                                                                                        <div className="text-sm font-semibold text-foreground">
                                                                                            {bookedSlot.displayTime}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                                                                        <User className="h-4 w-4 text-blue-500" />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            Bệnh nhân
                                                                                        </div>
                                                                                        <div className="text-sm font-medium text-foreground">
                                                                                            {bookedSlot.patientName}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                                                                        <Stethoscope className="h-4 w-4 text-green-500" />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            Dịch vụ
                                                                                        </div>
                                                                                        <div className="text-sm font-medium text-foreground">
                                                                                            {bookedSlot.serviceName}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </PopoverDialog>
                                                                    </Popover>
                                                                </PopoverTrigger>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })()}
                </div>

                {/* Right Sidebar - Only for Day View */}
                {viewMode === 'day' && (
                    <div className="space-y-4">
                        {/* Today's Appointments */}
                        <Card className="border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">Lịch hẹn hôm nay</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {todayAppointments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Không có lịch hẹn nào trong ngày</p>
                                ) : (
                                    <div className="space-y-2">
                                        {todayAppointments.map((slot, index) => (
                                            <div key={index} className="p-2 rounded-md bg-muted/50 border">
                                                <div className="text-xs font-medium text-foreground">
                                                    {slot.displayTime}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {slot.patientName}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Appointments */}
                        <Card className="border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Lịch hẹn sắp tới</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingAppointments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Không có lịch hẹn sắp tới</p>
                                ) : (
                                    <div className="space-y-2">
                                        {upcomingAppointments.map((item, index) => (
                                            <div key={index} className="p-2 rounded-md bg-muted/50 border">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {format(parseISO(item.date), 'dd/MM/yyyy', { locale: vi })}
                                                </div>
                                                <div className="text-xs font-medium text-foreground mt-1">
                                                    {item.slot.displayTime}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {item.slot.patientName}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
