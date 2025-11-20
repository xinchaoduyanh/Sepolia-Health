'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField, TextareaField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { ArrowLeft, AlertCircle, Save, Edit2, X } from 'lucide-react'
import { useClinic, useUpdateClinic } from '@/shared/hooks'
import type { UpdateClinicRequest } from '@/shared/lib/api-services/clinics.service'
import { Spinner } from '@workspace/ui/components/Spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'

interface FieldErrors {
    name?: string
    address?: string
    phone?: string
    email?: string
    description?: string
}

interface ClinicEditFormProps {
    clinicId: number
}

export function ClinicEditForm({ clinicId }: ClinicEditFormProps) {
    const router = useRouter()
    const { data: clinic, isLoading, error } = useClinic(clinicId)
    const updateClinic = useUpdateClinic()
    const [isEditMode, setIsEditMode] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        isActive: true,
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Load clinic data into form
    useEffect(() => {
        if (clinic) {
            setFormData({
                name: clinic.name || '',
                address: clinic.address || '',
                phone: clinic.phone || '',
                email: clinic.email || '',
                description: clinic.description || '',
                isActive: clinic.isActive ?? true,
            })
        }
    }, [clinic])

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

        const requestData: UpdateClinicRequest = {
            name: formData.name.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim() || undefined,
            email: formData.email.trim() || undefined,
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
        }

        try {
            await updateClinic.mutateAsync({ id: clinicId, data: requestData })
            setIsEditMode(false)
        } catch (_error) {
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

    const handleCancel = () => {
        // Reset form to original clinic data
        if (clinic) {
            setFormData({
                name: clinic.name || '',
                address: clinic.address || '',
                phone: clinic.phone || '',
                email: clinic.email || '',
                description: clinic.description || '',
                isActive: clinic.isActive ?? true,
            })
        }
        setFieldErrors({})
        setIsEditMode(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner />
            </div>
        )
    }

    if (error || !clinic) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-muted-foreground">Không thể tải thông tin phòng khám. Vui lòng thử lại sau.</p>
                    <Button className="mt-4" onClick={() => router.back()}>
                        Quay lại
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Quay lại</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết phòng khám</h1>
                        <p className="text-sm text-muted-foreground mt-1">Xem và chỉnh sửa thông tin phòng khám</p>
                    </div>
                </div>
                {!isEditMode && (
                    <Button onClick={() => setIsEditMode(true)} className="flex items-center space-x-2">
                        <Edit2 className="h-4 w-4" />
                        <span>Chỉnh sửa</span>
                    </Button>
                )}
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin phòng khám</CardTitle>
                    <CardDescription>Chi tiết về phòng khám trong hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                disabled={!isEditMode}
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
                                disabled={!isEditMode}
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
                                    disabled={!isEditMode}
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
                                    disabled={!isEditMode}
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
                                disabled={!isEditMode}
                                rows={4}
                            />
                        </div>

                        {/* Is Active */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isActive"
                                isSelected={formData.isActive}
                                onChange={isSelected => handleInputChange('isActive', isSelected)}
                                isDisabled={!isEditMode}
                            >
                                Phòng khám đang hoạt động
                            </Checkbox>
                            {!isEditMode && (
                                <Badge
                                    className={
                                        formData.isActive
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ml-2'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 ml-2'
                                    }
                                >
                                    {formData.isActive ? 'Hoạt động' : 'Tạm ngừng'}
                                </Badge>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Ngày tạo</Label>
                                <p className="text-sm text-foreground">
                                    {new Date(clinic.createdAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Cập nhật lần cuối</Label>
                                <p className="text-sm text-foreground">
                                    {new Date(clinic.updatedAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        {isEditMode && (
                            <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex items-center space-x-2"
                                >
                                    <X className="h-4 w-4" />
                                    <span>Hủy</span>
                                </Button>
                                <Button
                                    type="submit"
                                    isDisabled={updateClinic.isPending}
                                    className="flex items-center space-x-2"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{updateClinic.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
