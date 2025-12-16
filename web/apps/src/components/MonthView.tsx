'use client'

import { Card, CardContent } from '@workspace/ui/components/Card'
import { User } from 'lucide-react'
import { format, isSameDay, isSameMonth } from 'date-fns'

interface MonthViewProps {
    monthlySchedule: any
    currentDate: Date
    today: Date
}

export default function MonthView({ monthlySchedule, currentDate, today }: MonthViewProps) {
    const calendarDays: Date[] = []
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = new Date(start)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    const endDate = new Date(end)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        calendarDays.push(new Date(d))
    }

    return (
        <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/50 overflow-hidden">
            <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-1 bg-muted/30 rounded-xl overflow-hidden border-2 border-border p-1">
                    {/* Weekday Headers */}
                    {['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((day, index) => (
                        <div
                            key={index}
                            className="p-3 text-center font-bold text-sm bg-gradient-to-br from-muted/80 to-muted/50 border-b-2 border-border"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar Days - Full month grid */}
                    {calendarDays.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const dayData = monthlySchedule.days.find((d: any) => d.date === dateStr)
                        const isCurrentMonth = isSameMonth(date, currentDate)
                        const isToday = isSameDay(date, today)
                        const hasSchedule = dayData && !dayData.isOff && dayData.actualSchedule
                        const appointmentCount = dayData?.bookedTimeSlots?.length || 0

                        return (
                            <div
                                key={dateStr}
                                className={`min-h-[120px] p-3 bg-background border-2 rounded-lg relative transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                                    !isCurrentMonth
                                        ? 'opacity-40 bg-muted/10 border-muted/30'
                                        : 'border-border hover:border-primary/30'
                                } ${
                                    isToday
                                        ? 'bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/50 shadow-lg ring-2 ring-primary/20'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        className={`text-base font-bold rounded-full w-7 h-7 flex items-center justify-center transition-all ${
                                            isToday
                                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg scale-110'
                                                : 'text-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        {format(date, 'd')}
                                    </span>
                                    {hasSchedule && (
                                        <span className="text-[10px] px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 font-semibold">
                                            {dayData.actualSchedule?.startTime?.slice(0, 5)} -{' '}
                                            {dayData.actualSchedule?.endTime?.slice(0, 5)}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1.5 mt-2">
                                    {appointmentCount > 0 ? (
                                        <div className="text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            <span>{appointmentCount} bệnh nhân</span>
                                        </div>
                                    ) : hasSchedule ? (
                                        <div className="text-[11px] text-muted-foreground text-center mt-4 px-2 py-1 bg-muted/30 rounded-lg">
                                            Trống lịch
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-muted-foreground/50 text-center mt-4 px-2 py-1 bg-muted/20 rounded-lg">
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
    )
}
