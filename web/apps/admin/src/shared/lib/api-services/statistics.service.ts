import { apiClient } from '../api-client'

// Types for statistics API
export interface DashboardStats {
    totalUsers: number
    totalDoctors: number
    totalPatients: number
    totalAppointments: number
    activeUsers: number
    pendingAppointments: number
    completedAppointments: number
    cancelledAppointments: number
}

export interface OverviewStats {
    usersGrowth: {
        period: string
        growth: number
        percentage: number
    }
    appointmentsGrowth: {
        period: string
        growth: number
        percentage: number
    }
    revenueGrowth?: {
        period: string
        growth: number
        percentage: number
    }
}

export interface ChartData {
    labels: string[]
    datasets: {
        label: string
        data: number[]
        backgroundColor?: string
        borderColor?: string
    }[]
}

export type UsersChartData = ChartData

export type AppointmentsChartData = ChartData

export interface StatisticsParams {
    period?: 'day' | 'week' | 'month' | 'year'
    startDate?: string
    endDate?: string
}

export class StatisticsService {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        return apiClient.get<DashboardStats>('/statistics/dashboard')
    }

    /**
     * Get overview statistics
     */
    async getOverviewStats(params?: StatisticsParams): Promise<OverviewStats> {
        return apiClient.get<OverviewStats>('/statistics/overview', { params })
    }

    /**
     * Get users chart data
     */
    async getUsersChartData(params?: StatisticsParams): Promise<UsersChartData> {
        return apiClient.get<UsersChartData>('/admin/statistics/users-chart', { params })
    }

    /**
     * Get appointments chart data
     */
    async getAppointmentsChartData(params?: StatisticsParams): Promise<AppointmentsChartData> {
        return apiClient.get<AppointmentsChartData>('/admin/statistics/appointments-chart', { params })
    }

    /**
     * Get revenue chart data (if applicable)
     */
    async getRevenueChartData(params?: StatisticsParams): Promise<ChartData> {
        return apiClient.get<ChartData>('/admin/statistics/revenue-chart', { params })
    }
}

export const statisticsService = new StatisticsService()
