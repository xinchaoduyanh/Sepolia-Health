'use client'

import { AvatarUpload } from '@/components/AvatarUpload'
import { useDoctorProfile, useUpdateDoctorProfile } from '@/shared/hooks'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { Card } from '@workspace/ui/components/Card'
import { Tab, TabList, TabPanel, Tabs } from '@workspace/ui/components/Tabs'
import { cn } from '@workspace/ui/lib/utils'
import {
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    User,
    UserCircle2,
} from 'lucide-react'
import { useEffect, useState } from 'react'

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
                dateOfBirth: profile.dateOfBirth?.split('T')[0] || '',
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
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
                address: profile.address || '',
                dateOfBirth: profile.dateOfBirth?.split('T')[0] || '',
                gender: (profile.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
                avatar: profile.avatar || '',
            })
        }
        setIsEditing(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Đang tải thông tin hồ sơ...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="p-8 text-center max-w-md border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <div className="bg-destructive/10 p-3 rounded-full w-fit mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-destructive mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-muted-foreground mb-6">
                        Chúng tôi không thể tải được thông tin hồ sơ của bạn vào lúc này.
                    </p>
                    <Button onClick={() => window.location.reload()} variant="default" className="w-full">
                        Thử lại ngay
                    </Button>
                </Card>
            </div>
        )
    }

    const inputClassName =
        'w-full px-4 py-2.5 bg-background/50 backdrop-blur-sm text-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-primary/50'

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <UserCircle2 className="w-64 h-64 text-primary" />
                </div>

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110" />
                        <AvatarUpload value={formData.avatar} onChange={handleAvatarChange} disabled={!isEditing} />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                                {profile?.lastName} {profile?.firstName}
                            </h1>
                            <Badge
                                variant="success"
                                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3"
                            >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {profile?.status === 'ACTIVE' ? 'Đã xác minh' : 'Hoạt động'}
                            </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                            <Mail className="h-4 w-4" />
                            {profile?.email}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="default"
                                className="rounded-full px-6 py-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
                            >
                                <User className="h-5 w-5 mr-2" />
                                Chỉnh sửa hồ sơ
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    className="rounded-full px-6 py-6 border-primary/20 hover:bg-primary/5"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    isDisabled={updateProfile.isPending}
                                    className="rounded-full px-8 py-6 shadow-xl shadow-primary/30 flex-1"
                                >
                                    {updateProfile.isPending ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-5 w-5 mr-2" />
                                    )}
                                    Lưu thông tin
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content with Tabs */}
            <Tabs defaultValue="personal" className="space-y-6">
                <TabList className="bg-background/40 backdrop-blur-md border border-border p-1.5 rounded-2xl w-fit">
                    <Tab
                        id="personal"
                        className="px-6 py-2 rounded-xl data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-lg transition-all"
                    >
                        Thông tin cá nhân
                    </Tab>
                    <Tab
                        id="account"
                        className="px-6 py-2 rounded-xl data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-lg transition-all"
                    >
                        Tài khoản & Hệ thống
                    </Tab>
                </TabList>

                <TabPanel id="personal">
                    <Card className="p-8 border-primary/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <UserCircle2 className="h-5 w-5" />
                                    </div>
                                    Thông tin cơ bản
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5 group">
                                        <label className="text-sm font-semibold text-muted-foreground ml-1">
                                            Họ của bạn
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={e => handleInputChange('lastName', e.target.value)}
                                            disabled={!isEditing}
                                            className={inputClassName}
                                            placeholder="Giao"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-muted-foreground ml-1">
                                            Tên của bạn
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={e => handleInputChange('firstName', e.target.value)}
                                            disabled={!isEditing}
                                            className={inputClassName}
                                            placeholder="Vinh"
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-muted-foreground ml-1">
                                            Số điện thoại liên hệ
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => handleInputChange('phone', e.target.value)}
                                                disabled={!isEditing}
                                                className={cn(inputClassName, 'pl-12')}
                                                placeholder="0xxx-xxx-xxx"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-muted-foreground ml-1">
                                            Ngày sinh
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                                            <input
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                                                disabled={!isEditing}
                                                className={cn(inputClassName, 'pl-12')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-muted-foreground ml-1">
                                            Giới tính
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    disabled={!isEditing}
                                                    onClick={() => handleInputChange('gender', g)}
                                                    className={cn(
                                                        'py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                                                        formData.gender === g
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                                                            : 'bg-background/50 border-border hover:border-primary/50 text-muted-foreground',
                                                    )}
                                                >
                                                    {g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : 'Khác'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-sm font-semibold text-muted-foreground ml-1">
                                    Địa chỉ phòng khám/nhà riêng
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-primary/40" />
                                    <textarea
                                        value={formData.address}
                                        onChange={e => handleInputChange('address', e.target.value)}
                                        disabled={!isEditing}
                                        className={cn(inputClassName, 'pl-12 min-h-[120px] resize-none pt-3')}
                                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabPanel>

                <TabPanel id="account">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-8 border-primary/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-3xl relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <ShieldCheck className="w-32 h-32 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                Phân quyền & Vai trò
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground mb-1.5 ml-1">
                                        Vai trò hệ thống
                                    </p>
                                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                                        <span className="font-bold text-primary tracking-wide">
                                            {profile?.role === 'DOCTOR' ? 'BÁC SĨ CHUYÊN KHOA' : profile?.role}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] py-0">
                                            Mặc định
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground mb-1.5 ml-1">
                                        Trạng thái tài khoản
                                    </p>
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="font-bold text-emerald-600">
                                            {profile?.status === 'ACTIVE' ? 'Đang hoạt động' : profile?.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 border-primary/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-3xl relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Clock className="w-32 h-32 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <Clock className="h-5 w-5" />
                                </div>
                                Thời gian hoạt động
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground mb-1.5 ml-1">
                                        Ngày tham gia hệ thống
                                    </p>
                                    <div className="bg-background-secondary rounded-2xl p-4">
                                        <p className="text-lg font-bold text-foreground">
                                            {profile?.createdAt
                                                ? new Date(profile.createdAt).toLocaleDateString('vi-VN', {
                                                      day: '2-digit',
                                                      month: 'long',
                                                      year: 'numeric',
                                                  })
                                                : 'Chưa có'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 tracking-tight">
                                            Chào mừng bạn gia nhập Sepolia Healthcare
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground mb-1.5 ml-1">
                                        Lần cập nhật cuối
                                    </p>
                                    <div className="bg-background-secondary rounded-2xl p-4">
                                        <p className="text-lg font-bold text-foreground">
                                            {profile?.updatedAt
                                                ? new Date(profile.updatedAt).toLocaleDateString('vi-VN', {
                                                      day: '2-digit',
                                                      month: 'long',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : 'Chưa có'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabPanel>
            </Tabs>

            {/* Support Message */}
            <div className="text-center p-8">
                <p className="text-sm text-muted-foreground italic">
                    Bạn cần thay đổi thông tin chuyên môn hoặc xác thực tài khoản?
                    <button className="ml-2 text-primary font-bold hover:underline">Liên hệ quản trị viên</button>
                </p>
            </div>
        </div>
    )
}
