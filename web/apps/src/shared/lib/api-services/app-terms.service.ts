import { apiClient } from '../api-client'

// Types for App Terms API based on BE schema
export enum AppTermsType {
    USAGE_REGULATIONS = 'USAGE_REGULATIONS',
    DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    APP_FAQ = 'APP_FAQ',
}

export interface AppTerms {
    id: number
    type: AppTermsType
    title: string
    content: string
    version: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface AppTermsListParams {
    type?: AppTermsType
    isActive?: boolean
}

export interface AppTermsListResponse {
    terms: AppTerms[]
    total: number
}

export type AppTermsDetailResponse = AppTerms

export interface CreateAppTermsRequest {
    type: AppTermsType
    title: string
    content: string
    version?: number
}

export interface UpdateAppTermsRequest {
    title?: string
    content?: string
    version?: number
}

export type CreateAppTermsResponse = AppTerms
export type UpdateAppTermsResponse = AppTerms

export class AppTermsService {
    /**
     * Get app terms list with filters
     * GET /admin/app-terms
     */
    async getAppTerms(params: AppTermsListParams = {}): Promise<AppTermsListResponse> {
        return apiClient.get<AppTermsListResponse>('/admin/app-terms', { params })
    }

    /**
     * Get app terms by type (active version)
     * GET /admin/app-terms/type/:type
     */
    async getAppTermsByType(type: AppTermsType): Promise<AppTermsDetailResponse> {
        return apiClient.get<AppTermsDetailResponse>(`/admin/app-terms/type/${type}`)
    }

    /**
     * Get app terms by ID
     * GET /admin/app-terms/:id
     */
    async getAppTermsById(id: number): Promise<AppTermsDetailResponse> {
        return apiClient.get<AppTermsDetailResponse>(`/admin/app-terms/${id}`)
    }

    /**
     * Create new app terms
     * POST /admin/app-terms
     */
    async createAppTerms(termsData: CreateAppTermsRequest): Promise<CreateAppTermsResponse> {
        return apiClient.post<CreateAppTermsResponse>('/admin/app-terms', termsData)
    }

    /**
     * Update app terms
     * PUT /admin/app-terms/:id
     */
    async updateAppTerms(id: number, termsData: UpdateAppTermsRequest): Promise<UpdateAppTermsResponse> {
        return apiClient.put<UpdateAppTermsResponse>(`/admin/app-terms/${id}`, termsData)
    }

    /**
     * Activate app terms (apply this version)
     * PUT /admin/app-terms/:id/activate
     */
    async activateAppTerms(id: number): Promise<UpdateAppTermsResponse> {
        return apiClient.put<UpdateAppTermsResponse>(`/admin/app-terms/${id}/activate`)
    }

    /**
     * Delete app terms
     * DELETE /admin/app-terms/:id
     */
    async deleteAppTerms(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/app-terms/${id}`)
    }
}

export const appTermsService = new AppTermsService()
