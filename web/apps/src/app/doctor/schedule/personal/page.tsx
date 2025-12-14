'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { CalendarIcon } from 'lucide-react'
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
import { generateTimeSlots } from '@/util/appointment-helpers'
import WeekView from '@/components/WeekView'
import MonthView from '@/components/MonthView'
import DayView from '@/components/DayView'
import NavigationBar from '@/components/ScheduleNavigationBar'

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
        const appointments: Array<{ date: string; slot: any }> = []

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
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Lịch cá nhân
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Quản lý và theo dõi lịch làm việc của bạn một cách trực quan
                    </p>
                </div>
            </div>

            {/* Navigation Bar Component */}
            <NavigationBar
                viewMode={viewMode}
                setViewMode={setViewMode}
                dateDisplay={dateDisplay}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToday={handleToday}
                onRefresh={handleRefresh}
            />

            {/* Main Content: Calendar + Sidebar */}
            <div className={`grid grid-cols-1 gap-6 ${viewMode === 'day' ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
                {/* Calendar View */}
                <div>
                    {/* Week View Component */}
                    {viewMode === 'week' && weeklySchedule && (
                        <WeekView weeklySchedule={weeklySchedule} timeSlots={timeSlots} today={today} />
                    )}

                    {/* Month View Component */}
                    {viewMode === 'month' && monthlySchedule && (
                        <MonthView monthlySchedule={monthlySchedule} currentDate={currentDate} today={today} />
                    )}

                    {/* Day View Component */}
                    {viewMode === 'day' && weeklySchedule && (
                        <DayView
                            weeklySchedule={weeklySchedule}
                            currentDate={currentDate}
                            timeSlots={timeSlots}
                            today={today}
                        />
                    )}
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
