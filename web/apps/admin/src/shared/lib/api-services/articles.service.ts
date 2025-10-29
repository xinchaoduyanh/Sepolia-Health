import { apiClient } from '../api-client'

// Types for Article API based on BE schema
export interface Article {
    id: number
    title: string
    content: string
    image?: string
    createdAt: string
    updatedAt: string
}

export interface ArticlesListParams {
    page?: number
    limit?: number
    search?: string
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
    content: string
    image?: string
}

export interface UpdateArticleRequest {
    title?: string
    content?: string
    image?: string
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
}

export const articlesService = new ArticlesService()
