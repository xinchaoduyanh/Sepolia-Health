import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    servicesService,
    type ServicesListParams,
    type CreateServiceRequest,
    type UpdateServiceRequest,
} from '../lib/api-services/services.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get services list with pagination and filters
 */
export function useServices(params: ServicesListParams = {}, isReady: boolean) {
    return useQuery({
        queryKey: queryKeys.admin.services.list(params),
        queryFn: () => servicesService.getServices(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single service by ID
 */
export function useService(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.services.detail(id.toString()),
        queryFn: () => servicesService.getService(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new service
 */
export function useCreateService() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateServiceRequest) => servicesService.createService(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.services.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo dịch vụ thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo dịch vụ'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update service
 */
export function useUpdateService() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateServiceRequest }) =>
            servicesService.updateService(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.services.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.services.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật dịch vụ thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật dịch vụ'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete service
 */
export function useDeleteService() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => servicesService.deleteService(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.services.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa dịch vụ thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa dịch vụ'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
