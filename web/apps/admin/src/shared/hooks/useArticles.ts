import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    articlesService,
    type ArticlesListParams,
    type ArticlesListResponse,
    type CreateArticleRequest,
    type UpdateArticleRequest,
    type UploadArticleImageRequest,
    type UpdateArticleImageRequest,
    type AddArticleTagsRequest,
} from '../lib/api-services/articles.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get articles list with pagination and filters
 */
export function useArticles(params: ArticlesListParams = {}, isReady: boolean) {
    return useQuery<ArticlesListResponse>({
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

/**
 * Hook to publish article
 */
export function usePublishArticle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => articlesService.publishArticle(id),
        onSuccess: (_response, id) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Publish bài viết thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi publish bài viết'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to unpublish article
 */
export function useUnpublishArticle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => articlesService.unpublishArticle(id),
        onSuccess: (_response, id) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Unpublish bài viết thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi unpublish bài viết'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to upload article image
 */
export function useUploadArticleImage() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ articleId, imageData }: { articleId: number; imageData: UploadArticleImageRequest }) =>
            articlesService.uploadArticleImage(articleId, imageData),
        onSuccess: (_response, { articleId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.detail(articleId.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Upload ảnh thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete article image
 */
export function useDeleteArticleImage() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ articleId, imageId }: { articleId: number; imageId: number }) =>
            articlesService.deleteArticleImage(articleId, imageId),
        onSuccess: (_response, { articleId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.detail(articleId.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa ảnh thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa ảnh'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to add tags to article
 */
export function useAddArticleTags() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ articleId, tagsData }: { articleId: number; tagsData: AddArticleTagsRequest }) =>
            articlesService.addTags(articleId, tagsData),
        onSuccess: (_response, { articleId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.detail(articleId.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Thêm tags thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi thêm tags'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to remove tag from article
 */
export function useRemoveArticleTag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ articleId, tagId }: { articleId: number; tagId: number }) =>
            articlesService.removeTag(articleId, tagId),
        onSuccess: (_response, { articleId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.articles.detail(articleId.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa tag thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa tag'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
