'use client'

import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { Download } from 'lucide-react'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'

// Mock data
const mockAppointments = [
    {
        id: 265,
        pid: '209834734',
        name: 'Tán Nguyên Bảo',
        gender: 'Nữ',
        birthDate: '14/12/1989',
        phone: '0908260136',
        appointmentDate: '14/01/2022',
        appointmentTime: '08:00-08:30',
        service: 'Khám bệnh từ xa',
        doctor: 'Nguyễn Xuân Thắng',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã gửi kết quả',
    },
    {
        id: 266,
        pid: '209834735',
        name: 'Nguyễn Văn A',
        gender: 'Nam',
        birthDate: '15/01/1990',
        phone: '0908260137',
        appointmentDate: '14/01/2022',
        appointmentTime: '09:00-09:30',
        service: 'Tư vấn từ xa',
        doctor: 'Trần Văn An',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã xác nhận',
    },
    {
        id: 267,
        pid: '209834736',
        name: 'Lê Thị B',
        gender: 'Nữ',
        birthDate: '16/02/1985',
        phone: '0908260138',
        appointmentDate: '14/01/2022',
        appointmentTime: '10:00-10:30',
        service: 'Khám bệnh từ xa',
        doctor: 'Nguyễn Xuân Thắng',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã gửi kết quả',
    },
    {
        id: 268,
        pid: '209834737',
        name: 'Phạm Văn C',
        gender: 'Nam',
        birthDate: '17/03/1992',
        phone: '0908260139',
        appointmentDate: '14/01/2022',
        appointmentTime: '11:00-11:30',
        service: 'Tư vấn từ xa',
        doctor: 'Trần Văn An',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã xác nhận',
    },
    {
        id: 269,
        pid: '209834738',
        name: 'Hoàng Thị D',
        gender: 'Nữ',
        birthDate: '18/04/1988',
        phone: '0908260140',
        appointmentDate: '14/01/2022',
        appointmentTime: '14:00-14:30',
        service: 'Khám bệnh từ xa',
        doctor: 'Nguyễn Xuân Thắng',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã gửi kết quả',
    },
    {
        id: 270,
        pid: '209834739',
        name: 'Trần Văn E',
        gender: 'Nam',
        birthDate: '19/05/1991',
        phone: '0908260141',
        appointmentDate: '14/01/2022',
        appointmentTime: '15:00-15:30',
        service: 'Tư vấn từ xa',
        doctor: 'Trần Văn An',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã xác nhận',
    },
    {
        id: 271,
        pid: '209834740',
        name: 'Nguyễn Thị F',
        gender: 'Nữ',
        birthDate: '20/06/1987',
        phone: '0908260142',
        appointmentDate: '14/01/2022',
        appointmentTime: '16:00-16:30',
        service: 'Khám bệnh từ xa',
        doctor: 'Nguyễn Xuân Thắng',
        paymentMethod: 'Chuyển khoản',
        status: 'Chờ xác nhận',
    },
    {
        id: 272,
        pid: '209834741',
        name: 'Lê Văn G',
        gender: 'Nam',
        birthDate: '21/07/1993',
        phone: '0908260143',
        appointmentDate: '14/01/2022',
        appointmentTime: '17:00-17:30',
        service: 'Tư vấn từ xa',
        doctor: 'Trần Văn An',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã gửi kết quả',
    },
    {
        id: 273,
        pid: '209834742',
        name: 'Phạm Thị H',
        gender: 'Nữ',
        birthDate: '22/08/1986',
        phone: '0908260144',
        appointmentDate: '14/01/2022',
        appointmentTime: '18:00-18:30',
        service: 'Khám bệnh từ xa',
        doctor: 'Nguyễn Xuân Thắng',
        paymentMethod: 'Chuyển khoản',
        status: 'Đã xác nhận',
    },
    {
        id: 274,
        pid: '209834743',
        name: 'Võ Văn I',
        gender: 'Nam',
        birthDate: '23/09/1984',
        phone: '0908260145',
        appointmentDate: '14/01/2022',
        appointmentTime: '19:00-19:30',
        service: 'Tư vấn từ xa',
        doctor: 'Trần Văn An',
        paymentMethod: 'Chuyển khoản',
        status: 'Chờ xác nhận',
    },
]

// Define column definitions for DataTable
const columns: ColumnDef<(typeof mockAppointments)[0]>[] = [
    {
        accessorKey: 'id',
        header: 'Booking ID',
        size: 100,
    },
    {
        accessorKey: 'pid',
        header: 'PID',
        size: 120,
    },
    {
        accessorKey: 'name',
        header: 'Họ tên',
        size: 150,
    },
    {
        accessorKey: 'gender',
        header: 'Giới tính',
        size: 100,
    },
    {
        accessorKey: 'birthDate',
        header: 'Ngày sinh',
        size: 120,
    },
    {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        size: 130,
    },
    {
        accessorKey: 'appointmentDate',
        header: 'Ngày khám',
        size: 120,
    },
    {
        accessorKey: 'appointmentTime',
        header: 'Giờ khám',
        size: 120,
    },
    {
        accessorKey: 'service',
        header: 'Dịch vụ',
        size: 150,
    },
    {
        accessorKey: 'doctor',
        header: 'Bác sĩ',
        size: 150,
    },
    {
        accessorKey: 'paymentMethod',
        header: 'H.thức thanh toán',
        size: 140,
    },
    {
        accessorKey: 'status',
        header: 'Trạng thái',
        size: 120,
        cell: ({ getValue }) => {
            const status = getValue() as string
            return (
                <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                        status === 'Đã gửi kết quả'
                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : status === 'Đã xác nhận'
                              ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}
                >
                    {status}
                </Badge>
            )
        },
    },
]

// Filter options
const statusOptions = [
    { id: 'all', name: 'Tất cả' },
    { id: 'Đã gửi kết quả', name: 'Đã gửi kết quả' },
    { id: 'Đã xác nhận', name: 'Đã xác nhận' },
    { id: 'Chờ xác nhận', name: 'Chờ xác nhận' },
]

const serviceOptions = [
    { id: 'all', name: 'Tất cả' },
    { id: 'Khám bệnh từ xa', name: 'Khám bệnh từ xa' },
    { id: 'Tư vấn từ xa', name: 'Tư vấn từ xa' },
]

// Helper functions to convert between DD/MM/YYYY and YYYY-MM-DD formats
const convertToISO = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('/')
    if (parts.length !== 3) return ''
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const convertFromISO = (isoStr: string) => {
    if (!isoStr) return ''
    const parts = isoStr.split('-')
    if (parts.length !== 3) return ''
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
}

export default function AppointmentsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [fromDate, setFromDate] = useState('13/01/2022')
    const [toDate, setToDate] = useState('14/01/2022')
    const [statusFilter, setStatusFilter] = useState('all')
    const [serviceFilter, setServiceFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const filteredAppointments = useMemo(() => {
        return mockAppointments.filter(appointment => {
            const matchesSearch =
                appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                appointment.pid.includes(searchTerm) ||
                appointment.id.toString().includes(searchTerm)
            const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
            const matchesService = serviceFilter === 'all' || appointment.service === serviceFilter

            return matchesSearch && matchesStatus && matchesService
        })
    }, [searchTerm, statusFilter, serviceFilter])

    const totalPages = Math.ceil(filteredAppointments.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + pageSize)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Danh sách đặt khám/thành công</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý và theo dõi các cuộc hẹn khám bệnh</p>
                </div>
                <Button
                    variant="outline"
                    className="flex items-center space-x-2 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-800"
                >
                    <Download className="w-4 h-4" />
                    <span>Export dữ liệu</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Filters */}
                <div className="p-6 border-b border-border bg-muted">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <BsSearchField
                                placeholder="Tìm theo ID, PID, tên khách hàng"
                                value={searchTerm}
                                onChange={setSearchTerm}
                                className="w-full"
                            />
                        </div>

                        {/* Date Range */}
                        <BsDateRangePicker
                            value={{ start: convertToISO(fromDate), end: convertToISO(toDate) }}
                            onChange={value => {
                                setFromDate(convertFromISO(value.start))
                                setToDate(convertFromISO(value.end))
                            }}
                            className="w-full"
                        />

                        {/* Status Filter */}
                        <div>
                            <BsSelect
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={statusOptions}
                                placeholder="Trạng thái"
                                className="w-full"
                            />
                        </div>

                        {/* Service Filter */}
                        <div>
                            <BsSelect
                                value={serviceFilter}
                                onChange={setServiceFilter}
                                options={serviceOptions}
                                placeholder="Dịch vụ"
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="p-6">
                    <DataTable data={paginatedAppointments} columns={columns} containerClassName="min-h-[400px]" />
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Hiển thị {startIndex + 1} đến {Math.min(startIndex + pageSize, filteredAppointments.length)}{' '}
                        trong {filteredAppointments.length} kết quả
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Hiển thị:</span>
                            <BsSelect
                                value={pageSize}
                                onChange={setPageSize}
                                options={[
                                    { id: 5, name: '5' },
                                    { id: 10, name: '10' },
                                    { id: 20, name: '20' },
                                    { id: 50, name: '50' },
                                ]}
                                className="w-20"
                            />
                        </div>
                        <Pagination value={currentPage} onChange={setCurrentPage} pageCount={totalPages} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
                Copyright © 2025 Sepolia. All rights reserved.
            </div>
        </div>
    )
}
