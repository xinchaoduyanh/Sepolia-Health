import { apiClient } from '../api-client'

// Types for Doctor API based on BE schema
export interface Doctor {
    id: number
    fullName: string
    email: string
    phone: string
    services: Array<{
        id: number
        name: string
        price: number
        duration: number
        description?: string
    }>
    appointmentStats: {
        total: number
        completed: number
        cancelled: number
        upcoming: number
        onGoing: number
    }
    experienceYears: number // Year started practicing (e.g., 2006)
    status: string
    description?: string
    address?: string
    clinic?: { id: number; name: string } | null
    createdAt: string
}

export interface DoctorSchedule {
    id: number
    dayOfWeek: number
    startTime: string
    endTime: string
}

export interface DoctorScheduleResponse {
    doctorId: number
    doctorName: string
    schedules: DoctorSchedule[]
}

export interface DoctorsListParams {
    page?: number
    limit?: number
    search?: string
    clinicId?: number
    serviceId?: number
}

export interface Clinic {
    id: number
    name: string
    address: string
    phone?: string
    email?: string
    description?: string
}

export interface Service {
    id: number
    name: string
    price: number
    duration: number
    description?: string
}

export interface DoctorsListData {
    doctors: Doctor[]
    total: number
    page: number
    limit: number
}

export interface DoctorsListResponse {
    data: DoctorsListData
    message: string
    statusCode: number
}

export type DoctorDetailResponse = Doctor

export interface CreateDoctorRequest {
    email: string
    password: string
    fullName: string
    phone: string
    experienceYears: number
    description?: string
    address?: string
    clinicId: number
    serviceIds: number[]
    availabilities?: Array<{
        dayOfWeek: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        startTime: string
        endTime: string
    }>
}

export interface UpdateDoctorRequest {
    email?: string
    password?: string
    fullName?: string
    phone?: string
    specialty?: string
    experienceYears?: number
    description?: string
    address?: string
    clinicId?: number
    serviceIds?: number[]
}

export interface UpdateDoctorStatusRequest {
    status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE'
}

export interface CreateDoctorScheduleRequest {
    dayOfWeek: number
    startTime: string
    endTime: string
    locationId: number
    notes?: string
}

export interface UpdateDoctorScheduleRequest {
    dayOfWeek?: number
    startTime?: string
    endTime?: string
    locationId?: number
    notes?: string
}

export type CreateDoctorResponse = Doctor

export class DoctorsService {
    /**
     * Get doctors list with pagination and filters
     * GET /doctors
     */
    async getDoctors(params: DoctorsListParams = {}): Promise<DoctorsListData> {
        return apiClient.get<DoctorsListData>('/admin/doctors', { params })
    }

    /**
     * Get doctor by ID
     * GET /doctors/{id}
     */
    async getDoctor(id: number): Promise<DoctorDetailResponse> {
        return apiClient.get<DoctorDetailResponse>(`/admin/doctors/${id}`)
    }

    /**
     * Create new doctor
     * POST /doctors
     */
    async createDoctor(doctorData: CreateDoctorRequest): Promise<CreateDoctorResponse> {
        return apiClient.post<CreateDoctorResponse>('/admin/doctors', doctorData)
    }

    /**
     * Update doctor
     * PUT /doctors/{id}
     */
    async updateDoctor(id: number, doctorData: UpdateDoctorRequest): Promise<DoctorDetailResponse> {
        return apiClient.put<DoctorDetailResponse>(`/admin/doctors/${id}`, doctorData)
    }

    /**
     * Update doctor status
     * PUT /admin/doctors/{id}/status
     */
    async updateDoctorStatus(id: number, statusData: UpdateDoctorStatusRequest): Promise<DoctorDetailResponse> {
        return apiClient.put<DoctorDetailResponse>(`/admin/doctors/${id}/status`, statusData)
    }

    /**
     * Delete doctor (soft delete)
     * DELETE /admin/doctors/{id}
     */
    async deleteDoctor(id: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/admin/doctors/${id}`)
    }

    /**
     * Get list of clinics
     * GET /doctors/clinics/list
     */
    async getClinics(): Promise<Clinic[]> {
        return apiClient.get<Clinic[]>('/admin/doctors/clinics/list')
    }

    /**
     * Get list of services
     * GET /doctors/services/list
     */
    async getServices(): Promise<Service[]> {
        return apiClient.get<Service[]>('admin/doctors/services/list')
    }

    /**
     * Get doctor schedule
     * GET /admin/doctors/{id}/schedule
     */
    async getDoctorSchedule(doctorId: number): Promise<DoctorScheduleResponse> {
        return apiClient.get<DoctorScheduleResponse>(`/admin/doctors/${doctorId}/schedule`)
    }

    /**
     * Create doctor schedule
     * POST /admin/doctors/{id}/schedule
     */
    async createDoctorSchedule(doctorId: number, data: CreateDoctorScheduleRequest): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>(`/admin/doctors/${doctorId}/schedule`, data)
    }

    /**
     * Update doctor schedule
     * PATCH /admin/doctors/{id}/schedule/{scheduleId}
     */
    async updateDoctorSchedule(
        doctorId: number,
        scheduleId: number,
        data: UpdateDoctorScheduleRequest
    ): Promise<{ message: string }> {
        return apiClient.patch<{ message: string }>(`/admin/doctors/${doctorId}/schedule/${scheduleId}`, data)
    }

    /**
     * Delete doctor schedule
     * DELETE /admin/doctors/{id}/schedule/{scheduleId}
     */
    async deleteDoctorSchedule(doctorId: number, scheduleId: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/admin/doctors/${doctorId}/schedule/${scheduleId}`)
    }
}

export const doctorsService = new DoctorsService()
