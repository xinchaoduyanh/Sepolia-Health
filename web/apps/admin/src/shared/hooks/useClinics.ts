import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    clinicsService,
    type ClinicsListParams,
    type ClinicsListResponse,
    type CreateClinicRequest,
    type UpdateClinicRequest,
} from '../lib/api-services/clinics.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get clinics list with pagination and filters
 */
export function useClinics(params: ClinicsListParams = {}, isReady: boolean) {
    return useQuery<ClinicsListResponse>({
        queryKey: queryKeys.admin.clinics.list(params),
        queryFn: () => clinicsService.getClinics(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single clinic by ID
 */
export function useClinic(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.clinics.detail(id.toString()),
        queryFn: () => clinicsService.getClinic(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new clinic
 */
export function useCreateClinic() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateClinicRequest) => clinicsService.createClinic(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.clinics.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo phòng khám thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng khám'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update clinic
 */
export function useUpdateClinic() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateClinicRequest }) => clinicsService.updateClinic(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.clinics.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.clinics.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật phòng khám thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật phòng khám'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete clinic
 */
export function useDeleteClinic() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => clinicsService.deleteClinic(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.clinics.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa phòng khám thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa phòng khám'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
