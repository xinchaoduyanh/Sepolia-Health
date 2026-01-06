'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import {
    ArrowLeft,
    AlertCircle,
    User,
    Mail,
    Lock,
    Phone,
    Calendar,
    Clock,
    UserCheck,
} from 'lucide-react'
import { useCreateReceptionist } from '@/shared/hooks'
import type { CreateReceptionistRequest } from '@/shared/lib/api-services/receptionists.service'
import { AvatarUpload } from './AvatarUpload'
import { FormSelect } from '@workspace/ui/components/FormSelect'
import { FormDatePicker } from '@workspace/ui/components/FormDatePicker'

interface ReceptionistProfileForm {
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
    shift?: string
}

interface FieldErrors {
    email?: string
    password?: string
    phone?: string
}

export function ReceptionistCreateForm() {
    const router = useRouter()
    const createReceptionist = useCreateReceptionist()

    const [accountInfo, setAccountInfo] = useState({
        email: '',
        password: '',
        phone: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const [receptionistProfile, setReceptionistProfile] = useState<ReceptionistProfileForm>({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'MALE',
        avatar: '',
        shift: '',
    })

    // Helper functions
    const isAccountValid = accountInfo.email && accountInfo.password && accountInfo.phone
    const isProfileValid = receptionistProfile.firstName && receptionistProfile.lastName

    const canSubmit = isAccountValid && isProfileValid && !createReceptionist.isPending

    const handleAccountChange = (field: 'email' | 'password' | 'phone', value: string) => {
        setAccountInfo(prev => ({ ...prev, [field]: value }))
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleProfileChange = (field: keyof ReceptionistProfileForm, value: string) => {
        setReceptionistProfile(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        setFieldErrors({})

        const submitData: CreateReceptionistRequest = {
            email: accountInfo.email,
            password: accountInfo.password,
            phone: accountInfo.phone,
            fullName: `${receptionistProfile.lastName} ${receptionistProfile.firstName}`.trim(),
            address: undefined,
        }

        try {
            const response = await createReceptionist.mutateAsync(submitData)

            if (response?.id) {
                router.push(`/admin/receptionist-management/${response.id}`)
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || ''

            if (errorMessage.includes('Email đã được sử dụng') || errorMessage.toLowerCase().includes('email')) {
                setFieldErrors(prev => ({ ...prev, email: errorMessage }))
            } else if (
                errorMessage.includes('Số điện thoại đã được sử dụng') ||
                errorMessage.toLowerCase().includes('phone')
            ) {
                setFieldErrors(prev => ({ ...prev, phone: errorMessage }))
            }
        }
    }

    const genderOptions = [
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
        { value: 'OTHER', label: 'Khác' },
    ]

    const shiftOptions = [
        { value: 'Sáng (7:00-15:00)', label: 'Ca sáng (7:00-15:00)' },
        { value: 'Chiều (15:00-23:00)', label: 'Ca chiều (15:00-23:00)' },
        { value: 'Đêm (23:00-7:00)', label: 'Ca đêm (23:00-7:00)' },
        { value: 'Toàn thời gian', label: 'Toàn thời gian' },
    ]

    const inputClassName =
        'w-full px-4 py-2.5 bg-background text-foreground border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-primary/50 transition-all duration-200 outline-none shadow-sm'

    const labelClassName = 'flex items-center gap-2 text-sm font-medium text-foreground mb-2'

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
            <div className="w-full px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-muted/50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                            Tạo tài khoản lễ tân mới
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Điền đầy đủ thông tin để thêm lễ tân vào hệ thống
                        </p>
                    </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isAccountValid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isAccountValid ? 'bg-green-500 text-white' : 'bg-muted-foreground/30 text-muted-foreground'}`}
                        >
                            1
                        </div>
                        Tài khoản
                    </div>
                    <div className="w-8 h-0.5 bg-border" />
                    <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isProfileValid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isProfileValid ? 'bg-green-500 text-white' : 'bg-muted-foreground/30 text-muted-foreground'}`}
                        >
                            2
                        </div>
                        Thông tin cá nhân
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Account Information Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Thông tin tài khoản</h3>
                                    <p className="text-sm text-muted-foreground">Thông tin đăng nhập của lễ tân</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClassName}>
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Email đăng nhập <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={accountInfo.email}
                                        onChange={e => handleAccountChange('email', e.target.value)}
                                        placeholder="receptionist@sepolia.vn"
                                        className={`${inputClassName} ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        required
                                    />
                                    {fieldErrors.email && (
                                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{fieldErrors.email}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClassName}>
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={accountInfo.password}
                                        onChange={e => handleAccountChange('password', e.target.value)}
                                        placeholder="Tối thiểu 6 ký tự"
                                        className={`${inputClassName} ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        required
                                        minLength={6}
                                    />
                                    {fieldErrors.password && (
                                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{fieldErrors.password}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClassName}>
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        Số điện thoại đăng nhập <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={accountInfo.phone}
                                        onChange={e => handleAccountChange('phone', e.target.value)}
                                        placeholder="0123456789"
                                        className={`${inputClassName} ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        required
                                    />
                                    {fieldErrors.phone && (
                                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{fieldErrors.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receptionist Profile Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                    <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h3>
                                    <p className="text-sm text-muted-foreground">Thông tin cá nhân của lễ tân</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Avatar with Name Fields */}
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="flex flex-col items-center">
                                    <AvatarUpload
                                        value={receptionistProfile.avatar}
                                        onChange={url => handleProfileChange('avatar', url)}
                                    />
                                    <span className="text-xs text-muted-foreground mt-2">Ảnh đại diện</span>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClassName}>
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            Họ lễ tân <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={receptionistProfile.lastName}
                                            onChange={e => handleProfileChange('lastName', e.target.value)}
                                            placeholder="Nguyễn"
                                            className={inputClassName}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClassName}>
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            Tên lễ tân <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={receptionistProfile.firstName}
                                            onChange={e => handleProfileChange('firstName', e.target.value)}
                                            placeholder="Thị B"
                                            className={inputClassName}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className={labelClassName}>
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Giới tính <span className="text-red-500">*</span>
                                    </label>
                                    <FormSelect
                                        value={receptionistProfile.gender}
                                        onChange={(value) => handleProfileChange('gender', value)}
                                        options={genderOptions}
                                        placeholder="Chọn giới tính"
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Ngày sinh
                                    </label>
                                    <FormDatePicker
                                        value={receptionistProfile.dateOfBirth}
                                        onChange={(value) => handleProfileChange('dateOfBirth', value)}
                                        maxValue={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        Ca làm việc
                                    </label>
                                    <FormSelect
                                        value={receptionistProfile.shift || ''}
                                        onChange={(value) => handleProfileChange('shift', value)}
                                        options={[
                                            { value: '', label: 'Chọn ca làm việc' },
                                            ...shiftOptions
                                        ]}
                                        placeholder="Chọn ca làm việc"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between gap-4 bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                        <div className="text-sm text-muted-foreground">
                            {!canSubmit && (
                                <span className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    Vui lòng điền đầy đủ các trường bắt buộc
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl">
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                isDisabled={!canSubmit || createReceptionist.isPending}
                                className="rounded-xl px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                            >
                                {createReceptionist.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    'Tạo tài khoản lễ tân'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
