import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    appTermsService,
    type AppTermsType,
    type AppTermsListParams,
    type AppTermsListResponse,
    type AppTermsDetailResponse,
    type CreateAppTermsRequest,
    type UpdateAppTermsRequest,
} from '../lib/api-services'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get app terms list with filters
 */
export function useAppTerms(params: AppTermsListParams = {}, isReady: boolean = true) {
    return useQuery<AppTermsListResponse>({
        queryKey: queryKeys.admin.appTerms.list(params),
        queryFn: () => appTermsService.getAppTerms(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get app terms by type (active version)
 */
export function useAppTermsByType(type: AppTermsType, isReady: boolean = true) {
    return useQuery<AppTermsDetailResponse>({
        queryKey: queryKeys.admin.appTerms.byType(type),
        queryFn: () => appTermsService.getAppTermsByType(type),
        enabled: isReady && !!type,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single app terms by ID
 */
export function useAppTerm(id: number, isReady: boolean = true) {
    return useQuery<AppTermsDetailResponse>({
        queryKey: queryKeys.admin.appTerms.detail(id),
        queryFn: () => appTermsService.getAppTermsById(id),
        enabled: isReady && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to create app terms
 */
export function useCreateAppTerms() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateAppTermsRequest) => appTermsService.createAppTerms(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.appTerms.all() })
            toast.success({
                title: 'Thành công',
                description: 'Tạo điều khoản thành công',
            })
        },
        onError: (error: any) => {
            toast.error({
                title: 'Lỗi',
                description: error?.response?.data?.message || 'Tạo điều khoản thất bại',
            })
        },
    })
}

/**
 * Hook to update app terms
 */
export function useUpdateAppTerms() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAppTermsRequest }) =>
            appTermsService.updateAppTerms(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.appTerms.all() })
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.appTerms.detail(variables.id) })
            toast.success({
                title: 'Thành công',
                description: 'Cập nhật thông tin thành công',
            })
        },
        onError: (error: any) => {
            toast.error({
                title: 'Lỗi',
                description: error?.response?.data?.message || 'Cập nhật điều khoản thất bại',
            })
        },
    })
}

/**
 * Hook to activate app terms
 */
export function useActivateAppTerms() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => appTermsService.activateAppTerms(id),
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.appTerms.all() })
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.appTerms.detail(id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.appTerms.byType(data.type) })
            toast.success({
                title: 'Thành công',
                description: 'Kích hoạt điều khoản thành công',
            })
        },
        onError: (error: any) => {
            toast.error({
                title: 'Lỗi',
                description: error?.response?.data?.message || 'Kích hoạt điều khoản thất bại',
            })
        },
    })
}

/**
 * Hook to delete app terms
 */
export function useDeleteAppTerms() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => appTermsService.deleteAppTerms(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.appTerms.all() })
            toast.success({
                title: 'Thành công',
                description: 'Xóa điều khoản thành công',
            })
        },
        onError: (error: any) => {
            toast.error({
                title: 'Lỗi',
                description: error?.response?.data?.message || 'Xóa điều khoản thất bại',
            })
        },
    })
}
