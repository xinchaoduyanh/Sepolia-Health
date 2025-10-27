'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useDoctors, useDeleteDoctor } from '@/shared/hooks'

// Action cell component
function ActionCell({ doctor }: { doctor: any }) {
    const deleteDoctor = useDeleteDoctor()

    const handleDelete = () => {
        if (confirm('Bạn có chắc chắn muốn xóa bác sĩ này?')) {
            deleteDoctor.mutate(doctor.id)
        }
    }

    return (
        <div className="flex items-center justify-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => (window.location.href = `/dashboard/doctor-management/${doctor.id}`)}
            >
                <Eye className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

const columns: any[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="font-medium text-primary text-sm">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'fullName',
        header: 'Họ và tên',
        cell: ({ getValue, row }: { getValue: () => any; row: any }) => {
            const fullName = getValue() as string
            return (
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                            {fullName
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{fullName}</span>
                </div>
            )
        },
    },
    {
        accessorKey: 'email',
        header: 'Email',
        size: 250,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm">{getValue() || 'Chưa có'}</span>
        ),
    },
    {
        accessorKey: 'specialty',
        header: 'Chuyên khoa',
        cell: ({ getValue }: { getValue: () => any }) => (
            <Badge variant="outline" className="text-foreground">
                {getValue() as string}
            </Badge>
        ),
    },
    {
        accessorKey: 'experienceYears',
        header: 'Kinh nghiệm',
        size: 120,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm">{getValue()} năm</span>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ getValue }: { getValue: () => any }) => {
            const status = getValue() as string
            const statusColors = {
                ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                DEACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            }
            const statusText = {
                ACTIVE: 'Hoạt động',
                INACTIVE: 'Không hoạt động',
                DEACTIVE: 'Tạm khóa',
            }
            return (
                <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                    {statusText[status as keyof typeof statusText] || status}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Ngày tạo',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm">
                {typeof window !== 'undefined'
                    ? new Date(getValue() as string).toLocaleDateString('vi-VN')
                    : (getValue() as string)}
            </span>
        ),
    },
    {
        id: 'actions',
        header: 'Thao tác',
        size: 100,
        cell: ({ row }: { row: any }) => {
            const doctor = row.original
            return <ActionCell doctor={doctor} />
        },
    },
]

export default function DoctorListPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string | undefined>(undefined)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
        }

        if (debouncedSearchTerm !== undefined) {
            params.search = debouncedSearchTerm
        }

        return params
    }, [currentPage, debouncedSearchTerm])

    const isQueryReady = debouncedSearchTerm !== undefined

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value)
    }, [])

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Fetch doctors data
    const { data: doctorsResponse, isLoading, error } = useDoctors(queryParams, isQueryReady)

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách bác sĩ</h1>
                        <p className="text-sm text-muted-foreground mt-1">Đang tải dữ liệu...</p>
                    </div>
                </div>
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-muted-foreground">Đang tải...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách bác sĩ</h1>
                        <p className="text-sm text-muted-foreground mt-1">Có lỗi xảy ra khi tải dữ liệu</p>
                    </div>
                </div>
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-red-500">Lỗi: {error.message}</div>
                    </div>
                </div>
            </div>
        )
    }

    const doctors = doctorsResponse?.data?.doctors || []
    const totalPages = Math.ceil((doctorsResponse?.data?.total || 0) / itemsPerPage)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách bác sĩ</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin bác sĩ trong hệ thống</p>
                </div>
                <Button
                    className="flex items-center space-x-2"
                    onClick={() => (window.location.href = '/dashboard/doctor-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm bác sĩ mới</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search Bar */}
                <div className="p-6 border-b border-border">
                    <div className="max-w-md">
                        <BsSearchField
                            placeholder="Tìm theo tên, email hoặc ID"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="p-6">
                    <DataTable data={doctors} columns={columns} containerClassName="min-h-[400px]" />
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, doctorsResponse?.data?.total || 0)} trong tổng số{' '}
                        {doctorsResponse?.data?.total || 0} bác sĩ
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
