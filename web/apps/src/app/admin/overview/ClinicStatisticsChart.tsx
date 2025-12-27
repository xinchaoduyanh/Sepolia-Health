'use client'

import { statisticsService, type AppointmentsChartDataByClinic } from '@/shared/lib/api-services/statistics.service'
import { queryKeys } from '@/shared/lib/query-keys'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { useMemo, useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

function formatCurrency(num: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(num)
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num)
}

// Chart Skeleton Component
function ChartSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    )
}

// Custom Tooltip Component with Premium Styling
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) {
        return null
    }

    return (
        <div
            className="bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl p-4 min-w-[200px]"
            style={{
                boxShadow:
                    '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
            }}
        >
            <div className="border-b border-primary/10 pb-2 mb-3">
                <p className="text-sm font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {label}
                </p>
            </div>
            <div className="space-y-2">
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-4 group hover:bg-primary/5 rounded-md px-2 py-1.5 transition-all duration-200"
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm shadow-sm ring-1 ring-black/10"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {entry.name}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                            {formatNumber(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Custom Revenue Tooltip Component with Premium Styling
function CustomRevenueTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) {
        return null
    }

    return (
        <div
            className="bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl p-4 min-w-[200px]"
            style={{
                boxShadow:
                    '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
            }}
        >
            <div className="border-b border-primary/10 pb-2 mb-3">
                <p className="text-sm font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {label}
                </p>
            </div>
            <div className="space-y-2">
                {payload.map((entry: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-4 group hover:bg-primary/5 rounded-md px-2 py-1.5 transition-all duration-200"
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm shadow-sm ring-1 ring-black/10"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {entry.name}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Revenue Chart Component
function RevenueChart() {
    const [period, setPeriod] = useState<'1month' | '3months' | 'year'>('1month')
    const [selectedClinicId, setSelectedClinicId] = useState<number | 'all'>('all')

    const {
        data: chartData,
        isLoading,
        error,
    } = useQuery({
        queryKey: [...queryKeys.admin.statistics.all(), 'revenue-chart-by-clinic', period],
        queryFn: () => statisticsService.getRevenueChartByClinic(period),
        staleTime: 5 * 60 * 1000,
    })

    // Filter data by selected clinic
    const filteredData = useMemo(() => {
        if (!chartData || selectedClinicId === 'all') {
            return chartData
        }

        return {
            ...chartData,
            data: chartData.data.map(point => ({
                ...point,
                clinics: point.clinics.filter(c => c.clinicId === selectedClinicId),
            })),
        }
    }, [chartData, selectedClinicId])

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Doanh thu theo cơ sở</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartSkeleton />
                </CardContent>
            </Card>
        )
    }

    if (error || !filteredData || !filteredData.data.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Doanh thu theo cơ sở</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error ? 'Lỗi khi tải dữ liệu' : 'Chưa có dữ liệu'}</p>
                </CardContent>
            </Card>
        )
    }

    // Transform data for recharts
    const chartDataFormatted = filteredData.data.map(point => {
        const result: Record<string, string | number> = {
            label: point.label,
        }
        point.clinics.forEach(clinic => {
            result[clinic.clinicName] = clinic.revenue
        })
        return result
    })

    // Get clinics to display (filtered or all)
    const clinicsToDisplay =
        selectedClinicId === 'all'
            ? filteredData.clinics
            : filteredData.clinics.filter(c => c.clinicId === selectedClinicId)

    // Generate colors for each clinic
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb']

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>Doanh thu theo cơ sở</CardTitle>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                            value={selectedClinicId}
                            onChange={e =>
                                setSelectedClinicId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                            }
                            className="px-3 py-1.5 border rounded-md text-sm bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="all">Tất cả cơ sở</option>
                            {filteredData.clinics.map(clinic => (
                                <option key={clinic.clinicId} value={clinic.clinicId}>
                                    {clinic.clinicName}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <Button
                                variant={period === '1month' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod('1month')}
                            >
                                1 tháng
                            </Button>
                            <Button
                                variant={period === '3months' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod('3months')}
                            >
                                3 tháng
                            </Button>
                            <Button
                                variant={period === 'year' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod('year')}
                            >
                                Từ đầu năm
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 py-6">
                <div className="pl-4 pr-2">
                    <ResponsiveContainer width="100%" height={450}>
                        <LineChart data={chartDataFormatted} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="label"
                                className="text-muted-foreground"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                tickFormatter={value => {
                                    if (value >= 1000000) {
                                        return `${(value / 1000000).toFixed(1)}M`
                                    }
                                    if (value >= 1000) {
                                        return `${(value / 1000).toFixed(0)}K`
                                    }
                                    return value.toString()
                                }}
                                className="text-muted-foreground"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                width={80}
                            />
                            <Tooltip content={<CustomRevenueTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                            <Legend
                                wrapperStyle={{ color: 'hsl(var(--foreground))', paddingTop: '20px' }}
                                iconType="line"
                            />
                            {clinicsToDisplay.map((clinic, index) => (
                                <Line
                                    key={clinic.clinicId}
                                    type="monotone"
                                    dataKey={clinic.clinicName}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2.5}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 7 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

// Appointments Chart Component
function AppointmentsChart() {
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [selectedClinicId, setSelectedClinicId] = useState<number | 'all'>('all')

    // Generate list of 12 months
    const months: string[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
        months.push(monthStr)
    }

    const {
        data: chartData,
        isLoading,
        error,
    } = useQuery<AppointmentsChartDataByClinic>({
        queryKey: [...queryKeys.admin.statistics.all(), 'appointments-chart-by-clinic', selectedMonth],
        queryFn: () => statisticsService.getAppointmentsChartByClinic(selectedMonth),
        staleTime: 5 * 60 * 1000,
    })

    // Get unique clinics from data
    const clinics = useMemo(() => {
        if (!chartData || !chartData.data.length || !chartData.data[0]) return []
        return chartData.data[0].clinics.map(c => ({
            clinicId: c.clinicId,
            clinicName: c.clinicName,
        }))
    }, [chartData])

    // Filter data by selected clinic
    const filteredData = useMemo(() => {
        if (!chartData || selectedClinicId === 'all') {
            return chartData
        }

        return {
            ...chartData,
            data: chartData.data.map(point => ({
                ...point,
                clinics: point.clinics.filter(c => c.clinicId === selectedClinicId),
            })),
        }
    }, [chartData, selectedClinicId])

    // Get clinic names to display
    const clinicNames = useMemo(() => {
        if (!filteredData?.data[0]?.clinics) return []
        if (selectedClinicId === 'all') {
            return filteredData.data[0].clinics.map(c => c.clinicName)
        }
        return filteredData.data[0].clinics.filter(c => c.clinicId === selectedClinicId).map(c => c.clinicName)
    }, [filteredData, selectedClinicId])

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lịch hẹn theo cơ sở</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartSkeleton />
                </CardContent>
            </Card>
        )
    }

    if (error || !filteredData || !filteredData.data.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lịch hẹn theo cơ sở</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error ? 'Lỗi khi tải dữ liệu' : 'Chưa có dữ liệu'}</p>
                </CardContent>
            </Card>
        )
    }

    // Transform data for recharts
    const chartDataFormatted = filteredData.data.map(point => {
        const result: Record<string, string | number> = {
            label: point.label,
        }
        point.clinics.forEach(clinic => {
            result[clinic.clinicName] = clinic.appointments
        })
        return result
    })

    // Generate colors for each clinic
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb']

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>Lịch hẹn theo cơ sở</CardTitle>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                            value={selectedClinicId}
                            onChange={e =>
                                setSelectedClinicId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                            }
                            className="px-3 py-1.5 border rounded-md text-sm bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="all">Tất cả cơ sở</option>
                            {clinics.map(clinic => (
                                <option key={clinic.clinicId} value={clinic.clinicId}>
                                    {clinic.clinicName}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="px-3 py-1.5 border rounded-md text-sm bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            {months.map(month => (
                                <option key={month} value={month}>
                                    {new Date(month + '-01').toLocaleDateString('vi-VN', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 py-6">
                <div className="pl-4 pr-2">
                    <ResponsiveContainer width="100%" height={500}>
                        <BarChart
                            data={chartDataFormatted}
                            margin={{ top: 10, right: 30, left: 20, bottom: 80 }}
                            barGap={8}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="label"
                                className="text-muted-foreground"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={100}
                            />
                            <YAxis
                                className="text-muted-foreground"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                width={60}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                            <Legend
                                wrapperStyle={{ color: 'hsl(var(--foreground))', paddingTop: '20px' }}
                                iconType="rect"
                            />
                            {clinicNames.map((clinicName, index) => (
                                <Bar
                                    key={clinicName}
                                    dataKey={clinicName}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.8}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export function ClinicStatisticsChart() {
    return (
        <div className="space-y-6">
            <RevenueChart />
            <AppointmentsChart />
        </div>
    )
}
