import { apiClient } from '../api-client'

export interface AppointmentResult {
    id: number
    diagnosis?: string | null
    notes?: string | null
    prescription?: string | null
    recommendations?: string | null
    appointmentId: number
    createdAt: Date
    updatedAt: Date
}

export interface PatientInfo {
    id: number
    firstName: string
    lastName: string
    phone: string
    dateOfBirth: Date
    gender: string
}

export interface ServiceInfo {
    id: number
    name: string
    price: number
    duration: number
}

export interface ClinicInfo {
    id: number
    name: string
    address: string
}

export interface FeedbackInfo {
    id: number
    rating: number
    comment?: string | null
    createdAt: Date
}

export interface DoctorAppointmentDetail {
    id: number
    startTime: Date
    endTime: Date
    status: string
    notes?: string | null
    type: string
    patient?: PatientInfo
    service?: ServiceInfo
    clinic?: ClinicInfo | null
    feedback?: FeedbackInfo | null
    result?: AppointmentResult | null
    createdAt: Date
    updatedAt: Date
}

export interface DoctorAppointmentsListResponse {
    data: DoctorAppointmentDetail[]
    total: number
    page: number
    limit: number
}

export interface CreateAppointmentResultDto {
    diagnosis?: string
    notes?: string
    prescription?: string
    recommendations?: string
}

export class DoctorAppointmentService {
    /**
     * Get doctor's appointments
     * GET /doctor/appointments
     */
    async getAppointments(params?: {
        page?: number
        limit?: number
        status?: 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED'
        sortBy?: 'startTime' | 'createdAt'
        sortOrder?: 'asc' | 'desc'
    }): Promise<DoctorAppointmentsListResponse> {
        return apiClient.get<DoctorAppointmentsListResponse>('/doctor/appointments', { params })
    }

    /**
     * Get appointment by ID
     * GET /doctor/appointments/:id
     */
    async getAppointmentById(id: number): Promise<DoctorAppointmentDetail> {
        return apiClient.get<DoctorAppointmentDetail>(`/doctor/appointments/${id}`)
    }

    /**
     * Create or update appointment result
     * POST /doctor/appointments/:id/result
     */
    async createOrUpdateResult(id: number, data: CreateAppointmentResultDto): Promise<AppointmentResult> {
        return apiClient.post<AppointmentResult>(`/doctor/appointments/${id}/result`, data)
    }

    /**
     * Update appointment result
     * PUT /doctor/appointments/:id/result
     */
    async updateResult(id: number, data: CreateAppointmentResultDto): Promise<AppointmentResult> {
        return apiClient.put<AppointmentResult>(`/doctor/appointments/${id}/result`, data)
    }
}

export const doctorAppointmentService = new DoctorAppointmentService()
