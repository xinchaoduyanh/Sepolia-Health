'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Card, CardContent } from '@workspace/ui/components/Card'
import { parseISO, isSameDay } from 'date-fns'
import {
    APPOINTMENT_BLOCK_CONFIG,
    calculateAppointmentOffset,
    calculateAppointmentHeightPx,
    getUniqueAppointmentsForDay,
    isWithinWorkingHours,
} from '@/util/appointment-helpers'
import { formatTime } from '@/util/datetime'

interface DayViewProps {
    weeklySchedule: any
    currentDate: Date
    timeSlots: string[]
    today: Date
}

export default function DayView({ weeklySchedule, currentDate, timeSlots, today }: DayViewProps) {
    const todayData = weeklySchedule.days.find((d: any) => isSameDay(parseISO(d.date), currentDate))

    return (
        <Card className="border-2 shadow-lg overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                    {timeSlots.map((timeSlot, slotIndex) => {
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

                        // Get unique appointments for today
                        const uniqueAppointments = todayData
                            ? getUniqueAppointmentsForDay(todayData.bookedTimeSlots || [])
                            : []

                        // Hiển thị tất cả các khung giờ để giữ layout timeline đẹp
                        return (
                            <div key={timeSlot} className="flex min-h-[120px] group relative">
                                {/* Cột giờ bên trái */}
                                <div className="w-24 flex-none p-0 border-r bg-muted/5 text-sm font-medium text-muted-foreground text-center relative h-[120px]">
                                    {/* Hour label positioned at the bottom */}
                                    <div className="absolute bottom-1 left-0 right-0">{timeSlot}</div>
                                </div>

                                {/* Khu vực nội dung bên phải */}
                                <div
                                    className={`flex-1 p-2 relative transition-colors ${
                                        isWorkingHour ? 'bg-background hover:bg-muted/20' : 'bg-muted/10'
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
                                                    className="group/appointment absolute left-2 right-2 bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 dark:from-primary/25 dark:via-primary/20 dark:to-primary/15 border-2 border-primary/40 dark:border-primary/50 rounded-lg cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:border-primary/70 dark:hover:border-primary/80 backdrop-blur-sm flex flex-col"
                                                    style={{
                                                        top: `${calculateAppointmentOffset(apt.startDateTime)}px`,
                                                        height: `${Math.max(calculateAppointmentHeightPx(apt.startDateTime, apt.endDateTime), 50)}px`,
                                                        zIndex: 20,
                                                        minHeight: '50px',
                                                        padding:
                                                            calculateAppointmentHeightPx(apt.startDateTime, apt.endDateTime) <
                                                            60
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
                                                    {calculateAppointmentHeightPx(apt.startDateTime, apt.endDateTime) > 55 && (
                                                        <div
                                                            className={`${APPOINTMENT_BLOCK_CONFIG.patientNameTextSize} font-semibold text-foreground truncate leading-tight ${APPOINTMENT_BLOCK_CONFIG.patientNameMargin}`}
                                                        >
                                                            {apt.patientName}
                                                        </div>
                                                    )}

                                                    {/* Service - Show if >50px (includes 30min appointments) */}
                                                    {calculateAppointmentHeightPx(apt.startDateTime, apt.endDateTime) > 50 && (
                                                        <div
                                                            className={`${APPOINTMENT_BLOCK_CONFIG.serviceTextSize} text-muted-foreground line-clamp-1 leading-tight ${APPOINTMENT_BLOCK_CONFIG.serviceMargin}`}
                                                        >
                                                            {apt.serviceName}
                                                        </div>
                                                    )}

                                                    {/* Click hint for small blocks */}
                                                    {calculateAppointmentHeightPx(apt.startDateTime, apt.endDateTime) <= 55 && (
                                                        <div
                                                            className={`${APPOINTMENT_BLOCK_CONFIG.clickHintTextSize} text-muted-foreground/50 ${APPOINTMENT_BLOCK_CONFIG.clickHintMargin} leading-tight`}
                                                        >
                                                            Click →
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
