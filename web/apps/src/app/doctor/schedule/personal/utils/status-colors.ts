import type { AppointmentStatus } from '@/shared/lib/api-services/doctor-schedule.service'

/**
 * Get color classes for appointment status
 */
export function getStatusColor(status: AppointmentStatus): {
    bg: string
    text: string
    label: string
} {
    switch (status) {
        case 'UPCOMING':
            return {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-700 dark:text-blue-400',
                label: 'Sắp tới',
            }
        case 'ON_GOING':
            return {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-700 dark:text-green-400',
                label: 'Đang diễn ra',
            }
        case 'COMPLETED':
            return {
                bg: 'bg-gray-100 dark:bg-gray-800',
                text: 'text-gray-700 dark:text-gray-300',
                label: 'Hoàn thành',
            }
        case 'CANCELLED':
            return {
                bg: 'bg-red-100 dark:bg-red-900/30',
                text: 'text-red-700 dark:text-red-400',
                label: 'Đã hủy',
            }
        default:
            return {
                bg: 'bg-gray-100 dark:bg-gray-800',
                text: 'text-gray-700 dark:text-gray-300',
                label: 'Không xác định',
            }
    }
}
