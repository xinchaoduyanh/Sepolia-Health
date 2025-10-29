import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    articlesService,
    type ArticlesListParams,
    type CreateArticleRequest,
    type UpdateArticleRequest,
} from '../lib/api-services/articles.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get articles list with pagination and filters
 */
export function useArticles(params: ArticlesListParams = {}, isReady: boolean) {
    return useQuery({
        queryKey: queryKeys.admin.articles.list(params),
        queryFn: () => articlesService.getArticles(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single article by ID
 */
export function useArticle(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.articles.detail(id.toString()),
        queryFn: () => articlesService.getArticle(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new article
 */
export function useCreateArticle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateArticleRequest) => articlesService.createArticle(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo bài viết thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo bài viết'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update article
 */
export function useUpdateArticle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateArticleRequest }) =>
            articlesService.updateArticle(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật bài viết thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài viết'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete article
 */
export function useDeleteArticle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => articlesService.deleteArticle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa bài viết thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa bài viết'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

