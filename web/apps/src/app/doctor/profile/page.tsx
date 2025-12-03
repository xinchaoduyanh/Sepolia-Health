'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Card } from '@workspace/ui/components/Card'
import { AvatarUpload } from '@/components/AvatarUpload'
import { useDoctorProfile, useUpdateDoctorProfile } from '@/shared/hooks'
import { Loader2, Save, User, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'

export default function DoctorProfilePage() {
    const { data: profile, isLoading, error } = useDoctorProfile()
    const updateProfile = useUpdateDoctorProfile()

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
        avatar: '',
    })

    const [isEditing, setIsEditing] = useState(false)

    // Load profile data into form
    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
                address: profile.address || '',
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                gender: (profile.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
                avatar: profile.avatar || '',
            })
        }
    }, [profile])

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAvatarChange = async (url: string) => {
        setFormData(prev => ({ ...prev, avatar: url }))
    }

    const handleSave = async () => {
        try {
            const updateData: any = {}
            if (formData.firstName) updateData.firstName = formData.firstName
            if (formData.lastName) updateData.lastName = formData.lastName
            if (formData.phone) updateData.phone = formData.phone
            if (formData.address) updateData.address = formData.address
            if (formData.dateOfBirth) {
                // Convert date to ISO string
                const date = new Date(formData.dateOfBirth)
                updateData.dateOfBirth = date.toISOString()
            }
            if (formData.gender) updateData.gender = formData.gender
            if (formData.avatar) updateData.avatar = formData.avatar

            await updateProfile.mutateAsync(updateData)
            setIsEditing(false)
        } catch (error) {
            console.error('Update error:', error)
        }
    }

    const handleCancel = () => {
        // Reset form to original profile data
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
                address: profile.address || '',
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                gender: (profile.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
                avatar: profile.avatar || '',
            })
        }
        setIsEditing(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">Lỗi khi tải thông tin hồ sơ</p>
                    <Button onClick={() => window.location.reload()}>Thử lại</Button>
                </div>
            </div>
        )
    }

    const inputClassName =
        'w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
                    <p className="text-sm text-muted-foreground mt-1">Xem và chỉnh sửa thông tin cá nhân của bạn</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="default">
                        <User className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                    </Button>
                )}
            </div>

            {/* Profile Card */}
            <Card className="p-6">
                <div className="space-y-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex items-start gap-6">
                        <div>
                            <AvatarUpload value={formData.avatar} onChange={handleAvatarChange} disabled={!isEditing} />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Họ *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => handleInputChange('lastName', e.target.value)}
                                        disabled={!isEditing}
                                        className={inputClassName}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Tên *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => handleInputChange('firstName', e.target.value)}
                                        disabled={!isEditing}
                                        className={inputClassName}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Email</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg">
                                        <Mail className="h-4 w-4" />
                                        <span>{profile?.email || 'Chưa có'}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Số điện thoại</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => handleInputChange('phone', e.target.value)}
                                            disabled={!isEditing}
                                            className={`${inputClassName} pl-10`}
                                            placeholder="0123456789"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Ngày sinh</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                                    disabled={!isEditing}
                                    className={`${inputClassName} pl-10`}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Giới tính</label>
                            <select
                                value={formData.gender}
                                onChange={e => handleInputChange('gender', e.target.value)}
                                disabled={!isEditing}
                                className={inputClassName}
                            >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Địa chỉ</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <textarea
                                value={formData.address}
                                onChange={e => handleInputChange('address', e.target.value)}
                                disabled={!isEditing}
                                className={`${inputClassName} pl-10 min-h-[100px]`}
                                placeholder="Nhập địa chỉ của bạn"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                            <Button onClick={handleSave} disabled={updateProfile.isPending} className="flex-1">
                                {updateProfile.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </Button>
                            <Button onClick={handleCancel} variant="outline" disabled={updateProfile.isPending}>
                                Hủy
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Account Info Card */}
            <Card className="p-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Thông tin tài khoản
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Vai trò</p>
                            <p className="text-sm font-medium text-foreground mt-1">
                                {profile?.role === 'DOCTOR' ? 'Bác sĩ' : profile?.role}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                            <p className="text-sm font-medium text-foreground mt-1">
                                {profile?.status === 'ACTIVE' ? 'Hoạt động' : profile?.status}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Ngày tạo</p>
                            <p className="text-sm font-medium text-foreground mt-1">
                                {profile?.createdAt
                                    ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
                                    : 'Chưa có'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                            <p className="text-sm font-medium text-foreground mt-1">
                                {profile?.updatedAt
                                    ? new Date(profile.updatedAt).toLocaleDateString('vi-VN')
                                    : 'Chưa có'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
