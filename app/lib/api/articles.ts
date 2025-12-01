import { apiClient } from '@/lib/api-client'

export interface Article {
  id: number
  title: string
  content: string
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

export interface ArticleDetailResponse extends Article {}

export const articlesApi = {
  /**
   * Get list of published articles for patients
   */
  getArticles: async (params: ArticlesListParams = {}): Promise<ArticlesListResponse> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString())
    if (params.tagId) queryParams.append('tagId', params.tagId.toString())

    const response = await apiClient.get(`/patient/articles?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Get article detail by ID
   */
  getArticleById: async (id: number): Promise<ArticleDetailResponse> => {
    const response = await apiClient.get(`/patient/articles/${id}`)
    return response.data
  },

  /**
   * Increment view count for an article
   */
  incrementViews: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/patient/articles/${id}/views`)
    return response.data
  },
}

// React Query hooks for articles
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-native-toast-message'

export const useArticles = (params: ArticlesListParams = {}) => {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => articlesApi.getArticles(params),
  })
}

export const useArticle = (id: number) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesApi.getArticleById(id),
    enabled: !!id,
  })
}

export const useIncrementViews = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => articlesApi.incrementViews(id),
    onSuccess: (data, variables) => {
      // Invalidate the specific article query
      queryClient.invalidateQueries({ queryKey: ['article', variables] })
    },
    onError: (error) => {
      toast.error('Không thể cập nhật lượt xem')
    },
  })
}