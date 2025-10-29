import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    doctorsService,
    type DoctorsListParams,
    type Clinic,
    type Service,
    type CreateDoctorRequest,
    type UpdateDoctorRequest,
} from '../lib/api-services/doctors.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get clinics list for dropdowns
 */
export function useClinicsDropdown() {
    return useQuery<Clinic[]>({
        queryKey: queryKeys.admin.doctors.clinics(),
        queryFn: () => doctorsService.getClinics(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    })
}

/**
 * Hook to get services list for dropdowns
 */
export function useServicesDropdown() {
    return useQuery<Service[]>({
        queryKey: queryKeys.admin.doctors.services(),
        queryFn: () => doctorsService.getServices(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    })
}

/**
 * Hook to get doctors list with pagination and filters
 */
export function useDoctors(params: DoctorsListParams = {}, isReady: boolean) {
    return useQuery({
        queryKey: queryKeys.admin.doctors.list(params),
        queryFn: () => doctorsService.getDoctors(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to get single doctor by ID
 */
export function useDoctor(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.doctors.detail(id.toString()),
        queryFn: () => doctorsService.getDoctor(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

/**
 * Hook to create new doctor
 */
export function useCreateDoctor() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateDoctorRequest) => doctorsService.createDoctor(data),
        onSuccess: _response => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.doctors.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Tạo tài khoản bác sĩ thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản bác sĩ'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update doctor
 */
export function useUpdateDoctor() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateDoctorRequest }) => doctorsService.updateDoctor(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.doctors.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.doctors.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật thông tin bác sĩ thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin bác sĩ'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to update doctor status
 */
export function useUpdateDoctorStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE' }) =>
            doctorsService.updateDoctorStatus(id, { status }),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.doctors.lists(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.doctors.detail(id.toString()),
            })

            toast.success({
                title: 'Thành công',
                description: 'Cập nhật trạng thái bác sĩ thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái bác sĩ'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete doctor (soft delete)
 */
export function useDeleteDoctor() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => doctorsService.deleteDoctor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.doctors.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Xóa bác sĩ thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa bác sĩ'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
