import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    receptionistsService,
    type ReceptionistsListParams,
    type CreateReceptionistRequest,
    type UpdateReceptionistRequest,
} from '../lib/api-services/receptionists.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get receptionists list with pagination and filters
 */
export function useReceptionists(params: ReceptionistsListParams = {}, isReady: boolean) {
    return useQuery({
        queryKey: queryKeys.admin.receptionists.list(params),
        queryFn: () => receptionistsService.getReceptionists(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single receptionist by ID
 */
export function useReceptionist(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.receptionists.detail(id.toString()),
        queryFn: () => receptionistsService.getReceptionist(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new receptionist
 */
export function useCreateReceptionist() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateReceptionistRequest) => receptionistsService.createReceptionist(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.receptionists.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo tài khoản lễ tân thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản lễ tân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update receptionist
 */
export function useUpdateReceptionist() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateReceptionistRequest }) =>
            receptionistsService.updateReceptionist(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.receptionists.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.receptionists.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật thông tin lễ tân thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin lễ tân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update receptionist status
 */
export function useUpdateReceptionistStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE' }) =>
            receptionistsService.updateReceptionistStatus(id, { status }),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.receptionists.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.receptionists.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật trạng thái lễ tân thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái lễ tân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete receptionist
 */
export function useDeleteReceptionist() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => receptionistsService.deleteReceptionist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.receptionists.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa lễ tân thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa lễ tân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
