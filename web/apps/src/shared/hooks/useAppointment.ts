import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentService, AppointmentListParams } from '../lib/api-services/appointment.service'
import { queryKeys } from '../lib/query-keys'
import { AppointmentDetailResponse } from '@/types/appointment'

/**
 * Hook to get single appointment by ID
 */
export function useAppointment(id: number, isReady: boolean = true) {
	return useQuery<AppointmentDetailResponse>({
		queryKey: queryKeys.admin.appointments.detail(id.toString()),
		queryFn: () => appointmentService.getAppointmentById(id),
		enabled: isReady && !!id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 1,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchInterval: false,
	})
}

/**
 * Hook to get list of appointments with pagination and filters
 */
export function useAppointments(params: AppointmentListParams = {}) {
	return useQuery({
		queryKey: queryKeys.admin.appointments.list(params),
		queryFn: () => appointmentService.getAppointments(params),
		staleTime: 2 * 60 * 1000, // 2 minutes
		retry: 1,
		refetchOnWindowFocus: false,
	})
}

/**
 * Hook to get appointment summary statistics
 */
export function useAppointmentSummary() {
	return useQuery({
		queryKey: ['appointments', 'summary'],
		queryFn: () => appointmentService.getAppointmentSummary(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 1,
		refetchOnWindowFocus: false,
	})
}

/**
 * Hook to check in an appointment
 */
export function useCheckInAppointment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (appointmentId: number) => appointmentService.checkInAppointment(appointmentId),
		onSuccess: (_, appointmentId) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments.all() })
			queryClient.invalidateQueries({ queryKey: ['appointments', 'summary'] })
		},
	})
}

/**
 * Hook to update an appointment
 */
export function useUpdateAppointment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ appointmentId, data }: { appointmentId: number; data: { startTime?: string; notes?: string; doctorServiceId?: number } }) =>
			appointmentService.updateAppointment(appointmentId, data),
		onSuccess: (_, { appointmentId }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments.all() })
			queryClient.invalidateQueries({ queryKey: ['appointment-list'] })
			queryClient.invalidateQueries({ queryKey: ['appointments', 'summary'] })
		},
	})
}

/**
 * Hook to cancel an appointment
 */
export function useCancelAppointment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (appointmentId: number) => appointmentService.cancelAppointment(appointmentId),
		onSuccess: (_, appointmentId) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments.all() })
			queryClient.invalidateQueries({ queryKey: ['appointments', 'summary'] })
		},
	})
}


