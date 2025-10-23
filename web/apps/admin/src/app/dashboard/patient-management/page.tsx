'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Eye, Plus, MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/DropdownMenu'
import { usePatients, useDeletePatient, useUpdatePatientStatus } from '@/shared/hooks'

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
        id: 'patientProfile',
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
            const deletePatient = useDeletePatient()
            const updateStatus = useUpdatePatientStatus()

            const handleStatusChange = (newStatus: 'ACTIVE' | 'DEACTIVE' | 'UNVERIFIED') => {
                updateStatus.mutate({ id: patient.id, status: newStatus })
            }

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
                        onClick={() => (window.location.href = `/dashboard/patient-management/${patient.id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <button onClick={() => handleStatusChange('ACTIVE')} className="w-full text-left">
                                    Kích hoạt
                                </button>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <button onClick={() => handleStatusChange('DEACTIVE')} className="w-full text-left">
                                    Tạm khóa
                                </button>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <button onClick={() => handleStatusChange('UNVERIFIED')} className="w-full text-left">
                                    Chưa xác thực
                                </button>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <button onClick={handleDelete} className="w-full text-left text-red-600">
                                    Xóa
                                </button>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]

export default function PatientListPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE' | ''>('')
    const itemsPerPage = 10

    // Build query parameters
    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
        }

        if (searchTerm) {
            params.search = searchTerm
        }

        if (statusFilter) {
            params.status = statusFilter
        }

        return params
    }, [currentPage, searchTerm, statusFilter])

    // Fetch patients data
    const { data: patientsResponse, isLoading, error } = usePatients(queryParams)

    // Handle loading and error states
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Quản lý bệnh nhân</h1>
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
                        <h1 className="text-3xl font-bold text-foreground">Quản lý bệnh nhân</h1>
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
                    <h1 className="text-3xl font-bold text-foreground">Quản lý bệnh nhân</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin bệnh nhân trong hệ thống</p>
                </div>
                <Button
                    className="flex items-center space-x-2"
                    onClick={() => (window.location.href = '/dashboard/patient-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm bệnh nhân mới</span>
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
                                onChange={setSearchTerm}
                                className="w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
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
                        {patientsResponse?.data?.total || 0} bệnh nhân
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={setCurrentPage} />
                </div>
            </div>
        </div>
    )
}
