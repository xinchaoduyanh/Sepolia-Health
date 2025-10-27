'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useCreatePatient } from '@/shared/hooks'
import type { CreatePatientRequest } from '@/shared/lib/api-services/patients.service'

interface PatientProfileForm {
    id?: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    phone: string
    relationship: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'RELATIVE' | 'FRIEND' | 'OTHER'
    address?: string
}

export function PatientCreateForm() {
    const router = useRouter()
    const createPatient = useCreatePatient()

    const [accountInfo, setAccountInfo] = useState({
        email: '',
        password: '',
        phone: '',
    })

    const [profiles, setProfiles] = useState<PatientProfileForm[]>([
        {
            id: '1',
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: 'MALE',
            phone: '',
            relationship: 'SELF',
            address: '',
        },
    ])

    // Helper functions
    const hasSelfProfile = profiles.some(profile => profile.relationship === 'SELF')
    const isAccountValid = accountInfo.email && accountInfo.password && accountInfo.phone

    const getValidProfiles = () =>
        profiles.filter(profile => profile.firstName && profile.lastName && profile.dateOfBirth && profile.phone)

    const hasValidProfile = getValidProfiles().length > 0
    const canSubmit = isAccountValid && hasValidProfile && hasSelfProfile && !createPatient.isPending

    const handleAccountChange = (field: 'email' | 'password' | 'phone', value: string) => {
        setAccountInfo(prev => ({ ...prev, [field]: value }))
    }

    const handleProfileChange = (profileId: string, field: keyof PatientProfileForm, value: string) => {
        setProfiles(prev => prev.map(profile => (profile.id === profileId ? { ...profile, [field]: value } : profile)))
    }

    const addProfile = () => {
        const newProfile: PatientProfileForm = {
            id: Date.now().toString(),
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: 'MALE',
            phone: '',
            relationship: 'OTHER',
            address: '',
        }
        setProfiles(prev => [...prev, newProfile])
    }

    const removeProfile = (profileId: string) => {
        // Không cho xóa profile đầu tiên (SELF)
        if (profileId === '1') return
        setProfiles(prev => prev.filter(profile => profile.id !== profileId))
    }

    // Check if profile is the first one (SELF)
    const isFirstProfile = (profileId: string) => profileId === '1'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        // Prepare data
        const validProfiles = getValidProfiles()

        const submitData: CreatePatientRequest = {
            email: accountInfo.email,
            password: accountInfo.password,
            phone: accountInfo.phone,
            patientProfiles: validProfiles.map(({ id, ...profile }) => profile),
        }

        try {
            await createPatient.mutateAsync(submitData)
            router.push('/dashboard/customer-management')
        } catch (_error) {
            // Error handling is done in the hook
        }
    }

    const relationshipOptions = [
        { value: 'SELF', label: 'Bản thân' },
        { value: 'SPOUSE', label: 'Vợ/Chồng' },
        { value: 'CHILD', label: 'Con' },
        { value: 'PARENT', label: 'Bố/Mẹ' },
        { value: 'SIBLING', label: 'Anh/Chị/Em' },
        { value: 'RELATIVE', label: 'Họ hàng' },
        { value: 'FRIEND', label: 'Bạn bè' },
        { value: 'OTHER', label: 'Khác' },
    ]

    const genderOptions = [
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
        { value: 'OTHER', label: 'Khác' },
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
                    <h1 className="text-3xl font-bold text-foreground">Tạo tài khoản bệnh nhân mới</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm bệnh nhân mới vào hệ thống</p>
                </div>
            </div>

            {/* Warning Alert */}
            {!hasSelfProfile && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Lưu ý quan trọng</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                            Bạn phải có ít nhất một hồ sơ với mối quan hệ là <strong>&quot;Bản thân&quot;</strong> để có
                            thể tạo tài khoản.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin tài khoản</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Thông tin đăng nhập của bệnh nhân (người quản lý tài khoản)
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
                                    placeholder="example@email.com"
                                    className={inputClassName}
                                    required
                                />
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
                                    className={inputClassName}
                                    required
                                    minLength={6}
                                />
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
                                    className={inputClassName}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Profiles Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Hồ sơ bệnh nhân</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ít nhất một hồ sơ với mối quan hệ &quot;Bản thân&quot; (bắt buộc)
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addProfile}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm hồ sơ
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {profiles.map((profile, index) => {
                            const isSelfProfile = profile.relationship === 'SELF'
                            const isFirst = isFirstProfile(profile.id!)
                            return (
                                <div
                                    key={`${profile.id}-${index}`}
                                    className={`border rounded-lg p-5 space-y-4 ${
                                        isSelfProfile
                                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                                            : 'border-border bg-card'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-medium text-foreground">
                                                Hồ sơ {index + 1}
                                                {isSelfProfile && (
                                                    <span className="ml-2 text-xs bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-full">
                                                        Bản thân (Bắt buộc)
                                                    </span>
                                                )}
                                            </h4>
                                        </div>
                                        {profiles.length > 1 && !isFirst && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeProfile(profile.id!)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`firstName-${profile.id}`}
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Tên bệnh nhân *
                                            </label>
                                            <input
                                                id={`firstName-${profile.id}`}
                                                value={profile.firstName}
                                                onChange={e =>
                                                    handleProfileChange(profile.id!, 'firstName', e.target.value)
                                                }
                                                placeholder="Văn A"
                                                className={inputClassName}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`lastName-${profile.id}`}
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Họ bệnh nhân *
                                            </label>
                                            <input
                                                id={`lastName-${profile.id}`}
                                                value={profile.lastName}
                                                onChange={e =>
                                                    handleProfileChange(profile.id!, 'lastName', e.target.value)
                                                }
                                                placeholder="Nguyễn"
                                                className={inputClassName}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`dateOfBirth-${profile.id}`}
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Ngày sinh *
                                            </label>
                                            <input
                                                id={`dateOfBirth-${profile.id}`}
                                                type="date"
                                                value={profile.dateOfBirth}
                                                onChange={e =>
                                                    handleProfileChange(profile.id!, 'dateOfBirth', e.target.value)
                                                }
                                                max={new Date().toISOString().split('T')[0]}
                                                className={inputClassName}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`gender-${profile.id}`}
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Giới tính *
                                            </label>
                                            <select
                                                value={profile.gender}
                                                onChange={e =>
                                                    handleProfileChange(profile.id!, 'gender', e.target.value)
                                                }
                                                className={inputClassName}
                                            >
                                                {genderOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`profilePhone-${profile.id}`}
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Số điện thoại liên lạc *
                                            </label>
                                            <input
                                                id={`profilePhone-${profile.id}`}
                                                type="tel"
                                                value={profile.phone}
                                                onChange={e =>
                                                    handleProfileChange(profile.id!, 'phone', e.target.value)
                                                }
                                                placeholder="0123456789"
                                                className={inputClassName}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`relationship-${profile.id}`}
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Mối quan hệ *
                                            </label>
                                            <select
                                                value={profile.relationship}
                                                onChange={e =>
                                                    handleProfileChange(profile.id!, 'relationship', e.target.value)
                                                }
                                                disabled={isFirst}
                                                className={`${inputClassName} ${isFirst ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                {relationshipOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {isFirst && (
                                                <p className="text-xs text-muted-foreground">
                                                    Mối quan hệ &quot;Bản thân&quot; là bắt buộc và không thể thay đổi
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`address-${profile.id}`}
                                            className="block text-sm font-medium text-foreground"
                                        >
                                            Địa chỉ (Tùy chọn)
                                        </label>
                                        <textarea
                                            id={`address-${profile.id}`}
                                            value={profile.address || ''}
                                            onChange={e => handleProfileChange(profile.id!, 'address', e.target.value)}
                                            placeholder="Nhập địa chỉ"
                                            rows={2}
                                            className={inputClassName}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 bg-card rounded-lg shadow-sm border border-border p-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!canSubmit || createPatient.isPending}>
                        {createPatient.isPending ? 'Đang tạo...' : 'Tạo tài khoản bệnh nhân'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
