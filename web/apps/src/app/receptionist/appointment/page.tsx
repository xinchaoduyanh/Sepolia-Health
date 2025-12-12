'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppointmentList } from '@/components/AppointmentList'
import { useAppointments, useAppointmentSummary } from '@/shared/hooks/useAppointment'

export default function AppointmentPage() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const pageSize = 10

    // Fetch appointments with current filters
    const { data, isLoading, error } = useAppointments({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
    })

    // Fetch appointment summary
    const { data: summaryData, isLoading: isSummaryLoading } = useAppointmentSummary()

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
                onPageChange={handlePageChange}
            />
        </div>
    )
}
