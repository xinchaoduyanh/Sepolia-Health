'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { usePatients } from '@/shared/hooks'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { PatientActionDialog } from '@/components/PatientActionDialog'

// Skeleton table component for loading state
const SkeletonTable = ({ columns }: { columns: any[] }) => {
    return (
        <div className="relative grid bg-background-secondary rounded-md overflow-hidden border min-h-[400px] [&_tbody_tr]:h-12">
            <div className="w-full overflow-x-auto">
                <table className="group w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                                    style={{
                                        minWidth: col.size || 180,
                                        maxWidth: col.size || 180,
                                    }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {[...Array(7)].map((_, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                            >
                                {columns.map((col, colIdx) => (
                                    <td
                                        key={colIdx}
                                        className="h-12 p-4 align-middle [&:has([role=checkbox])]:pr-0"
                                        style={{
                                            minWidth: col.size || 180,
                                            maxWidth: col.size || 180,
                                        }}
                                    >
                                        {col.accessorKey === 'id' && <Skeleton className="h-4 w-16" />}
                                        {col.accessorKey === 'patientProfiles' && (
                                            <div className="flex items-center space-x-3">
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        )}
                                        {col.accessorKey === 'email' && <Skeleton className="h-4 w-40" />}
                                        {col.accessorKey === 'phone' && <Skeleton className="h-4 w-24" />}
                                        {col.id === 'patientProfileInfo' && (
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        )}
                                        {col.accessorKey === 'patientProfilesCount' && <Skeleton className="h-4 w-8" />}
                                        {col.accessorKey === 'status' && <Skeleton className="h-5 w-24" />}
                                        {col.accessorKey === 'createdAt' && <Skeleton className="h-4 w-24" />}
                                        {col.id === 'actions' && (
                                            <div className="flex items-center space-x-1">
                                                <Skeleton className="h-8 w-8" />
                                                <Skeleton className="h-8 w-8" />
                                            </div>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// Action cell component to handle hooks properly
function ActionCell({ patient }: { patient: any }) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <div className="flex items-center justify-center space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => (window.location.href = `/admin/customer-management/${patient.id}`)}
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => setDialogOpen(true)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <PatientActionDialog patient={patient} open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
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
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                {selfProfile.fullName
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{selfProfile.fullName}</span>
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
        id: 'patientProfilesCount',
        header: 'Số hồ sơ',
        size: 100,
        cell: ({ row }: { row: any }) => {
            const patientProfiles = row.original.patientProfiles || []
            return (
                <div className="flex items-center justify-center">
                    <span className="text-sm font-medium">{patientProfiles.length}</span>
                </div>
            )
        },
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
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string | undefined>(undefined)
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

        if (debouncedSearchTerm !== undefined) {
            params.search = debouncedSearchTerm
        }

        if (statusFilter) {
            params.status = statusFilter
        }

        return params
    }, [currentPage, debouncedSearchTerm, statusFilter])
    const isQueryReady = debouncedSearchTerm !== undefined
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
    const { data: patientsResponse, isLoading } = usePatients(queryParams, isQueryReady)

    const patients = patientsResponse?.patients || []
    const totalPages = Math.ceil((patientsResponse?.total || 0) / itemsPerPage)

    // Show skeleton when loading or query not ready
    const showSkeleton = isLoading || !isQueryReady

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
                    onClick={() => (window.location.href = '/admin/customer-management/create')}
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
                                className="px-3 py-2 bg-background text-foreground border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    {showSkeleton ? (
                        <SkeletonTable columns={columns} />
                    ) : (
                        <DataTable
                            data={patients}
                            columns={columns}
                            containerClassName="min-h-[400px] [&_tbody_tr]:h-12"
                        />
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, patientsResponse?.total || 0)} trong tổng số{' '}
                        {patientsResponse?.total || 0} khách hàng
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
