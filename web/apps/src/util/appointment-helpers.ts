/**
 * Configuration for appointment block styling
 * Adjust these values to customize text sizes, spacing, and appearance
 */
export const APPOINTMENT_BLOCK_CONFIG = {
    // Text sizes (Tailwind classes)
    timeTextSize: 'text-[10px]', // Time display in block
    patientNameTextSize: 'text-[12px]', // Patient name
    serviceTextSize: 'text-[12px]', // Service description
    clickHintTextSize: 'text-[9px]', // "Click →" hint

    // Icon sizes
    timeIconSize: 'h-2.5 w-2.5', // Clock icon

    // Spacing
    timeGap: 'gap-0.5', // Gap between clock icon and time text
    patientNameMargin: 'mt-0', // Margin above patient name
    serviceMargin: 'mt-0', // Margin above service
    clickHintMargin: 'mt-auto pt-0.5', // Margin for click hint

    // Padding for small blocks (< 60px height)
    smallBlockPadding: '0.25rem 0.375rem',
    // Padding for larger blocks
    normalBlockPadding: '0.375rem',
}

export const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 7; hour <= 18; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
}

// Check if a time slot is within working hours
export const isWithinWorkingHours = (timeSlot: string, startTime: string | null, endTime: string | null): boolean => {
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

// Get all unique appointments for a day (deduplicated)
export const getUniqueAppointmentsForDay = (bookedSlots: any[]) => {
    const seen = new Set<number>()
    return bookedSlots.filter(apt => {
        if (seen.has(apt.appointmentId)) return false
        seen.add(apt.appointmentId)
        return true
    })
}

// Calculate vertical offset (in pixels) based on start time within the day
export const calculateAppointmentOffset = (startTime: string, dayStartTime: string = '07:00') => {
    const startParts = startTime.split(':')
    const startMinutes = parseInt(startParts[0] || '0', 10) * 60 + parseInt(startParts[1] || '0', 10)

    const dayStartParts = dayStartTime.split(':')
    const dayStartMinutes = parseInt(dayStartParts[0] || '0', 10) * 60 + parseInt(dayStartParts[1] || '0', 10)

    const offsetMinutes = startMinutes - dayStartMinutes
    const slotHeightPx = 120 // Each hour is 120px
    const offsetPx = (offsetMinutes / 60) * slotHeightPx

    return offsetPx
}

// Calculate height based on duration (in pixels)
export const calculateAppointmentHeightPx = (startTime: string, endTime: string) => {
    const startParts = startTime.split(':')
    const startMinutes = parseInt(startParts[0] || '0', 10) * 60 + parseInt(startParts[1] || '0', 10)

    const endParts = endTime.split(':')
    const endMinutes = parseInt(endParts[0] || '0', 10) * 60 + parseInt(endParts[1] || '0', 10)

    const durationMinutes = endMinutes - startMinutes
    const slotHeightPx = 120 // Each hour is 120px
    const heightPx = (durationMinutes / 60) * slotHeightPx

    return heightPx
}
