'use client'

import { AppointmentSummary } from '@/shared/lib/api-services/appointment.service'
import { AppointmentDetailResponse } from '@/types/appointment'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { DataTable } from '@workspace/ui/components/DataTable'
import { Pagination } from '@workspace/ui/components/Pagination'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { AlertCircle, Calendar, CheckCircle2, Clock, Eye, Phone, Plus, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const statusOptions = [
    { id: 'all', name: 'Tất cả trạng thái' },
    { id: 'UPCOMING', name: 'Sắp tới' },
    { id: 'ON_GOING', name: 'Đang diễn ra' },
    { id: 'COMPLETED', name: 'Hoàn thành' },
    { id: 'CANCELLED', name: 'Đã hủy' },
]

const getStatusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' => {
    switch (status.toUpperCase()) {
        case 'UPCOMING':
            return 'info' // Sky Blue
        case 'ON_GOING':
            return 'secondary' // Soft Blue
        case 'COMPLETED':
            return 'success' // Teal/Mint
        case 'CANCELLED':
            return 'destructive' // Rose
        default:
            return 'default'
    }
}

const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
        case 'UPCOMING':
            return <Clock className="h-3 w-3" />
        case 'ON_GOING':
            return <AlertCircle className="h-3 w-3" />
        case 'COMPLETED':
            return <CheckCircle2 className="h-3 w-3" />
        case 'CANCELLED':
            return <XCircle className="h-3 w-3" />
        default:
            return null
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
    totalItems?: number
    pageSize?: number
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
    totalItems = 0,
    pageSize = 10,
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
            size: 90,
            minSize: 80,
            maxSize: 100,
            cell: ({ row }: any) => (
                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-800/30 whitespace-nowrap">
                    #{row.original.id}
                </span>
            ),
        },
        {
            accessorKey: 'patient',
            header: 'Bệnh nhân',
            cell: ({ row }: any) => {
                const patient = row.original.patientProfile
                const initials = patient
                    ? `${patient.lastName?.charAt(0) || ''}${patient.firstName?.charAt(0) || ''}`
                    : '?'
                return (
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            {patient?.avatar ? (
                                <img
                                    src={patient.avatar}
                                    alt={`${patient.lastName} ${patient.firstName}`}
                                    className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-100 dark:ring-emerald-800/30"
                                />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="font-medium text-slate-800 dark:text-slate-100 text-[13px]">
                                {patient ? `${patient.lastName} ${patient.firstName}` : 'N/A'}
                            </div>
                            {patient?.phone && (
                                <div className="flex items-center text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    <Phone className="h-3 w-3 mr-1 text-emerald-400" />
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
                const initials = doctor
                    ? `${doctor.lastName?.charAt(0) || ''}${doctor.firstName?.charAt(0) || ''}`
                    : '?'
                return (
                    <div className="flex items-center space-x-2.5">
                        <div className="flex-shrink-0">
                            {doctor?.avatar ? (
                                <img
                                    src={doctor.avatar}
                                    alt={`${doctor.lastName} ${doctor.firstName}`}
                                    className="h-8 w-8 rounded-full object-cover ring-2 ring-sky-100 dark:ring-sky-800/30"
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-semibold shadow-sm">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 text-[13px]">
                            {doctor ? `BS. ${doctor.lastName} ${doctor.firstName}` : 'N/A'}
                        </span>
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
                        <div className="font-medium text-slate-800 dark:text-slate-100 text-[13px]">
                            {service?.name || 'N/A'}
                        </div>
                        {service && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                <span className="inline-flex items-center gap-1">
                                    <span className="text-emerald-500">{service.duration} phút</span>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                        {service.price.toLocaleString('vi-VN')} ₫
                                    </span>
                                </span>
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
                    <div className="flex items-center space-x-2.5">
                        <div className="flex-shrink-0 p-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100/50 dark:border-emerald-800/30">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <div className="font-medium text-emerald-700 dark:text-emerald-300 text-[13px]">
                                {format(startTime, 'dd/MM/yyyy', { locale: vi })}
                            </div>
                            <div className="flex items-center text-[11px] text-teal-500 dark:text-teal-400 mt-0.5">
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
            cell: ({ row }: any) => {
                const status = row.original.status
                return (
                    <Badge
                        variant={getStatusVariant(status)}
                        className="flex items-center gap-1.5 px-2.5 py-1 font-medium text-[10px] uppercase tracking-wider"
                    >
                        {getStatusIcon(status)}
                        {getStatusLabel(status)}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'billing',
            header: 'Thanh toán',
            cell: ({ row }: any) => {
                const billing = row.original.billing
                const isPaid = billing?.status?.toUpperCase() === 'PAID'
                return billing ? (
                    <div className="flex items-center gap-2.5">
                        <div className="font-bold text-[14px] tabular-nums text-sky-600 dark:text-sky-400">
                            {billing.amount.toLocaleString('vi-VN')} ₫
                        </div>
                        <Badge
                            variant={isPaid ? 'success' : 'destructive'}
                            className="text-[9px] font-semibold px-2 py-0.5"
                        >
                            {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Badge>
                    </div>
                ) : (
                    <span className="text-slate-300 dark:text-slate-600 text-[11px] italic">Chưa có hóa đơn</span>
                )
            },
        },
        {
            accessorKey: 'actions',
            header: 'Thao tác',
            size: 70,
            minSize: 60,
            maxSize: 80,
            cell: ({ row }: any) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(row.original.id)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-colors"
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
                        {isSummaryLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            summary?.reduce((acc, s) => acc + s.count, 0) || 0
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">Tổng lịch hẹn</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-blue-600">
                        {isSummaryLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            summary?.find(s => s.appointmentStatus === 'UPCOMING')?.count || 0
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">Sắp tới</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-orange-600">
                        {isSummaryLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            summary?.find(s => s.appointmentStatus === 'ON_GOING')?.count || 0
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">Đang diễn ra</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-green-600">
                        {isSummaryLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            summary?.find(s => s.appointmentStatus === 'COMPLETED')?.count || 0
                        )}
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
                    <div className="p-4 space-y-4">
                        <div className="flex space-x-4">
                            <Skeleton className="h-10 w-[100px]" />
                            <Skeleton className="h-10 w-[200px]" />
                            <Skeleton className="h-10 w-[150px]" />
                            <Skeleton className="h-10 w-[150px]" />
                            <Skeleton className="h-10 w-[150px]" />
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex space-x-4">
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ))}
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
                <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-muted-foreground italic">
                        Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, totalItems)}{' '}
                        trong {totalItems} lịch hẹn
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={onPageChange} />
                </div>
            )}
        </div>
    )
}
