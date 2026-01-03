import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    promotionsService,
    type PromotionsListParams,
    type PromotionsListResponse,
    type CreatePromotionRequest,
    type UpdatePromotionRequest,
} from '../lib/api-services/promotions.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get promotions list with pagination and filters
 */
export function usePromotions(params: PromotionsListParams = {}, isReady: boolean) {
    return useQuery<PromotionsListResponse>({
        queryKey: queryKeys.admin.promotions.list(params),
        queryFn: () => promotionsService.getPromotions(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single promotion by ID
 */
export function usePromotion(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.promotions.detail(id.toString()),
        queryFn: () => promotionsService.getPromotion(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new promotion
 */
export function useCreatePromotion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreatePromotionRequest) => promotionsService.createPromotion(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotions.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo chương trình khuyến mãi thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo chương trình khuyến mãi'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update promotion
 */
export function useUpdatePromotion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePromotionRequest }) =>
            promotionsService.updatePromotion(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotions.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotions.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật chương trình khuyến mãi thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chương trình khuyến mãi'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete promotion
 */
export function useDeletePromotion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => promotionsService.deletePromotion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotions.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa chương trình khuyến mãi thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa chương trình khuyến mãi'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to renew promotion QR code
 */
export function useRenewPromotionQr() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => promotionsService.renewPromotionQr(id),
        onSuccess: (_response, id) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotions.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.promotions.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Đã làm mới mã QR thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi làm mới mã QR'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
