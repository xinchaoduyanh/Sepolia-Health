'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import {
    ArrowLeft,
    AlertCircle,
    Plus,
    Trash2,
    User,
    Mail,
    Lock,
    Phone,
    Calendar,
    Building2,
    Stethoscope,
    Clock,
    FileText,
    MapPin,
    Briefcase,
} from 'lucide-react'
import { useCreateDoctor, useClinicsDropdown, useServicesDropdown } from '@/shared/hooks'
import type { CreateDoctorRequest } from '@/shared/lib/api-services/doctors.service'
import { AvatarUpload } from './AvatarUpload'

interface DoctorProfileForm {
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
    experienceYear: number // Năm bắt đầu hành nghề
    contactInfo: string
    clinicId: number
    serviceIds: number[]
    description?: string
    address?: string
}

interface FieldErrors {
    email?: string
    password?: string
    phone?: string
}

export function DoctorCreateForm() {
    const router = useRouter()
    const createDoctor = useCreateDoctor()
    const { data: clinicsData } = useClinicsDropdown()
    const { data: servicesData } = useServicesDropdown()

    const clinics = Array.isArray(clinicsData) ? clinicsData : []
    const services = Array.isArray(servicesData) ? servicesData : []

    const [accountInfo, setAccountInfo] = useState({
        email: '',
        password: '',
        phone: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const [doctorProfile, setDoctorProfile] = useState<DoctorProfileForm>({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'MALE',
        avatar: '',
        experienceYear: new Date().getFullYear(),
        contactInfo: '',
        clinicId: -1,
        serviceIds: [],
        description: '',
        address: '',
    })

    const [availabilities, setAvailabilities] = useState<
        Array<{
            dayOfWeek: number
            startTime: string
            endTime: string
        }>
    >([])

    // Helper functions
    const isAccountValid = accountInfo.email.trim() && accountInfo.password.trim() && accountInfo.phone.trim()
    const isProfileValid =
        doctorProfile.firstName.trim() &&
        doctorProfile.lastName.trim() &&
        doctorProfile.contactInfo.trim() &&
        doctorProfile.experienceYear >= 1950 &&
        doctorProfile.experienceYear <= new Date().getFullYear() &&
        doctorProfile.clinicId > 0 &&
        doctorProfile.serviceIds.length > 0

    const canSubmit = isAccountValid && isProfileValid

    const handleAccountChange = (field: 'email' | 'password' | 'phone', value: string) => {
        setAccountInfo(prev => ({ ...prev, [field]: value }))
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleProfileChange = (field: keyof DoctorProfileForm, value: string | number | number[]) => {
        if (field === 'experienceYear') {
            setDoctorProfile(prev => ({ ...prev, [field]: Number(value) }))
        } else {
            setDoctorProfile(prev => ({ ...prev, [field]: value }))
        }
    }

    const handleServiceToggle = (serviceId: number) => {
        setDoctorProfile(prev => ({
            ...prev,
            serviceIds: prev.serviceIds.includes(serviceId)
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId],
        }))
    }

    const addAvailability = () => {
        const lastDay = availabilities.length > 0 ? (availabilities[availabilities.length - 1]?.dayOfWeek ?? 1) : 1
        setAvailabilities(prev => [...prev, { dayOfWeek: lastDay, startTime: '08:00', endTime: '17:00' }])
    }

    const updateAvailability = (index: number, field: keyof (typeof availabilities)[0], value: string | number) => {
        setAvailabilities(prev => prev.map((avail, i) => (i === index ? { ...avail, [field]: value } : avail)))
    }

    const removeAvailability = (index: number) => {
        setAvailabilities(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        setFieldErrors({})

        const submitData: CreateDoctorRequest = {
            email: accountInfo.email,
            password: accountInfo.password,
            phone: accountInfo.phone,
            fullName: `${doctorProfile.lastName} ${doctorProfile.firstName}`.trim(),
            experienceYears: doctorProfile.experienceYear,
            description: doctorProfile.description || undefined,
            address: doctorProfile.address || undefined,
            clinicId: doctorProfile.clinicId,
            serviceIds: doctorProfile.serviceIds,
            ...(availabilities.length > 0 && {
                availabilities: availabilities.map(avail => ({
                    dayOfWeek: avail.dayOfWeek,
                    startTime: avail.startTime,
                    endTime: avail.endTime,
                })),
            }),
        }

        try {
            const response = await createDoctor.mutateAsync(submitData)

            if (response?.id) {
                router.push(`/admin/doctor-management/${response.id}`)
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

    const currentYear = new Date().getFullYear()
    const experienceYearOptions = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => ({
        value: currentYear - i,
        label: `${currentYear - i}`,
    }))

    const dayOfWeekOptions = [
        { value: 1, label: 'Thứ 2' },
        { value: 2, label: 'Thứ 3' },
        { value: 3, label: 'Thứ 4' },
        { value: 4, label: 'Thứ 5' },
        { value: 5, label: 'Thứ 6' },
        { value: 6, label: 'Thứ 7' },
        { value: 0, label: 'Chủ nhật' },
    ]

    const inputClassName =
        'w-full px-4 py-2.5 bg-background text-foreground border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-primary/50 transition-all duration-200 outline-none shadow-sm'

    const selectClassName =
        'w-full px-4 py-2.5 bg-gradient-to-r from-background to-muted/20 text-foreground border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-primary/50 hover:from-primary/5 hover:to-primary/10 transition-all duration-200 outline-none shadow-sm cursor-pointer appearance-none bg-no-repeat bg-right pr-10'

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
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Tạo tài khoản bác sĩ mới
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Điền đầy đủ thông tin để thêm bác sĩ vào hệ thống
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            Thông tin
                        </div>
                        <div className="w-8 h-0.5 bg-border" />
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-muted-foreground/30">
                                3
                            </div>
                            Lịch làm việc
                        </div>
                    </div>

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
                                        Thông tin đăng nhập của bác sĩ
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
                                        placeholder="doctor@sepolia.vn"
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

                    {/* Doctor Profile Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h3>
                                    <p className="text-sm text-muted-foreground">Thông tin cá nhân của bác sĩ</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Avatar with Name Fields */}
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="flex flex-col items-center">
                                    <AvatarUpload
                                        value={doctorProfile.avatar}
                                        onChange={url => handleProfileChange('avatar', url)}
                                    />
                                    <span className="text-xs text-muted-foreground mt-2">Ảnh đại diện</span>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClassName}>
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            Họ bác sĩ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={doctorProfile.lastName}
                                            onChange={e => handleProfileChange('lastName', e.target.value)}
                                            placeholder="Nguyễn"
                                            className={inputClassName}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClassName}>
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            Tên bác sĩ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={doctorProfile.firstName}
                                            onChange={e => handleProfileChange('firstName', e.target.value)}
                                            placeholder="Văn A"
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
                                    <select
                                        value={doctorProfile.gender}
                                        onChange={e => handleProfileChange('gender', e.target.value)}
                                        className={selectClassName}
                                    >
                                        {genderOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClassName}>
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Ngày sinh
                                    </label>
                                    <input
                                        type="date"
                                        value={doctorProfile.dateOfBirth}
                                        onChange={e => handleProfileChange('dateOfBirth', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={inputClassName}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        SĐT liên lạc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={doctorProfile.contactInfo}
                                        onChange={e => handleProfileChange('contactInfo', e.target.value)}
                                        placeholder="0123456789"
                                        className={inputClassName}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClassName}>
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        Năm bắt đầu hành nghề <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={doctorProfile.experienceYear}
                                        onChange={e => handleProfileChange('experienceYear', e.target.value)}
                                        className={selectClassName}
                                        required
                                    >
                                        {experienceYearOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label} ({currentYear - option.value} năm kinh nghiệm)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClassName}>
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        Địa chỉ
                                    </label>
                                    <input
                                        value={doctorProfile.address || ''}
                                        onChange={e => handleProfileChange('address', e.target.value)}
                                        placeholder="Nhập địa chỉ"
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Information Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Stethoscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Thông tin chuyên môn</h3>
                                    <p className="text-sm text-muted-foreground">Cơ sở và dịch vụ của bác sĩ</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className={labelClassName}>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    Cơ sở phòng khám <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={doctorProfile.clinicId}
                                    onChange={e => handleProfileChange('clinicId', parseInt(e.target.value))}
                                    className={selectClassName}
                                    required
                                >
                                    <option value={-1}>Chọn cơ sở phòng khám</option>
                                    {clinics.map(clinic => (
                                        <option key={clinic.id} value={clinic.id}>
                                            {clinic.name}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div>
                                <label className={labelClassName}>
                                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                    Dịch vụ chuyên khoa <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl border border-border/50 max-h-48 overflow-y-auto">
                                    {services.map(service => (
                                        <label
                                            key={service.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                                doctorProfile.serviceIds.includes(service.id)
                                                    ? 'bg-primary/10 border-primary border-2'
                                                    : 'bg-background border border-border hover:border-primary/50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={doctorProfile.serviceIds.includes(service.id)}
                                                onChange={() => handleServiceToggle(service.id)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                    doctorProfile.serviceIds.includes(service.id)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border'
                                                }`}
                                            >
                                                {doctorProfile.serviceIds.includes(service.id) && (
                                                    <svg
                                                        className="w-3 h-3 text-primary-foreground"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={3}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium">{service.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {doctorProfile.serviceIds.length === 0 && (
                                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        Vui lòng chọn ít nhất một dịch vụ
                                    </p>
                                )}
                                {doctorProfile.serviceIds.length > 0 && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Đã chọn {doctorProfile.serviceIds.length} dịch vụ
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Mô tả chuyên môn
                                </label>
                                <textarea
                                    value={doctorProfile.description || ''}
                                    onChange={e => handleProfileChange('description', e.target.value)}
                                    placeholder="Mô tả về chuyên môn, kinh nghiệm của bác sĩ..."
                                    rows={3}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Weekly Availability Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Lịch làm việc hàng tuần</h3>
                                        <p className="text-sm text-muted-foreground">Thiết lập lịch cố định (tùy chọn)</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addAvailability}
                                    className="rounded-xl"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm lịch
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            {availabilities.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Chưa có lịch làm việc nào được thiết lập</p>
                                    <p className="text-sm mt-1">Nhấn "Thêm lịch" để bắt đầu</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {availabilities.map((availability, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50"
                                        >
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                        Thứ trong tuần
                                                    </label>
                                                    <select
                                                        value={availability.dayOfWeek}
                                                        onChange={e =>
                                                            updateAvailability(index, 'dayOfWeek', parseInt(e.target.value))
                                                        }
                                                        className={selectClassName}
                                                    >
                                                        {dayOfWeekOptions.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                        Giờ bắt đầu
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={availability.startTime}
                                                        onChange={e => updateAvailability(index, 'startTime', e.target.value)}
                                                        className={inputClassName}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                        Giờ kết thúc
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={availability.endTime}
                                                        onChange={e => updateAvailability(index, 'endTime', e.target.value)}
                                                        className={inputClassName}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeAvailability(index)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                isDisabled={!canSubmit || createDoctor.isPending}
                                className="rounded-xl px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            >
                                {createDoctor.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    'Tạo tài khoản bác sĩ'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
