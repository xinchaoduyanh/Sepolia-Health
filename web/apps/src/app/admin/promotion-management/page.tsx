'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Eye, Plus, Trash2, Settings, QrCode } from 'lucide-react'
import { usePromotions, useDeletePromotion } from '@/shared/hooks'
import { Skeleton } from '@workspace/ui/components/Skeleton'

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
                                        <Skeleton className="h-4 w-24" />
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
function ActionCell({ promotion }: { promotion: any }) {
    const deletePromotion = useDeletePromotion()

    const handleDelete = () => {
        if (confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) {
            deletePromotion.mutate(promotion.id)
        }
    }

    return (
        <div className="flex items-center justify-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => (window.location.href = `/admin/promotion-management/${promotion.id}`)}
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
        accessorKey: 'title',
        header: 'Tiêu đề',
        cell: ({ getValue }: { getValue: () => any }) => {
            const title = getValue() as string
            return (
                <div className="max-w-xs">
                    <span className="font-medium text-foreground text-sm line-clamp-2">{title}</span>
                </div>
            )
        },
    },
    {
        accessorKey: 'code',
        header: 'Mã voucher',
        size: 150,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="font-mono text-sm text-foreground">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'discountPercent',
        header: 'Giảm giá (%)',
        size: 120,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-sm text-foreground">{getValue() as number}%</span>
        ),
    },
    {
        accessorKey: 'maxDiscountAmount',
        header: 'Giảm tối đa (VND)',
        size: 150,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-sm text-foreground">
                {new Intl.NumberFormat('vi-VN').format(getValue() as number)}
            </span>
        ),
    },
    {
        accessorKey: 'validFrom',
        header: 'Ngày bắt đầu',
        size: 150,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm">
                {typeof window !== 'undefined'
                    ? new Date(getValue() as string).toLocaleDateString('vi-VN')
                    : (getValue() as string)}
            </span>
        ),
    },
    {
        accessorKey: 'validTo',
        header: 'Ngày kết thúc',
        size: 150,
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
            const promotion = row.original
            return <ActionCell promotion={promotion} />
        },
    },
]

export default function PromotionManagementPage() {
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

    // Fetch promotions data
    const { data: promotionsResponse, isLoading } = usePromotions(queryParams, true)

    const promotions = promotionsResponse?.promotions || []
    const totalPages = Math.ceil((promotionsResponse?.total || 0) / itemsPerPage)

    // Loading state - only for initial data
    const isInitialLoading = isLoading

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý chương trình khuyến mãi</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý vouchers và cấu hình hiển thị</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="flex items-center space-x-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                        onClick={() => (window.location.href = '/admin/promotion-management/qr-settings')}
                    >
                        <QrCode className="h-4 w-4" />
                        <span>Mã QR Live</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex items-center space-x-2"
                        onClick={() => (window.location.href = '/admin/promotion-display-management')}
                    >
                        <Settings className="h-4 w-4" />
                        <span>Quản lý hiển thị</span>
                    </Button>
                    <Button
                        className="flex items-center space-x-2"
                        onClick={() => (window.location.href = '/admin/promotion-management/create')}
                    >
                        <Plus className="h-4 w-4" />
                        <span>Thêm voucher mới</span>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search and Filters Bar */}
                <div className="p-6 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <BsSearchField
                                placeholder="Tìm theo tiêu đề hoặc mã voucher"
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
                        <DataTable data={promotions} columns={columns} containerClassName="min-h-[400px]" />
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, promotionsResponse?.total || 0)} trong tổng số{' '}
                        {promotionsResponse?.total || 0} chương trình khuyến mãi
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
