'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Button } from '@workspace/ui/components/Button'
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    IdCard,
    Briefcase,
    Flag,
    Heart,
    Droplets,
    AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { usePatient } from '@/shared/hooks'

// Helper function to translate relationship types
const getRelationshipLabel = (relationship: string): string => {
    const relationshipMap: Record<string, string> = {
        SELF: 'Bản thân',
        MOTHER: 'Mẹ',
        FATHER: 'Bố',
        SPOUSE: 'Vợ/Chồng',
        CHILD: 'Con',
        SIBLING: 'Anh/Chị/Em',
        GRANDPARENT: 'Ông/Bà',
        GRANDCHILD: 'Cháu',
        OTHER: 'Khác',
    }
    return relationshipMap[relationship] || relationship
}

const getGenderLabel = (gender: string): string => {
    const genderMap: Record<string, string> = {
        MALE: 'Nam',
        FEMALE: 'Nữ',
        OTHER: 'Khác',
    }
    return genderMap[gender] || gender
}

export default function UserDetailPage() {
    const params = useParams()
    const patientId = params?.id ? Number(params.id) : 0

    const { data: userData, isLoading: loading, isError, error } = usePatient(patientId)

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/customer-management/customer-list">
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

    if (isError || !userData) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/customer-management/customer-list">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Link>
                    </Button>
                </div>
                <Card className="border-red-200 dark:border-red-800">
                    <CardContent className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Không tìm thấy thông tin bệnh nhân</h3>
                        <p className="text-muted-foreground mb-4">
                            {(error as any)?.response?.data?.message || 'Bệnh nhân không tồn tại hoặc đã bị xóa'}
                        </p>
                        <Button asChild>
                            <Link href="/admin/customer-management/customer-list">Quay lại danh sách</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/customer-management/customer-list">
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
                    <div>
                        <h3 className="text-lg font-semibold">User #{userData.id}</h3>
                        <p className="text-muted-foreground">Tài khoản chính</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{userData.email || 'Chưa có'}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{userData.phone || 'Chưa có'}</span>
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
                                            {profile.avatar ? (
                                                <img
                                                    src={profile.avatar}
                                                    alt={profile.fullName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <AvatarFallback className="text-sm">
                                                    {profile.fullName
                                                        ?.split(' ')
                                                        ?.map((n: string) => n[0])
                                                        ?.join('') || 'P'}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{profile.fullName}</CardTitle>
                                            <CardDescription className="flex items-center space-x-2">
                                                <Badge
                                                    variant={profile.relationship === 'SELF' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {getRelationshipLabel(profile.relationship)}
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
                                            <p className="text-sm">{getGenderLabel(profile.gender)}</p>
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
                                            <span className="line-clamp-2">{profile.address || 'Chưa có'}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                CMND/CCCD
                                            </label>
                                            <p className="text-sm flex items-center space-x-1">
                                                <IdCard className="h-3 w-3" />
                                                <span className="truncate">{profile.idCardNumber || 'Chưa có'}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Nghề nghiệp
                                            </label>
                                            <p className="text-sm flex items-center space-x-1">
                                                <Briefcase className="h-3 w-3" />
                                                <span className="truncate">{profile.occupation || 'Chưa có'}</span>
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
                                                <span className="truncate">{profile.nationality || 'Chưa có'}</span>
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
                                                        (allergy: any, allergyIndex:any) => (
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
