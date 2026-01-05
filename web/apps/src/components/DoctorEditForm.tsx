'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useUpdateDoctor, useClinicsDropdown, useServicesDropdown } from '@/shared/hooks'
import type { UpdateDoctorRequest, Doctor } from '@/shared/lib/api-services/doctors.service'
import { AvatarUpload } from './AvatarUpload'

interface DoctorProfileForm {
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
    experienceYear: number
    contactInfo: string
    clinicId: number
    serviceIds: number[]
    description?: string
    address?: string
}

interface DoctorEditFormProps {
    doctor: Doctor
    doctorId: number
}

export function DoctorEditForm({ doctor, doctorId }: DoctorEditFormProps) {
    const router = useRouter()
    const updateDoctor = useUpdateDoctor()
    const { data: clinicsData } = useClinicsDropdown()
    const { data: servicesData } = useServicesDropdown()

    const clinics = Array.isArray(clinicsData) ? clinicsData : []
    const services = Array.isArray(servicesData) ? servicesData : []

    // Parse fullName into firstName and lastName
    const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
        const parts = fullName ? fullName.trim().split(' ') : ['']
        if (parts.length === 1) {
            return { firstName: parts[0] || '', lastName: '' }
        }
        const lastName = parts[0] || ''
        const firstName = parts.slice(1).join(' ')
        return { firstName, lastName }
    }

    const { firstName: initialFirstName, lastName: initialLastName } = parseFullName(doctor.fullName)

    const [doctorProfile, setDoctorProfile] = useState<DoctorProfileForm>({
        firstName: initialFirstName || '',
        lastName: initialLastName || '',
        dateOfBirth: '',
        gender: 'MALE',
        avatar: '',
        experienceYear: doctor.experienceYears || new Date().getFullYear(),
        contactInfo: doctor.phone || '',
        clinicId: doctor.clinic?.id || -1,
        serviceIds: doctor.services?.map(s => s.id) || [],
        description: doctor.description || '',
        address: doctor.address || '',
    })

    const isProfileValid =
        doctorProfile.firstName.trim() &&
        doctorProfile.lastName.trim() &&
        doctorProfile.experienceYear >= 1950 &&
        doctorProfile.experienceYear <= new Date().getFullYear()

    const canSubmit = isProfileValid && !updateDoctor.isPending

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        const currentYear = new Date().getFullYear()
        const submitData: UpdateDoctorRequest = {
            fullName: `${doctorProfile.lastName} ${doctorProfile.firstName}`.trim(),
            experienceYears: doctorProfile.experienceYear,
            description: doctorProfile.description || undefined,
            address: doctorProfile.address || undefined,
            phone: doctorProfile.contactInfo || undefined,
            serviceIds: doctorProfile.serviceIds,
        }

        try {
            await updateDoctor.mutateAsync({ id: doctorId, data: submitData })
            router.push(`/admin/doctor-management/${doctorId}`)
        } catch (error: any) {
            console.error('Update error:', error)
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

    const inputClassName =
        'w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors'

    const readOnlyClassName =
        'w-full px-3 py-2 bg-muted text-muted-foreground border border-border rounded-md cursor-not-allowed'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa thông tin bác sĩ</h1>
                    <p className="text-sm text-muted-foreground mt-1">Cập nhật thông tin cho {doctor.fullName}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information Section - Read Only */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin tài khoản</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Thông tin đăng nhập (không thể chỉnh sửa)
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Email đăng nhập</label>
                                <input
                                    type="email"
                                    value={doctor.email}
                                    className={readOnlyClassName}
                                    disabled
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={doctor.phone || ''}
                                    className={readOnlyClassName}
                                    disabled
                                    readOnly
                                />
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
                        <div>
                            <AvatarUpload
                                value={doctorProfile.avatar}
                                onChange={url => handleProfileChange('avatar', url)}
                            />
                        </div>

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
                            <label htmlFor="contactInfo" className="block text-sm font-medium text-foreground">
                                Số điện thoại liên lạc
                            </label>
                            <input
                                id="contactInfo"
                                type="tel"
                                value={doctorProfile.contactInfo}
                                onChange={e => handleProfileChange('contactInfo', e.target.value)}
                                placeholder="0123456789"
                                className={inputClassName}
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
                                        {option.label} ({currentYear - option.value} năm kinh nghiệm)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Cơ sở phòng khám</label>
                            <input
                                type="text"
                                value={doctor.clinic?.name || 'Chưa xác định'}
                                className={readOnlyClassName}
                                disabled
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
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
                        <p className="text-sm text-muted-foreground mt-1">Thông tin về dịch vụ của bác sĩ</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Dịch vụ chuyên khoa</label>
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

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 bg-card rounded-lg shadow-sm border border-border p-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!canSubmit || updateDoctor.isPending}>
                        {updateDoctor.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
