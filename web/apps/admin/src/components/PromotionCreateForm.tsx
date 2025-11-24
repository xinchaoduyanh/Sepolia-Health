'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save } from 'lucide-react'
import { useCreatePromotion, useUpdatePromotion, usePromotion } from '@/shared/hooks'
import type { CreatePromotionRequest, UpdatePromotionRequest } from '@/shared/lib/api-services/promotions.service'

interface FieldErrors {
    title?: string
    code?: string
    discountPercent?: string
    maxDiscountAmount?: string
    validFrom?: string
    validTo?: string
}

interface PromotionCreateFormProps {
    promotionId?: number
}

export function PromotionCreateForm({ promotionId }: PromotionCreateFormProps) {
    const router = useRouter()
    const createPromotion = useCreatePromotion()
    const updatePromotion = useUpdatePromotion()
    const { data: existingPromotion } = usePromotion(promotionId || 0)

    const isEditMode = !!promotionId

    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        discountPercent: 0,
        maxDiscountAmount: 0,
        validFrom: '',
        validTo: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Load existing data if editing
    React.useEffect(() => {
        if (existingPromotion && isEditMode) {
            setFormData({
                title: existingPromotion.title,
                code: existingPromotion.code,
                description: existingPromotion.description || '',
                discountPercent: existingPromotion.discountPercent,
                maxDiscountAmount: existingPromotion.maxDiscountAmount,
                validFrom: existingPromotion.validFrom
                    ? new Date(existingPromotion.validFrom).toISOString().split('T')[0]
                    : '',
                validTo: existingPromotion.validTo
                    ? new Date(existingPromotion.validTo).toISOString().split('T')[0]
                    : '',
            })
        }
    }, [existingPromotion, isEditMode])

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề không được để trống'
        }

        if (!formData.code.trim()) {
            errors.code = 'Mã voucher không được để trống'
        }

        if (formData.discountPercent < 0 || formData.discountPercent > 100) {
            errors.discountPercent = 'Phần trăm giảm giá phải từ 0 đến 100'
        }

        if (formData.maxDiscountAmount < 1000) {
            errors.maxDiscountAmount = 'Số tiền giảm giá tối đa phải >= 1000 VND'
        }
        if (!Number.isInteger(formData.maxDiscountAmount)) {
            errors.maxDiscountAmount = 'Số tiền giảm giá tối đa phải là số nguyên'
        }

        if (!formData.validFrom) {
            errors.validFrom = 'Ngày bắt đầu không được để trống'
        }

        if (!formData.validTo) {
            errors.validTo = 'Ngày kết thúc không được để trống'
        }

        if (formData.validFrom && formData.validTo) {
            const from = new Date(formData.validFrom)
            const to = new Date(formData.validTo)
            if (from >= to) {
                errors.validTo = 'Ngày kết thúc phải sau ngày bắt đầu'
            }
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: CreatePromotionRequest | UpdatePromotionRequest = {
            title: formData.title.trim(),
            code: formData.code.trim(),
            description: formData.description.trim() || undefined,
            discountPercent: formData.discountPercent,
            maxDiscountAmount: formData.maxDiscountAmount,
            validFrom: new Date(formData.validFrom).toISOString(),
            validTo: new Date(formData.validTo).toISOString(),
        }

        try {
            if (isEditMode && promotionId) {
                await updatePromotion.mutateAsync({ id: promotionId, data: requestData as UpdatePromotionRequest })
            } else {
                await createPromotion.mutateAsync(requestData as CreatePromotionRequest)
            }
            router.push('/dashboard/admin/promotion-management')
        } catch (_error) {
            // Error is handled by the mutation
        }
    }

    const handleInputChange = (field: keyof typeof formData, value: string | number) => {
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
                    <h1 className="text-3xl font-bold text-foreground">
                        {isEditMode ? 'Chỉnh sửa voucher' : 'Tạo voucher mới'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isEditMode ? 'Cập nhật thông tin voucher' : 'Thêm voucher mới vào hệ thống'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Tiêu đề <span className="text-red-500">*</span>
                        </Label>
                        <InputField
                            id="title"
                            type="text"
                            placeholder="Ví dụ: Ưu đãi Giáng Sinh"
                            value={formData.title}
                            onChange={e => handleInputChange('title', e.target.value)}
                            className={fieldErrors.title ? 'border-red-500' : ''}
                        />
                        {fieldErrors.title && (
                            <div className="flex items-center space-x-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>{fieldErrors.title}</span>
                            </div>
                        )}
                    </div>

                    {/* Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Mã voucher <span className="text-red-500">*</span>
                        </Label>
                        <InputField
                            id="code"
                            type="text"
                            placeholder="Ví dụ: CHRISTMAS2024"
                            value={formData.code}
                            onChange={e => handleInputChange('code', e.target.value.toUpperCase())}
                            className={fieldErrors.code ? 'border-red-500' : ''}
                        />
                        {fieldErrors.code && (
                            <div className="flex items-center space-x-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>{fieldErrors.code}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <InputField
                            id="description"
                            type="text"
                            placeholder="Mô tả chương trình khuyến mãi"
                            value={formData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    {/* Discount Percent and Max Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="discountPercent">
                                Phần trăm giảm giá (%) <span className="text-red-500">*</span>
                            </Label>
                            <InputField
                                id="discountPercent"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="10"
                                value={formData.discountPercent.toString()}
                                onChange={e => handleInputChange('discountPercent', parseFloat(e.target.value) || 0)}
                                className={fieldErrors.discountPercent ? 'border-red-500' : ''}
                            />
                            {fieldErrors.discountPercent && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.discountPercent}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxDiscountAmount">
                                Giảm giá tối đa (VND) <span className="text-red-500">*</span>
                            </Label>
                            <InputField
                                id="maxDiscountAmount"
                                type="number"
                                min="1000"
                                step="1000"
                                placeholder="100000"
                                value={formData.maxDiscountAmount.toString()}
                                onChange={e => {
                                    const value = parseInt(e.target.value, 10) || 0
                                    handleInputChange('maxDiscountAmount', value)
                                }}
                                className={fieldErrors.maxDiscountAmount ? 'border-red-500' : ''}
                            />
                            {fieldErrors.maxDiscountAmount && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.maxDiscountAmount}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Valid From and Valid To */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="validFrom">
                                Ngày bắt đầu <span className="text-red-500">*</span>
                            </Label>
                            <InputField
                                id="validFrom"
                                type="date"
                                value={formData.validFrom}
                                onChange={e => handleInputChange('validFrom', e.target.value)}
                                className={fieldErrors.validFrom ? 'border-red-500' : ''}
                            />
                            {fieldErrors.validFrom && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.validFrom}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="validTo">
                                Ngày kết thúc <span className="text-red-500">*</span>
                            </Label>
                            <InputField
                                id="validTo"
                                type="date"
                                value={formData.validTo}
                                onChange={e => handleInputChange('validTo', e.target.value)}
                                className={fieldErrors.validTo ? 'border-red-500' : ''}
                            />
                            {fieldErrors.validTo && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.validTo}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            isDisabled={createPromotion.isPending || updatePromotion.isPending}
                            className="flex items-center space-x-2"
                        >
                            <Save className="h-4 w-4" />
                            <span>{isEditMode ? 'Cập nhật' : 'Tạo mới'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
