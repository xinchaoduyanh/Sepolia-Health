import { apiClient } from '../api-client'

export interface AdminAppointment {
    id: number
    date: string
    startTime: string
    endTime: string
    status: 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED'
    notes?: string
    patientName: string
    patientDob: string
    patientPhone: string
    patientGender: string
    doctor: {
        id: number
        fullName: string
        specialty: string
        avatar?: string
    }
    service: {
        id: number
        name: string
        price: number
        duration: number
    }
    clinic: {
        id: number
        name: string
        address: string
        phone?: string
    }
}

export interface AdminAppointmentsListParams {
    page?: number
    limit?: number
    search?: string
    status?: string
    doctorId?: number
    clinicId?: number
    dateFrom?: string
    dateTo?: string
}

export interface AdminAppointmentsListData {
    appointments: AdminAppointment[]
    total: number
    page: number
    limit: number
}

export class AdminAppointmentService {
    /**
     * Get appointments list for admin
     * GET /admin/appointments
     */
    async getAppointments(params: AdminAppointmentsListParams = {}): Promise<AdminAppointmentsListData> {
        return apiClient.get<AdminAppointmentsListData>('/admin/appointments', { params })
    }

    /**
     * Get appointment by ID for admin
     * GET /admin/appointments/{id}
     */
    async getAppointment(id: number): Promise<AdminAppointment> {
        return apiClient.get<AdminAppointment>(`/admin/appointments/${id}`)
    }

    /**
     * Cancel an appointment
     * PATCH /admin/appointments/{id}/cancel
     */
    async cancelAppointment(id: number): Promise<{ message: string }> {
        return apiClient.patch<{ message: string }>(`/admin/appointments/${id}/cancel`)
    }
}

export const adminAppointmentService = new AdminAppointmentService()
