'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { useCreateDoctor, useClinicsDropdown, useServicesDropdown } from '@/shared/hooks'
import type { CreateDoctorRequest } from '@/shared/lib/api-services/doctors.service'
import { AvatarUpload } from './AvatarUpload'

interface DoctorProfileForm {
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
    experienceYear: number // Năm bắt đầu hành nghề (1950-2025)
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

    // Extract arrays safely - ensure they are always arrays
    // Note: clinicsData and servicesData are already arrays after apiClient unwraps the response
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
        experienceYear: 2025, // Default to current year
        contactInfo: '',
        clinicId: -1, // Use -1 to indicate no selection
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
        doctorProfile.experienceYear <= 2025 &&
        doctorProfile.clinicId > 0 &&
        doctorProfile.serviceIds.length > 0

    const canSubmit = isAccountValid && isProfileValid

    const handleAccountChange = (field: 'email' | 'password' | 'phone', value: string) => {
        setAccountInfo(prev => ({ ...prev, [field]: value }))
        // Clear field error when user types
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
        // Default to the same day as the last availability, or Monday if none exist
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

        // Clear previous errors
        setFieldErrors({})

        // Prepare data
        const submitData: CreateDoctorRequest = {
            email: accountInfo.email,
            password: accountInfo.password,
            phone: accountInfo.phone,
            fullName: `${doctorProfile.firstName} ${doctorProfile.lastName}`.trim(),
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

            // Redirect to doctor detail page with the new doctor ID
            if (response?.id) {
                router.push(`/doctor-management/${response.id}`)
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

    // Generate years from 1950 to 2025
    const experienceYearOptions = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => ({
        value: 2025 - i,
        label: `${2025 - i}`,
    }))

    const dayOfWeekOptions = [
        { value: 0, label: 'Chủ nhật', enumValue: 'SUNDAY' },
        { value: 1, label: 'Thứ 2', enumValue: 'MONDAY' },
        { value: 2, label: 'Thứ 3', enumValue: 'TUESDAY' },
        { value: 3, label: 'Thứ 4', enumValue: 'WEDNESDAY' },
        { value: 4, label: 'Thứ 5', enumValue: 'THURSDAY' },
        { value: 5, label: 'Thứ 6', enumValue: 'FRIDAY' },
        { value: 6, label: 'Thứ 7', enumValue: 'SATURDAY' },
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
                    <h1 className="text-3xl font-bold text-foreground">Tạo tài khoản bác sĩ mới</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm bác sĩ mới vào hệ thống</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin tài khoản</h3>
                        <p className="text-sm text-muted-foreground mt-1">Thông tin đăng nhập của bác sĩ</p>
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
                                    placeholder="doctor@sepolia.com"
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

                {/* Doctor Profile Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h3>
                        <p className="text-sm text-muted-foreground mt-1">Thông tin cá nhân của bác sĩ</p>
                    </div>

                    {/* Avatar with Name Fields */}
                    <div className="flex items-start gap-4 mb-6">
                        {/* Avatar Circle */}
                        <div>
                            <AvatarUpload
                                value={doctorProfile.avatar}
                                onChange={url => handleProfileChange('avatar', url)}
                            />
                        </div>

                        {/* Name Fields */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
                                    Họ bác sĩ *
                                </label>
                                <input
                                    id="lastName"
                                    value={doctorProfile.lastName}
                                    onChange={e => handleProfileChange('lastName', e.target.value)}
                                    placeholder="Nguyễn"
                                    className={inputClassName}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="gender" className="block text-sm font-medium text-foreground">
                                    Giới tính *
                                </label>
                                <select
                                    value={doctorProfile.gender}
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
                            <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
                                Tên bác sĩ *
                            </label>
                            <input
                                id="firstName"
                                value={doctorProfile.firstName}
                                onChange={e => handleProfileChange('firstName', e.target.value)}
                                placeholder="Văn A"
                                className={inputClassName}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground">
                                Ngày sinh
                            </label>
                            <input
                                id="dateOfBirth"
                                type="date"
                                value={doctorProfile.dateOfBirth}
                                onChange={e => handleProfileChange('dateOfBirth', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className={inputClassName}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="contactInfo" className="block text-sm font-medium text-foreground">
                                Số điện thoại liên lạc *
                            </label>
                            <input
                                id="contactInfo"
                                type="tel"
                                value={doctorProfile.contactInfo}
                                onChange={e => handleProfileChange('contactInfo', e.target.value)}
                                placeholder="0123456789"
                                className={inputClassName}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="experienceYear" className="block text-sm font-medium text-foreground">
                                Năm bắt đầu hành nghề *
                            </label>
                            <select
                                id="experienceYear"
                                value={doctorProfile.experienceYear}
                                onChange={e => handleProfileChange('experienceYear', e.target.value)}
                                className={inputClassName}
                                required
                            >
                                {experienceYearOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label} ({2025 - option.value} năm kinh nghiệm)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="address" className="block text-sm font-medium text-foreground">
                            Địa chỉ (Tùy chọn)
                        </label>
                        <textarea
                            id="address"
                            value={doctorProfile.address || ''}
                            onChange={e => handleProfileChange('address', e.target.value)}
                            placeholder="Nhập địa chỉ"
                            rows={2}
                            className={inputClassName}
                        />
                    </div>
                </div>

                {/* Professional Information Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin chuyên môn</h3>
                        <p className="text-sm text-muted-foreground mt-1">Thông tin về cơ sở và dịch vụ của bác sĩ</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="clinicId" className="block text-sm font-medium text-foreground">
                                Cơ sở phòng khám *
                            </label>
                            <select
                                id="clinicId"
                                value={doctorProfile.clinicId}
                                onChange={e => handleProfileChange('clinicId', parseInt(e.target.value))}
                                className={inputClassName}
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

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Dịch vụ chuyên khoa *</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
                                {services.map(service => (
                                    <label key={service.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={doctorProfile.serviceIds.includes(service.id)}
                                            onChange={() => handleServiceToggle(service.id)}
                                            className="rounded border-border"
                                        />
                                        <span className="text-sm">{service.name}</span>
                                    </label>
                                ))}
                            </div>
                            {doctorProfile.serviceIds.length === 0 && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Vui lòng chọn ít nhất một dịch vụ
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-foreground">
                                Mô tả chuyên môn (Tùy chọn)
                            </label>
                            <textarea
                                id="description"
                                value={doctorProfile.description || ''}
                                onChange={e => handleProfileChange('description', e.target.value)}
                                placeholder="Mô tả về chuyên môn, kinh nghiệm của bác sĩ"
                                rows={3}
                                className={inputClassName}
                            />
                        </div>
                    </div>
                </div>

                {/* Weekly Availability Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Lịch làm việc hàng tuần</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Thiết lập lịch làm việc cố định (tùy chọn)
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addAvailability}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm lịch
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {availabilities.map((availability, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-foreground">
                                            Thứ trong tuần
                                        </label>
                                        <select
                                            value={availability.dayOfWeek}
                                            onChange={e =>
                                                updateAvailability(index, 'dayOfWeek', parseInt(e.target.value))
                                            }
                                            className={inputClassName}
                                        >
                                            {dayOfWeekOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-foreground">Giờ bắt đầu</label>
                                        <input
                                            type="time"
                                            value={availability.startTime}
                                            onChange={e => updateAvailability(index, 'startTime', e.target.value)}
                                            className={inputClassName}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-foreground">
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
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {availabilities.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Chưa có lịch làm việc nào được thiết lập
                            </p>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 bg-card rounded-lg shadow-sm border border-border p-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!canSubmit || createDoctor.isPending}>
                        {createDoctor.isPending ? 'Đang tạo...' : 'Tạo tài khoản bác sĩ'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
