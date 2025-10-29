'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Input'
import { Textarea } from '@workspace/ui/components/Textarea'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save } from 'lucide-react'
import { useCreateService } from '@/shared/hooks'
import type { CreateServiceRequest } from '@/shared/lib/api-services/services.service'

interface FieldErrors {
    name?: string
    price?: string
    duration?: string
    description?: string
}

export function ServiceCreateForm() {
    const router = useRouter()
    const createService = useCreateService()

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration: '',
        description: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

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

        const requestData: CreateServiceRequest = {
            name: formData.name.trim(),
            price: parseFloat(formData.price),
            duration: parseInt(formData.duration),
            description: formData.description.trim() || undefined,
        }

        try {
            await createService.mutateAsync(requestData)
            router.push('/dashboard/service-management/service-list')
        } catch (error) {
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Quay lại</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tạo dịch vụ mới</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm dịch vụ mới vào hệ thống</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên dịch vụ <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Nhập tên dịch vụ"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
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
                            <Label htmlFor="price">Giá (VNĐ) <span className="text-red-500">*</span></Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="Nhập giá dịch vụ"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', e.target.value)}
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
                            <Label htmlFor="duration">Thời lượng (phút) <span className="text-red-500">*</span></Label>
                            <Input
                                id="duration"
                                type="number"
                                placeholder="Nhập thời lượng"
                                value={formData.duration}
                                onChange={(e) => handleInputChange('duration', e.target.value)}
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
                        <Textarea
                            id="description"
                            placeholder="Nhập mô tả dịch vụ (không bắt buộc)"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={createService.isPending}
                            className="flex items-center space-x-2"
                        >
                            <Save className="h-4 w-4" />
                            <span>{createService.isPending ? 'Đang tạo...' : 'Tạo dịch vụ'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
