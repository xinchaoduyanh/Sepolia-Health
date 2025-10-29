import { apiClient } from '../api-client'

// Types for Clinic API based on BE schema
export interface Clinic {
    id: number
    name: string
    address: string
    phone?: string
    email?: string
    description?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface ClinicsListParams {
    page?: number
    limit?: number
    search?: string
}

export interface ClinicsListResponse {
    clinics: Clinic[]
    total: number
    page: number
    limit: number
}

export type ClinicDetailResponse = Clinic

export interface CreateClinicRequest {
    name: string
    address: string
    phone?: string
    email?: string
    description?: string
    isActive?: boolean
}

export interface UpdateClinicRequest {
    name?: string
    address?: string
    phone?: string
    email?: string
    description?: string
    isActive?: boolean
}

export type CreateClinicResponse = Clinic

export class ClinicsService {
    /**
     * Get clinics list with pagination and filters
     * GET /admin/clinics
     */
    async getClinics(params: ClinicsListParams = {}): Promise<ClinicsListResponse> {
        return apiClient.get<ClinicsListResponse>('/admin/clinics', { params })
    }

    /**
     * Get clinic by ID
     * GET /admin/clinics/{id}
     */
    async getClinic(id: number): Promise<ClinicDetailResponse> {
        return apiClient.get<ClinicDetailResponse>(`/admin/clinics/${id}`)
    }

    /**
     * Create new clinic
     * POST /admin/clinics
     */
    async createClinic(clinicData: CreateClinicRequest): Promise<CreateClinicResponse> {
        return apiClient.post<CreateClinicResponse>('/admin/clinics', clinicData)
    }

    /**
     * Update clinic
     * PUT /admin/clinics/{id}
     */
    async updateClinic(id: number, clinicData: UpdateClinicRequest): Promise<ClinicDetailResponse> {
        return apiClient.put<ClinicDetailResponse>(`/admin/clinics/${id}`, clinicData)
    }

    /**
     * Delete clinic
     * DELETE /admin/clinics/{id}
     */
    async deleteClinic(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/clinics/${id}`)
    }
}

export const clinicsService = new ClinicsService()
