'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { AvatarUpload } from './AvatarUpload'
import { doctorsService } from '@/shared/lib/api-services/doctors.service'
import type { Clinic, Service } from '@/shared/lib/api-services/doctors.service'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface FieldErrors {
    email?: string
    password?: string
    phone?: string
    fullName?: string
    experienceYears?: string
    clinicId?: string
    serviceIds?: string
    dateOfBirth?: string
    gender?: string
    avatar?: string
    experience?: string
    contactInfo?: string
}

interface AvailabilityForm {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
}

export function DoctorCreateForm() {
    const router = useRouter()

    // Account & Basic Info (Required by DTO)
    const [accountInfo, setAccountInfo] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        experienceYears: 0,
        clinicId: 0,
        serviceIds: [] as number[],
        description: '', // Optional
        address: '', // Optional
    })

    // Additional Profile Info (From Prisma Schema)
    const [profileInfo, setProfileInfo] = useState({
        dateOfBirth: '', // Optional in schema
        gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '', // Optional in schema
        avatar: '', // Optional in schema
    })

    const [availabilities, setAvailabilities] = useState<AvailabilityForm[]>([])
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Dropdown data
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loadingData, setLoadingData] = useState(true)

    // Load clinics and services
    useEffect(() => {
        const loadData = async () => {
            try {
                const [clinicsResponse, servicesResponse] = await Promise.all([
                    doctorsService.getClinics(),
                    doctorsService.getServices(),
                ])
                setClinics(clinicsResponse.data || [])
                setServices(servicesResponse.data || [])
            } catch (error) {
                console.error('Error loading data:', error)
                toast.error('Không thể tải danh sách phòng khám và dịch vụ')
            } finally {
                setLoadingData(false)
            }
        }
        loadData()
    }, [])

    const createDoctor = useMutation({
        mutationFn: (data: any) => doctorsService.createDoctor(data),
        onSuccess: response => {
            toast.success('Tạo tài khoản bác sĩ thành công!')
            // Navigate to doctor detail or list
            if (response?.id) {
                router.push(`/dashboard/doctor-management/${response.id}`)
            } else {
                router.push('/dashboard/doctor-management/doctor-list')
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

    const handleServiceToggle = (serviceId: number) => {
        const current = accountInfo.serviceIds
        const newServiceIds = current.includes(serviceId)
            ? current.filter(id => id !== serviceId)
            : [...current, serviceId]
        handleAccountChange('serviceIds', newServiceIds)
    }

    const addAvailability = () => {
        const newAvailability: AvailabilityForm = {
            id: Date.now().toString(),
            dayOfWeek: 1, // Monday
            startTime: '08:00',
            endTime: '17:00',
        }
        setAvailabilities(prev => [...prev, newAvailability])
    }

    const removeAvailability = (id: string) => {
        setAvailabilities(prev => prev.filter(a => a.id !== id))
    }

    const handleAvailabilityChange = (id: string, field: keyof AvailabilityForm, value: any) => {
        setAvailabilities(prev =>
            prev.map(a => (a.id === id ? { ...a, [field]: field === 'dayOfWeek' ? parseInt(value) : value } : a)),
        )
    }

    // Validation
    const isAccountValid =
        accountInfo.email &&
        accountInfo.password &&
        accountInfo.fullName &&
        accountInfo.phone &&
        accountInfo.experienceYears >= 0 &&
        accountInfo.clinicId > 0 &&
        accountInfo.serviceIds.length > 0

    const canSubmit = isAccountValid && !createDoctor.isPending && !loadingData

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        // Clear previous errors
        setFieldErrors({})

        // Prepare data according to CreateDoctorDto
        const submitData = {
            email: accountInfo.email,
            password: accountInfo.password,
            fullName: accountInfo.fullName,
            phone: accountInfo.phone,
            experienceYears: accountInfo.experienceYears,
            clinicId: accountInfo.clinicId,
            serviceIds: accountInfo.serviceIds,
            description: accountInfo.description || undefined,
            address: accountInfo.address || undefined,
            availabilities:
                availabilities.length > 0
                    ? availabilities.map(a => ({
                          dayOfWeek: a.dayOfWeek,
                          startTime: a.startTime,
                          endTime: a.endTime,
                      }))
                    : undefined,
        }

        try {
            await createDoctor.mutateAsync(submitData)
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

    const dayOfWeekOptions = [
        { value: 0, label: 'Chủ nhật' },
        { value: 1, label: 'Thứ 2' },
        { value: 2, label: 'Thứ 3' },
        { value: 3, label: 'Thứ 4' },
        { value: 4, label: 'Thứ 5' },
        { value: 5, label: 'Thứ 6' },
        { value: 6, label: 'Thứ 7' },
    ]

    const genderOptions = [
        { value: '', label: '-- Chọn giới tính --' },
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
        { value: 'OTHER', label: 'Khác' },
    ]

    const inputClassName =
        'w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors'

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

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
                        <h3 className="text-lg font-semibold text-foreground">Thông tin tài khoản *</h3>
                        <p className="text-sm text-muted-foreground mt-1">Thông tin đăng nhập của bác sĩ (bắt buộc)</p>
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
                                    placeholder="doctor@example.com"
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
                                    placeholder="Nguyễn Văn A"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="experienceYears" className="block text-sm font-medium text-foreground">
                                    Số năm kinh nghiệm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="experienceYears"
                                    type="number"
                                    value={accountInfo.experienceYears}
                                    onChange={e =>
                                        handleAccountChange('experienceYears', parseInt(e.target.value) || 0)
                                    }
                                    placeholder="5"
                                    min={0}
                                    className={inputClassName}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="clinicId" className="block text-sm font-medium text-foreground">
                                    Phòng khám <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="clinicId"
                                    value={accountInfo.clinicId}
                                    onChange={e => handleAccountChange('clinicId', parseInt(e.target.value) || 0)}
                                    className={inputClassName}
                                    required
                                >
                                    <option value={0}>-- Chọn phòng khám --</option>
                                    {clinics.map(clinic => (
                                        <option key={clinic.id} value={clinic.id}>
                                            {clinic.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-foreground">
                                Mô tả / Chuyên môn (Tùy chọn)
                            </label>
                            <textarea
                                id="description"
                                value={accountInfo.description}
                                onChange={e => handleAccountChange('description', e.target.value)}
                                placeholder="Bác sĩ chuyên khoa tim mạch với 5 năm kinh nghiệm..."
                                rows={3}
                                className={inputClassName}
                            />
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
                                placeholder="123 Đường ABC, Quận 1, TP.HCM"
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
                            Các thông tin bổ sung về bác sĩ (không bắt buộc)
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
                    </div>
                </div>

                {/* Services Selection */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                            Dịch vụ cung cấp <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Chọn ít nhất một dịch vụ (bắt buộc)</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {services.map(service => (
                            <label
                                key={service.id}
                                className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-colors ${
                                    accountInfo.serviceIds.includes(service.id)
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={accountInfo.serviceIds.includes(service.id)}
                                    onChange={() => handleServiceToggle(service.id)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-foreground">{service.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {service.price.toLocaleString('vi-VN')} VNĐ - {service.duration} phút
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                    {accountInfo.serviceIds.length === 0 && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">Vui lòng chọn ít nhất một dịch vụ</p>
                    )}
                </div>

                {/* Weekly Availabilities (Optional) */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Lịch làm việc hàng tuần</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Thêm lịch làm việc cố định (tùy chọn)
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addAvailability}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm lịch
                            </Button>
                        </div>
                    </div>

                    {availabilities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Chưa có lịch làm việc. Bạn có thể thêm sau.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {availabilities.map((availability, index) => (
                                <div key={availability.id} className="border border-border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-foreground">Lịch {index + 1}</h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeAvailability(availability.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-foreground">Thứ</label>
                                            <select
                                                value={availability.dayOfWeek}
                                                onChange={e =>
                                                    handleAvailabilityChange(
                                                        availability.id,
                                                        'dayOfWeek',
                                                        e.target.value,
                                                    )
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
                                            <label className="block text-sm font-medium text-foreground">
                                                Giờ bắt đầu
                                            </label>
                                            <input
                                                type="time"
                                                value={availability.startTime}
                                                onChange={e =>
                                                    handleAvailabilityChange(
                                                        availability.id,
                                                        'startTime',
                                                        e.target.value,
                                                    )
                                                }
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
                                                onChange={e =>
                                                    handleAvailabilityChange(availability.id, 'endTime', e.target.value)
                                                }
                                                className={inputClassName}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 bg-card rounded-lg shadow-sm border border-border p-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!canSubmit}>
                        {createDoctor.isPending ? 'Đang tạo...' : 'Tạo tài khoản bác sĩ'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
