import { apiClient } from '../api-client'

// Types for Tag API based on BE schema
export interface Tag {
    id: number
    name: string
    slug: string
    description?: string
    usageCount: number
    createdAt: string
    updatedAt?: string
}

export interface TagsListParams {
    page?: number
    limit?: number
    search?: string
}

export interface TagsListResponse {
    tags: Tag[]
    total: number
    page: number
    limit: number
}

export type TagDetailResponse = Tag

export interface CreateTagRequest {
    name: string
    description?: string
}

export interface UpdateTagRequest {
    name?: string
    description?: string
}

export type CreateTagResponse = Tag

export class TagsService {
    /**
     * Get tags list with pagination and filters
     * GET /admin/tags
     */
    async getTags(params: TagsListParams = {}): Promise<TagsListResponse> {
        return apiClient.get<TagsListResponse>('/admin/tags', { params })
    }

    /**
     * Get tag by ID
     * GET /admin/tags/{id}
     */
    async getTag(id: number): Promise<TagDetailResponse> {
        return apiClient.get<TagDetailResponse>(`/admin/tags/${id}`)
    }

    /**
     * Create new tag
     * POST /admin/tags
     */
    async createTag(tagData: CreateTagRequest): Promise<CreateTagResponse> {
        return apiClient.post<CreateTagResponse>('/admin/tags', tagData)
    }

    /**
     * Update tag
     * PUT /admin/tags/{id}
     */
    async updateTag(id: number, tagData: UpdateTagRequest): Promise<TagDetailResponse> {
        return apiClient.put<TagDetailResponse>(`/admin/tags/${id}`, tagData)
    }

    /**
     * Delete tag
     * DELETE /admin/tags/{id}
     */
    async deleteTag(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/tags/${id}`)
    }
}

export const tagsService = new TagsService()
