import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    tagsService,
    type TagsListParams,
    type TagsListResponse,
    type CreateTagRequest,
    type UpdateTagRequest,
} from '../lib/api-services/tags.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get tags list with pagination and filters
 */
export function useTags(params: TagsListParams = {}, isReady: boolean) {
    return useQuery<TagsListResponse>({
        queryKey: queryKeys.admin.tags.list(params),
        queryFn: () => tagsService.getTags(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single tag by ID
 */
export function useTag(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.tags.detail(id.toString()),
        queryFn: () => tagsService.getTag(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new tag
 */
export function useCreateTag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateTagRequest) => tagsService.createTag(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.tags.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo tag thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo tag'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update tag
 */
export function useUpdateTag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTagRequest }) => tagsService.updateTag(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.tags.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.tags.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật tag thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tag'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete tag
 */
export function useDeleteTag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => tagsService.deleteTag(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.tags.lists(),
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
