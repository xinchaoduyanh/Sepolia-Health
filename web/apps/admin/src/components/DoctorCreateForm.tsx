'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Select } from '@workspace/ui/components/Select'
import { Textfield } from '@workspace/ui/components/Textfield'
import { RadioGroup } from '@workspace/ui/components/RadioGroup'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { Card } from '@workspace/ui/components/Card'
import { Uploader } from '@workspace/ui/components/Uploader'
import { Camera, Upload, Save, ArrowLeft } from 'lucide-react'

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

interface DoctorCreateFormProps {
    onBack: () => void
    onSave: (doctorData: any) => void
}

export function DoctorCreateForm({ onBack, onSave }: DoctorCreateFormProps) {
    const [doctorType, setDoctorType] = useState<'vinmec' | 'external'>('vinmec')
    const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('male')
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        uid: '',
        site: '',
        cm: '',
        profileId: '',
    })
    const [avatar, setAvatar] = useState<File | null>(null)

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSpecialtyChange = (specialtyId: string, checked: boolean) => {
        setSelectedSpecialties(prev =>
            checked 
                ? [...prev, specialtyId]
                : prev.filter(id => id !== specialtyId)
        )
    }

    const handleSave = () => {
        const doctorData = {
            doctorType,
            gender,
            selectedSpecialties,
            formData,
            avatar,
        }
        onSave(doctorData)
    }

    const handleAvatarUpload = (files: File[]) => {
        if (files.length > 0) {
            setAvatar(files[0])
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Quay lại</span>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Tạo lập hồ sơ bác sĩ</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Thêm thông tin bác sĩ mới vào hệ thống
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <Card className="p-6">
                <div className="space-y-8">
                    {/* Doctor Type Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Kiểu bác sĩ</h3>
                        <RadioGroup
                            value={doctorType}
                            onChange={setDoctorType}
                            options={[
                                { value: 'vinmec', label: 'Bác sĩ Vinmec' },
                                { value: 'external', label: 'Bác sĩ ngoài Vinmec' }
                            ]}
                        />
                    </div>

                    {/* General Information */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin chung</h3>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Avatar Section */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Ảnh đại diện
                                </label>
                                <div className="flex flex-col items-center space-y-4">
                                    {avatar ? (
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600">
                                            <img
                                                src={URL.createObjectURL(avatar)}
                                                alt="Avatar preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                                            <div className="text-center">
                                                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    Ảnh đại diện
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <Uploader
                                        onUpload={handleAvatarUpload}
                                        accept="image/*"
                                        maxFiles={1}
                                        className="w-full"
                                    >
                                        <Button variant="outline" size="sm" className="flex items-center space-x-2">
                                            <Upload className="w-4 h-4" />
                                            <span>Tải lên</span>
                                        </Button>
                                    </Uploader>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Gender Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Giới tính
                                    </label>
                                    <RadioGroup
                                        value={gender}
                                        onChange={setGender}
                                        options={[
                                            { value: 'male', label: 'Nam' },
                                            { value: 'female', label: 'Nữ' },
                                            { value: 'unknown', label: 'Không xác định' }
                                        ]}
                                    />
                                </div>

                                {/* Input Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Họ tên *
                                        </label>
                                        <Textfield
                                            value={formData.fullName}
                                            onChange={(value) => handleInputChange('fullName', value)}
                                            placeholder="Nhập họ tên"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Số điện thoại *
                                        </label>
                                        <Textfield
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(value) => handleInputChange('phone', value)}
                                            placeholder="Nhập số điện thoại"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Email *
                                        </label>
                                        <Textfield
                                            type="email"
                                            value={formData.email}
                                            onChange={(value) => handleInputChange('email', value)}
                                            placeholder="Nhập email"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            UID
                                        </label>
                                        <Textfield
                                            value={formData.uid}
                                            onChange={(value) => handleInputChange('uid', value)}
                                            placeholder="Nhập UID"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-foreground">Thông tin bổ sung</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Site *</label>
                                <Select
                                    value={formData.site}
                                    onChange={(value) => handleInputChange('site', value)}
                                    options={siteOptions}
                                    placeholder="Chọn site"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CM *</label>
                                <Select
                                    value={formData.cm}
                                    onChange={(value) => handleInputChange('cm', value)}
                                    options={cmOptions}
                                    placeholder="Chọn CM"
                                    required
                                />
                            </div>
                        </div>

                        {/* Specialty Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Chuyên khoa *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {specialtyOptions.map(specialty => (
                                    <div key={specialty.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={specialty.id}
                                            checked={selectedSpecialties.includes(specialty.id)}
                                            onChange={(checked) => handleSpecialtyChange(specialty.id, checked)}
                                        />
                                        <label 
                                            htmlFor={specialty.id}
                                            className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                                        >
                                            {specialty.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Profile ID Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Profile ID thông tin bác sĩ tại Vinmec.com
                            </label>
                            <div className="flex space-x-3">
                                <Textfield
                                    value={formData.profileId}
                                    onChange={(value) => handleInputChange('profileId', value)}
                                    placeholder="Nhập Profile ID"
                                    className="flex-1"
                                />
                                <Button variant="outline" className="px-6">
                                    Cập nhật
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                    <Button variant="outline" onClick={onBack}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave} className="flex items-center space-x-2">
                        <Save className="h-4 w-4" />
                        <span>Lưu bác sĩ</span>
                    </Button>
                </div>
            </Card>
        </div>
    )
}
