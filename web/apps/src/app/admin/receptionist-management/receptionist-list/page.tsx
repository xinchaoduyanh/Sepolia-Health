'use client'

import { ReceptionistActionDialog } from '@/components/ReceptionistActionDialog'
import { useReceptionists } from '@/shared/hooks'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { DataTable } from '@workspace/ui/components/DataTable'
import { Pagination } from '@workspace/ui/components/Pagination'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Eye, MoreHorizontal, Plus } from 'lucide-react'
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
                                        {col.accessorKey === 'fullName' && (
                                            <div className="flex items-center space-x-3">
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        )}
                                        {col.accessorKey === 'email' && <Skeleton className="h-4 w-40" />}
                                        {col.accessorKey === 'phone' && <Skeleton className="h-4 w-24" />}
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
function ActionCell({ receptionist }: { receptionist: any }) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <div className="flex items-center justify-center space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => (window.location.href = `/admin/receptionist-management/${receptionist.id}`)}
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDialogOpen(true)}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
            <ReceptionistActionDialog receptionist={receptionist} open={dialogOpen} onOpenChange={setDialogOpen} />
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
        accessorKey: 'fullName',
        header: 'Họ và tên',
        cell: ({ row }: { row: any }) => {
            const receptionist = row.original
            const fullName = receptionist.fullName
            const avatarUrl = receptionist.avatar
            return (
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
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
            const receptionist = row.original
            return <ActionCell receptionist={receptionist} />
        },
    },
]

export default function ReceptionistListPage() {
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

    // Fetch receptionists data
    const { data: receptionistsResponse, isLoading } = useReceptionists(queryParams, isQueryReady)

    const receptionists = receptionistsResponse?.receptionists || []
    const totalPages = Math.ceil((receptionistsResponse?.total || 0) / itemsPerPage)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách lễ tân</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin lễ tân trong hệ thống</p>
                </div>
                <Button
                    className="flex items-center space-x-2"
                    onClick={() => (window.location.href = '/admin/receptionist-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm lễ tân mới</span>
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
                    {isLoading ? (
                        <SkeletonTable columns={columns} />
                    ) : (
                        <DataTable data={receptionists} columns={columns} containerClassName="min-h-[400px]" />
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, receptionistsResponse?.total || 0)} trong tổng số{' '}
                        {receptionistsResponse?.total || 0} lễ tân
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
