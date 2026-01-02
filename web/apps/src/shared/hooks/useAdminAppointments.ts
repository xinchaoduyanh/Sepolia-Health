import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    adminAppointmentService,
    type AdminAppointmentsListParams,
} from '../lib/api-services/admin-appointment.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get appointments list for admin
 */
export function useAdminAppointments(params: AdminAppointmentsListParams = {}, isReady: boolean) {
    return useQuery({
        queryKey: queryKeys.admin.appointments.list(params),
        queryFn: () => adminAppointmentService.getAppointments(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to get single appointment by ID for admin
 */
export function useAdminAppointment(id: number) {
    return useQuery({
        queryKey: queryKeys.admin.appointments.detail(id.toString()),
        queryFn: () => adminAppointmentService.getAppointment(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to cancel an appointment
 */
export function useCancelAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => adminAppointmentService.cancelAppointment(id),
        onSuccess: () => {
            // Invalidate all relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.appointments.lists(),
            })
            // Also invalidate doctor lists/details as stats might change
            queryClient.invalidateQueries({
                queryKey: queryKeys.admin.doctors.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Hủy cuộc hẹn thành công',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi hủy cuộc hẹn'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
