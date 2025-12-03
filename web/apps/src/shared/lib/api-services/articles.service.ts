import { apiClient } from '../api-client'

// Types for Article API based on BE schema
export interface ArticleImage {
    id: number
    url: string
    alt?: string
    order: number
    createdAt: string
}

export interface ArticleTag {
    id: number
    name: string
    slug: string
}

export interface Article {
    id: number
    title: string
    content?: string
    contentMarkdown: string
    excerpt?: string
    slug: string
    isPublished: boolean
    publishedAt?: string
    authorId?: number
    views: number
    image?: string
    images?: ArticleImage[]
    tags?: ArticleTag[]
    createdAt: string
    updatedAt: string
}

export interface ArticlesListParams {
    page?: number
    limit?: number
    search?: string
    isPublished?: boolean
    tagId?: number
}

export interface ArticlesListResponse {
    articles: Article[]
    total: number
    page: number
    limit: number
}

export type ArticleDetailResponse = Article

export interface CreateArticleRequest {
    title: string
    content?: string
    contentMarkdown: string
    excerpt?: string
    slug?: string
    image?: string
    isPublished?: boolean
    tagIds?: number[]
}

export interface UpdateArticleRequest {
    title?: string
    content?: string
    contentMarkdown?: string
    excerpt?: string
    slug?: string
    image?: string
    isPublished?: boolean
    tagIds?: number[]
}

export interface UploadArticleImageRequest {
    url: string
    alt?: string
    order?: number
}

export interface UpdateArticleImageRequest {
    alt?: string
    order?: number
}

export interface AddArticleTagsRequest {
    tagIds: number[]
}

export type CreateArticleResponse = Article

export class ArticlesService {
    /**
     * Get articles list with pagination and filters
     * GET /articles
     */
    async getArticles(params: ArticlesListParams = {}): Promise<ArticlesListResponse> {
        return apiClient.get<ArticlesListResponse>('/admin/articles', { params })
    }

    /**
     * Get article by ID
     * GET /admin/articles/{id}
     */
    async getArticle(id: number): Promise<ArticleDetailResponse> {
        return apiClient.get<ArticleDetailResponse>(`/admin/articles/${id}`)
    }

    /**
     * Create new article
     * POST /admin/articles
     */
    async createArticle(articleData: CreateArticleRequest): Promise<CreateArticleResponse> {
        return apiClient.post<CreateArticleResponse>('/admin/articles', articleData)
    }

    /**
     * Update article
     * PUT /admin/articles/{id}
     */
    async updateArticle(id: number, articleData: UpdateArticleRequest): Promise<ArticleDetailResponse> {
        return apiClient.put<ArticleDetailResponse>(`/admin/articles/${id}`, articleData)
    }

    /**
     * Delete article
     * DELETE /admin/articles/{id}
     */
    async deleteArticle(id: number): Promise<void> {
        return apiClient.delete<void>(`/admin/articles/${id}`)
    }

    /**
     * Upload image for article
     * POST /admin/articles/{id}/images
     */
    async uploadArticleImage(id: number, imageData: UploadArticleImageRequest): Promise<ArticleImage> {
        return apiClient.post<ArticleImage>(`/admin/articles/${id}/images`, imageData)
    }

    /**
     * Delete article image
     * DELETE /admin/articles/{id}/images/{imageId}
     */
    async deleteArticleImage(articleId: number, imageId: number): Promise<void> {
        return apiClient.delete<void>(`/admin/articles/${articleId}/images/${imageId}`)
    }

    /**
     * Update article image
     * PATCH /admin/articles/{id}/images/{imageId}
     */
    async updateArticleImage(
        articleId: number,
        imageId: number,
        imageData: UpdateArticleImageRequest,
    ): Promise<ArticleImage> {
        return apiClient.patch<ArticleImage>(`/admin/articles/${articleId}/images/${imageId}`, imageData)
    }

    /**
     * Publish article
     * POST /admin/articles/{id}/publish
     */
    async publishArticle(id: number): Promise<ArticleDetailResponse> {
        return apiClient.post<ArticleDetailResponse>(`/admin/articles/${id}/publish`)
    }

    /**
     * Unpublish article
     * POST /admin/articles/{id}/unpublish
     */
    async unpublishArticle(id: number): Promise<ArticleDetailResponse> {
        return apiClient.post<ArticleDetailResponse>(`/admin/articles/${id}/unpublish`)
    }

    /**
     * Add tags to article
     * POST /admin/articles/{id}/tags
     */
    async addTags(id: number, tagsData: AddArticleTagsRequest): Promise<ArticleDetailResponse> {
        return apiClient.post<ArticleDetailResponse>(`/admin/articles/${id}/tags`, tagsData)
    }

    /**
     * Remove tag from article
     * DELETE /admin/articles/{id}/tags/{tagId}
     */
    async removeTag(articleId: number, tagId: number): Promise<void> {
        return apiClient.delete<void>(`/admin/articles/${articleId}/tags/${tagId}`)
    }

    /**
     * Increment view count
     * POST /admin/articles/{id}/views
     */
    async incrementViews(id: number): Promise<void> {
        return apiClient.post<void>(`/admin/articles/${id}/views`)
    }
}

export const articlesService = new ArticlesService()
