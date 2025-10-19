'use client'

import { useState } from 'react'
import { DataTable } from '@workspace/ui/components/DataTable'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'

import { Eye, Edit, Trash2, Plus } from 'lucide-react'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { BsSelect } from '@workspace/ui/components/Select'

// Mock data for doctors
const mockDoctors = [
    {
        id: '1',
        fullName: 'BS. Nguyễn Văn A',
        email: 'nguyenvana@vinmec.com',
        phone: '0123456789',
        specialty: ['Da liễu', 'Nhi Khoa'],
        site: 'Hà Nội',
        cm: 'CM1',
        status: 'active',
        avatar: null,
        doctorType: 'vinmec',
        profileId: 'VIN001',
    },
    {
        id: '2',
        fullName: 'BS. Trần Thị B',
        email: 'tranthib@vinmec.com',
        phone: '0987654321',
        specialty: ['Dinh dưỡng', 'Huyết học'],
        site: 'TP. Hồ Chí Minh',
        cm: 'CM2',
        status: 'active',
        avatar: null,
        doctorType: 'vinmec',
        profileId: 'VIN002',
    },
    {
        id: '3',
        fullName: 'BS. Lê Văn C',
        email: 'levanc@external.com',
        phone: '0369852147',
        specialty: ['Mắt', 'Nam Khoa'],
        site: 'Đà Nẵng',
        cm: 'CM3',
        status: 'inactive',
        avatar: null,
        doctorType: 'external',
        profileId: 'EXT001',
    },
]

const specialtyOptions = [
    { id: 'all', name: 'Tất cả chuyên khoa' },
    { id: 'dermatology', name: 'Da liễu' },
    { id: 'nutrition', name: 'Dinh dưỡng' },
    { id: 'hematology', name: 'Huyết học' },
    { id: 'ophthalmology', name: 'Mắt' },
    { id: 'andrology', name: 'Nam Khoa' },
    { id: 'pediatrics', name: 'Nhi Khoa' },
]

const siteOptions = [
    { id: 'all', name: 'Tất cả site' },
    { id: 'hanoi', name: 'Hà Nội' },
    { id: 'hcm', name: 'TP. Hồ Chí Minh' },
    { id: 'danang', name: 'Đà Nẵng' },
    { id: 'cantho', name: 'Cần Thơ' },
]

interface DoctorListProps {
    onViewDetail: (doctorId: string) => void
    onEdit: (doctorId: string) => void
    onCreateNew: () => void
}

export function DoctorList({ onViewDetail, onEdit, onCreateNew }: DoctorListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSpecialty, setSelectedSpecialty] = useState('all')
    const [selectedSite, setSelectedSite] = useState('all')

    // Filter doctors based on search and filters
    const filteredDoctors = mockDoctors.filter(doctor => {
        const matchesSearch =
            doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.phone.includes(searchTerm)

        const matchesSpecialty =
            selectedSpecialty === 'all' || doctor.specialty.some(s => s.toLowerCase().includes(selectedSpecialty))

        const matchesSite = selectedSite === 'all' || doctor.site === siteOptions.find(s => s.id === selectedSite)?.name

        return matchesSearch && matchesSpecialty && matchesSite
    })

    const columns = [
        {
            accessorKey: 'avatar',
            header: 'Ảnh',
            cell: ({ row }: any) => (
                <Avatar className="w-10 h-10">
                    <AvatarImage src={row.original.avatar} alt={row.original.fullName} />
                    <AvatarFallback>{row.original.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
            ),
        },
        {
            accessorKey: 'fullName',
            header: 'Họ tên',
            cell: ({ row }: any) => (
                <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{row.original.fullName}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{row.original.email}</div>
                </div>
            ),
        },
        {
            accessorKey: 'phone',
            header: 'Số điện thoại',
            cell: ({ row }: any) => <span className="text-slate-700 dark:text-slate-300">{row.original.phone}</span>,
        },
        {
            accessorKey: 'specialty',
            header: 'Chuyên khoa',
            cell: ({ row }: any) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.specialty.map((spec: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            accessorKey: 'site',
            header: 'Site',
            cell: ({ row }: any) => <span className="text-slate-700 dark:text-slate-300">{row.original.site}</span>,
        },
        {
            accessorKey: 'doctorType',
            header: 'Loại',
            cell: ({ row }: any) => (
                <Badge variant={row.original.doctorType === 'vinmec' ? 'default' : 'outline'}>
                    {row.original.doctorType === 'vinmec' ? 'Vinmec' : 'Ngoài Vinmec'}
                </Badge>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Trạng thái',
            cell: ({ row }: any) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
                    {row.original.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
            ),
        },
        {
            accessorKey: 'actions',
            header: 'Thao tác',
            cell: ({ row }: any) => (
                <div className="flex space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(row.original.id)}
                        className="h-8 w-8 p-0"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(row.original.id)} className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Delete doctor:', row.original.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Danh sách bác sĩ</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý và xem danh sách tất cả bác sĩ trong hệ thống
                    </p>
                </div>
                <Button onClick={onCreateNew} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Thêm bác sĩ mới</span>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <BsSearchField
                        placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="w-48">
                        <BsSelect
                            value={selectedSpecialty}
                            onChange={value => setSelectedSpecialty(value as string)}
                            options={specialtyOptions}
                            placeholder="Chọn chuyên khoa"
                        />
                    </div>
                    <div className="w-48">
                        <BsSelect
                            value={selectedSite}
                            onChange={value => setSelectedSite(value as string)}
                            options={siteOptions}
                            placeholder="Chọn site"
                        />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <DataTable data={filteredDoctors} columns={columns} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-foreground">{mockDoctors.length}</div>
                    <div className="text-sm text-muted-foreground">Tổng số bác sĩ</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-green-600">
                        {mockDoctors.filter(d => d.status === 'active').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Đang hoạt động</div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-blue-600">
                        {mockDoctors.filter(d => d.doctorType === 'vinmec').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Bác sĩ Vinmec</div>
                </div>
            </div>
        </div>
    )
}
