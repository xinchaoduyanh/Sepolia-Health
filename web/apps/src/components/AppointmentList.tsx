'use client'

import { useState, useEffect, useRef } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Calendar, Clock, User, Phone, Plus, Eye } from 'lucide-react'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { AppointmentDetailResponse } from '@/types/appointment'
import { AppointmentSummary } from '@/shared/lib/api-services/appointment.service'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const statusOptions = [
    { id: 'all', name: 'Tất cả trạng thái' },
    { id: 'UPCOMING', name: 'Sắp tới' },
    { id: 'ON_GOING', name: 'Đang diễn ra' },
    { id: 'COMPLETED', name: 'Hoàn thành' },
    { id: 'CANCELLED', name: 'Đã hủy' },
]

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toUpperCase()) {
        case 'UPCOMING':
            return 'default' // Blue for upcoming
        case 'ON_GOING':
            return 'outline' // Green outline for ongoing
        case 'COMPLETED':
            return 'outline' // Green outline for completed
        case 'CANCELLED':
            return 'secondary' // Gray for cancelled (inactive)
        default:
            return 'default'
    }
}

const getStatusLabel = (status: string): string => {
    switch (status.toUpperCase()) {
        case 'UPCOMING':
            return 'Sắp tới'
        case 'ON_GOING':
            return 'Đang diễn ra'
        case 'COMPLETED':
            return 'Hoàn thành'
        case 'CANCELLED':
            return 'Đã hủy'
        default:
            return status
    }
}

interface AppointmentListProps {
    appointments: AppointmentDetailResponse[]
    summary?: AppointmentSummary[]
    isLoading?: boolean
    isSummaryLoading?: boolean
    onViewDetail: (appointmentId: number) => void
    onCreateNew: () => void
    onSearchChange: (search: string) => void
    onStatusChange: (status: string) => void
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function AppointmentList({
    appointments,
    summary,
    isLoading,
    isSummaryLoading,
    onViewDetail,
    onCreateNew,
    onSearchChange,
    onStatusChange,
    currentPage,
    totalPages,
    onPageChange,
}: AppointmentListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Debounce search - only call API after user stops typing for 500ms
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
            onSearchChange(searchTerm)
        }, 500)

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [searchTerm])

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // If user presses Enter, search immediately
        if (e.key === 'Enter') {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
            onSearchChange(searchTerm)
        }
    }

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value)
        onStatusChange(value === 'all' ? '' : value)
    }

    const columns = [
        {
            accessorKey: 'id',
            header: 'Mã',
            cell: ({ row }: any) => (
                <span className="font-mono text-sm text-slate-600 dark:text-slate-400">#{row.original.id}</span>
            ),
        },
        {
            accessorKey: 'patient',
            header: 'Bệnh nhân',
            cell: ({ row }: any) => {
                const patient = row.original.patientProfile
                return (
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
                            </div>
                            {patient?.phone && (
                                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {patient.phone}
                                </div>
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'doctor',
            header: 'Bác sĩ',
            cell: ({ row }: any) => {
                const doctor = row.original.doctor
                return (
                    <div className="text-slate-700 dark:text-slate-300">
                        {doctor ? `BS. ${doctor.firstName} ${doctor.lastName}` : 'N/A'}
                    </div>
                )
            },
        },
        {
            accessorKey: 'service',
            header: 'Dịch vụ',
            cell: ({ row }: any) => {
                const service = row.original.service
                return (
                    <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{service?.name || 'N/A'}</div>
                        {service && (
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {service.duration} phút • {service.price.toLocaleString('vi-VN')} ₫
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: 'startTime',
            header: 'Thời gian',
            cell: ({ row }: any) => {
                const startTime = new Date(row.original.startTime)
                return (
                    <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 mt-1">
                            <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                {format(startTime, 'dd/MM/yyyy', { locale: vi })}
                            </div>
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(startTime, 'HH:mm', { locale: vi })}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'status',
            header: 'Trạng thái',
            cell: ({ row }: any) => (
                <Badge variant={getStatusVariant(row.original.status)}>{getStatusLabel(row.original.status)}</Badge>
            ),
        },
        {
            accessorKey: 'billing',
            header: 'Thanh toán',
            cell: ({ row }: any) => {
                const billing = row.original.billing
                return billing ? (
                    <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                            {billing.amount.toLocaleString('vi-VN')} ₫
                        </div>
                        <Badge variant={billing.status === 'paid' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {billing.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Badge>
                    </div>
                ) : (
                    <span className="text-slate-400">N/A</span>
                )
            },
        },
        {
            accessorKey: 'actions',
            header: 'Thao tác',
            size: 80,
            minSize: 80,
            maxSize: 80,
            cell: ({ row }: any) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(row.original.id)}
                    className="h-8 w-8 p-0"
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Quản lý lịch hẹn</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Xem và quản lý tất cả các lịch hẹn trong hệ thống
                    </p>
                </div>
                <Button onClick={onCreateNew} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Tạo lịch hẹn mới</span>
                </Button>
            </div>

            {/* Stats - Moved to top */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-foreground">
                        {isSummaryLoading ? '...' : summary?.reduce((acc, s) => acc + s.count, 0) || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Tổng lịch hẹn</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-blue-600">
                        {isSummaryLoading ? '...' : summary?.find(s => s.appointmentStatus === 'UPCOMING')?.count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Sắp tới</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-orange-600">
                        {isSummaryLoading ? '...' : summary?.find(s => s.appointmentStatus === 'ON_GOING')?.count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Đang diễn ra</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-green-600">
                        {isSummaryLoading ? '...' : summary?.find(s => s.appointmentStatus === 'COMPLETED')?.count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Hoàn thành</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <BsSearchField
                        placeholder="Tìm kiếm theo tên bệnh nhân, số điện thoại..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>
                <div className="w-full sm:w-48">
                    <BsSelect
                        value={selectedStatus}
                        onChange={value => handleStatusChange(value as string)}
                        options={statusOptions}
                        placeholder="Chọn trạng thái"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-x-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-muted-foreground">Đang tải...</div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Calendar className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                            Không có lịch hẹn nào
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Bắt đầu bằng cách tạo lịch hẹn mới
                        </p>
                    </div>
                ) : (
                    <DataTable data={appointments} columns={columns} />
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Trang {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            isDisabled={currentPage === 1}
                        >
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            isDisabled={currentPage === totalPages}
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
