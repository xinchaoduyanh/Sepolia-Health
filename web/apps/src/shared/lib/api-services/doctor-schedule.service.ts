import { apiClient } from '../api-client'

// Types for Doctor Schedule API
export type AppointmentStatus = 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED'

export interface BookedTimeSlot {
    startTime: string
    endTime: string
    displayTime: string
    appointmentId: number
    serviceName: string
    patientName: string
    status: AppointmentStatus
    startDateTime: string
    endDateTime: string
}

export interface DoctorAvailability {
    id: number
    dayOfWeek: number
    startTime: string
    endTime: string
}

export interface AvailabilityOverride {
    id: number
    date: string
    startTime: string | null
    endTime: string | null
}

export interface WeeklyScheduleDay {
    date: string
    dayOfWeek: number
    dayName: string
    availability: DoctorAvailability | null
    override: AvailabilityOverride | null
    actualSchedule: { startTime: string; endTime: string } | null
    isOff: boolean
    bookedTimeSlots: BookedTimeSlot[]
}

export interface WeeklyScheduleResponse {
    doctorId: number
    doctorName: string
    weekStartDate: string
    weekEndDate: string
    days: WeeklyScheduleDay[]
}

export interface MonthlyScheduleResponse {
    doctorId: number
    doctorName: string
    startDate: string
    endDate: string
    days: WeeklyScheduleDay[]
}

export interface GetWeeklyScheduleParams {
    weekStartDate?: string // ISO date string (YYYY-MM-DD)
}

export interface GetMonthlyScheduleParams {
    startDate?: string // ISO date string (YYYY-MM-DD)
    endDate?: string // ISO date string (YYYY-MM-DD)
}

export class DoctorScheduleService {
    /**
     * Get weekly schedule for doctor
     * GET /doctor/schedule/weekly
     */
    async getWeeklySchedule(params: GetWeeklyScheduleParams = {}): Promise<WeeklyScheduleResponse> {
        return apiClient.get<WeeklyScheduleResponse>('/doctor/schedule/weekly', { params })
    }

    /**
     * Get monthly schedule for doctor
     * GET /doctor/schedule/monthly
     */
    async getMonthlySchedule(params: GetMonthlyScheduleParams = {}): Promise<MonthlyScheduleResponse> {
        return apiClient.get<MonthlyScheduleResponse>('/doctor/schedule/monthly', { params })
    }
}

export const doctorScheduleService = new DoctorScheduleService()
