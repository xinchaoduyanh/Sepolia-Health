'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save, Check, Upload, X } from 'lucide-react'
import {
    useCreatePromotionDisplay,
    useUpdatePromotionDisplay,
    usePromotionDisplay,
    usePromotions,
    useApplyPromotionToDisplay,
    useActivatePromotionDisplay,
} from '@/shared/hooks'
import type {
    CreatePromotionDisplayRequest,
    UpdatePromotionDisplayRequest,
} from '@/shared/lib/api-services/promotion-displays.service'
import { uploadService } from '@/shared/lib/api-services/upload.service'

export default function PromotionDisplayEditPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const displayId = searchParams.get('id') ? parseInt(searchParams.get('id')!, 10) : null

    const createDisplay = useCreatePromotionDisplay()
    const updateDisplay = useUpdatePromotionDisplay()
    const applyPromotion = useApplyPromotionToDisplay()
    const activateDisplay = useActivatePromotionDisplay()
    const { data: existingDisplay } = usePromotionDisplay(displayId || 0)
    const { data: promotionsResponse } = usePromotions({}, true)

    const isEditMode = !!displayId
    const promotions = promotionsResponse?.promotions || []

    const [formData, setFormData] = useState({
        promotionId: 0,
        displayOrder: 0,
        isActive: false,
        backgroundColor: '["#1E3A5F", "#2C5282"]',
        textColor: '#FFFFFF',
        buttonColor: 'rgba(255,255,255,0.25)',
        buttonTextColor: '#FFFFFF',
        buttonText: 'Nhận ngay',
        iconName: 'gift-outline',
        imageUrl: '',
    })

    const [fieldErrors, setFieldErrors] = useState<any>({})
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')

    // Load existing data if editing
    useEffect(() => {
        if (existingDisplay && isEditMode) {
            setFormData({
                promotionId: existingDisplay.promotionId,
                displayOrder: existingDisplay.displayOrder,
                isActive: existingDisplay.isActive,
                backgroundColor: existingDisplay.backgroundColor,
                textColor: existingDisplay.textColor,
                buttonColor: existingDisplay.buttonColor,
                buttonTextColor: existingDisplay.buttonTextColor,
                buttonText: existingDisplay.buttonText || 'Nhận ngay',
                iconName: existingDisplay.iconName || 'gift-outline',
                imageUrl: existingDisplay.imageUrl || '',
            })
        }
    }, [existingDisplay, isEditMode])

    // Map icon name to emoji
    const getIconEmoji = (iconName: string): string => {
        const iconMap: Record<string, string> = {
            'gift-outline': '🎁',
            gift: '🎁',
            'star-outline': '⭐',
            star: '⭐',
            'heart-outline': '❤️',
            heart: '❤️',
            'trophy-outline': '🏆',
            trophy: '🏆',
            'sparkles-outline': '✨',
            sparkles: '✨',
            'rocket-outline': '🚀',
            rocket: '🚀',
            'cash-outline': '💰',
            cash: '💰',
            'card-outline': '💳',
            card: '💳',
            'pricetag-outline': '🏷️',
            pricetag: '🏷️',
        }
        return iconMap[iconName] || '🎁'
    }

    // Parse gradient colors for preview
    const getGradientColors = (): string[] => {
        try {
            const parsed = JSON.parse(formData.backgroundColor)
            if (Array.isArray(parsed)) {
                return parsed
            }
        } catch {
            // If not JSON, try to split by comma
            const colors = formData.backgroundColor
                .split(',')
                .map(c => c.trim().replaceAll('[', '').replaceAll(']', '').replaceAll('"', ''))
            if (colors.length >= 2) {
                return colors
            }
        }
        return ['#1E3A5F', '#2C5282']
    }

    const selectedPromotion = promotions.find(p => p.id === formData.promotionId)

    const validateForm = (): boolean => {
        const errors: any = {}

        if (!formData.promotionId || formData.promotionId === 0) {
            errors.promotionId = 'Vui lòng chọn promotion'
        }

        if (!formData.backgroundColor.trim()) {
            errors.backgroundColor = 'Màu nền không được để trống'
        }

        if (!formData.textColor.trim()) {
            errors.textColor = 'Màu chữ không được để trống'
        }

        if (!formData.buttonColor.trim()) {
            errors.buttonColor = 'Màu nút không được để trống'
        }

        if (!formData.buttonTextColor.trim()) {
            errors.buttonTextColor = 'Màu chữ nút không được để trống'
        }

        if (!formData.buttonText.trim()) {
            errors.buttonText = 'Text nút không được để trống'
        }

        if (!formData.iconName.trim()) {
            errors.iconName = 'Icon không được để trống'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: CreatePromotionDisplayRequest | UpdatePromotionDisplayRequest = {
            promotionId: formData.promotionId,
            displayOrder: formData.displayOrder,
            isActive: formData.isActive,
            backgroundColor: formData.backgroundColor,
            textColor: formData.textColor,
            buttonColor: formData.buttonColor,
            buttonTextColor: formData.buttonTextColor,
            buttonText: formData.buttonText,
            iconName: formData.iconName,
            imageUrl: formData.imageUrl || undefined,
        }

        try {
            if (isEditMode && displayId) {
                await updateDisplay.mutateAsync({ id: displayId, data: requestData as UpdatePromotionDisplayRequest })
                if (formData.isActive) {
                    await activateDisplay.mutateAsync(displayId)
                }
            } else {
                await createDisplay.mutateAsync(requestData as CreatePromotionDisplayRequest)
                if (formData.isActive) {
                    // Get the created display ID - in real app, you'd get this from response
                    // For now, we'll just redirect and let user activate manually
                }
            }
            router.push('/admin/promotion-display-management')
        } catch (_error) {
            // Error is handled by the mutation
        }
    }

    const handleApplyPromotion = async () => {
        if (!displayId || !formData.promotionId) return

        try {
            await applyPromotion.mutateAsync({
                id: displayId,
                data: { promotionId: formData.promotionId },
            })
        } catch (_error) {
            // Error handled by mutation
        }
    }

    const gradientColors = getGradientColors()

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
                        {isEditMode ? 'Chỉnh sửa cấu hình hiển thị' : 'Tạo cấu hình hiển thị mới'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Cấu hình UI cho promotion trên app</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-card rounded-lg shadow-sm border border-border">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Select Promotion */}
                        <div className="space-y-2">
                            <Label htmlFor="promotionId">
                                Chọn Promotion <span className="text-red-500">*</span>
                            </Label>
                            <select
                                id="promotionId"
                                value={formData.promotionId}
                                onChange={e =>
                                    setFormData(prev => ({ ...prev, promotionId: parseInt(e.target.value) }))
                                }
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value={0}>-- Chọn promotion --</option>
                                {promotions.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.title} ({p.code})
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.promotionId && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.promotionId}</span>
                                </div>
                            )}
                            {isEditMode && displayId && formData.promotionId > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleApplyPromotion}
                                    className="mt-2"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Áp dụng promotion này
                                </Button>
                            )}
                        </div>

                        {/* Display Order */}
                        <div className="space-y-2">
                            <Label htmlFor="displayOrder">Thứ tự hiển thị</Label>
                            <InputField
                                id="displayOrder"
                                type="number"
                                min="0"
                                value={formData.displayOrder.toString()}
                                onChange={e =>
                                    setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))
                                }
                            />
                        </div>

                        {/* Is Active */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="isActive">Kích hoạt (sẽ tự động deactivate display khác)</Label>
                            </div>
                        </div>

                        {/* Background Options */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Label className="text-base font-semibold">
                                    Hình nền <span className="text-red-500">*</span>
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    (Chọn màu nền gradient HOẶC tải ảnh lên)
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Option 1: Gradient Background */}
                                <div className="space-y-2 border rounded-lg p-4 bg-card">
                                    <Label htmlFor="backgroundColor" className="font-medium">
                                        Màu nền gradient
                                    </Label>
                                    <div className="space-y-2">
                                        <InputField
                                            id="backgroundColor"
                                            type="text"
                                            placeholder='["#1E3A5F", "#2C5282"]'
                                            value={formData.backgroundColor}
                                            onChange={e =>
                                                setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))
                                            }
                                            className={fieldErrors.backgroundColor ? 'border-red-500' : ''}
                                            disabled={!!formData.imageUrl}
                                        />
                                        <div className="flex items-center space-x-2">
                                            <Label className="text-xs text-muted-foreground">Màu 1:</Label>
                                            <input
                                                type="color"
                                                disabled={!!formData.imageUrl}
                                                value={(() => {
                                                    try {
                                                        const parsed = JSON.parse(formData.backgroundColor)
                                                        if (Array.isArray(parsed) && parsed[0]) return parsed[0]
                                                    } catch {
                                                        const colors = formData.backgroundColor.split(',')
                                                        if (colors[0])
                                                            return colors[0]
                                                                .trim()
                                                                .replaceAll('[', '')
                                                                .replaceAll(']', '')
                                                                .replaceAll('"', '')
                                                    }
                                                    return '#1E3A5F'
                                                })()}
                                                onChange={e => {
                                                    const color1 = e.target.value
                                                    const color2 = (() => {
                                                        try {
                                                            const parsed = JSON.parse(formData.backgroundColor)
                                                            if (Array.isArray(parsed) && parsed[1]) return parsed[1]
                                                        } catch {
                                                            const colors = formData.backgroundColor.split(',')
                                                            if (colors[1])
                                                                return colors[1]
                                                                    .trim()
                                                                    .replaceAll('[', '')
                                                                    .replaceAll(']', '')
                                                                    .replaceAll('"', '')
                                                        }
                                                        return '#2C5282'
                                                    })()
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        backgroundColor: JSON.stringify([color1, color2]),
                                                    }))
                                                }}
                                                className="w-12 h-12 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Chọn màu gradient 1"
                                            />
                                            <Label className="text-xs text-muted-foreground">Màu 2:</Label>
                                            <input
                                                type="color"
                                                disabled={!!formData.imageUrl}
                                                value={(() => {
                                                    try {
                                                        const parsed = JSON.parse(formData.backgroundColor)
                                                        if (Array.isArray(parsed) && parsed[1]) return parsed[1]
                                                    } catch {
                                                        const colors = formData.backgroundColor.split(',')
                                                        if (colors[1])
                                                            return colors[1]
                                                                .trim()
                                                                .replaceAll('[', '')
                                                                .replaceAll(']', '')
                                                                .replaceAll('"', '')
                                                    }
                                                    return '#2C5282'
                                                })()}
                                                onChange={e => {
                                                    const color2 = e.target.value
                                                    const color1 = (() => {
                                                        try {
                                                            const parsed = JSON.parse(formData.backgroundColor)
                                                            if (Array.isArray(parsed) && parsed[0]) return parsed[0]
                                                        } catch {
                                                            const colors = formData.backgroundColor.split(',')
                                                            if (colors[0])
                                                                return colors[0].trim().replace(/[\[\]"]/g, '')
                                                        }
                                                        return '#1E3A5F'
                                                    })()
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        backgroundColor: JSON.stringify([color1, color2]),
                                                    }))
                                                }}
                                                className="w-12 h-12 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Chọn màu gradient 2"
                                            />
                                            <div
                                                className="w-16 h-12 border rounded"
                                                style={{
                                                    background: `linear-gradient(135deg, ${(() => {
                                                        try {
                                                            const parsed = JSON.parse(formData.backgroundColor)
                                                            if (Array.isArray(parsed)) return parsed.join(', ')
                                                        } catch {
                                                            const colors = formData.backgroundColor.split(',')
                                                            if (colors.length >= 2) {
                                                                return colors
                                                                    .map(c => c.trim().replace(/[\[\]"]/g, ''))
                                                                    .join(', ')
                                                            }
                                                        }
                                                        return '#1E3A5F, #2C5282'
                                                    })()})`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {fieldErrors.backgroundColor && (
                                        <div className="flex items-center space-x-2 text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>{fieldErrors.backgroundColor}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Option 2: Image Upload */}
                                <div className="space-y-2 border rounded-lg p-4 bg-card">
                                    <Label htmlFor="imageUrl" className="font-medium">
                                        Hình ảnh tải lên
                                    </Label>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            id="imageUpload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async e => {
                                                const file = e.target.files?.[0]
                                                if (!file) return

                                                // Validate file size (10MB)
                                                if (file.size > 10 * 1024 * 1024) {
                                                    setUploadError('Kích thước file không được vượt quá 10MB')
                                                    return
                                                }

                                                // Validate file type
                                                if (!file.type.startsWith('image/')) {
                                                    setUploadError('Vui lòng chọn file ảnh')
                                                    return
                                                }

                                                setIsUploading(true)
                                                setUploadError('')

                                                try {
                                                    const url = await uploadService.uploadFile(file)
                                                    setFormData(prev => ({ ...prev, imageUrl: url }))
                                                } catch (error: any) {
                                                    console.error('Upload error:', error)
                                                    setUploadError(error.message || 'Lỗi khi upload ảnh')
                                                } finally {
                                                    setIsUploading(false)
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="imageUpload"
                                            className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors w-full"
                                        >
                                            <Upload className="h-4 w-4" />
                                            <span>{isUploading ? 'Đang tải lên...' : 'Chọn ảnh'}</span>
                                        </label>

                                        {formData.imageUrl && (
                                            <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-md">
                                                <span className="text-xs text-muted-foreground truncate flex-1">
                                                    ✓ Đã tải ảnh lên
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                                    className="text-destructive hover:text-destructive/80 ml-2"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {uploadError && (
                                            <div className="flex items-center space-x-2 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                <span>{uploadError}</span>
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground">PNG/JPG, tối đa 10MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Text Color */}
                        <div className="space-y-2">
                            <Label htmlFor="textColor">
                                Màu chữ <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center space-x-2">
                                <InputField
                                    id="textColor"
                                    type="text"
                                    placeholder="#FFFFFF"
                                    value={formData.textColor}
                                    onChange={e => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                                    className={fieldErrors.textColor ? 'border-red-500' : ''}
                                />
                                <input
                                    type="color"
                                    value={formData.textColor.startsWith('#') ? formData.textColor : '#FFFFFF'}
                                    onChange={e => {
                                        setFormData(prev => ({ ...prev, textColor: e.target.value }))
                                    }}
                                    className="w-12 h-12 border rounded cursor-pointer"
                                    title="Chọn màu"
                                />
                                <div
                                    className="w-10 h-10 border rounded"
                                    style={{ backgroundColor: formData.textColor }}
                                />
                            </div>
                            {fieldErrors.textColor && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.textColor}</span>
                                </div>
                            )}
                        </div>

                        {/* Button Color */}
                        <div className="space-y-2">
                            <Label htmlFor="buttonColor">
                                Màu nút <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center space-x-2">
                                <InputField
                                    id="buttonColor"
                                    type="text"
                                    placeholder="rgba(255,255,255,0.25)"
                                    value={formData.buttonColor}
                                    onChange={e => setFormData(prev => ({ ...prev, buttonColor: e.target.value }))}
                                    className={fieldErrors.buttonColor ? 'border-red-500' : ''}
                                />
                                <input
                                    type="color"
                                    value={
                                        formData.buttonColor.startsWith('#')
                                            ? formData.buttonColor
                                            : formData.buttonColor.startsWith('rgba')
                                              ? '#FFFFFF'
                                              : '#FFFFFF'
                                    }
                                    onChange={e => {
                                        // Convert hex to rgba with opacity
                                        const hex = e.target.value
                                        const r = parseInt(hex.slice(1, 3), 16)
                                        const g = parseInt(hex.slice(3, 5), 16)
                                        const b = parseInt(hex.slice(5, 7), 16)
                                        setFormData(prev => ({
                                            ...prev,
                                            buttonColor: `rgba(${r},${g},${b},0.25)`,
                                        }))
                                    }}
                                    className="w-12 h-12 border rounded cursor-pointer"
                                    title="Chọn màu"
                                />
                                <div
                                    className="w-10 h-10 border rounded"
                                    style={{ backgroundColor: formData.buttonColor }}
                                />
                            </div>
                            {fieldErrors.buttonColor && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.buttonColor}</span>
                                </div>
                            )}
                        </div>

                        {/* Button Text Color */}
                        <div className="space-y-2">
                            <Label htmlFor="buttonTextColor">
                                Màu chữ nút <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center space-x-2">
                                <InputField
                                    id="buttonTextColor"
                                    type="text"
                                    placeholder="#FFFFFF"
                                    value={formData.buttonTextColor}
                                    onChange={e => setFormData(prev => ({ ...prev, buttonTextColor: e.target.value }))}
                                    className={fieldErrors.buttonTextColor ? 'border-red-500' : ''}
                                />
                                <input
                                    type="color"
                                    value={
                                        formData.buttonTextColor.startsWith('#') ? formData.buttonTextColor : '#FFFFFF'
                                    }
                                    onChange={e => {
                                        setFormData(prev => ({ ...prev, buttonTextColor: e.target.value }))
                                    }}
                                    className="w-12 h-12 border rounded cursor-pointer"
                                    title="Chọn màu"
                                />
                                <div
                                    className="w-10 h-10 border rounded"
                                    style={{ backgroundColor: formData.buttonTextColor }}
                                />
                            </div>
                            {fieldErrors.buttonTextColor && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.buttonTextColor}</span>
                                </div>
                            )}
                        </div>

                        {/* Button Text */}
                        <div className="space-y-2">
                            <Label htmlFor="buttonText">
                                Text nút <span className="text-red-500">*</span>
                            </Label>
                            <InputField
                                id="buttonText"
                                type="text"
                                placeholder="Nhận ngay"
                                value={formData.buttonText}
                                onChange={e => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                                className={fieldErrors.buttonText ? 'border-red-500' : ''}
                            />
                            {fieldErrors.buttonText && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.buttonText}</span>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Text hiển thị trên button (ví dụ: "Nhận ngay", "Claim Now", "Xem ngay",...)
                            </p>
                        </div>

                        {/* Icon Name */}
                        <div className="space-y-2">
                            <Label htmlFor="iconName">
                                Icon <span className="text-red-500">*</span>
                            </Label>
                            <select
                                id="iconName"
                                value={formData.iconName}
                                onChange={e => setFormData(prev => ({ ...prev, iconName: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            >
                                <option value="gift-outline">🎁 Quà tặng (gift-outline)</option>
                                <option value="gift">🎁 Quà tặng đầy (gift)</option>
                                <option value="star-outline">⭐ Ngôi sao (star-outline)</option>
                                <option value="star">⭐ Ngôi sao đầy (star)</option>
                                <option value="heart-outline">❤️ Trái tim (heart-outline)</option>
                                <option value="heart">❤️ Trái tim đầy (heart)</option>
                                <option value="trophy-outline">🏆 Cúp (trophy-outline)</option>
                                <option value="trophy">🏆 Cúp đầy (trophy)</option>
                                <option value="sparkles-outline">✨ Lấp lánh (sparkles-outline)</option>
                                <option value="sparkles">✨ Lấp lánh đầy (sparkles)</option>
                                <option value="rocket-outline">🚀 Tên lửa (rocket-outline)</option>
                                <option value="rocket">🚀 Tên lửa đầy (rocket)</option>
                                <option value="cash-outline">💰 Tiền (cash-outline)</option>
                                <option value="cash">💰 Tiền đầy (cash)</option>
                                <option value="card-outline">💳 Thẻ (card-outline)</option>
                                <option value="card">💳 Thẻ đầy (card)</option>
                                <option value="pricetag-outline">🏷️ Nhãn giá (pricetag-outline)</option>
                                <option value="pricetag">🏷️ Nhãn giá đầy (pricetag)</option>
                            </select>
                            {fieldErrors.iconName && (
                                <div className="flex items-center space-x-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fieldErrors.iconName}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                isDisabled={createDisplay.isPending || updateDisplay.isPending}
                                className="flex items-center space-x-2"
                            >
                                <Save className="h-4 w-4" />
                                <span>{isEditMode ? 'Cập nhật' : 'Tạo mới'}</span>
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Preview */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h2 className="text-xl font-semibold mb-4">Preview</h2>
                    <div
                        className="rounded-2xl shadow-lg overflow-hidden relative"
                        style={{
                            minHeight: '200px',
                        }}
                    >
                        {/* Background - Image or Gradient */}
                        {formData.imageUrl ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: `url(${formData.imageUrl})`,
                                }}
                            />
                        ) : (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
                                }}
                            />
                        )}

                        {/* Overlay for image background */}
                        {formData.imageUrl && <div className="absolute inset-0 bg-black/30" />}

                        {/* Content */}
                        <div className="relative p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <h3 className="text-2xl font-bold mb-2" style={{ color: formData.textColor }}>
                                        {selectedPromotion?.title || 'Tiêu đề promotion'}
                                    </h3>
                                    <p className="text-sm mb-4" style={{ color: formData.textColor, opacity: 0.9 }}>
                                        {selectedPromotion?.description || 'Mô tả promotion sẽ hiển thị ở đây'}
                                    </p>
                                    <button
                                        className="px-5 py-3 rounded-full border-2 flex items-center space-x-2"
                                        style={{
                                            backgroundColor: formData.buttonColor,
                                            borderColor: formData.buttonTextColor,
                                        }}
                                    >
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: formData.buttonTextColor }}
                                        >
                                            {formData.buttonText}
                                        </span>
                                    </button>
                                </div>
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                >
                                    <span style={{ fontSize: '40px' }}>{getIconEmoji(formData.iconName)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
