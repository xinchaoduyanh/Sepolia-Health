import { apiClient } from '../api-client'

// Types for PromotionDisplay API based on BE schema
export interface PromotionDisplay {
    id: number
    promotionId: number
    promotion: any
    displayOrder: number
    isActive: boolean
    backgroundColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
    imageUrl?: string
    createdAt: string
    updatedAt: string
    archivedAt?: string
}

export type PromotionDisplayDetailResponse = PromotionDisplay

export interface CreatePromotionDisplayRequest {
    promotionId: number
    displayOrder?: number
    isActive?: boolean
    backgroundColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
    imageUrl?: string
}

export interface UpdatePromotionDisplayRequest {
    promotionId?: number
    displayOrder?: number
    isActive?: boolean
    backgroundColor?: string
    textColor?: string
    buttonColor?: string
    buttonTextColor?: string
    imageUrl?: string
}

export interface ApplyPromotionRequest {
    promotionId: number
}

export type CreatePromotionDisplayResponse = PromotionDisplay
export type UpdatePromotionDisplayResponse = PromotionDisplay

export class PromotionDisplaysService {
    /**
     * Get all promotion displays
     * GET /admin/promotion-displays
     */
    async getPromotionDisplays(): Promise<PromotionDisplayDetailResponse[]> {
        return apiClient.get<PromotionDisplayDetailResponse[]>('/admin/promotion-displays')
    }

    /**
     * Get active promotion display
     * GET /admin/promotion-displays/active
     */
    async getActivePromotionDisplay(): Promise<PromotionDisplayDetailResponse | null> {
        return apiClient.get<PromotionDisplayDetailResponse | null>('/admin/promotion-displays/active')
    }

    /**
     * Get promotion display by ID
     * GET /admin/promotion-displays/{id}
     */
    async getPromotionDisplay(id: number): Promise<PromotionDisplayDetailResponse> {
        return apiClient.get<PromotionDisplayDetailResponse>(`/admin/promotion-displays/${id}`)
    }

    /**
     * Create new promotion display
     * POST /admin/promotion-displays
     */
    async createPromotionDisplay(data: CreatePromotionDisplayRequest): Promise<CreatePromotionDisplayResponse> {
        return apiClient.post<CreatePromotionDisplayResponse>('/admin/promotion-displays', data)
    }

    /**
     * Update promotion display
     * PUT /admin/promotion-displays/{id}
     */
    async updatePromotionDisplay(
        id: number,
        data: UpdatePromotionDisplayRequest,
    ): Promise<UpdatePromotionDisplayResponse> {
        return apiClient.put<UpdatePromotionDisplayResponse>(`/admin/promotion-displays/${id}`, data)
    }

    /**
     * Apply promotion to display
     * PUT /admin/promotion-displays/{id}/apply-promotion
     */
    async applyPromotionToDisplay(id: number, data: ApplyPromotionRequest): Promise<UpdatePromotionDisplayResponse> {
        return apiClient.put<UpdatePromotionDisplayResponse>(`/admin/promotion-displays/${id}/apply-promotion`, data)
    }

    /**
     * Activate promotion display
     * PUT /admin/promotion-displays/{id}/activate
     */
    async activatePromotionDisplay(id: number): Promise<UpdatePromotionDisplayResponse> {
        return apiClient.put<UpdatePromotionDisplayResponse>(`/admin/promotion-displays/${id}/activate`)
    }

    /**
     * Delete promotion display
     * DELETE /admin/promotion-displays/{id}
     */
    async deletePromotionDisplay(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/promotion-displays/${id}`)
    }
}

export const promotionDisplaysService = new PromotionDisplaysService()
