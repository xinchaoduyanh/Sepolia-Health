'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useUpdateReceptionist } from '@/shared/hooks'
import type { UpdateReceptionistRequest, Receptionist } from '@/shared/lib/api-services/receptionists.service'
import { AvatarUpload } from './AvatarUpload'

interface ReceptionistProfileForm {
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    avatar?: string
    shift?: string
    address?: string
}

interface ReceptionistEditFormProps {
    receptionist: Receptionist
    receptionistId: number
}

export function ReceptionistEditForm({ receptionist, receptionistId }: ReceptionistEditFormProps) {
    const router = useRouter()
    const updateReceptionist = useUpdateReceptionist()

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

    const { firstName: initialFirstName, lastName: initialLastName } = parseFullName(receptionist.fullName)

    const [receptionistProfile, setReceptionistProfile] = useState<ReceptionistProfileForm>({
        firstName: initialFirstName || '',
        lastName: initialLastName || '',
        dateOfBirth: '', // TODO: Bind if available in data
        gender: 'FEMALE', // TODO: Bind if available in data
        avatar: '', // TODO: Bind if available in data
        shift: '', // TODO: Bind if available in data
        address: '', // TODO: Bind if available in data
    })

    const isProfileValid = receptionistProfile.firstName.trim() && receptionistProfile.lastName.trim()

    const canSubmit = isProfileValid && !updateReceptionist.isPending

    const handleProfileChange = (field: keyof ReceptionistProfileForm, value: string) => {
        setReceptionistProfile(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!canSubmit) return

        const submitData: UpdateReceptionistRequest = {
            fullName: `${receptionistProfile.lastName} ${receptionistProfile.firstName}`.trim(),
            phone: receptionist.phone, // Phone is read-only but required in types sometimes? Checked service, it's optional. Let's keep it if we want to update it.
            // Actually, requirements say phone/email read-only.
            // UpdateReceptionistRequest fields are optional.
            address: receptionistProfile.address || undefined,
        }

        try {
            await updateReceptionist.mutateAsync({ id: receptionistId, data: submitData })
            router.push(`/admin/receptionist-management/${receptionistId}`)
        } catch (error: any) {
            console.error('Update error:', error)
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
                    <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa thông tin lễ tân</h1>
                    <p className="text-sm text-muted-foreground mt-1">Cập nhật thông tin cho {receptionist.fullName}</p>
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
                                    value={receptionist.email}
                                    className={readOnlyClassName}
                                    disabled
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={receptionist.phone || ''}
                                    className={readOnlyClassName}
                                    disabled
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receptionist Profile Section */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h3>
                        <p className="text-sm text-muted-foreground mt-1">Thông tin cá nhân của lễ tân</p>
                    </div>

                    {/* Avatar with Name Fields */}
                    <div className="flex items-start gap-4 mb-6">
                        <div>
                            <AvatarUpload
                                value={receptionistProfile.avatar}
                                onChange={url => handleProfileChange('avatar', url)}
                            />
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
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
                                <label htmlFor="gender" className="block text-sm font-medium text-foreground">
                                    Giới tính *
                                </label>
                                <select
                                    value={receptionistProfile.gender}
                                    onChange={e => handleProfileChange('gender', e.target.value as any)}
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
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground">
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

                    <div className="space-y-2 mt-4">
                        <label htmlFor="shift" className="block text-sm font-medium text-foreground">
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

                     <div className="space-y-2 mt-4">
                        <label htmlFor="address" className="block text-sm font-medium text-foreground">
                            Địa chỉ (Tùy chọn)
                        </label>
                        <textarea
                            id="address"
                            value={receptionistProfile.address || ''}
                            onChange={e => handleProfileChange('address', e.target.value)}
                            placeholder="Nhập địa chỉ"
                            rows={2}
                            className={inputClassName}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 bg-card rounded-lg shadow-sm border border-border p-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!canSubmit || updateReceptionist.isPending}>
                        {updateReceptionist.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
