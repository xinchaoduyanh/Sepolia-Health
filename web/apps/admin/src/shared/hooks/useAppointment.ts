import { useQuery } from '@tanstack/react-query'
import { appointmentService } from '../lib/api-services'
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
