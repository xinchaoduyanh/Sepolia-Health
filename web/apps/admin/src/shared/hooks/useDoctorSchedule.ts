import { useQuery } from '@tanstack/react-query'
import { doctorScheduleService, type GetWeeklyScheduleParams } from '../lib/api-services/doctor-schedule.service'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get weekly schedule for doctor
 */
export function useDoctorWeeklySchedule(params: GetWeeklyScheduleParams = {}, isReady: boolean = true) {
    return useQuery({
        queryKey: ['doctor', 'schedule', 'weekly', params.weekStartDate],
        queryFn: () => doctorScheduleService.getWeeklySchedule(params),
        enabled: isReady,
        staleTime: 1 * 60 * 1000, // 1 minute (frequently changes)
        retry: 2,
    })
}

/**
 * Hook to get monthly schedule for doctor
 */
export function useDoctorMonthlySchedule(params: { startDate?: string; endDate?: string } = {}, isReady: boolean = true) {
    return useQuery({
        queryKey: ['doctor', 'schedule', 'monthly', params.startDate, params.endDate],
        queryFn: () => doctorScheduleService.getMonthlySchedule(params),
        enabled: isReady,
        staleTime: 5 * 60 * 1000, // 5 minutes (less frequently changes)
        retry: 2,
    })
}

