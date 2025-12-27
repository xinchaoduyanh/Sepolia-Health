'use client'

import { useDeleteTag, useTags } from '@/shared/hooks'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { DataTable } from '@workspace/ui/components/DataTable'
import { Pagination } from '@workspace/ui/components/Pagination'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Eye, Plus, Trash2 } from 'lucide-react'
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
                onClick={() => (window.location.href = `/admin/tag-management/${tag.id}`)}
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
            <div className="flex items-center">
                <span className="font-semibold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    #{getValue() as string}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'name',
        header: 'Tên tag',
        size: 220,
        cell: ({ getValue }: { getValue: () => any }) => {
            const name = getValue() as string
            // Generate a consistent color based on tag name
            const colors = [
                'from-pink-500 to-rose-500',
                'from-purple-500 to-indigo-500',
                'from-blue-500 to-cyan-500',
                'from-green-500 to-emerald-500',
                'from-yellow-500 to-orange-500',
                'from-red-500 to-pink-500',
            ]
            const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length

            return (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors[colorIndex]}`} />
                    <Badge
                        variant="outline"
                        className={`bg-gradient-to-r ${colors[colorIndex]} text-white border-0 font-medium shadow-sm hover:shadow-md transition-shadow`}
                    >
                        {name}
                    </Badge>
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
            return (
                <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700">
                    {slug}
                </code>
            )
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
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                        {description || <span className="italic text-slate-400">Không có mô tả</span>}
                    </p>
                </div>
            )
        },
    },
    {
        accessorKey: 'usageCount',
        header: 'Số lần sử dụng',
        size: 140,
        cell: ({ getValue }: { getValue: () => any }) => {
            const count = getValue() as number
            const getCountColor = (count: number) => {
                if (count >= 50) return 'from-green-500 to-emerald-500'
                if (count >= 20) return 'from-blue-500 to-cyan-500'
                if (count >= 10) return 'from-yellow-500 to-orange-500'
                return 'from-slate-400 to-slate-500'
            }

            return (
                <div className="flex items-center gap-2">
                    <div
                        className={`px-3 py-1 rounded-full bg-gradient-to-r ${getCountColor(count)} text-white text-xs font-semibold shadow-sm`}
                    >
                        {count} lần
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Ngày tạo',
        size: 120,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm font-medium">
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Quản lý danh sách tags
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        <span className="inline-block w-1 h-1 rounded-full bg-cyan-500"></span>
                        Quản lý và phân loại nội dung với tags
                    </p>
                </div>
                <Button
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200"
                    onClick={() => (window.location.href = '/admin/tag-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm tag mới</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="relative bg-card rounded-xl shadow-xl border border-border overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

                {/* Search and Filters Bar */}
                <div className="p-6 border-b border-border bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <BsSearchField
                                placeholder="🔍 Tìm theo tên hoặc slug..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="font-medium">{tagsResponse?.total || 0} tags</span>
                            </div>
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
                <div className="px-6 py-4 border-t border-border bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/50 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground font-medium">
                        Hiển thị{' '}
                        <span className="text-foreground font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                        đến{' '}
                        <span className="text-foreground font-semibold">
                            {Math.min(currentPage * itemsPerPage, tagsResponse?.total || 0)}
                        </span>{' '}
                        trong tổng số <span className="text-foreground font-semibold">{tagsResponse?.total || 0}</span>{' '}
                        tags
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
