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
    createdAt: string
}

export interface DoctorsListParams {
    page?: number
    limit?: number
    search?: string
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
}

export const doctorsService = new DoctorsService()
