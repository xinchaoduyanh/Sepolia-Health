import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    patientsService,
    type PatientsListParams,
    type CreatePatientRequest,
    type UpdatePatientRequest,
} from '../lib/api-services/patients.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get patients list with pagination and filters
 */
export function usePatients(params: PatientsListParams = {}) {
    console.log('🔍 usePatients called with params:', params)
    
    return useQuery({
        queryKey: queryKeys.admin.patients.list(params),
        queryFn: () => {
            console.log('🚀 API call to getPatients with params:', params)
            return patientsService.getPatients(params)
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to get single patient by ID
 */
export function usePatient(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.patients.detail(id.toString()),
        queryFn: () => patientsService.getPatient(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new patient
 */
export function useCreatePatient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreatePatientRequest) => patientsService.createPatient(data),
        onSuccess: _response => {
            // Invalidate and refetch patients list
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.patients.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo tài khoản bệnh nhân thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản bệnh nhân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update patient
 */
export function useUpdatePatient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePatientRequest }) =>
            patientsService.updatePatient(id, data),
        onSuccess: (response, { id }) => {
            // Invalidate and refetch patients list and specific patient
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.patients.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.patients.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật thông tin bệnh nhân thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin bệnh nhân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete patient
 */
export function useDeletePatient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => patientsService.deletePatient(id),
        onSuccess: () => {
            // Invalidate and refetch patients list
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.patients.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa bệnh nhân thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa bệnh nhân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update patient status
 */
export function useUpdatePatientStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE' }) =>
            patientsService.updatePatientStatus(id, status),
        onSuccess: (response, { id }) => {
            // Invalidate and refetch patients list and specific patient
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.patients.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.patients.detail(id.toString()),
            })

            const statusText = {
                UNVERIFIED: 'Chưa xác thực',
                ACTIVE: 'Hoạt động',
                DEACTIVE: 'Tạm khóa',
            }[status]

            toast.success({
                title: 'Thành công',
                description: `Cập nhật trạng thái bệnh nhân thành ${statusText}`,
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái bệnh nhân'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
