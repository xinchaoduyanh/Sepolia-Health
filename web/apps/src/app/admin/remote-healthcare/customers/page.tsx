'use client'

import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'

// Mock data for customers
const mockCustomers = [
    {
        id: 1,
        pid: '209834734',
        name: 'Tán Nguyên Bảo',
        gender: 'Nữ',
        birthDate: '14/12/1989',
        phone: '0908260136',
        lastExamination: '14/01/2022',
    },
    {
        id: 2,
        pid: '',
        name: 'Nguyễn Văn A',
        gender: 'Nam',
        birthDate: '15/01/1990',
        phone: '0908260137',
        lastExamination: '13/01/2022',
    },
    {
        id: 3,
        pid: '209834736',
        name: 'Lê Thị B',
        gender: 'Nữ',
        birthDate: '16/02/1985',
        phone: '0908260138',
        lastExamination: '12/01/2022',
    },
    {
        id: 4,
        pid: '209834737',
        name: 'Phạm Văn C',
        gender: 'Nam',
        birthDate: '17/03/1992',
        phone: '0908260139',
        lastExamination: '11/01/2022',
    },
    {
        id: 5,
        pid: '',
        name: 'Hoàng Thị D',
        gender: 'Nữ',
        birthDate: '18/04/1988',
        phone: '0908260140',
        lastExamination: '10/01/2022',
    },
    {
        id: 6,
        pid: '209834739',
        name: 'Trần Văn E',
        gender: 'Nam',
        birthDate: '19/05/1991',
        phone: '0908260141',
        lastExamination: '09/01/2022',
    },
    {
        id: 7,
        pid: '209834740',
        name: 'Nguyễn Thị F',
        gender: 'Nữ',
        birthDate: '20/06/1987',
        phone: '0908260142',
        lastExamination: '08/01/2022',
    },
    {
        id: 8,
        pid: '',
        name: 'Lê Văn G',
        gender: 'Nam',
        birthDate: '21/07/1993',
        phone: '0908260143',
        lastExamination: '07/01/2022',
    },
    {
        id: 9,
        pid: '209834742',
        name: 'Phạm Thị H',
        gender: 'Nữ',
        birthDate: '22/08/1986',
        phone: '0908260144',
        lastExamination: '06/01/2022',
    },
    {
        id: 10,
        pid: '209834743',
        name: 'Võ Văn I',
        gender: 'Nam',
        birthDate: '23/09/1984',
        phone: '0908260145',
        lastExamination: '05/01/2022',
    },
]

// Define column definitions for DataTable
const columns: ColumnDef<(typeof mockCustomers)[0]>[] = [
    {
        accessorKey: 'id',
        header: 'STT',
        size: 80,
        cell: ({ row }) => {
            return <span className="text-slate-600 dark:text-slate-400 font-medium">{row.index + 1}</span>
        },
    },
    {
        accessorKey: 'pid',
        header: 'PID',
        size: 120,
        cell: ({ getValue }) => {
            const pid = getValue() as string
            return <span className="text-slate-700 dark:text-slate-300">{pid || '-'}</span>
        },
    },
    {
        accessorKey: 'name',
        header: 'Họ tên',
        size: 180,
        cell: ({ getValue }) => {
            const name = getValue() as string
            return <span className="text-slate-900 dark:text-slate-100 font-medium">{name}</span>
        },
    },
    {
        accessorKey: 'gender',
        header: 'Giới tính',
        size: 100,
        cell: ({ getValue }) => {
            const gender = getValue() as string
            return <span className="text-slate-700 dark:text-slate-300">{gender}</span>
        },
    },
    {
        accessorKey: 'birthDate',
        header: 'Ngày sinh',
        size: 120,
        cell: ({ getValue }) => {
            const birthDate = getValue() as string
            return <span className="text-slate-700 dark:text-slate-300">{birthDate}</span>
        },
    },
    {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        size: 140,
        cell: ({ getValue }) => {
            const phone = getValue() as string
            return <span className="text-slate-700 dark:text-slate-300 font-mono">{phone}</span>
        },
    },
    {
        accessorKey: 'lastExamination',
        header: 'Khám gần nhất',
        size: 140,
        cell: ({ getValue }) => {
            const lastExamination = getValue() as string
            return <span className="text-slate-700 dark:text-slate-300">{lastExamination}</span>
        },
    },
]

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const filteredCustomers = useMemo(() => {
        return mockCustomers.filter(customer => {
            const matchesSearch =
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.pid.includes(searchTerm) ||
                customer.phone.includes(searchTerm)

            return matchesSearch
        })
    }, [searchTerm])

    const totalPages = Math.ceil(filteredCustomers.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Danh sách khách hàng</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin khách hàng</p>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="text-slate-500 dark:text-slate-500">Chăm sóc sức khỏe từ xa</span> &gt;{' '}
                <span className="text-slate-700 dark:text-slate-300">Danh sách khách hàng</span>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search Bar */}
                <div className="p-6 border-b border-border">
                    <div className="max-w-md">
                        <BsSearchField
                            placeholder="Tìm theo PID, tên khách hàng"
                            value={searchTerm}
                            onChange={setSearchTerm}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="p-6">
                    <DataTable data={paginatedCustomers} columns={columns} containerClassName="min-h-[400px]" />
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Hiển thị {startIndex + 1} đến {Math.min(startIndex + pageSize, filteredCustomers.length)} trong{' '}
                        {filteredCustomers.length} kết quả
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Hiển thị:</span>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(Number(e.target.value))}
                                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <Pagination value={currentPage} onChange={setCurrentPage} pageCount={totalPages} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
                Copyright © {new Date().getFullYear()} Sepolia. All rights reserved.
            </div>
        </div>
    )
}
