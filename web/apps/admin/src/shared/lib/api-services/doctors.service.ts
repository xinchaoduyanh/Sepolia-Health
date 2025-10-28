import { apiClient } from '../api-client'

// Types for Doctor API based on BE schema
export interface Doctor {
    id: number
    fullName: string
    email: string
    phone: string
    specialty: string
    experienceYears: number
    status: string
    clinic?: { id: number; name: string } | null
    createdAt: string
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

export interface DoctorsListResponse {
    doctors: Doctor[]
    total: number
    page: number
    limit: number
}

export interface DoctorDetailResponse extends Doctor {}

export interface CreateDoctorRequest {
    email: string
    password: string
    fullName: string
    phone: string
    specialty: string
    experienceYears: number
    description?: string
    address?: string
    clinicId: number
    serviceIds: number[]
    availabilities?: Array<{
        dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
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

export interface CreateDoctorResponse extends Doctor {}

export class DoctorsService {
    /**
     * Get doctors list with pagination and filters
     * GET /admin/doctors
     */
    async getDoctors(params: DoctorsListParams = {}): Promise<DoctorsListResponse> {
        return apiClient.get<DoctorsListResponse>('/admin/doctors', { params })
    }

    /**
     * Get doctor by ID
     * GET /admin/doctors/{id}
     */
    async getDoctor(id: number): Promise<DoctorDetailResponse> {
        return apiClient.get<DoctorDetailResponse>(`/admin/doctors/${id}`)
    }

    /**
     * Create new doctor
     * POST /admin/doctors
     */
    async createDoctor(doctorData: CreateDoctorRequest): Promise<CreateDoctorResponse> {
        return apiClient.post<CreateDoctorResponse>('/admin/doctors', doctorData)
    }

    /**
     * Update doctor
     * PUT /admin/doctors/{id}
     */
    async updateDoctor(id: number, doctorData: UpdateDoctorRequest): Promise<DoctorDetailResponse> {
        return apiClient.put<DoctorDetailResponse>(`/admin/doctors/${id}`, doctorData)
    }

    /**
     * Delete doctor
     * DELETE /admin/doctors/{id}
     */
    async deleteDoctor(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/doctors/${id}`)
    }

    /**
     * Get list of clinics
     * GET /admin/doctors/clinics/list
     */
    async getClinics(): Promise<{ data: Clinic[] }> {
        return apiClient.get<{ data: Clinic[] }>('/admin/doctors/clinics/list')
    }

    /**
     * Get list of services
     * GET /admin/doctors/services/list
     */
    async getServices(): Promise<{ data: Service[] }> {
        return apiClient.get<{ data: Service[] }>('/admin/doctors/services/list')
    }
}

export const doctorsService = new DoctorsService()
