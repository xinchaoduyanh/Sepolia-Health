import { apiClient } from '../api-client'

export interface AppointmentResultFile {
    id: number
    fileUrl: string
    fileType: string
    fileName: string
    fileSize: number
    createdAt: Date
}

export interface AppointmentResult {
    id: number
    diagnosis?: string | null
    notes?: string | null
    prescription?: string | null
    recommendations?: string | null
    files?: AppointmentResultFile[]
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
    idCardNumber?: string
    occupation?: string
    nationality?: string
    address?: string
    additionalInfo?: Record<string, any> | null
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

export interface DoctorInfo {
    id: number
    firstName: string
    lastName: string
}

export interface DoctorAppointmentDetail {
    id: number
    startTime: Date
    endTime: Date
    status: string
    notes?: string | null
    type: 'ONLINE' | 'OFFLINE'
    hostUrl?: string | null
    patient?: PatientInfo
    doctor?: DoctorInfo
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

    /**
     * Get patient medical history
     * GET /doctor/appointments/patient/:patientProfileId/history
     */
    async getPatientMedicalHistory(
        patientProfileId: number,
        params?: {
            page?: number
            limit?: number
            sortBy?: string
            sortOrder?: 'asc' | 'desc'
        },
    ): Promise<DoctorAppointmentsListResponse> {
        return apiClient.get<DoctorAppointmentsListResponse>(
            `/doctor/appointments/patient/${patientProfileId}/history`,
            { params },
        )
    }

    /**
     * Upload file for appointment result
     * POST /doctor/appointments/results/:resultId/files
     */
    async uploadResultFile(resultId: number, file: File): Promise<AppointmentResultFile> {
        const formData = new FormData()
        formData.append('file', file)

        return apiClient.post<AppointmentResultFile>(
            `/doctor/appointments/results/${resultId}/files`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        )
    }

    /**
     * Delete file from appointment result
     * DELETE /doctor/appointments/results/:resultId/files/:fileId
     */
    async deleteResultFile(resultId: number, fileId: number): Promise<{ success: boolean; message: string }> {
        return apiClient.delete<{ success: boolean; message: string }>(
            `/doctor/appointments/results/${resultId}/files/${fileId}`,
        )
    }
}

export const doctorAppointmentService = new DoctorAppointmentService()
