'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Eye, Plus } from 'lucide-react'

// Mock data based on API structure
const mockCustomers = [
    {
        id: 1,
        email: 'nguyenvanan@email.com',
        fullName: 'Nguyễn Văn An',
        phoneNumber: '0901234567',
        status: 'ACTIVE',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
        patientProfiles: [
            {
                id: '1',
                role: 'SELF',
                relationship: 'SELF',
                gender: 'Male',
                dateOfBirth: '1990-01-15T00:00:00.000Z',
                address: 'Hà Nội',
                createdAt: '2024-01-15T00:00:00.000Z',
                updatedAt: '2024-01-20T00:00:00.000Z',
                userId: '1',
            },
        ],
        profileCount: 1,
    },
    {
        id: 2,
        email: 'tranthibinh@email.com',
        fullName: 'Trần Thị Bình',
        phoneNumber: '0901234568',
        status: 'ACTIVE',
        createdAt: '2024-01-16T00:00:00.000Z',
        updatedAt: '2024-01-19T00:00:00.000Z',
        patientProfiles: [
            {
                id: '2',
                role: 'SELF',
                relationship: 'SELF',
                gender: 'Female',
                dateOfBirth: '1985-02-16T00:00:00.000Z',
                address: 'TP. Hồ Chí Minh',
                createdAt: '2024-01-16T00:00:00.000Z',
                updatedAt: '2024-01-19T00:00:00.000Z',
                userId: '2',
            },
        ],
        profileCount: 1,
    },
    {
        id: 3,
        email: 'levancuong@email.com',
        fullName: 'Lê Văn Cường',
        phoneNumber: '0901234569',
        status: 'ACTIVE',
        createdAt: '2024-01-17T00:00:00.000Z',
        updatedAt: '2024-01-18T00:00:00.000Z',
        patientProfiles: [
            {
                id: '3',
                role: 'SELF',
                relationship: 'SELF',
                gender: 'Male',
                dateOfBirth: '1992-03-17T00:00:00.000Z',
                address: 'Đà Nẵng',
                createdAt: '2024-01-17T00:00:00.000Z',
                updatedAt: '2024-01-18T00:00:00.000Z',
                userId: '3',
            },
        ],
        profileCount: 1,
    },
    {
        id: 4,
        email: 'phamthidung@email.com',
        fullName: 'Phạm Thị Dung',
        phoneNumber: '0901234570',
        status: 'ACTIVE',
        createdAt: '2024-01-18T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
        patientProfiles: [
            {
                id: '4',
                role: 'SELF',
                relationship: 'SELF',
                gender: 'Female',
                dateOfBirth: '1988-04-18T00:00:00.000Z',
                address: 'Hải Phòng',
                createdAt: '2024-01-18T00:00:00.000Z',
                updatedAt: '2024-01-20T00:00:00.000Z',
                userId: '4',
            },
        ],
        profileCount: 1,
    },
    {
        id: 5,
        email: 'hoangvanem@email.com',
        fullName: 'Hoàng Văn Em',
        phoneNumber: '0901234571',
        status: 'ACTIVE',
        createdAt: '2024-01-19T00:00:00.000Z',
        updatedAt: '2024-01-19T00:00:00.000Z',
        patientProfiles: [
            {
                id: '5',
                role: 'SELF',
                relationship: 'SELF',
                gender: 'Male',
                dateOfBirth: '1991-05-19T00:00:00.000Z',
                address: 'Cần Thơ',
                createdAt: '2024-01-19T00:00:00.000Z',
                updatedAt: '2024-01-19T00:00:00.000Z',
                userId: '5',
            },
        ],
        profileCount: 1,
    },
]

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
        cell: ({ getValue }: { getValue: () => any }) => (
            <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                        {(getValue() as string)
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')}
                    </AvatarFallback>
                </Avatar>
                <span className="font-medium">{getValue() as string}</span>
            </div>
        ),
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
        accessorKey: 'phoneNumber',
        header: 'Số điện thoại',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground text-sm">{getValue() as string}</span>
        ),
    },
    {
        id: 'patientProfile',
        header: 'Hồ sơ bệnh nhân',
        cell: ({ row }: { row: any }) => {
            const patientProfiles = row.original.patientProfiles || []
            const selfProfile = patientProfiles.find((profile: any) => profile.role === 'SELF')

            if (selfProfile) {
                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium">{selfProfile.gender === 'Male' ? 'Nam' : 'Nữ'}</div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(selfProfile.dateOfBirth).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-muted-foreground">{selfProfile.address}</div>
                    </div>
                )
            }
            return <span className="text-muted-foreground">Chưa có</span>
        },
    },
    {
        accessorKey: 'profileCount',
        header: 'Số hồ sơ',
        size: 100,
        cell: ({ getValue }: { getValue: () => any }) => (
            <div className="flex items-center justify-center">
                <span className="text-sm font-medium">{getValue() as number}</span>
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
                INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            }
            const statusText = {
                ACTIVE: 'Hoạt động',
                INACTIVE: 'Không hoạt động',
                PENDING: 'Chờ duyệt',
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
                {new Date(getValue() as string).toLocaleDateString('vi-VN')}
            </span>
        ),
    },
    {
        id: 'actions',
        header: 'Thao tác',
        size: 80,
        cell: ({ row }: { row: any }) => (
            <div className="flex items-center justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => (window.location.href = `/dashboard/customer-management/${row.original.id}`)}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
]

export default function CustomerListPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Filter customers based on search term and prioritize users with SELF profile
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) {
            // Sort by users with SELF profile first
            return mockCustomers.sort((a, b) => {
                const aHasSelf = a.patientProfiles?.some(profile => profile.role === 'SELF')
                const bHasSelf = b.patientProfiles?.some(profile => profile.role === 'SELF')
                if (aHasSelf && !bHasSelf) return -1
                if (!aHasSelf && bHasSelf) return 1
                return 0
            })
        }

        const filtered = mockCustomers.filter(
            customer =>
                customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.id.toString().includes(searchTerm) ||
                customer.phoneNumber.includes(searchTerm),
        )

        // Sort by users with SELF profile first
        return filtered.sort((a, b) => {
            const aHasSelf = a.patientProfiles?.some(profile => profile.role === 'SELF')
            const bHasSelf = b.patientProfiles?.some(profile => profile.role === 'SELF')
            if (aHasSelf && !bHasSelf) return -1
            if (!aHasSelf && bHasSelf) return 1
            return 0
        })
    }, [searchTerm])

    // Paginate customers
    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredCustomers.slice(startIndex, endIndex)
    }, [filteredCustomers, currentPage])

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý danh sách khách hàng</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin khách hàng trong hệ thống</p>
                </div>
                <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Thêm khách hàng mới</span>
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Search Bar */}
                <div className="p-6 border-b border-border">
                    <div className="max-w-md">
                        <BsSearchField
                            placeholder="Tìm theo tên, email, ID hoặc số điện thoại"
                            value={searchTerm}
                            onChange={setSearchTerm}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="p-6">
                    <DataTable data={paginatedCustomers} columns={columns} containerClassName="min-h-[400px]" />
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} trong tổng số{' '}
                        {filteredCustomers.length} khách hàng
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={setCurrentPage} />
                </div>
            </div>
        </div>
    )
}
