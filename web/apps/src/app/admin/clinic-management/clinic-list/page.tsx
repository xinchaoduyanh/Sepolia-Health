'use client'

import { useClinics, useDeleteClinic, useUpdateClinic } from '@/shared/hooks'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { DataTable } from '@workspace/ui/components/DataTable'
import { Pagination } from '@workspace/ui/components/Pagination'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Eye, Lock, LockOpen, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
// Skeleton table component for loading state
const SkeletonTable = ({ columns }: { columns: any[] }) => {
    return (
        <div className="relative grid bg-background-secondary rounded-md overflow-hidden border min-h-[400px]">
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
                                        className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                                        style={{
                                            minWidth: col.size || 180,
                                            maxWidth: col.size || 180,
                                        }}
                                    >
                                        {col.accessorKey === 'id' && <Skeleton className="h-4 w-16" />}
                                        {col.accessorKey === 'name' && <Skeleton className="h-4 w-32" />}
                                        {col.accessorKey === 'address' && <Skeleton className="h-4 w-40" />}
                                        {col.accessorKey === 'phone' && <Skeleton className="h-4 w-24" />}
                                        {col.accessorKey === 'email' && <Skeleton className="h-4 w-32" />}
                                        {col.accessorKey === 'isActive' && <Skeleton className="h-5 w-20" />}
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

// Action cell component
function ActionCell({ clinic }: { clinic: any }) {
    const deleteClinic = useDeleteClinic()
    const updateClinic = useUpdateClinic()

    const router = useRouter()

    const handleDelete = () => {
        confirm({
            title: 'Xóa phòng khám',
            description: `Bạn có chắc chắn muốn xóa phòng khám "${clinic.name}"? Hành động này không thể hoàn tác.`,
            variant: 'destructive',
            action: {
                label: 'Xóa',
                onClick: () => deleteClinic.mutate(clinic.id),
            },
            cancel: {
                label: 'Hủy',
                onClick: () => {},
            },
        })
    }

    const handleToggleActive = () => {
        const newStatus = !clinic.isActive
        const isActivating = newStatus

        confirm({
            title: isActivating ? 'Kích hoạt phòng khám' : 'Tạm ngừng phòng khám',
            description: isActivating
                ? `Bạn có chắc chắn muốn kích hoạt phòng khám "${clinic.name}"?`
                : `Bạn có chắc chắn muốn tạm ngừng hoạt động phòng khám "${clinic.name}"?`,
            variant: isActivating ? 'default' : 'destructive',
            action: {
                label: isActivating ? 'Kích hoạt' : 'Tạm ngừng',
                onClick: () =>
                    updateClinic.mutate({
                        id: clinic.id,
                        data: { isActive: newStatus },
                    }),
            },
            cancel: {
                label: 'Hủy',
                onClick: () => {},
            },
        })
    }

    const isUpdating = updateClinic.isPending

    return (
        <div className="flex items-center justify-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => router.push(`/admin/clinic-management/${clinic.id}`)}
            >
                <Eye className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${
                    clinic.isActive
                        ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950'
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950'
                }`}
                onClick={handleToggleActive}
                isDisabled={isUpdating}
            >
                {isUpdating ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : clinic.isActive ? (
                    <LockOpen className="h-4 w-4" />
                ) : (
                    <Lock className="h-4 w-4" />
                )}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
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
        accessorKey: 'name',
        header: 'Tên phòng khám',
        cell: ({ getValue }: { getValue: () => any }) => {
            const name = getValue() as string
            return (
                <div className="max-w-xs">
                    <span className="font-medium text-foreground text-sm">{name}</span>
                </div>
            )
        },
    },
    {
        accessorKey: 'address',
        header: 'Địa chỉ',
        size: 300,
        cell: ({ getValue }: { getValue: () => any }) => {
            const address = getValue() as string
            return (
                <div className="max-w-sm">
                    <span className="text-muted-foreground text-sm line-clamp-2">{address}</span>
                </div>
            )
        },
    },
    {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        size: 130,
        cell: ({ getValue }: { getValue: () => any }) => {
            const phone = getValue() as string
            return <span className="text-muted-foreground text-sm">{phone || 'Chưa có'}</span>
        },
    },
    {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
        cell: ({ getValue }: { getValue: () => any }) => {
            const email = getValue() as string
            return <span className="text-muted-foreground text-sm">{email || 'Chưa có'}</span>
        },
    },
    {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        size: 120,
        cell: ({ getValue }: { getValue: () => any }) => {
            const isActive = getValue() as boolean
            return (
                <Badge
                    className={
                        isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }
                >
                    {isActive ? 'Hoạt động' : 'Tạm ngừng'}
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
            const clinic = row.original
            return <ActionCell clinic={clinic} />
        },
    },
]

export default function ClinicListPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('')
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

        if (debouncedSearchTerm) {
            params.search = debouncedSearchTerm
        }

        return params
    }, [currentPage, debouncedSearchTerm])

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value)
    }, [])

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Fetch clinics data
    const { data: clinicsResponse, isLoading } = useClinics(queryParams, true)

    const clinics = clinicsResponse?.clinics || []
    const totalPages = Math.ceil((clinicsResponse?.total || 0) / itemsPerPage)

    // Loading state - only for initial data
    const isInitialLoading = isLoading

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách phòng khám</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin phòng khám trong hệ thống</p>
                </div>
                <Button
                    className="flex items-center space-x-2"
                    onClick={() => router.push('/admin/clinic-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm phòng khám mới</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search and Filters Bar */}
                <div className="p-6 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <BsSearchField
                                placeholder="Tìm theo tên hoặc địa chỉ"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="p-6">
                    {isInitialLoading ? (
                        <SkeletonTable columns={columns} />
                    ) : (
                        <DataTable data={clinics} columns={columns} containerClassName="min-h-[400px]" />
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, clinicsResponse?.total || 0)} trong tổng số{' '}
                        {clinicsResponse?.total || 0} phòng khám
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
