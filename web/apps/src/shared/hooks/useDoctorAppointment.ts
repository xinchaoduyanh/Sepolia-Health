import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    doctorAppointmentService,
    type DoctorAppointmentDetail,
    type DoctorAppointmentsListResponse,
    type CreateAppointmentResultDto,
    type AppointmentResult,
} from '../lib/api-services'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get doctor's appointments list
 */
export function useDoctorAppointments(params?: {
    page?: number
    limit?: number
    status?: 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED'
    sortBy?: 'startTime' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
}) {
    return useQuery<DoctorAppointmentsListResponse>({
        queryKey: queryKeys.doctor?.appointments?.list(params) || ['doctor', 'appointments', params],
        queryFn: () => doctorAppointmentService.getAppointments(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 1,
        refetchOnWindowFocus: false,
    })
}

/**
 * Hook to get single doctor appointment by ID
 */
export function useDoctorAppointment(id: number, isReady: boolean = true) {
    return useQuery<DoctorAppointmentDetail>({
        queryKey: queryKeys.doctor?.appointments?.detail(id.toString()) || ['doctor', 'appointments', id],
        queryFn: () => doctorAppointmentService.getAppointmentById(id),
        enabled: isReady && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
    })
}

/**
 * Hook to create or update appointment result
 */
export function useCreateOrUpdateAppointmentResult() {
    const queryClient = useQueryClient()

    return useMutation<AppointmentResult, Error, { appointmentId: number; data: CreateAppointmentResultDto }>({
        mutationFn: ({ appointmentId, data }) => doctorAppointmentService.createOrUpdateResult(appointmentId, data),
        onSuccess: (_, variables) => {
            // Invalidate appointments list
            queryClient.invalidateQueries({
                queryKey: ['doctor', 'appointments'],
            })
            // Invalidate specific appointment
            queryClient.invalidateQueries({
                queryKey: ['doctor', 'appointments', variables.appointmentId],
            })
        },
    })
}

/**
 * Hook to update appointment result
 */
export function useUpdateAppointmentResult() {
    const queryClient = useQueryClient()

    return useMutation<AppointmentResult, Error, { appointmentId: number; data: CreateAppointmentResultDto }>({
        mutationFn: ({ appointmentId, data }) => doctorAppointmentService.updateResult(appointmentId, data),
        onSuccess: (_, variables) => {
            // Invalidate appointments list
            queryClient.invalidateQueries({
                queryKey: ['doctor', 'appointments'],
            })
            // Invalidate specific appointment
            queryClient.invalidateQueries({
                queryKey: ['doctor', 'appointments', variables.appointmentId],
            })
        },
    })
}

/**
 * Hook to get patient medical history
 * Returns all completed appointments for a specific patient
 */
export function usePatientMedicalHistory(
    patientProfileId: number,
    enabled: boolean = true,
    params?: {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
    }
) {
    return useQuery<DoctorAppointmentsListResponse>({
        queryKey: ['doctor', 'patient-history', patientProfileId, params],
        queryFn: () => doctorAppointmentService.getPatientMedicalHistory(patientProfileId, params),
        enabled: enabled && !!patientProfileId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
    })
}
