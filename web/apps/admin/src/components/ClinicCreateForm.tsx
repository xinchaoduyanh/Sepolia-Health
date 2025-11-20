'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField, TextareaField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { ArrowLeft, AlertCircle, Save } from 'lucide-react'
import { useCreateClinic } from '@/shared/hooks'
import type { CreateClinicRequest } from '@/shared/lib/api-services/clinics.service'

interface FieldErrors {
    name?: string
    address?: string
    phone?: string
    email?: string
    description?: string
}

export function ClinicCreateForm() {
    const router = useRouter()
    const createClinic = useCreateClinic()

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        isActive: true,
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.name.trim()) {
            errors.name = 'Tên phòng khám không được để trống'
        }

        if (!formData.address.trim()) {
            errors.address = 'Địa chỉ không được để trống'
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email không hợp lệ'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: CreateClinicRequest = {
            name: formData.name.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim() || undefined,
            email: formData.email.trim() || undefined,
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
        }

        try {
            await createClinic.mutateAsync(requestData)
            router.push('/dashboard/clinic-management/clinic-list')
        } catch (error) {
            // Error is handled by the mutation
        }
    }

    const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Clear error when user starts typing
        if (fieldErrors[field as keyof FieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Quay lại</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tạo phòng khám mới</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm phòng khám mới vào hệ thống</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Tên phòng khám <span className="text-red-500">*</span>
                        </Label>
                        <InputField
                            id="name"
                            type="text"
                            placeholder="Nhập tên phòng khám"
                            value={formData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            className={fieldErrors.name ? 'border-red-500' : ''}
                        />
                        {fieldErrors.name && (
                            <div className="flex items-center space-x-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>{fieldErrors.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">
                            Địa chỉ <span className="text-red-500">*</span>
                        </Label>
                        <TextareaField
                            id="address"
                            placeholder="Nhập địa chỉ phòng khám"
                            value={formData.address}
                            onChange={e => handleInputChange('address', e.target.value)}
                            rows={3}
                            className={fieldErrors.address ? 'border-red-500' : ''}
                        />
                        {fieldErrors.address && (
                            <div className="flex items-center space-x-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>{fieldErrors.address}</span>
                            </div>
                        )}
                    </div>

                    {/* Phone and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <InputField
                                id="phone"
                                type="tel"
                                placeholder="Nhập số điện thoại"
                                value={formData.phone}
                                onChange={e => handleInputChange('phone', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <InputField
                                id="email"
                                type="email"
                                placeholder="Nhập email liên hệ"
                                value={formData.email}
                                onChange={e => handleInputChange('email', e.target.value)}
                                className={fieldErrors.email ? 'border-red-500' : ''}
                            />
                            {fieldErrors.email && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả phòng khám</Label>
                        <TextareaField
                            id="description"
                            placeholder="Nhập mô tả về phòng khám"
                            value={formData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isActive"
                            isSelected={formData.isActive}
                            onChange={isSelected => handleInputChange('isActive', isSelected)}
                        >
                            Phòng khám đang hoạt động
                        </Checkbox>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Hủy
                        </Button>
                        <Button type="submit" isDisabled={createClinic.isPending} className="flex items-center space-x-2">
                            <Save className="h-4 w-4" />
                            <span>{createClinic.isPending ? 'Đang tạo...' : 'Tạo phòng khám'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
