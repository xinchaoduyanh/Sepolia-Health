'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Pagination } from '@workspace/ui/components/Pagination'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Eye, Edit, Trash2, Plus } from 'lucide-react'

// Mock data for customers
const mockCustomers = [
    {
        id: 1,
        customerId: 'CUS001',
        name: 'Nguyễn Văn An',
        email: 'nguyenvanan@email.com',
        phone: '0901234567',
        gender: 'Nam',
        birthDate: '15/01/1990',
        address: 'Hà Nội',
        status: 'active',
        createdAt: '15/01/2024',
        lastVisit: '20/01/2024',
    },
    {
        id: 2,
        customerId: 'CUS002',
        name: 'Trần Thị Bình',
        email: 'tranthibinh@email.com',
        phone: '0901234568',
        gender: 'Nữ',
        birthDate: '16/02/1985',
        address: 'TP. Hồ Chí Minh',
        status: 'active',
        createdAt: '16/01/2024',
        lastVisit: '19/01/2024',
    },
    {
        id: 3,
        customerId: 'CUS003',
        name: 'Lê Văn Cường',
        email: 'levancuong@email.com',
        phone: '0901234569',
        gender: 'Nam',
        birthDate: '17/03/1992',
        address: 'Đà Nẵng',
        status: 'inactive',
        createdAt: '17/01/2024',
        lastVisit: '18/01/2024',
    },
    {
        id: 4,
        customerId: 'CUS004',
        name: 'Phạm Thị Dung',
        email: 'phamthidung@email.com',
        phone: '0901234570',
        gender: 'Nữ',
        birthDate: '18/04/1988',
        address: 'Hải Phòng',
        status: 'active',
        createdAt: '18/01/2024',
        lastVisit: '20/01/2024',
    },
    {
        id: 5,
        customerId: 'CUS005',
        name: 'Hoàng Văn Em',
        email: 'hoangvanem@email.com',
        phone: '0901234571',
        gender: 'Nam',
        birthDate: '19/05/1991',
        address: 'Cần Thơ',
        status: 'pending',
        createdAt: '19/01/2024',
        lastVisit: 'Chưa có',
    },
]

const columns: any[] = [
    {
        accessorKey: 'customerId',
        header: 'ID khách hàng',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="font-medium text-primary">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'name',
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
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'gender',
        header: 'Giới tính',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'birthDate',
        header: 'Ngày sinh',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'address',
        header: 'Địa chỉ',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground">{getValue() as string}</span>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ getValue }: { getValue: () => any }) => {
            const status = getValue() as string
            const statusColors = {
                active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            }
            const statusText = {
                active: 'Hoạt động',
                inactive: 'Không hoạt động',
                pending: 'Chờ duyệt',
            }
            return (
                <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                    {statusText[status as keyof typeof statusText] || status}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'lastVisit',
        header: 'Lần khám cuối',
        cell: ({ getValue }: { getValue: () => any }) => (
            <span className="text-muted-foreground">{getValue() as string}</span>
        ),
    },
    {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row: _row }: { row: any }) => (
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
]

export default function CustomerListPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Filter customers based on search term
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return mockCustomers
        return mockCustomers.filter(
            customer =>
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone.includes(searchTerm),
        )
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
