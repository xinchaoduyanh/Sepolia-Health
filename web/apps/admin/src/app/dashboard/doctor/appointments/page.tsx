'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BsSelect } from '@workspace/ui/components/Select'
import { Badge } from '@workspace/ui/components/Badge'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Calendar, Clock, User, FileText, Star, CheckCircle2, XCircle, Edit, Eye } from 'lucide-react'
import { useDoctorAppointments, useCreateOrUpdateAppointmentResult } from '@/shared/hooks'
import { formatDate, formatTime } from '@/util/datetime'
import { AppointmentResultModal } from './AppointmentResultModal'

// Skeleton loading component
const SkeletonCard = () => (
    <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
    </div>
)

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'UPCOMING':
            return {
                label: 'Sắp tới',
                className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            }
        case 'ON_GOING':
            return {
                label: 'Đang diễn ra',
                className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            }
        case 'COMPLETED':
            return {
                label: 'Đã hoàn thành',
                className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            }
        case 'CANCELLED':
            return {
                label: 'Đã hủy',
                className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            }
        default:
            return {
                label: status,
                className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
            }
    }
}

export default function DoctorAppointmentsPage() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED' | ''>('')
    const [sortBy, setSortBy] = useState<'startTime' | 'createdAt'>('startTime')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
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
    const appointments = data?.data || []
    const totalPages = Math.ceil((data?.total || 0) / itemsPerPage)

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    const handleViewDetail = useCallback(
        (id: number) => {
            router.push(`/dashboard/doctor/appointments/${id}`)
        },
        [router],
    )

    const handleAddResult = useCallback((id: number) => {
        setSelectedAppointment(id)
        setIsModalOpen(true)
    }, [])

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Lịch khám</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý và đánh giá các lịch khám của bạn</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
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
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
                {isLoading ? (
                    <>
                        {[...Array(5)].map((_, idx) => (
                            <SkeletonCard key={idx} />
                        ))}
                    </>
                ) : appointments.length === 0 ? (
                    <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có lịch khám nào</h3>
                        <p className="text-sm text-muted-foreground">
                            Không tìm thấy lịch khám nào phù hợp với bộ lọc của bạn
                        </p>
                    </div>
                ) : (
                    appointments.map(appointment => {
                        const statusBadge = getStatusBadge(appointment.status)
                        const isCompleted = appointment.status === 'COMPLETED'
                        const hasResult = !!appointment.result
                        const hasFeedback = !!appointment.feedback

                        return (
                            <div
                                key={appointment.id}
                                className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-foreground">
                                                Lịch khám #{appointment.id}
                                            </h3>
                                            <Badge variant="secondary" className={statusBadge.className}>
                                                {statusBadge.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(appointment.startTime.toString())}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{formatTime(appointment.startTime.toString())}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                {appointment.patient && (
                                    <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium text-foreground">
                                            {appointment.patient.firstName} {appointment.patient.lastName}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            - {appointment.patient.phone}
                                        </span>
                                    </div>
                                )}

                                {/* Service Info */}
                                {appointment.service && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-foreground">
                                                {appointment.service.name}
                                            </span>
                                            <span className="text-muted-foreground">
                                                - {appointment.service.price.toLocaleString('vi-VN')} VNĐ
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback from Patient */}
                                {hasFeedback && appointment.feedback && (
                                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium text-foreground">
                                                Đánh giá từ bệnh nhân: {appointment.feedback.rating}/5
                                            </span>
                                        </div>
                                        {appointment.feedback.comment && (
                                            <p className="text-sm text-muted-foreground ml-6">
                                                &ldquo;{appointment.feedback.comment}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Result Status */}
                                {isCompleted && (
                                    <div className="mb-4">
                                        {hasResult ? (
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                                <span className="font-medium">Đã có kết quả khám</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                                <XCircle className="h-5 w-5" />
                                                <span className="font-medium">Chưa có kết quả khám</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-4 border-t border-border">
                                    <button
                                        onClick={() => handleViewDetail(appointment.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Xem chi tiết
                                    </button>
                                    {isCompleted && (
                                        <button
                                            onClick={() => handleAddResult(appointment.id)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                                        >
                                            {hasResult ? (
                                                <>
                                                    <Edit className="h-4 w-4" />
                                                    Cập nhật kết quả
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="h-4 w-4" />
                                                    Thêm kết quả
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-card rounded-lg shadow-sm border border-border px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, data?.total || 0)} trong tổng số {data?.total || 0} lịch
                        khám
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            )}

            {/* Result Modal */}
            {selectedAppointment && (
                <AppointmentResultModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedAppointment(null)
                    }}
                    appointmentId={selectedAppointment}
                />
            )}
        </div>
    )
}
