'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useTags, useDeleteTag } from '@/shared/hooks'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Badge } from '@workspace/ui/components/Badge'

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
                                        {col.accessorKey === 'slug' && <Skeleton className="h-4 w-24" />}
                                        {col.accessorKey === 'description' && <Skeleton className="h-4 w-40" />}
                                        {col.accessorKey === 'usageCount' && <Skeleton className="h-4 w-16" />}
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
function ActionCell({ tag }: { tag: any }) {
    const deleteTag = useDeleteTag()

    const handleDelete = () => {
        if (confirm('Bạn có chắc chắn muốn xóa tag này?')) {
            deleteTag.mutate(tag.id)
        }
    }

    return (
        <div className="flex items-center justify-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => (window.location.href = `/dashboard/admin/tag-management/${tag.id}`)}
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
        accessorKey: 'name',
        header: 'Tên tag',
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
        accessorKey: 'slug',
        header: 'Slug',
        size: 200,
        cell: ({ getValue }: { getValue: () => any }) => {
            const slug = getValue() as string
            return <span className="text-muted-foreground text-sm font-mono">{slug}</span>
        },
    },
    {
        accessorKey: 'description',
        header: 'Mô tả',
        size: 300,
        cell: ({ getValue }: { getValue: () => any }) => {
            const description = getValue() as string
            return (
                <div className="max-w-sm">
                    <span className="text-muted-foreground text-sm line-clamp-2">
                        {description || 'Không có mô tả'}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: 'usageCount',
        header: 'Số lần sử dụng',
        size: 120,
        cell: ({ getValue }: { getValue: () => any }) => {
            const count = getValue() as number
            return (
                <Badge variant="secondary" className="font-medium">
                    {count}
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
            const tag = row.original
            return <ActionCell tag={tag} />
        },
    },
]

export default function TagListPage() {
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

    // Fetch tags data
    const { data: tagsResponse, isLoading } = useTags(queryParams, true)

    const tags = tagsResponse?.tags || []
    const totalPages = Math.ceil((tagsResponse?.total || 0) / itemsPerPage)

    // Loading state - only for initial data
    const isInitialLoading = isLoading

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách tags</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin tags trong hệ thống</p>
                </div>
                <Button
                    className="flex items-center space-x-2"
                    onClick={() => (window.location.href = '/dashboard/admin/tag-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm tag mới</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search and Filters Bar */}
                <div className="p-6 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <BsSearchField
                                placeholder="Tìm theo tên hoặc slug"
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
                        <DataTable data={tags} columns={columns} containerClassName="min-h-[400px]" />
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, tagsResponse?.total || 0)} trong tổng số{' '}
                        {tagsResponse?.total || 0} tags
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
