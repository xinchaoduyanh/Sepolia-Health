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
    data: {
        receptionists: Receptionist[]
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface ReceptionistDetailResponse {
    data: Receptionist
}

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

export interface CreateReceptionistResponse {
    data: Receptionist
}

export class ReceptionistsService {
    /**
     * Get receptionists list with pagination and filters
     * GET /receptionists
     */
    async getReceptionists(params: ReceptionistsListParams = {}): Promise<ReceptionistsListResponse> {
        return apiClient.get<ReceptionistsListResponse>('/receptionists', { params })
    }

    /**
     * Get receptionist by ID
     * GET /receptionists/{id}
     */
    async getReceptionist(id: number): Promise<ReceptionistDetailResponse> {
        return apiClient.get<ReceptionistDetailResponse>(`/receptionists/${id}`)
    }

    /**
     * Create new receptionist
     * POST /receptionists
     */
    async createReceptionist(receptionistData: CreateReceptionistRequest): Promise<CreateReceptionistResponse> {
        return apiClient.post<CreateReceptionistResponse>('/receptionists', receptionistData)
    }

    /**
     * Update receptionist
     * PUT /receptionists/{id}
     */
    async updateReceptionist(
        id: number,
        receptionistData: UpdateReceptionistRequest,
    ): Promise<ReceptionistDetailResponse> {
        return apiClient.put<ReceptionistDetailResponse>(`/receptionists/${id}`, receptionistData)
    }

    /**
     * Delete receptionist
     * DELETE /receptionists/{id}
     */
    async deleteReceptionist(id: number): Promise<void> {
        return apiClient.delete<void>(`/receptionists/${id}`)
    }
}

export const receptionistsService = new ReceptionistsService()
