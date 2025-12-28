import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    doctorAppointmentService,
    type DoctorAppointmentDetail,
    type DoctorAppointmentsListResponse,
    type CreateAppointmentResultDto,
    type AppointmentResult,
    type AppointmentResultFile,
} from '../lib/api-services'
import { queryKeys } from '../lib/query-keys'
import { toast } from '@workspace/ui/components/Sonner'

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
            
            // Show success toast
            toast.success({
                title: 'Thành công',
                description: 'Đã cập nhật kết quả khám thành công!',
            })
        },
        onError: (error: any) => {
            toast.error({
                title: 'Lỗi',
                description: error?.message || 'Không thể cập nhật kết quả khám',
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

/**
 * Hook to upload file for appointment result
 */
export function useUploadResultFile() {
    const queryClient = useQueryClient()

    return useMutation<AppointmentResultFile, Error, { resultId: number; file: File; appointmentId: number }>({
        mutationFn: ({ resultId, file }) => doctorAppointmentService.uploadResultFile(resultId, file),
        onSuccess: (_, variables) => {
            // Invalidate with exact query key pattern
            const queryKey = queryKeys.doctor?.appointments?.detail(variables.appointmentId.toString()) || ['doctor', 'appointments', variables.appointmentId]
            
            queryClient.invalidateQueries({
                queryKey: queryKey,
            })
            
            // Force refetch to ensure immediate update
            queryClient.refetchQueries({
                queryKey: queryKey,
            })
        },
    })
}

/**
 * Hook to delete file from appointment result
 */
export function useDeleteResultFile() {
    const queryClient = useQueryClient()

    return useMutation<{ success: boolean; message: string }, Error, { resultId: number; fileId: number; appointmentId: number }>({
        mutationFn: ({ resultId, fileId }) => doctorAppointmentService.deleteResultFile(resultId, fileId),
        onSuccess: (_, variables) => {
            // Invalidate with exact query key pattern
            const queryKey = queryKeys.doctor?.appointments?.detail(variables.appointmentId.toString()) || ['doctor', 'appointments', variables.appointmentId]
            
            queryClient.invalidateQueries({
                queryKey: queryKey,
            })
            
            // Force refetch to ensure immediate update
            queryClient.refetchQueries({
                queryKey: queryKey,
            })
        },
    })
}

