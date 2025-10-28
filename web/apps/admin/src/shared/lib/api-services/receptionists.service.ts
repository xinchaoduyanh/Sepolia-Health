import { apiClient } from '../api-client'

// Types for Receptionist API based on BE schema
export interface Receptionist {
    id: number
    fullName: string
    email: string
    phone: string
    status: string
    createdAt: string
}

export interface ReceptionistsListParams {
    page?: number
    limit?: number
    search?: string
}

export interface ReceptionistsListResponse {
    receptionists: Receptionist[]
    total: number
    page: number
    limit: number
}

export interface ReceptionistDetailResponse extends Receptionist {}

export interface CreateReceptionistRequest {
    email: string
    password: string
    fullName: string
    phone: string
    address?: string
}

export interface UpdateReceptionistRequest {
    email?: string
    password?: string
    fullName?: string
    phone?: string
    address?: string
}

export interface CreateReceptionistResponse extends Receptionist {}

export class ReceptionistsService {
    /**
     * Get receptionists list with pagination and filters
     * GET /receptionists
     */
    async getReceptionists(params: ReceptionistsListParams = {}): Promise<ReceptionistsListResponse> {
        return apiClient.get<ReceptionistsListResponse>('/admin/receptionists', { params })
    }

    /**
     * Get receptionist by ID
     * GET /receptionists/{id}
     */
    async getReceptionist(id: number): Promise<ReceptionistDetailResponse> {
        return apiClient.get<ReceptionistDetailResponse>(`/admin/receptionists/${id}`)
    }

    /**
     * Create new receptionist
     * POST /receptionists
     */
    async createReceptionist(receptionistData: CreateReceptionistRequest): Promise<CreateReceptionistResponse> {
        return apiClient.post<CreateReceptionistResponse>('/admin/receptionists', receptionistData)
    }

    /**
     * Update receptionist
     * PUT /receptionists/{id}
     */
    async updateReceptionist(
        id: number,
        receptionistData: UpdateReceptionistRequest,
    ): Promise<ReceptionistDetailResponse> {
        return apiClient.put<ReceptionistDetailResponse>(`/admin/receptionists/${id}`, receptionistData)
    }

    /**
     * Delete receptionist
     * DELETE /receptionists/{id}
     */
    async deleteReceptionist(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/receptionists/${id}`)
    }
}

export const receptionistsService = new ReceptionistsService()
