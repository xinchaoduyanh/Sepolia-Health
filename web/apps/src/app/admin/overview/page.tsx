'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { statisticsService } from '@/shared/lib/api-services/statistics.service'
import { queryKeys } from '@/shared/lib/query-keys'
import { ClinicStatisticsChart } from '@/app/admin/overview/ClinicStatisticsChart'

function formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num)
}

function formatCurrency(num: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(num)
}

function formatPercentageChange(percentageChange: number): string {
    const sign = percentageChange >= 0 ? '+' : ''
    return `${sign}${percentageChange.toFixed(1)}%`
}

export default function OverviewPage() {
    const {
        data: overviewStats,
        isLoading,
        error,
    } = useQuery({
        queryKey: queryKeys.admin.statistics.overview(),
        queryFn: () => statisticsService.getOverviewStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    if (isLoading) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Đang tải...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">...</div>
                                <p className="text-xs text-muted-foreground">...</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Lỗi khi tải dữ liệu thống kê</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const stats = (overviewStats as any) || {
        totalPatients: { absoluteTotal: 0, currentMonth: 0, previousMonth: 0, difference: 0, percentageChange: 0 },
        appointments: { absoluteTotal: 0, currentMonth: 0, previousMonth: 0, difference: 0, percentageChange: 0 },
        doctors: { absoluteTotal: 0, currentMonth: 0, previousMonth: 0, difference: 0, percentageChange: 0 },
        revenue: { absoluteTotal: 0, currentMonth: 0, previousMonth: 0, difference: 0, percentageChange: 0 },
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(stats.totalPatients.absoluteTotal)}</div>
                        <p className="text-xs text-muted-foreground">
                            +{formatNumber(stats.totalPatients.currentMonth)} bệnh nhân mới trong tháng này
                            {stats.totalPatients.percentageChange !== 0 && (
                                <span>
                                    {' '}
                                    ({formatPercentageChange(stats.totalPatients.percentageChange)} so với tháng trước)
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lịch hẹn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(stats.appointments.absoluteTotal)}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatNumber(stats.appointments.currentMonth)} lịch hẹn hoàn thành tháng này
                            {stats.appointments.percentageChange !== 0 && (
                                <span>
                                    {' '}
                                    ({formatPercentageChange(stats.appointments.percentageChange)} so với tháng trước)
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bác sĩ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(stats.doctors.absoluteTotal)}</div>
                        <p className="text-xs text-muted-foreground">
                            +{formatNumber(stats.doctors.currentMonth)} bác sĩ mới trong tháng này
                            {stats.doctors.percentageChange !== 0 && (
                                <span>
                                    {' '}
                                    ({formatPercentageChange(stats.doctors.percentageChange)} so với tháng trước)
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.revenue.absoluteTotal)}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(stats.revenue.currentMonth)} tháng này
                            {stats.revenue.percentageChange !== 0 && (
                                <span>
                                    {' '}
                                    ({formatPercentageChange(stats.revenue.percentageChange)} so với tháng trước)
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Clinic Statistics */}
            <ClinicStatisticsChart />
        </div>
    )
}
