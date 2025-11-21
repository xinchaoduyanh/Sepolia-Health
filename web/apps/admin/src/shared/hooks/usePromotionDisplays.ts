import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    promotionDisplaysService,
    type CreatePromotionDisplayRequest,
    type UpdatePromotionDisplayRequest,
    type ApplyPromotionRequest,
} from '../lib/api-services/promotion-displays.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get all promotion displays
 */
export function usePromotionDisplays(isReady: boolean) {
    return useQuery({
        queryKey: queryKeys.admin.promotionDisplays.lists(),
        queryFn: () => promotionDisplaysService.getPromotionDisplays(),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get active promotion display
 */
export function useActivePromotionDisplay(isReady: boolean) {
    return useQuery({
        queryKey: queryKeys.admin.promotionDisplays.active(),
        queryFn: () => promotionDisplaysService.getActivePromotionDisplay(),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to get single promotion display by ID
 */
export function usePromotionDisplay(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.promotionDisplays.detail(id.toString()),
        queryFn: () => promotionDisplaysService.getPromotionDisplay(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new promotion display
 */
export function useCreatePromotionDisplay() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreatePromotionDisplayRequest) => promotionDisplaysService.createPromotionDisplay(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.active(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo cấu hình hiển thị thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo cấu hình hiển thị'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update promotion display
 */
export function useUpdatePromotionDisplay() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePromotionDisplayRequest }) =>
            promotionDisplaysService.updatePromotionDisplay(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.active(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật cấu hình hiển thị thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cấu hình hiển thị'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to apply promotion to display
 */
export function useApplyPromotionToDisplay() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ApplyPromotionRequest }) =>
            promotionDisplaysService.applyPromotionToDisplay(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.active(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Áp dụng promotion thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi áp dụng promotion'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to activate promotion display
 */
export function useActivatePromotionDisplay() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => promotionDisplaysService.activatePromotionDisplay(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.active(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Kích hoạt cấu hình hiển thị thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi kích hoạt cấu hình hiển thị'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete promotion display
 */
export function useDeletePromotionDisplay() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => promotionDisplaysService.deletePromotionDisplay(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotionDisplays.active(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa cấu hình hiển thị thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa cấu hình hiển thị'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
