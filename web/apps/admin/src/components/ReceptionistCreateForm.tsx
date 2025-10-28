'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { AvatarUpload } from './AvatarUpload'
import { receptionistsService } from '@/shared/lib/api-services/receptionists.service'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface FieldErrors {
    email?: string
    password?: string
    phone?: string
    fullName?: string
    address?: string
    dateOfBirth?: string
    gender?: string
    avatar?: string
    shift?: string
}

export function ReceptionistCreateForm() {
    const router = useRouter()

    // Account & Basic Info (Required by DTO)
    const [accountInfo, setAccountInfo] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        address: '', // Optional in DTO
    })

    // Additional Profile Info (From Prisma Schema)
    const [profileInfo, setProfileInfo] = useState({
        dateOfBirth: '', // Optional in schema
        gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '', // Optional in schema
        avatar: '', // Optional in schema
        shift: '', // Optional in schema (e.g., "Sáng", "Chiều", "Tối")
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const createReceptionist = useMutation({
        mutationFn: (data: any) => receptionistsService.createReceptionist(data),
        onSuccess: response => {
            toast.success('Tạo tài khoản lễ tân thành công!')
            // Navigate to receptionist detail or list
            if (response?.id) {
                router.push(`/dashboard/receptionist-management/${response.id}`)
            } else {
                router.push('/dashboard/receptionist-management')
            }
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra'
            toast.error(errorMessage)
        },
    })

    const handleAccountChange = (field: string, value: any) => {
        setAccountInfo(prev => ({ ...prev, [field]: value }))
        if (fieldErrors[field as keyof FieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleProfileChange = (field: string, value: any) => {
        setProfileInfo(prev => ({ ...prev, [field]: value }))
        if (fieldErrors[field as keyof FieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    // Validation
    const isAccountValid = accountInfo.email && accountInfo.password && accountInfo.fullName && accountInfo.phone

    const canSubmit = isAccountValid && !createReceptionist.isPending

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        // Clear previous errors
        setFieldErrors({})

        // Prepare data according to CreateReceptionistDto
        const submitData = {
            email: accountInfo.email,
            password: accountInfo.password,
            fullName: accountInfo.fullName,
            phone: accountInfo.phone,
            address: accountInfo.address || undefined,
        }

        try {
            await createReceptionist.mutateAsync(submitData)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || ''

            // Map error messages to specific fields
            if (errorMessage.includes('Email') || errorMessage.toLowerCase().includes('email')) {
                setFieldErrors(prev => ({ ...prev, email: errorMessage }))
            } else if (errorMessage.includes('phone') || errorMessage.includes('điện thoại')) {
                setFieldErrors(prev => ({ ...prev, phone: errorMessage }))
            }
        }
    }

    const genderOptions = [
        { value: '', label: '-- Chọn giới tính --' },
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
        { value: 'OTHER', label: 'Khác' },
    ]

    const shiftOptions = [
        { value: '', label: '-- Chọn ca làm việc --' },
        { value: 'Sáng', label: 'Ca sáng (7:00 - 12:00)' },
        { value: 'Chiều', label: 'Ca chiều (12:00 - 17:00)' },
        { value: 'Tối', label: 'Ca tối (17:00 - 22:00)' },
        { value: 'Toàn thời gian', label: 'Toàn thời gian (7:00 - 17:00)' },
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
                        <h3 className="text-lg font-semibold text-foreground">Thông tin tài khoản *</h3>
                        <p className="text-sm text-muted-foreground mt-1">Thông tin đăng nhập của lễ tân (bắt buộc)</p>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                    Email đăng nhập <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={accountInfo.email}
                                    onChange={e => handleAccountChange('email', e.target.value)}
                                    placeholder="receptionist@example.com"
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
                                    Mật khẩu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={accountInfo.password}
                                    onChange={e => handleAccountChange('password', e.target.value)}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className={inputClassName}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={accountInfo.fullName}
                                    onChange={e => handleAccountChange('fullName', e.target.value)}
                                    placeholder="Nguyễn Thị B"
                                    className={inputClassName}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                                    Số điện thoại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={accountInfo.phone}
                                    onChange={e => handleAccountChange('phone', e.target.value)}
                                    placeholder="0987654321"
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
                        <div className="space-y-2">
                            <label htmlFor="address" className="block text-sm font-medium text-foreground">
                                Địa chỉ (Tùy chọn)
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={accountInfo.address}
                                onChange={e => handleAccountChange('address', e.target.value)}
                                placeholder="456 Đường XYZ, Quận 2, TP.HCM"
                                className={inputClassName}
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Profile Information (from Prisma Schema) */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin hồ sơ bổ sung</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Các thông tin bổ sung về lễ tân (không bắt buộc)
                        </p>
                    </div>
                    <div className="space-y-4">
                        {/* Avatar Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Ảnh đại diện (Tùy chọn)</label>
                            <AvatarUpload
                                value={profileInfo.avatar}
                                onChange={url => handleProfileChange('avatar', url)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground">
                                    Ngày sinh (Tùy chọn)
                                </label>
                                <input
                                    id="dateOfBirth"
                                    type="date"
                                    value={profileInfo.dateOfBirth}
                                    onChange={e => handleProfileChange('dateOfBirth', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className={inputClassName}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="gender" className="block text-sm font-medium text-foreground">
                                    Giới tính (Tùy chọn)
                                </label>
                                <select
                                    id="gender"
                                    value={profileInfo.gender}
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

                        <div className="space-y-2">
                            <label htmlFor="shift" className="block text-sm font-medium text-foreground">
                                Ca làm việc (Tùy chọn)
                            </label>
                            <select
                                id="shift"
                                value={profileInfo.shift}
                                onChange={e => handleProfileChange('shift', e.target.value)}
                                className={inputClassName}
                            >
                                {shiftOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Chọn ca làm việc chính của lễ tân (có thể điều chỉnh sau)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Information Note */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300">Lưu ý</h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-400 mt-1 list-disc list-inside space-y-1">
                                <li>
                                    Các trường có dấu <span className="text-red-600">*</span> là bắt buộc
                                </li>
                                <li>Thông tin hồ sơ bổ sung (ảnh, ngày sinh, giới tính, ca làm việc) là tùy chọn</li>
                                <li>Mật khẩu phải có ít nhất 6 ký tự</li>
                                <li>Email và số điện thoại phải là duy nhất trong hệ thống</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 bg-card rounded-lg shadow-sm border border-border p-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!canSubmit}>
                        {createReceptionist.isPending ? 'Đang tạo...' : 'Tạo tài khoản lễ tân'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
