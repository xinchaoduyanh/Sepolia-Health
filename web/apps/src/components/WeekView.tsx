'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Card, CardContent } from '@workspace/ui/components/Card'
import { format, parseISO, isSameDay } from 'date-fns'
import {
    APPOINTMENT_BLOCK_CONFIG,
    calculateAppointmentOffset,
    calculateAppointmentHeightPx,
    getUniqueAppointmentsForDay,
} from '@/util/appointment-helpers'
import { formatTime } from '@/util/datetime'

interface WeekViewProps {
    weeklySchedule: any
    timeSlots: string[]
    today: Date
}

export default function WeekView({ weeklySchedule, timeSlots, today }: WeekViewProps) {
    return (
        <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/50 overflow-hidden">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[700px]">
                        {/* Header - Days of week */}
                        <thead>
                            <tr className="bg-gradient-to-r from-muted/80 to-muted/50 border-b-2 border-border sticky top-0 z-40">
                                <th className="border-r-2 border-border p-4 w-24 bg-background sticky left-0 z-30 shadow-lg">
                                    <span className="text-sm font-bold text-foreground">Giờ</span>
                                </th>
                                {weeklySchedule.days.map((day: any) => {
                                    const date = parseISO(day.date)
                                    const isToday = isSameDay(date, today)
                                    return (
                                        <th
                                            key={day.date}
                                            className={`border-r-2 border-border p-3 text-center font-semibold min-w-[120px] transition-all ${
                                                isToday
                                                    ? 'bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 border-primary/40 shadow-inner'
                                                    : 'bg-background hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={`text-base font-bold capitalize ${
                                                        isToday ? 'text-primary' : 'text-foreground'
                                                    }`}
                                                >
                                                    {day.dayName}
                                                </span>
                                                <span
                                                    className={`text-xs font-medium ${
                                                        isToday ? 'text-primary/80' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {format(date, 'dd/MM')}
                                                </span>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Time slots rows */}
                            {timeSlots.map((timeSlot, slotIndex) => (
                                <tr key={timeSlot} className="group hover:bg-muted/30 transition-colors">
                                    <td className="border-r-2 border-b-2 p-0 text-xs font-medium text-muted-foreground text-center bg-background sticky left-0 z-10 relative h-[120px]">
                                        {/* Hour label positioned at the bottom of the block */}
                                        <div className="absolute bottom-1 left-0 right-0 text-center">{timeSlot}</div>
                                    </td>
                                    {/* Day columns */}
                                    {weeklySchedule.days.map((day: any) => {
                                        const date = parseISO(day.date)
                                        const isToday = isSameDay(date, today)

                                        // Get unique appointments for this day
                                        const uniqueAppointments = getUniqueAppointmentsForDay(
                                            day.bookedTimeSlots || [],
                                        )

                                        return (
                                            <td
                                                key={day.date}
                                                className={`border-r border-b border-border p-1.5 align-top transition-all duration-200 h-[120px] relative ${
                                                    isToday
                                                        ? 'bg-primary/5 dark:bg-primary/10'
                                                        : 'bg-background hover:bg-muted/20'
                                                }`}
                                            >
                                                {/* Appointments overlaid with absolute positioning */}
                                                {slotIndex === 0 &&
                                                    uniqueAppointments.map((apt: any) => (
                                                        <Link
                                                            key={apt.appointmentId}
                                                            href={`/doctor/schedule/appointments/${apt.appointmentId}`}
                                                        >
                                                            <div
                                                                className="group/appointment absolute left-1.5 right-1.5 bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 dark:from-primary/25 dark:via-primary/20 dark:to-primary/15 border-2 border-primary/40 dark:border-primary/50 rounded-lg cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:border-primary/70 dark:hover:border-primary/80 backdrop-blur-sm flex flex-col"
                                                                style={{
                                                                    top: `${calculateAppointmentOffset(apt.startDateTime)}px`,
                                                                    height: `${Math.max(calculateAppointmentHeightPx(apt.startDateTime, apt.endDateTime), 50)}px`,
                                                                    zIndex: 20,
                                                                    minHeight: '50px',
                                                                    padding:
                                                                        calculateAppointmentHeightPx(
                                                                            apt.startDateTime,
                                                                            apt.endDateTime,
                                                                        ) < 60
                                                                            ? APPOINTMENT_BLOCK_CONFIG.smallBlockPadding
                                                                            : APPOINTMENT_BLOCK_CONFIG.normalBlockPadding,
                                                                }}
                                                            >
                                                                {/* Time - Always show */}
                                                                <div
                                                                    className={`flex items-center ${APPOINTMENT_BLOCK_CONFIG.timeGap} flex-shrink-0`}
                                                                >
                                                                    <Clock
                                                                        className={`${APPOINTMENT_BLOCK_CONFIG.timeIconSize} text-primary flex-shrink-0`}
                                                                    />
                                                                    <span
                                                                        className={`${APPOINTMENT_BLOCK_CONFIG.timeTextSize} font-bold text-primary dark:text-primary leading-tight`}
                                                                    >
                                                                        {formatTime(apt.startDateTime)}
                                                                    </span>
                                                                </div>

                                                                {/* Patient Name - Show if >55px */}
                                                                {calculateAppointmentHeightPx(
                                                                    apt.startDateTime,
                                                                    apt.endDateTime,
                                                                ) > 55 && (
                                                                    <div
                                                                        className={`${APPOINTMENT_BLOCK_CONFIG.patientNameTextSize} font-semibold text-foreground truncate leading-tight ${APPOINTMENT_BLOCK_CONFIG.patientNameMargin}`}
                                                                    >
                                                                        {apt.patientName}
                                                                    </div>
                                                                )}

                                                                {/* Service - Show if >50px (includes 30min appointments) */}
                                                                {calculateAppointmentHeightPx(
                                                                    apt.startDateTime,
                                                                    apt.endDateTime,
                                                                ) > 50 && (
                                                                    <div
                                                                        className={`${APPOINTMENT_BLOCK_CONFIG.serviceTextSize} text-muted-foreground line-clamp-1 leading-tight ${APPOINTMENT_BLOCK_CONFIG.serviceMargin}`}
                                                                    >
                                                                        {apt.serviceName}
                                                                    </div>
                                                                )}

                                                                {/* Click hint for small blocks */}
                                                                {calculateAppointmentHeightPx(
                                                                    apt.startDateTime,
                                                                    apt.endDateTime,
                                                                ) <= 55 && (
                                                                    <div
                                                                        className={`${APPOINTMENT_BLOCK_CONFIG.clickHintTextSize} text-muted-foreground/50 ${APPOINTMENT_BLOCK_CONFIG.clickHintMargin} leading-tight`}
                                                                    >
                                                                        Click →
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    ))}
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
    )
}
