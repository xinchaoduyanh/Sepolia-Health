'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { BsSelect } from '@workspace/ui/components/Select'
import { Camera, Upload } from 'lucide-react'

// Specialty options
const specialtyOptions = [
    { id: 'dermatology', name: 'Da liễu' },
    { id: 'nutrition', name: 'Dinh dưỡng' },
    { id: 'hematology', name: 'Huyết học' },
    { id: 'ophthalmology', name: 'Mắt' },
    { id: 'andrology', name: 'Nam Khoa' },
    { id: 'pediatrics', name: 'Nhi Khoa' },
]

// Site options
const siteOptions = [
    { id: 'hanoi', name: 'Hà Nội' },
    { id: 'hcm', name: 'TP. Hồ Chí Minh' },
    { id: 'danang', name: 'Đà Nẵng' },
    { id: 'cantho', name: 'Cần Thơ' },
]

// CM options
const cmOptions = [
    { id: 'cm1', name: 'CM1' },
    { id: 'cm2', name: 'CM2' },
    { id: 'cm3', name: 'CM3' },
]

export default function DoctorManagementPage() {
    const [doctorType, setDoctorType] = useState<'vinmec' | 'external'>('vinmec')
    const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('male')
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['dermatology', 'nutrition', 'hematology'])
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        uid: '',
        site: '',
        cm: '',
        profileId: '',
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSpecialtyChange = (specialtyId: string) => {
        setSelectedSpecialties(prev =>
            prev.includes(specialtyId) ? prev.filter(id => id !== specialtyId) : [...prev, specialtyId],
        )
    }

    const handleSave = () => {
        console.log('Saving doctor:', {
            doctorType,
            gender,
            selectedSpecialties,
            formData,
        })
        // Handle save logic here
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý bác sĩ</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm và quản lý thông tin bác sĩ</p>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="text-slate-500 dark:text-slate-500">Chăm sóc sức khỏe từ xa</span> &gt;{' '}
                <span className="text-slate-700 dark:text-slate-300">Quản lý bác sĩ</span>
            </div>

            {/* Main Content */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <div className="p-6 space-y-8">
                    {/* Doctor Type Selection */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Kiểu bác sĩ</h2>
                        <div className="flex space-x-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="doctorType"
                                    value="vinmec"
                                    checked={doctorType === 'vinmec'}
                                    onChange={e => setDoctorType(e.target.value as 'vinmec' | 'external')}
                                    className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Bác sĩ Vinmec</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="doctorType"
                                    value="external"
                                    checked={doctorType === 'external'}
                                    onChange={e => setDoctorType(e.target.value as 'vinmec' | 'external')}
                                    className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Bác sĩ ngoài Vinmec</span>
                            </label>
                        </div>
                    </div>

                    {/* General Information */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-foreground">Thông tin chung</h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Avatar Section */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Ảnh đại diện
                                </label>
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                Ảnh đại diện
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                                        <Upload className="w-4 h-4" />
                                        <span>Tải lên</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Gender Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Giới tính
                                    </label>
                                    <div className="flex space-x-6">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="male"
                                                checked={gender === 'male'}
                                                onChange={e =>
                                                    setGender(e.target.value as 'male' | 'female' | 'unknown')
                                                }
                                                className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                                            />
                                            <span className="text-slate-700 dark:text-slate-300">Nam</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="female"
                                                checked={gender === 'female'}
                                                onChange={e =>
                                                    setGender(e.target.value as 'male' | 'female' | 'unknown')
                                                }
                                                className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                                            />
                                            <span className="text-slate-700 dark:text-slate-300">Nữ</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="unknown"
                                                checked={gender === 'unknown'}
                                                onChange={e =>
                                                    setGender(e.target.value as 'male' | 'female' | 'unknown')
                                                }
                                                className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                                            />
                                            <span className="text-slate-700 dark:text-slate-300">Không xác định</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Input Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Họ tên
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={e => handleInputChange('fullName', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                                            placeholder="Nhập họ tên"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => handleInputChange('phone', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => handleInputChange('email', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                                            placeholder="Nhập email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            UID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.uid}
                                            onChange={e => handleInputChange('uid', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                                            placeholder="Nhập UID"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-foreground">Thông tin bổ sung</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Site</label>
                                <BsSelect
                                    value={formData.site}
                                    onChange={setFormData.site}
                                    options={siteOptions}
                                    placeholder="Chọn site"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CM</label>
                                <BsSelect
                                    value={formData.cm}
                                    onChange={setFormData.cm}
                                    options={cmOptions}
                                    placeholder="Chọn CM"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Specialty Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Chuyên khoa
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {specialtyOptions.map(specialty => (
                                    <label key={specialty.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedSpecialties.includes(specialty.id)}
                                            onChange={() => handleSpecialtyChange(specialty.id)}
                                            className="w-4 h-4 text-slate-600 focus:ring-slate-500 rounded"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300">{specialty.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Profile ID Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Profile ID thông tin bác sĩ tại Vinmec.com
                            </label>
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={formData.profileId}
                                    onChange={e => handleInputChange('profileId', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                                    placeholder="Nhập Profile ID"
                                />
                                <Button variant="outline" className="px-6">
                                    Cập nhật
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-t border-border flex justify-end">
                    <Button onClick={handleSave} className="px-8 py-2 bg-slate-600 hover:bg-slate-700 text-white">
                        Lưu bác sĩ
                    </Button>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
                Copyright © 2025 Sepolia. All rights reserved.
            </div>
        </div>
    )
}
