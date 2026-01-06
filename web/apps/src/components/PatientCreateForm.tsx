'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import {
    ArrowLeft,
    Plus,
    Trash2,
    AlertCircle,
    User,
    Mail,
    Lock,
    Phone,
    Calendar,
    Users,
    MapPin,
    Heart,
} from 'lucide-react'
import { useCreatePatient } from '@/shared/hooks'
import type { CreatePatientRequest } from '@/shared/lib/api-services/patients.service'
import { AvatarUpload } from './AvatarUpload'
import { FormSelect } from '@workspace/ui/components/FormSelect'
import { FormDatePicker } from '@workspace/ui/components/FormDatePicker'

interface PatientProfileForm {
    id?: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    phone: string
    relationship: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'RELATIVE' | 'FRIEND' | 'OTHER'
    address?: string
    avatar?: string
}

interface FieldErrors {
    email?: string
    password?: string
    phone?: string
}

export function PatientCreateForm() {
    const router = useRouter()
    const createPatient = useCreatePatient()

    const [accountInfo, setAccountInfo] = useState({
        email: '',
        password: '',
        phone: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

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
            avatar: '',
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
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
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
            avatar: '',
        }
        setProfiles(prev => [...prev, newProfile])
    }

    const removeProfile = (profileId: string) => {
        if (profileId === '1') return
        setProfiles(prev => prev.filter(profile => profile.id !== profileId))
    }

    const isFirstProfile = (profileId: string) => profileId === '1'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        setFieldErrors({})

        const validProfiles = getValidProfiles()

        const submitData: CreatePatientRequest = {
            email: accountInfo.email,
            password: accountInfo.password,
            phone: accountInfo.phone,
            patientProfiles: validProfiles.map(({ id, ...profile }) => profile),
        }

        try {
            const response = await createPatient.mutateAsync(submitData)

            if (response?.id) {
                router.push(`/admin/customer-management/${response.id}`)
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
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                            Tạo tài khoản bệnh nhân mới
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Điền đầy đủ thông tin để thêm bệnh nhân vào hệ thống
                        </p>
                    </div>
                </div>

                {/* Warning Alert */}
                {!hasSelfProfile && (
                    <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-amber-800 dark:text-amber-300">Lưu ý quan trọng</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                Bạn phải có ít nhất một hồ sơ với mối quan hệ là <strong>"Bản thân"</strong> để có thể
                                tạo tài khoản.
                            </p>
                        </div>
                    </div>
                )}

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
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${hasValidProfile && hasSelfProfile ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${hasValidProfile && hasSelfProfile ? 'bg-green-500 text-white' : 'bg-muted-foreground/30 text-muted-foreground'}`}
                        >
                            2
                        </div>
                        Hồ sơ bệnh nhân
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
                                    <p className="text-sm text-muted-foreground">
                                        Thông tin đăng nhập của bệnh nhân (người quản lý tài khoản)
                                    </p>
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
                                        placeholder="patient@example.com"
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

                    {/* Patient Profiles Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 dark:from-pink-500/5 dark:to-rose-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Hồ sơ bệnh nhân</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Ít nhất một hồ sơ với mối quan hệ "Bản thân" (bắt buộc)
                                        </p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addProfile} className="rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm hồ sơ
                                </Button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {profiles.map((profile, index) => {
                                const isSelfProfile = profile.relationship === 'SELF'
                                const isFirst = isFirstProfile(profile.id!)
                                return (
                                    <div
                                        key={`${profile.id}-${index}`}
                                        className={`rounded-2xl p-6 space-y-5 transition-all ${
                                            isSelfProfile
                                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2 border-blue-300 dark:border-blue-700'
                                                : 'bg-muted/30 border border-border/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                                        isSelfProfile
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-muted-foreground/20 text-muted-foreground'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </div>
                                                <h4 className="font-semibold text-foreground">
                                                    Hồ sơ {index + 1}
                                                    {isSelfProfile && (
                                                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
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
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Avatar with Name Fields */}
                                        <div className="flex flex-col md:flex-row items-start gap-6">
                                            <div className="flex flex-col items-center">
                                                <AvatarUpload
                                                    value={profile.avatar}
                                                    onChange={url => handleProfileChange(profile.id!, 'avatar', url)}
                                                />
                                                <span className="text-xs text-muted-foreground mt-2">Ảnh đại diện</span>
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className={labelClassName}>
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        Họ bệnh nhân <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        value={profile.lastName}
                                                        onChange={e =>
                                                            handleProfileChange(profile.id!, 'lastName', e.target.value)
                                                        }
                                                        placeholder="Nguyễn"
                                                        className={inputClassName}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClassName}>
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        Tên bệnh nhân <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        value={profile.firstName}
                                                        onChange={e =>
                                                            handleProfileChange(profile.id!, 'firstName', e.target.value)
                                                        }
                                                        placeholder="Văn A"
                                                        className={inputClassName}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                            <div>
                                                <label className={labelClassName}>
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    Giới tính <span className="text-red-500">*</span>
                                                </label>
                                                <FormSelect
                                                    value={profile.gender}
                                                    onChange={(value) =>
                                                        handleProfileChange(profile.id!, 'gender', value)
                                                    }
                                                    options={genderOptions}
                                                    placeholder="Chọn giới tính"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClassName}>
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    Ngày sinh <span className="text-red-500">*</span>
                                                </label>
                                                <FormDatePicker
                                                    value={profile.dateOfBirth}
                                                    onChange={(value) =>
                                                        handleProfileChange(profile.id!, 'dateOfBirth', value)
                                                    }
                                                    maxValue={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClassName}>
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    Số điện thoại <span className="text-red-500">*</span>
                                                </label>
                                                <input
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
                                            <div>
                                                <label className={labelClassName}>
                                                    <Heart className="h-4 w-4 text-muted-foreground" />
                                                    Mối quan hệ <span className="text-red-500">*</span>
                                                </label>
                                                <FormSelect
                                                    value={profile.relationship}
                                                    onChange={(value) =>
                                                        handleProfileChange(profile.id!, 'relationship', value)
                                                    }
                                                    options={relationshipOptions
                                                        .filter(option => isFirst || option.value !== 'SELF')
                                                    }
                                                    disabled={isFirst}
                                                    placeholder="Chọn mối quan hệ"
                                                />
                                                {isFirst && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Không thể thay đổi
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClassName}>
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                Địa chỉ
                                            </label>
                                            <textarea
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
                                isDisabled={!canSubmit || createPatient.isPending}
                                className="rounded-xl px-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                            >
                                {createPatient.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    'Tạo tài khoản bệnh nhân'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
