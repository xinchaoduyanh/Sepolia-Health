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
    data: {
        doctors: Doctor[]
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface DoctorDetailResponse {
    data: Doctor
}

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

export interface CreateDoctorResponse {
    data: Doctor
}

export class DoctorsService {
    /**
     * Get doctors list with pagination and filters
     * GET /doctors
     */
    async getDoctors(params: DoctorsListParams = {}): Promise<DoctorsListResponse> {
        return apiClient.get<DoctorsListResponse>('/doctors', { params })
    }

    /**
     * Get doctor by ID
     * GET /doctors/{id}
     */
    async getDoctor(id: number): Promise<DoctorDetailResponse> {
        return apiClient.get<DoctorDetailResponse>(`/doctors/${id}`)
    }

    /**
     * Create new doctor
     * POST /doctors
     */
    async createDoctor(doctorData: CreateDoctorRequest): Promise<CreateDoctorResponse> {
        return apiClient.post<CreateDoctorResponse>('/doctors', doctorData)
    }

    /**
     * Update doctor
     * PUT /doctors/{id}
     */
    async updateDoctor(id: number, doctorData: UpdateDoctorRequest): Promise<DoctorDetailResponse> {
        return apiClient.put<DoctorDetailResponse>(`/doctors/${id}`, doctorData)
    }

    /**
     * Delete doctor
     * DELETE /doctors/{id}
     */
    async deleteDoctor(id: number): Promise<void> {
        return apiClient.delete<void>(`/doctors/${id}`)
    }

    /**
     * Get list of clinics
     * GET /doctors/clinics/list
     */
    async getClinics(): Promise<{ data: Clinic[] }> {
        return apiClient.get<{ data: Clinic[] }>('/doctors/clinics/list')
    }

    /**
     * Get list of services
     * GET /doctors/services/list
     */
    async getServices(): Promise<{ data: Service[] }> {
        return apiClient.get<{ data: Service[] }>('/doctors/services/list')
    }
}

export const doctorsService = new DoctorsService()
