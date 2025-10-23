'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useCreatePatient } from '@/shared/hooks'
import type { CreatePatientRequest } from '@/shared/lib/api-services/patients.service'

interface PatientProfileForm {
    id?: string // For form management
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    phone: string
    relationship: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'RELATIVE' | 'FRIEND' | 'OTHER'
    avatar?: string
    idCardNumber?: string
    occupation?: string
    nationality?: string
    address?: string
    healthDetailsJson?: Record<string, any>
}

export function PatientCreateForm() {
    const router = useRouter()
    const createPatient = useCreatePatient()

    const [formData, setFormData] = useState<CreatePatientRequest>({
        email: '',
        password: '',
        phone: '',
        patientProfiles: [
            {
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                gender: 'MALE',
                phone: '',
                relationship: 'SELF',
                address: '',
            },
        ],
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

    const handleInputChange = (field: keyof CreatePatientRequest, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }))
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
        if (profiles.length > 1) {
            setProfiles(prev => prev.filter(profile => profile.id !== profileId))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate form
        if (!formData.email || !formData.password || !formData.phone) {
            alert('Vui lòng điền đầy đủ thông tin tài khoản')
            return
        }

        // Validate profiles
        const validProfiles = profiles.filter(
            profile => profile.firstName && profile.lastName && profile.dateOfBirth && profile.phone,
        )

        if (validProfiles.length === 0) {
            alert('Vui lòng điền ít nhất một hồ sơ bệnh nhân')
            return
        }

        // Check if there's at least one SELF profile
        const hasSelfProfile = validProfiles.some(profile => profile.relationship === 'SELF')
        if (!hasSelfProfile) {
            alert('Phải có ít nhất một hồ sơ với mối quan hệ là "Bản thân"')
            return
        }

        // Prepare data for API
        const submitData: CreatePatientRequest = {
            ...formData,
            patientProfiles: validProfiles.map(({ id, ...profile }) => profile),
        }

        try {
            await createPatient.mutateAsync(submitData)
            router.push('/dashboard/patient-management')
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Thông tin tài khoản</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium">
                                    Email *
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e: any) => handleInputChange('email', e.target.value)}
                                    placeholder="Nhập email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium">
                                    Mật khẩu *
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e: any) => handleInputChange('password', e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-medium">
                                    Số điện thoại đăng nhập *
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e: any) => handleInputChange('phone', e.target.value)}
                                    placeholder="Nhập số điện thoại"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Profiles */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Hồ sơ bệnh nhân</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addProfile}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm hồ sơ
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {profiles.map((profile, index) => (
                            <div key={`${profile.id}-${index}`} className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Hồ sơ {index + 1}</h4>
                                    {profiles.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeProfile(profile.id!)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`firstName-${profile.id}`}
                                            className="block text-sm font-medium"
                                        >
                                            Tên *
                                        </label>
                                        <input
                                            id={`firstName-${profile.id}`}
                                            value={profile.firstName}
                                            onChange={(e: any) =>
                                                handleProfileChange(profile.id!, 'firstName', e.target.value)
                                            }
                                            placeholder="Nhập tên"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`lastName-${profile.id}`} className="block text-sm font-medium">
                                            Họ *
                                        </label>
                                        <input
                                            id={`lastName-${profile.id}`}
                                            value={profile.lastName}
                                            onChange={(e: any) =>
                                                handleProfileChange(profile.id!, 'lastName', e.target.value)
                                            }
                                            placeholder="Nhập họ"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`dateOfBirth-${profile.id}`}
                                            className="block text-sm font-medium"
                                        >
                                            Ngày sinh *
                                        </label>
                                        <input
                                            id={`dateOfBirth-${profile.id}`}
                                            type="date"
                                            value={profile.dateOfBirth}
                                            onChange={(e: any) =>
                                                handleProfileChange(profile.id!, 'dateOfBirth', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`gender-${profile.id}`} className="block text-sm font-medium">
                                            Giới tính *
                                        </label>
                                        <select
                                            value={profile.gender}
                                            onChange={(e: any) =>
                                                handleProfileChange(profile.id!, 'gender', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                                            className="block text-sm font-medium"
                                        >
                                            Số điện thoại *
                                        </label>
                                        <input
                                            id={`profilePhone-${profile.id}`}
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e: any) =>
                                                handleProfileChange(profile.id!, 'phone', e.target.value)
                                            }
                                            placeholder="Nhập số điện thoại"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`relationship-${profile.id}`}
                                            className="block text-sm font-medium"
                                        >
                                            Mối quan hệ *
                                        </label>
                                        <select
                                            value={profile.relationship}
                                            onChange={(e: any) =>
                                                handleProfileChange(profile.id!, 'relationship', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            {relationshipOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor={`address-${profile.id}`} className="block text-sm font-medium">
                                        Địa chỉ
                                    </label>
                                    <textarea
                                        id={`address-${profile.id}`}
                                        value={profile.address}
                                        onChange={(e: any) =>
                                            handleProfileChange(profile.id!, 'address', e.target.value)
                                        }
                                        placeholder="Nhập địa chỉ"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={createPatient.isPending}>
                        {createPatient.isPending ? 'Đang tạo...' : 'Tạo bệnh nhân'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
