import { apiClient } from '../api-client'

// Types for Promotion API based on BE schema
export interface Promotion {
    id: number
    title: string
    code: string
    description?: string
    discountPercent: number
    maxDiscountAmount: number
    validFrom: string
    validTo: string
    createdAt: string
    updatedAt: string
}

export interface PromotionsListParams {
    page?: number
    limit?: number
    search?: string
}

export interface PromotionsListResponse {
    promotions: Promotion[]
    total: number
    page: number
    limit: number
}

export type PromotionDetailResponse = Promotion

export interface CreatePromotionRequest {
    title: string
    code: string
    description?: string
    discountPercent: number
    maxDiscountAmount: number
    validFrom: string
    validTo: string
}

export interface UpdatePromotionRequest {
    title?: string
    code?: string
    description?: string
    discountPercent?: number
    maxDiscountAmount?: number
    validFrom?: string
    validTo?: string
}

export type CreatePromotionResponse = Promotion
export type UpdatePromotionResponse = Promotion

export class PromotionsService {
    /**
     * Get promotions list with pagination and filters
     * GET /admin/promotions
     */
    async getPromotions(params: PromotionsListParams = {}): Promise<PromotionsListResponse> {
        return apiClient.get<PromotionsListResponse>('/admin/promotions', { params })
    }

    /**
     * Get promotion by ID
     * GET /admin/promotions/{id}
     */
    async getPromotion(id: number): Promise<PromotionDetailResponse> {
        return apiClient.get<PromotionDetailResponse>(`/admin/promotions/${id}`)
    }

    /**
     * Create new promotion
     * POST /admin/promotions
     */
    async createPromotion(promotionData: CreatePromotionRequest): Promise<CreatePromotionResponse> {
        return apiClient.post<CreatePromotionResponse>('/admin/promotions', promotionData)
    }

    /**
     * Update promotion
     * PUT /admin/promotions/{id}
     */
    async updatePromotion(id: number, promotionData: UpdatePromotionRequest): Promise<UpdatePromotionResponse> {
        return apiClient.put<UpdatePromotionResponse>(`/admin/promotions/${id}`, promotionData)
    }

    /**
     * Delete promotion
     * DELETE /admin/promotions/{id}
     */
    async deletePromotion(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/promotions/${id}`)
    }
}

export const promotionsService = new PromotionsService()
