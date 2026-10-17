'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, QrCode } from 'lucide-react'
import { Button } from '@workspace/ui/components/Button'
import {
    DialogOverlay,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@workspace/ui/components/Dialog'
import { toast } from '@workspace/ui/components/Sonner'
import { AppointmentList } from '@/components/AppointmentList'
import { QRScanner } from '@/components/QRScanner'
import { useAppointments, useAppointmentSummary } from '@/shared/hooks/useAppointment'

export default function AppointmentPage() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [todayOnly, setTodayOnly] = useState(true)
    const [isScanOpen, setIsScanOpen] = useState(false)
    const pageSize = 10

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const startDate = todayOnly ? todayStr : undefined
    const endDate = todayOnly ? todayStr : undefined
    const refetchInterval = todayOnly ? 30000 : undefined

    // Fetch appointments with current filters
    const { data, isLoading, error } = useAppointments(
        {
            page: currentPage,
            limit: pageSize,
            search: searchTerm,
            status: statusFilter,
            startDate,
            endDate,
        },
        { refetchInterval }
    )

    // Fetch appointment summary
    const { data: summaryData, isLoading: isSummaryLoading } = useAppointmentSummary({ refetchInterval })

    const handleViewDetail = (appointmentId: number) => {
        router.push(`/receptionist/appointment/${appointmentId}`)
    }

    const handleCreateNew = () => {
        router.push('/receptionist/schedule-appointment')
    }

    const handleSearchChange = (search: string) => {
        setSearchTerm(search)
        setCurrentPage(1) // Reset to first page when searching
    }

    const handleStatusChange = (status: string) => {
        setStatusFilter(status)
        setCurrentPage(1) // Reset to first page when filtering
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleToggleToday = (isToday: boolean) => {
        setTodayOnly(isToday)
        setCurrentPage(1)
    }

    const handleScanSuccess = (appointmentId: string) => {
        setIsScanOpen(false)
        router.push(`/receptionist/appointment/${appointmentId}`)
    }

    const handleScanError = (errorMessage?: string) => {
        toast.error({
            title: 'Lỗi quét QR',
            description: errorMessage || 'Mã QR không hợp lệ. Vui lòng quét lại.',
        })
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-red-800 dark:text-red-200 font-medium">Lỗi tải dữ liệu</h3>
                    <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                        Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.
                    </p>
                </div>
            </div>
        )
    }

    const toolbar = (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center p-1 rounded-lg bg-muted border border-border">
                    <Button
                        variant={todayOnly ? 'default' : 'ghost'}
                        size="sm"
                        onPress={() => handleToggleToday(true)}
                        className={todayOnly ? 'font-medium' : 'text-muted-foreground'}
                    >
                        <Calendar className="h-4 w-4 mr-1.5" />
                        Hôm nay
                    </Button>
                    <Button
                        variant={!todayOnly ? 'default' : 'ghost'}
                        size="sm"
                        onPress={() => handleToggleToday(false)}
                        className={!todayOnly ? 'font-medium' : 'text-muted-foreground'}
                    >
                        Tất cả
                    </Button>
                </div>

                {todayOnly && (
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Tự động làm mới mỗi 30 giây</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setIsScanOpen(true)}
                    className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                    <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Quét QR check-in</span>
                </Button>
            </div>
        </div>
    )

    const title = todayOnly ? 'Lịch hẹn hôm nay & check-in' : 'Tất cả lịch hẹn'
    const subtitle = todayOnly ? (
        <span>
            Xem danh sách lịch hẹn hôm nay và tiếp đón bệnh nhân.{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                (Dữ liệu tự động làm mới mỗi 30 giây)
            </span>
        </span>
    ) : (
        'Xem và quản lý tất cả các lịch hẹn trong hệ thống'
    )

    return (
        <div className="container mx-auto px-4 py-8">
            <AppointmentList
                appointments={data?.data || []}
                summary={summaryData}
                isLoading={isLoading}
                isSummaryLoading={isSummaryLoading}
                onViewDetail={handleViewDetail}
                onCreateNew={handleCreateNew}
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
                currentPage={data?.page || 1}
                totalPages={data?.totalPages || 1}
                totalItems={data?.total || 0}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                toolbar={toolbar}
                title={title}
                subtitle={subtitle}
            />

            <DialogOverlay isOpen={isScanOpen} onOpenChange={setIsScanOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Quét mã QR check-in</DialogTitle>
                        <DialogDescription>
                            Hướng camera về phía mã QR trên ứng dụng bệnh nhân để mở chi tiết lịch hẹn và check-in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <QRScanner
                            onScanSuccess={handleScanSuccess}
                            onScanError={handleScanError}
                        />
                    </div>
                </DialogContent>
            </DialogOverlay>
        </div>
    )
}
