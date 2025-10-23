'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, Calendar, MapPin, IdCard } from 'lucide-react'
import { usePatient, useDeletePatient, useUpdatePatientStatus } from '@/shared/hooks'
import { toast } from 'sonner'

export default function PatientDetailPage() {
    const params = useParams()
    const router = useRouter()
    const patientId = parseInt(params.id as string)

    const { data: patientResponse, isLoading, error } = usePatient(patientId)
    const deletePatient = useDeletePatient()
    const updateStatus = useUpdatePatientStatus()

    const handleStatusChange = (newStatus: 'ACTIVE' | 'DEACTIVE' | 'UNVERIFIED') => {
        updateStatus.mutate({ id: patientId, status: newStatus })
    }

    const handleDelete = () => {
        if (confirm('Bạn có chắc chắn muốn xóa bệnh nhân này?')) {
            deletePatient.mutate(patientId, {
                onSuccess: () => {
                    router.push('/dashboard/patient-management')
                },
            })
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Chi tiết bệnh nhân</h1>
                </div>
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-muted-foreground">Đang tải...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !patientResponse?.data) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Chi tiết bệnh nhân</h1>
                </div>
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-red-500">Không tìm thấy bệnh nhân hoặc có lỗi xảy ra</div>
                    </div>
                </div>
            </div>
        )
    }

    const patient = patientResponse.data
    const selfProfile = patient.patientProfiles?.find(profile => profile.relationship === 'SELF')

    const getStatusColor = (status: string) => {
        const statusColors = {
            ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            DEACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
            UNVERIFIED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        }
        return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
    }

    const getStatusText = (status: string) => {
        const statusText = {
            ACTIVE: 'Hoạt động',
            DEACTIVE: 'Tạm khóa',
            UNVERIFIED: 'Chưa xác thực',
        }
        return statusText[status as keyof typeof statusText] || status
    }

    const getGenderText = (gender: string) => {
        const genderText = {
            MALE: 'Nam',
            FEMALE: 'Nữ',
            OTHER: 'Khác',
        }
        return genderText[gender as keyof typeof genderText] || gender
    }

    const getRelationshipText = (relationship: string) => {
        const relationshipText = {
            SELF: 'Bản thân',
            SPOUSE: 'Vợ/Chồng',
            CHILD: 'Con',
            PARENT: 'Bố/Mẹ',
            SIBLING: 'Anh/Chị/Em',
            RELATIVE: 'Họ hàng',
            FRIEND: 'Bạn bè',
            OTHER: 'Khác',
        }
        return relationshipText[relationship as keyof typeof relationshipText] || relationship
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết bệnh nhân</h1>
                        <p className="text-sm text-muted-foreground mt-1">ID: {patient.id}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="h-5 w-5" />
                                <span>Thông tin cơ bản</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="text-lg">
                                        {selfProfile?.fullName
                                            ?.split(' ')
                                            .map((n: string) => n[0])
                                            .join('') || 'N/A'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold">{selfProfile?.fullName || 'Chưa có tên'}</h3>
                                    <Badge className={getStatusColor(patient.status)}>
                                        {getStatusText(patient.status)}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{patient.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{patient.phone || 'Chưa có'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile Details */}
                    {selfProfile && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin hồ sơ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {typeof window !== 'undefined'
                                                ? new Date(selfProfile.dateOfBirth).toLocaleDateString('vi-VN')
                                                : selfProfile.dateOfBirth}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{getGenderText(selfProfile.gender)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{selfProfile.address || 'Chưa có địa chỉ'}</span>
                                    </div>
                                    {selfProfile.idCardNumber && (
                                        <div className="flex items-center space-x-2">
                                            <IdCard className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{selfProfile.idCardNumber}</span>
                                        </div>
                                    )}
                                </div>

                                {selfProfile.occupation && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Nghề nghiệp:
                                        </label>
                                        <p className="text-sm">{selfProfile.occupation}</p>
                                    </div>
                                )}

                                {selfProfile.nationality && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Quốc tịch:</label>
                                        <p className="text-sm">{selfProfile.nationality}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* All Profiles */}
                    {patient.patientProfiles && patient.patientProfiles.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Tất cả hồ sơ ({patient.patientProfiles.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {patient.patientProfiles.map((profile, index) => (
                                        <div key={`${profile.id}-${index}`} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{profile.fullName}</h4>
                                                <Badge variant="outline">
                                                    {getRelationshipText(profile.relationship)}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                <div>Giới tính: {getGenderText(profile.gender)}</div>
                                                <div>SĐT: {profile.phone}</div>
                                                <div>
                                                    Ngày sinh:{' '}
                                                    {typeof window !== 'undefined'
                                                        ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')
                                                        : profile.dateOfBirth}
                                                </div>
                                                <div>Địa chỉ: {profile.address || 'Chưa có'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Actions Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thao tác</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleStatusChange('ACTIVE')}
                                disabled={patient.status === 'ACTIVE'}
                            >
                                Kích hoạt tài khoản
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleStatusChange('DEACTIVE')}
                                disabled={patient.status === 'DEACTIVE'}
                            >
                                Tạm khóa tài khoản
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleStatusChange('UNVERIFIED')}
                                disabled={patient.status === 'UNVERIFIED'}
                            >
                                Đánh dấu chưa xác thực
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin hệ thống</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <label className="font-medium text-muted-foreground">Ngày tạo:</label>
                                <p>
                                    {typeof window !== 'undefined'
                                        ? new Date(patient.createdAt).toLocaleString('vi-VN')
                                        : patient.createdAt}
                                </p>
                            </div>
                            <div>
                                <label className="font-medium text-muted-foreground">Cập nhật lần cuối:</label>
                                <p>
                                    {typeof window !== 'undefined'
                                        ? new Date(patient.updatedAt).toLocaleString('vi-VN')
                                        : patient.updatedAt}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
