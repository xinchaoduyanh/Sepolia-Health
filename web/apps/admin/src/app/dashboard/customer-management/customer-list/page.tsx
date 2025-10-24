'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { usePatients, useDeletePatient } from '@/shared/hooks'

// Action cell component to handle hooks properly
function ActionCell({ patient }: { patient: any }) {
    const deletePatient = useDeletePatient()

    const handleDelete = () => {
        if (confirm('Bạn có chắc chắn muốn xóa bệnh nhân này?')) {
            deletePatient.mutate(patient.id)
        }
    }

    return (
        <div className="flex items-center justify-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => (window.location.href = `/dashboard/customer-management/${patient.id}`)}
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
        accessorKey: 'patientProfiles',
        header: 'Họ và tên',
        cell: ({ getValue }: { getValue: () => any }) => {
            const profiles = getValue() as any[]
            const selfProfile = profiles?.find((profile: any) => profile.relationship === 'SELF')

            if (selfProfile) {
                return (
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                                {selfProfile.fullName
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{selfProfile.fullName}</span>
                    </div>
                )
            }
            return <span className="text-muted-foreground">Chưa có hồ sơ</span>
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
        id: 'patientProfileInfo',
        header: 'Thông tin hồ sơ',
        cell: ({ row }: { row: any }) => {
            const patientProfiles = row.original.patientProfiles || []
            const selfProfile = patientProfiles.find((profile: any) => profile.relationship === 'SELF')

            if (selfProfile) {
                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium">
                            {selfProfile.gender === 'MALE' ? 'Nam' : selfProfile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {typeof window !== 'undefined'
                                ? new Date(selfProfile.dateOfBirth).toLocaleDateString('vi-VN')
                                : selfProfile.dateOfBirth}
                        </div>
                        <div className="text-xs text-muted-foreground">{selfProfile.address || 'Chưa có địa chỉ'}</div>
                    </div>
                )
            }
            return <span className="text-muted-foreground">Chưa có</span>
        },
    },
    {
        accessorKey: 'patientProfiles',
        header: 'Số hồ sơ',
        size: 100,
        cell: ({ getValue }: { getValue: () => any }) => (
            <div className="flex items-center justify-center">
                <span className="text-sm font-medium">{(getValue() as any[])?.length || 0}</span>
            </div>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ getValue }: { getValue: () => any }) => {
            const status = getValue() as string
            const statusColors = {
                ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                DEACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                UNVERIFIED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            }
            const statusText = {
                ACTIVE: 'Hoạt động',
                DEACTIVE: 'Tạm khóa',
                UNVERIFIED: 'Chưa xác thực',
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
        size: 80,
        cell: ({ row }: { row: any }) => {
            const patient = row.original
            return <ActionCell patient={patient} />
        },
    },
]

export default function CustomerListPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE' | ''>('')
    const itemsPerPage = 10

    // Debug: Track component renders
    console.log('🔄 CustomerListPage rendered')

    // Debounce search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500) // 500ms delay

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Build query parameters - memoize to prevent unnecessary re-renders
    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
        }

        if (debouncedSearchTerm) {
            params.search = debouncedSearchTerm
        }

        if (statusFilter) {
            params.status = statusFilter
        }

        return params
    }, [currentPage, debouncedSearchTerm, statusFilter])

    // Memoize handlers to prevent re-renders
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value)
    }, [])

    const handleStatusFilterChange = useCallback((value: string) => {
        setStatusFilter(value as any)
    }, [])

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Fetch patients data
    const { data: patientsResponse, isLoading, error } = usePatients(queryParams)

    // Debug log to track API calls - only log when params change
    useEffect(() => {
        console.log('🔍 CustomerListPage - Query params changed:', queryParams)
        console.log('🔍 CustomerListPage - Loading:', isLoading)
        console.log('🔍 CustomerListPage - Error:', error)
        console.log('🔍 CustomerListPage - Data:', patientsResponse)
    }, [queryParams, isLoading, error, patientsResponse])

    // Handle loading and error states
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách khách hàng</h1>
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
                        <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách khách hàng</h1>
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

    const patients = patientsResponse?.data?.patients || []
    const totalPages = Math.ceil((patientsResponse?.data?.total || 0) / itemsPerPage)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách khách hàng</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin khách hàng trong hệ thống</p>
                </div>
                <Button
                    className="flex items-center space-x-2"
                    onClick={() => (window.location.href = '/dashboard/customer-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm khách hàng mới</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search and Filter Bar */}
                <div className="p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="max-w-md">
                            <BsSearchField
                                placeholder="Tìm theo tên, email, ID hoặc số điện thoại"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={e => handleStatusFilterChange(e.target.value)}
                                className="px-3 py-2 border border-border rounded-md text-sm"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="DEACTIVE">Tạm khóa</option>
                                <option value="UNVERIFIED">Chưa xác thực</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="p-6">
                    <DataTable data={patients} columns={columns} containerClassName="min-h-[400px]" />
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, patientsResponse?.data?.total || 0)} trong tổng số{' '}
                        {patientsResponse?.data?.total || 0} khách hàng
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
