'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField, TextareaField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save, Edit2, X } from 'lucide-react'
import { useService, useUpdateService } from '@/shared/hooks'
import type { UpdateServiceRequest } from '@/shared/lib/api-services/services.service'
import { Spinner } from '@workspace/ui/components/Spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'

interface FieldErrors {
    name?: string
    price?: string
    duration?: string
    description?: string
}

interface ServiceEditFormProps {
    serviceId: number
}

export function ServiceEditForm({ serviceId }: ServiceEditFormProps) {
    const router = useRouter()
    const { data: service, isLoading, error } = useService(serviceId)
    const updateService = useUpdateService()
    const [isEditMode, setIsEditMode] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration: '',
        description: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Load service data into form
    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || '',
                price: service.price?.toString() || '',
                duration: service.duration?.toString() || '',
                description: service.description || '',
            })
        }
    }, [service])

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.name.trim()) {
            errors.name = 'Tên dịch vụ không được để trống'
        }

        const price = parseFloat(formData.price)
        if (!formData.price || isNaN(price) || price < 0) {
            errors.price = 'Giá phải là số dương'
        }

        const duration = parseInt(formData.duration)
        if (!formData.duration || isNaN(duration) || duration < 1) {
            errors.duration = 'Thời lượng phải là số nguyên dương'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: UpdateServiceRequest = {
            name: formData.name.trim(),
            price: parseFloat(formData.price),
            duration: parseInt(formData.duration),
            description: formData.description.trim() || undefined,
        }

        try {
            await updateService.mutateAsync({ id: serviceId, data: requestData })
            setIsEditMode(false)
        } catch (_error) {
            // Error is handled by the mutation
        }
    }

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Clear error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleCancel = () => {
        // Reset form to original service data
        if (service) {
            setFormData({
                name: service.name || '',
                price: service.price?.toString() || '',
                duration: service.duration?.toString() || '',
                description: service.description || '',
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

    if (error || !service) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-muted-foreground">Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.</p>
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
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết dịch vụ</h1>
                        <p className="text-sm text-muted-foreground mt-1">Xem và chỉnh sửa thông tin dịch vụ</p>
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
                    <CardTitle>Thông tin dịch vụ</CardTitle>
                    <CardDescription>Chi tiết về dịch vụ trong hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Tên dịch vụ <span className="text-red-500">*</span>
                            </Label>
                            <InputField
                                id="name"
                                type="text"
                                placeholder="Nhập tên dịch vụ"
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

                        {/* Price and Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Giá (VNĐ) <span className="text-red-500">*</span>
                                </Label>
                                <InputField
                                    id="price"
                                    type="number"
                                    placeholder="Nhập giá dịch vụ"
                                    value={formData.price}
                                    onChange={e => handleInputChange('price', e.target.value)}
                                    disabled={!isEditMode}
                                    className={fieldErrors.price ? 'border-red-500' : ''}
                                    min="0"
                                    step="1000"
                                />
                                {fieldErrors.price && (
                                    <div className="flex items-center space-x-2 text-sm text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{fieldErrors.price}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">
                                    Thời lượng (phút) <span className="text-red-500">*</span>
                                </Label>
                                <InputField
                                    id="duration"
                                    type="number"
                                    placeholder="Nhập thời lượng"
                                    value={formData.duration}
                                    onChange={e => handleInputChange('duration', e.target.value)}
                                    disabled={!isEditMode}
                                    className={fieldErrors.duration ? 'border-red-500' : ''}
                                    min="1"
                                />
                                {fieldErrors.duration && (
                                    <div className="flex items-center space-x-2 text-sm text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{fieldErrors.duration}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả dịch vụ</Label>
                            <TextareaField
                                id="description"
                                placeholder="Nhập mô tả dịch vụ (không bắt buộc)"
                                value={formData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    handleInputChange('description', e.target.value)
                                }
                                disabled={!isEditMode}
                                rows={4}
                            />
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Ngày tạo</Label>
                                <p className="text-sm text-foreground">
                                    {new Date(service.createdAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Cập nhật lần cuối</Label>
                                <p className="text-sm text-foreground">
                                    {new Date(service.updatedAt).toLocaleString('vi-VN')}
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
                                    isDisabled={updateService.isPending}
                                    className="flex items-center space-x-2"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{updateService.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
