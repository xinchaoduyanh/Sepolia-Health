'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useCreateReceptionist } from '@/shared/hooks'
import type { CreateReceptionistRequest } from '@/shared/lib/api-services/receptionists.service'
import { AvatarUpload } from './AvatarUpload'

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
        // Clear field error when user types
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

        // Clear previous errors
        setFieldErrors({})

        // Prepare data
        const submitData: CreateReceptionistRequest = {
            email: accountInfo.email,
            password: accountInfo.password,
            phone: accountInfo.phone,
            fullName: `${receptionistProfile.firstName} ${receptionistProfile.lastName}`.trim(),
            address: undefined, // Not used in current form, but available in API
        }

        try {
            const response = await createReceptionist.mutateAsync(submitData)

            // Redirect to receptionist detail page with the new receptionist ID
            if (response?.id) {
                router.push(`/dashboard/receptionist-management/${response.id}`)
            }
        } catch (error: any) {
            // Parse error message from backend
            const errorMessage = error?.response?.data?.message || error?.message || ''

            // Map error messages to specific fields
            if (errorMessage.includes('Email đã được sử dụng') || errorMessage.toLowerCase().includes('email')) {
                setFieldErrors(prev => ({ ...prev, email: errorMessage }))
            } else if (
                errorMessage.includes('Số điện thoại đã được sử dụng') ||
                errorMessage.toLowerCase().includes('phone')
            ) {
                setFieldErrors(prev => ({ ...prev, phone: errorMessage }))
            }
            // Toast notification is handled by the hook
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
        'w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tạo tài khoản lễ tân mới</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm lễ tân mới vào hệ thống</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin tài khoản</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Thông tin đăng nhập của lễ tân
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                    Email đăng nhập *
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={accountInfo.email}
                                    onChange={e => handleAccountChange('email', e.target.value)}
                                    placeholder="receptionist@sepolia.com"
                                    className={`${inputClassName} ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    required
                                />
                                {fieldErrors.email && (
                                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-1">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{fieldErrors.email}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                    Mật khẩu *
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={accountInfo.password}
                                    onChange={e => handleAccountChange('password', e.target.value)}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className={`${inputClassName} ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    required
                                    minLength={6}
                                />
                                {fieldErrors.password && (
                                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-1">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{fieldErrors.password}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                                    Số điện thoại đăng nhập *
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={accountInfo.phone}
                                    onChange={e => handleAccountChange('phone', e.target.value)}
                                    placeholder="0123456789"
                                    className={`${inputClassName} ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    required
                                />
                                {fieldErrors.phone && (
                                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-1">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{fieldErrors.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receptionist Profile Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Thông tin cá nhân của lễ tân
                        </p>
                    </div>

                    {/* Avatar with Name Fields */}
                    <div className="flex items-start gap-4 mb-6">
                        {/* Avatar Circle */}
                        <div>
                            <AvatarUpload
                                value={receptionistProfile.avatar}
                                onChange={url => handleProfileChange('avatar', url)}
                            />
                        </div>

                        {/* Name Fields */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="lastName"
                                    className="block text-sm font-medium text-foreground"
                                >
                                    Họ lễ tân *
                                </label>
                                <input
                                    id="lastName"
                                    value={receptionistProfile.lastName}
                                    onChange={e => handleProfileChange('lastName', e.target.value)}
                                    placeholder="Nguyễn"
                                    className={inputClassName}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="gender"
                                    className="block text-sm font-medium text-foreground"
                                >
                                    Giới tính *
                                </label>
                                <select
                                    value={receptionistProfile.gender}
                                    onChange={e => handleProfileChange('gender', e.target.value)}
                                    className={inputClassName}
                                >
                                    {genderOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="firstName"
                                className="block text-sm font-medium text-foreground"
                            >
                                Tên lễ tân *
                            </label>
                            <input
                                id="firstName"
                                value={receptionistProfile.firstName}
                                onChange={e => handleProfileChange('firstName', e.target.value)}
                                placeholder="Thị B"
                                className={inputClassName}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="dateOfBirth"
                                className="block text-sm font-medium text-foreground"
                            >
                                Ngày sinh
                            </label>
                            <input
                                id="dateOfBirth"
                                type="date"
                                value={receptionistProfile.dateOfBirth}
                                onChange={e => handleProfileChange('dateOfBirth', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className={inputClassName}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="shift"
                            className="block text-sm font-medium text-foreground"
                        >
                            Ca làm việc (Tùy chọn)
                        </label>
                        <select
                            id="shift"
                            value={receptionistProfile.shift || ''}
                            onChange={e => handleProfileChange('shift', e.target.value)}
                            className={inputClassName}
                        >
                            <option value="">Chọn ca làm việc</option>
                            {shiftOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 bg-card rounded-lg shadow-sm border border-border p-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!canSubmit || createReceptionist.isPending}>
                        {createReceptionist.isPending ? 'Đang tạo...' : 'Tạo tài khoản lễ tân'}
                    </Button>
                </div>
            </form>
        </div>
    )
}