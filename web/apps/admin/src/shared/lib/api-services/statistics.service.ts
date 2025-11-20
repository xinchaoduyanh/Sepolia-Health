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

export interface MonthComparison {
    currentMonth: number
    previousMonth: number
    difference: number
    percentageChange: number
}

export interface OverviewStats {
    totalPatients: MonthComparison
    appointments: MonthComparison
    doctors: MonthComparison
    revenue: MonthComparison
}

export interface ClinicStatisticsItem {
    clinicId: number
    clinicName: string
    patients: number
    appointments: number
    doctors: number
    revenue: number
}

export interface ClinicStatistics {
    clinics: ClinicStatisticsItem[]
}

export interface RevenueChartDataPoint {
    label: string
    clinics: Array<{
        clinicId: number
        clinicName: string
        revenue: number
    }>
}

export interface RevenueChartData {
    data: RevenueChartDataPoint[]
    clinics: Array<{
        clinicId: number
        clinicName: string
    }>
}

export interface AppointmentsChartDataPoint {
    label: string
    clinics: Array<{
        clinicId: number
        clinicName: string
        appointments: number
    }>
}

export interface AppointmentsChartData {
    data: AppointmentsChartDataPoint[]
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
     * Get overview statistics (current month vs previous month)
     */
    async getOverviewStats(): Promise<OverviewStats> {
        return apiClient.get<OverviewStats>('/admin/statistics/overview')
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

    /**
     * Get statistics by clinic
     */
    async getClinicStatistics(): Promise<ClinicStatistics> {
        return apiClient.get<ClinicStatistics>('/admin/statistics/clinics')
    }

    /**
     * Get revenue chart data by clinic
     */
    async getRevenueChartByClinic(period: '1month' | '3months' | 'year'): Promise<RevenueChartData> {
        return apiClient.get<RevenueChartData>('/admin/statistics/revenue-chart-by-clinic', {
            params: { period },
        })
    }

    /**
     * Get appointments chart data by clinic
     */
    async getAppointmentsChartByClinic(month?: string): Promise<AppointmentsChartData> {
        return apiClient.get<AppointmentsChartData>('/admin/statistics/appointments-chart-by-clinic', {
            params: month ? { month } : undefined,
        })
    }
}

export const statisticsService = new StatisticsService()
