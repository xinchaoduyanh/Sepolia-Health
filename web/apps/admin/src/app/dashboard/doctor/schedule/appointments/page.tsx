'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BsSelect } from '@workspace/ui/components/Select'
import { Badge } from '@workspace/ui/components/Badge'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    Calendar,
    Clock,
    User,
    Star,
    CheckCircle2,
    Eye,
    TrendingUp,
    CalendarCheck,
    Activity,
    Filter,
    Stethoscope,
    XCircle,
} from 'lucide-react'
import { useDoctorAppointments } from '@/shared/hooks'
import { useAuth } from '@/shared/hooks/useAuth'
import { formatDate, formatTime } from '@/util/datetime'

// Skeleton loading component
const TableSkeleton = () => (
    <Card className="border-2 shadow-lg">
        <CardContent className="p-6">
            <div className="space-y-4">
                {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border-b">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
)

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'UPCOMING':
            return {
                label: 'Sắp tới',
                className:
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700',
            }
        case 'ON_GOING':
            return {
                label: 'Đang diễn ra',
                className:
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
            }
        case 'COMPLETED':
            return {
                label: 'Đã hoàn thành',
                className:
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700',
            }
        case 'CANCELLED':
            return {
                label: 'Đã hủy',
                className:
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700',
            }
        default:
            return {
                label: status,
                className:
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700',
            }
    }
}

export default function DoctorScheduleAppointmentsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED' | ''>('')
    const [resultFilter, setResultFilter] = useState<'hasResult' | 'noResult' | ''>('')
    const [sortBy, setSortBy] = useState<'startTime' | 'createdAt'>('startTime')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const itemsPerPage = 10

    const queryParams = useMemo(
        () => ({
            page: currentPage,
            limit: itemsPerPage,
            status: statusFilter || undefined,
            sortBy,
            sortOrder,
        }),
        [currentPage, statusFilter, sortBy, sortOrder],
    )

    const { data, isLoading } = useDoctorAppointments(queryParams)

    // Filter by result status
    const appointments = useMemo(() => {
        const allAppointments = data?.data || []
        if (!resultFilter) return allAppointments
        if (resultFilter === 'hasResult') {
            return allAppointments.filter(apt => apt.result)
        }
        if (resultFilter === 'noResult') {
            return allAppointments.filter(apt => !apt.result)
        }
        return allAppointments
    }, [data?.data, resultFilter])

    const totalPages = Math.ceil((appointments.length || 0) / itemsPerPage)

    // Fetch statistics by querying each status with limit=1 to get total counts
    const upcomingQueryParams = useMemo(
        () => ({ page: 1, limit: 1, status: 'UPCOMING' as const, sortBy, sortOrder }),
        [sortBy, sortOrder],
    )
    const onGoingQueryParams = useMemo(
        () => ({ page: 1, limit: 1, status: 'ON_GOING' as const, sortBy, sortOrder }),
        [sortBy, sortOrder],
    )
    const completedQueryParams = useMemo(
        () => ({ page: 1, limit: 1, status: 'COMPLETED' as const, sortBy, sortOrder }),
        [sortBy, sortOrder],
    )
    const allQueryParams = useMemo(() => ({ page: 1, limit: 1, sortBy, sortOrder }), [sortBy, sortOrder])

    const { data: upcomingData } = useDoctorAppointments(upcomingQueryParams)
    const { data: onGoingData } = useDoctorAppointments(onGoingQueryParams)
    const { data: completedData } = useDoctorAppointments(completedQueryParams)
    const { data: allData } = useDoctorAppointments(allQueryParams)

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    const handleViewDetail = useCallback(
        (id: number) => {
            router.push(`/dashboard/doctor/schedule/appointments/${id}`)
        },
        [router],
    )

    // Calculate statistics from API totals (most accurate)
    const statistics = useMemo(() => {
        return {
            upcoming: upcomingData?.total || 0,
            onGoing: onGoingData?.total || 0,
            completed: completedData?.total || 0,
            total: allData?.total || 0,
        }
    }, [upcomingData?.total, onGoingData?.total, completedData?.total, allData?.total])

    const statusOptions = [
        { id: '', name: 'Tất cả trạng thái' },
        { id: 'UPCOMING', name: 'Sắp tới' },
        { id: 'ON_GOING', name: 'Đang diễn ra' },
        { id: 'COMPLETED', name: 'Đã hoàn thành' },
        { id: 'CANCELLED', name: 'Đã hủy' },
    ]

    const sortOptions = [
        { id: 'startTime', name: 'Thời gian khám' },
        { id: 'createdAt', name: 'Ngày tạo' },
    ]

    const orderOptions = [
        { id: 'desc', name: 'Mới nhất' },
        { id: 'asc', name: 'Cũ nhất' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Danh sách khám
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Xem và quản lý tất cả các lịch khám đã đặt của bạn
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Tổng lịch khám</p>
                                    <p className="text-3xl font-bold text-foreground">{statistics.total}</p>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <CalendarCheck className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-500/10 dark:to-blue-500/5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Sắp tới</p>
                                    <p className="text-3xl font-bold text-foreground">{statistics.upcoming}</p>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <TrendingUp className="h-6 w-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 dark:from-yellow-500/10 dark:to-yellow-500/5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Đang diễn ra</p>
                                    <p className="text-3xl font-bold text-foreground">{statistics.onGoing}</p>
                                </div>
                                <div className="p-3 bg-yellow-500/10 rounded-xl">
                                    <Activity className="h-6 w-6 text-yellow-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10 dark:from-green-500/10 dark:to-green-500/5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Đã hoàn thành</p>
                                    <p className="text-3xl font-bold text-foreground">{statistics.completed}</p>
                                </div>
                                <div className="p-3 bg-green-500/10 rounded-xl">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/50">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Bộ lọc và tìm kiếm</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Trạng thái</label>
                            <BsSelect
                                placeholder="Lọc theo trạng thái"
                                selectedKey={statusFilter || null}
                                onSelectionChange={key => {
                                    setStatusFilter((key as any) || '')
                                    setCurrentPage(1)
                                }}
                                options={statusOptions}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Kết quả khám</label>
                            <BsSelect
                                placeholder="Lọc theo kết quả"
                                selectedKey={resultFilter || null}
                                onSelectionChange={key => {
                                    setResultFilter((key as any) || '')
                                    setCurrentPage(1)
                                }}
                                options={[
                                    { id: '', name: 'Tất cả' },
                                    { id: 'hasResult', name: 'Đã có kết quả' },
                                    { id: 'noResult', name: 'Chưa có kết quả' },
                                ]}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Sắp xếp theo</label>
                            <BsSelect
                                placeholder="Sắp xếp theo"
                                selectedKey={sortBy}
                                onSelectionChange={key => {
                                    setSortBy(key as any)
                                    setCurrentPage(1)
                                }}
                                options={sortOptions}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Thứ tự</label>
                            <BsSelect
                                placeholder="Thứ tự"
                                selectedKey={sortOrder}
                                onSelectionChange={key => {
                                    setSortOrder(key as any)
                                    setCurrentPage(1)
                                }}
                                options={orderOptions}
                                className="w-full"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-muted/30">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl font-bold">Danh sách lịch khám</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : appointments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                                <Calendar className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">Chưa có lịch khám nào</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Không tìm thấy lịch khám nào phù hợp với bộ lọc của bạn.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b-2 border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                                            Bệnh nhân
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                                            Dịch vụ
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                                            Bác sĩ
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                                            Ngày & Giờ
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                                            Đánh giá
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-foreground">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {appointments.map(appointment => {
                                        const statusBadge = getStatusBadge(appointment.status)
                                        const hasFeedback = !!appointment.feedback
                                        const hasResult = !!appointment.result

                                        // Get doctor name from current user
                                        const doctorProfile = (user as any)?.doctorProfile
                                        const doctorName = doctorProfile
                                            ? `BS. ${doctorProfile.firstName} ${doctorProfile.lastName}`
                                            : 'Bạn'

                                        return (
                                            <tr
                                                key={appointment.id}
                                                className="hover:bg-muted/20 transition-colors group bg-background"
                                            >
                                                <td className="px-6 py-4">
                                                    {appointment.patient ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/10 rounded-full">
                                                                <User className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-foreground">
                                                                    {appointment.patient.firstName}{' '}
                                                                    {appointment.patient.lastName}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {appointment.patient.phone}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {appointment.service ? (
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {appointment.service.name}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {appointment.service.price.toLocaleString('vi-VN')} VNĐ
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                                            <Stethoscope className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{doctorName}</p>
                                                            {hasResult ? (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                                    <span className="text-xs text-green-600">
                                                                        Đã có kết quả
                                                                    </span>
                                                                </div>
                                                            ) : appointment.status === 'COMPLETED' ? (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <XCircle className="h-3 w-3 text-yellow-600" />
                                                                    <span className="text-xs text-yellow-600">
                                                                        Chưa có kết quả
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            <span className="font-medium text-foreground">
                                                                {formatDate(appointment.startTime.toString())}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-primary" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {formatTime(appointment.startTime.toString())}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${statusBadge.className} border-2 font-semibold`}
                                                    >
                                                        {statusBadge.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {hasFeedback && appointment.feedback ? (
                                                        <div className="flex items-center gap-2">
                                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                            <span className="font-medium text-foreground">
                                                                {appointment.feedback.rating}/5
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Chưa có</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleViewDetail(appointment.id)}
                                                            className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-105 border border-primary/20"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Card className="border-2 shadow-lg">
                    <CardContent className="px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                        <div className="text-sm text-muted-foreground">
                            Hiển thị{' '}
                            <span className="font-semibold text-foreground">
                                {(currentPage - 1) * itemsPerPage + 1}
                            </span>{' '}
                            đến{' '}
                            <span className="font-semibold text-foreground">
                                {Math.min(currentPage * itemsPerPage, data?.total || 0)}
                            </span>{' '}
                            trong tổng số{' '}
                            <span className="font-semibold text-foreground">{appointments.length || 0}</span> lịch khám
                        </div>
                        <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
