'use client'

import { DoctorActionDialog } from '@/components/DoctorActionDialog'
import { useClinicsDropdown, useDoctors, useServicesDropdown } from '@/shared/hooks'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { DataTable } from '@workspace/ui/components/DataTable'
import { Pagination } from '@workspace/ui/components/Pagination'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
                                        {col.accessorKey === 'services' && (
                                            <div className="flex gap-1">
                                                <Skeleton className="h-5 w-20" />
                                                <Skeleton className="h-5 w-24" />
                                            </div>
                                        )}
                                        {col.accessorKey === 'experienceYears' && <Skeleton className="h-4 w-16" />}
                                        {col.accessorKey === 'clinic' && <Skeleton className="h-4 w-40" />}
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

// Action cell component
function ActionCell({ doctor }: { doctor: any }) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <div className="flex items-center justify-center space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => (window.location.href = `/admin/doctor-management/${doctor.id}`)}
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
            <DoctorActionDialog doctor={doctor} open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
    )
}

const columns: any[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        size: 50,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="font-medium text-primary text-sm">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'fullName',
        header: 'Họ và tên',
        cell: ({ row }: { row: any }) => {
            const doctor = row.original
            const fullName = doctor.fullName
            const avatarUrl = doctor.doctorProfile?.avatar || doctor.avatar

            return (
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
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
        size: 160,
        cell: ({ getValue }: { getValue: () => any }) => (
            <div className="w-full max-w-[180px] truncate" title={getValue() as string}>
                <span className="text-muted-foreground text-sm">{getValue() as string}</span>
            </div>
        ),
    },
    {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        size: 110,
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm">{getValue() || 'Chưa có'}</span>
        ),
    },
    {
        accessorKey: 'services',
        header: 'Chuyên khoa',
        size: 280,
        cell: ({ getValue }: { getValue: () => any }) => {
            const services = getValue() as string[] | undefined
            if (!services || services.length === 0) {
                return <span className="text-muted-foreground text-sm">Chưa có</span>
            }
            return (
                <div className="flex flex-wrap gap-1">
                    {services.map((service: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {service}
                        </Badge>
                    ))}
                </div>
            )
        },
    },
    {
        accessorKey: 'experienceYears',
        header: 'Kinh nghiệm',
        size: 120,
        cell: ({ getValue }: { getValue: () => any }) => {
            const val = getValue() as number
            const currentYear = new Date().getFullYear()
            // Fix: If value > 1900, it is Start Year. Otherwise it is Duration.
            const years = val > 1900 ? currentYear - val : val
            return <span className="text-muted-foreground text-sm">{years} năm</span>
        },
    },
    {
        accessorKey: 'clinic',
        header: 'Cơ sở',
        size: 200,
        cell: ({ getValue }: { getValue: () => any }) => {
            const clinic = getValue() as { id: number; name: string } | null | undefined
            return <span className="text-muted-foreground text-sm">{clinic?.name || 'Chưa có'}</span>
        },
    },
    {
        accessorKey: 'status',
        header: 'Trạng thái',
        size: 130,
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
        header: 'Hành động',
        size: 120,
        cell: ({ row }: { row: any }) => {
            const doctor = row.original
            return <ActionCell doctor={doctor} />
        },
    },
]

export default function DoctorListPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedClinicId, setSelectedClinicId] = useState<string>('')
    const [selectedServiceId, setSelectedServiceId] = useState<string>('')
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

        if (selectedClinicId) {
            params.clinicId = parseInt(selectedClinicId)
        }

        if (selectedServiceId) {
            params.serviceId = parseInt(selectedServiceId)
        }

        return params
    }, [currentPage, debouncedSearchTerm, selectedClinicId, selectedServiceId])

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value)
    }, [])

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Fetch doctors data
    const { data: doctorsResponse, isLoading } = useDoctors(queryParams, true)

    // Fetch clinics and services for filters
    const { data: clinicsData } = useClinicsDropdown()
    const { data: servicesData } = useServicesDropdown()

    // Extract arrays safely - ensure they are always arrays
    // Note: clinicsData and servicesData are already arrays after apiClient unwraps the response
    const clinics = Array.isArray(clinicsData) ? clinicsData : []
    const services = Array.isArray(servicesData) ? servicesData : []

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedClinicId, selectedServiceId])

    const doctors = doctorsResponse?.doctors || []
    const totalPages = Math.ceil((doctorsResponse?.total || 0) / itemsPerPage)

    // Loading state - only for initial data
    const isInitialLoading = isLoading

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
                    onClick={() => (window.location.href = '/admin/doctor-management/create')}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm bác sĩ mới</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search and Filters Bar */}
                <div className="p-6 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <BsSearchField
                                placeholder="Tìm theo tên, email hoặc ID"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <BsSelect
                                placeholder="Chọn cơ sở"
                                selectedKey={selectedClinicId || null}
                                onSelectionChange={key => {
                                    setSelectedClinicId((key as string) || '')
                                }}
                                options={[
                                    { id: '', name: 'Tất cả cơ sở' },
                                    ...(Array.isArray(clinics) && clinics.length > 0
                                        ? clinics.map(c => ({ id: c.id.toString(), name: c.name }))
                                        : []),
                                ]}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <BsSelect
                                placeholder="Chọn dịch vụ"
                                selectedKey={selectedServiceId || null}
                                onSelectionChange={key => {
                                    setSelectedServiceId((key as string) || '')
                                }}
                                options={[
                                    { id: '', name: 'Tất cả dịch vụ' },
                                    ...(Array.isArray(services) && services.length > 0
                                        ? services.map(s => ({ id: s.id.toString(), name: s.name }))
                                        : []),
                                ]}
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
                        <DataTable
                            data={doctors}
                            columns={columns}
                            containerClassName="min-h-[400px] [&_tbody_tr]:h-12"
                        />
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, doctorsResponse?.total || 0)} trong tổng số{' '}
                        {doctorsResponse?.total || 0} bác sĩ
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            </div>
        </div>
    )
}
