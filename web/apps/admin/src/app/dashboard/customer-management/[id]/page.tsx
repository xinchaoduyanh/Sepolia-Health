'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, IdCard, Briefcase, Flag, Heart, Droplets } from 'lucide-react'
import Link from 'next/link'

// Mock data based on API structure
const mockUserData = {
    id: 1,
    email: 'patient@sepolia.com',
    phone: '0123456789',
    status: 'ACTIVE',
    patientProfiles: [
        {
            id: 1,
            firstName: 'Văn C',
            lastName: 'Nguyễn',
            fullName: 'Nguyễn Văn C',
            dateOfBirth: '1990-01-15',
            gender: 'MALE',
            phone: '0123456789',
            relationship: 'SELF',
            avatar: 'https://example.com/avatar.jpg',
            idCardNumber: '123456789',
            occupation: 'Kỹ sư',
            nationality: 'Việt Nam',
            address: '789 Đường DEF, Quận 3, TP.HCM',
            healthDetailsJson: {
                allergies: ['Penicillin'],
                bloodType: 'O+',
            },
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
            id: 2,
            firstName: 'Thị A',
            lastName: 'Trần',
            fullName: 'Trần Thị A',
            dateOfBirth: '1985-03-20',
            gender: 'FEMALE',
            phone: '0987654321',
            relationship: 'MOTHER',
            avatar: 'https://example.com/avatar2.jpg',
            idCardNumber: '987654321',
            occupation: 'Giáo viên',
            nationality: 'Việt Nam',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            healthDetailsJson: {
                allergies: ['Aspirin'],
                bloodType: 'A+',
            },
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
        },
        {
            id: 3,
            firstName: 'Văn B',
            lastName: 'Lê',
            fullName: 'Lê Văn B',
            dateOfBirth: '1995-07-10',
            gender: 'MALE',
            phone: '0912345678',
            relationship: 'FATHER',
            avatar: 'https://example.com/avatar3.jpg',
            idCardNumber: '456789123',
            occupation: 'Bác sĩ',
            nationality: 'Việt Nam',
            address: '456 Đường XYZ, Quận 2, TP.HCM',
            healthDetailsJson: {
                allergies: [],
                bloodType: 'B+',
            },
            createdAt: '2024-01-03T00:00:00.000Z',
            updatedAt: '2024-01-03T00:00:00.000Z',
        },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
}

export default function UserDetailPage() {
    const params = useParams()
    const [userData, setUserData] = useState(mockUserData)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate API call
        const fetchUserData = async () => {
            setLoading(true)
            // In real app, fetch from API using params.id
            setTimeout(() => {
                setUserData(mockUserData)
                setLoading(false)
            }, 500)
        }

        fetchUserData()
    }, [params.id])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/customer-management/customer-list">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Link>
                    </Button>
                </div>
                <div className="text-center py-8">
                    <div className="text-muted-foreground">Đang tải thông tin...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/customer-management/customer-list">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết khách hàng</h1>
                        <p className="text-sm text-muted-foreground mt-1">Thông tin chi tiết về khách hàng</p>
                    </div>
                </div>
                <Badge
                    className={
                        userData.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                    }
                >
                    {userData.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
            </div>

            {/* Thông tin User */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Thông tin User</span>
                    </CardTitle>
                    <CardDescription>Thông tin tài khoản và liên hệ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg">
                                {userData.email.split('@')[0].substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-semibold">User #{userData.id}</h3>
                            <p className="text-muted-foreground">Tài khoản chính</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{userData.email}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{userData.phone}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    Tạo:{' '}
                                    {typeof window !== 'undefined'
                                        ? new Date(userData.createdAt).toLocaleDateString('vi-VN')
                                        : userData.createdAt}
                                </span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Heart className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{userData.patientProfiles?.length || 0} hồ sơ bệnh nhân</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danh sách PatientProfiles */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Hồ sơ bệnh nhân</h2>
                    <Badge variant="outline" className="text-sm">
                        {userData.patientProfiles?.length || 0} hồ sơ
                    </Badge>
                </div>

                {userData.patientProfiles && userData.patientProfiles.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {userData.patientProfiles.map((profile, index) => (
                            <Card key={`${profile.id}-${index}`} className="relative">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="text-sm">
                                                {profile.fullName
                                                    .split(' ')
                                                    .map((n: string) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{profile.fullName}</CardTitle>
                                            <CardDescription className="flex items-center space-x-2">
                                                <Badge
                                                    variant={profile.relationship === 'SELF' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {profile.relationship === 'SELF'
                                                        ? 'Bản thân'
                                                        : profile.relationship === 'MOTHER'
                                                          ? 'Mẹ'
                                                          : profile.relationship === 'FATHER'
                                                            ? 'Bố'
                                                            : profile.relationship === 'SPOUSE'
                                                              ? 'Vợ/Chồng'
                                                              : profile.relationship === 'CHILD'
                                                                ? 'Con'
                                                                : profile.relationship === 'SIBLING'
                                                                  ? 'Anh/Chị/Em'
                                                                  : profile.relationship === 'GRANDPARENT'
                                                                    ? 'Ông/Bà'
                                                                    : profile.relationship === 'GRANDCHILD'
                                                                      ? 'Cháu'
                                                                      : profile.relationship === 'OTHER'
                                                                        ? 'Khác'
                                                                        : profile.relationship}
                                                </Badge>
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Giới tính
                                            </label>
                                            <p className="text-sm">{profile.gender === 'MALE' ? 'Nam' : 'Nữ'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Ngày sinh
                                            </label>
                                            <p className="text-sm">
                                                {typeof window !== 'undefined'
                                                    ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')
                                                    : profile.dateOfBirth}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Địa chỉ</label>
                                        <p className="text-sm flex items-start space-x-1">
                                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{profile.address}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                CMND/CCCD
                                            </label>
                                            <p className="text-sm flex items-center space-x-1">
                                                <IdCard className="h-3 w-3" />
                                                <span className="truncate">{profile.idCardNumber}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Nghề nghiệp
                                            </label>
                                            <p className="text-sm flex items-center space-x-1">
                                                <Briefcase className="h-3 w-3" />
                                                <span className="truncate">{profile.occupation}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Nhóm máu
                                            </label>
                                            <p className="text-sm flex items-center space-x-1">
                                                <Droplets className="h-3 w-3" />
                                                <span>{profile.healthDetailsJson?.bloodType || 'Chưa có'}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Quốc tịch
                                            </label>
                                            <p className="text-sm flex items-center space-x-1">
                                                <Flag className="h-3 w-3" />
                                                <span className="truncate">{profile.nationality}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {profile.healthDetailsJson?.allergies &&
                                        profile.healthDetailsJson.allergies.length > 0 && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Dị ứng
                                                </label>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {profile.healthDetailsJson.allergies.map(
                                                        (allergy, allergyIndex) => (
                                                            <Badge
                                                                key={allergyIndex}
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {allergy}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground">
                                            Tạo:{' '}
                                            {typeof window !== 'undefined'
                                                ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
                                                : profile.createdAt}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="text-center py-8">
                            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Chưa có hồ sơ bệnh nhân nào</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
