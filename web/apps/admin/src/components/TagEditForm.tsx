'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField, TextareaField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save, Edit2, X } from 'lucide-react'
import { useTag, useUpdateTag } from '@/shared/hooks'
import type { UpdateTagRequest } from '@/shared/lib/api-services/tags.service'
import { Spinner } from '@workspace/ui/components/Spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'

interface FieldErrors {
    name?: string
    description?: string
}

interface TagEditFormProps {
    tagId: number
}

export function TagEditForm({ tagId }: TagEditFormProps) {
    const router = useRouter()
    const { data: tag, isLoading, error } = useTag(tagId)
    const updateTag = useUpdateTag()
    const [isEditMode, setIsEditMode] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Load tag data into form
    useEffect(() => {
        if (tag) {
            setFormData({
                name: tag.name || '',
                description: tag.description || '',
            })
        }
    }, [tag])

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.name.trim()) {
            errors.name = 'Tên tag không được để trống'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: UpdateTagRequest = {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
        }

        try {
            await updateTag.mutateAsync({ id: tagId, data: requestData })
            setIsEditMode(false)
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

    const handleCancel = () => {
        // Reset form to original tag data
        if (tag) {
            setFormData({
                name: tag.name || '',
                description: tag.description || '',
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

    if (error || !tag) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-muted-foreground">Không thể tải thông tin tag. Vui lòng thử lại sau.</p>
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
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết tag</h1>
                        <p className="text-sm text-muted-foreground mt-1">Xem và chỉnh sửa thông tin tag</p>
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
                    <CardTitle>Thông tin tag</CardTitle>
                    <CardDescription>Chi tiết về tag trong hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Tên tag <span className="text-red-500">*</span>
                            </Label>
                            <InputField
                                id="name"
                                type="text"
                                placeholder="Nhập tên tag"
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

                        {/* Slug (read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <InputField
                                id="slug"
                                type="text"
                                value={tag.slug}
                                disabled
                                className="font-mono bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Slug được tạo tự động từ tên tag</p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả tag</Label>
                            <TextareaField
                                id="description"
                                placeholder="Nhập mô tả tag (không bắt buộc)"
                                value={formData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    handleInputChange('description', e.target.value)
                                }
                                disabled={!isEditMode}
                                rows={4}
                            />
                        </div>

                        {/* Usage Count */}
                        <div className="space-y-2">
                            <Label>Số lần sử dụng</Label>
                            <div>
                                <Badge variant="secondary" className="text-base px-3 py-1">
                                    {tag.usageCount}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Số lượng câu hỏi đang sử dụng tag này</p>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Ngày tạo</Label>
                                <p className="text-sm text-foreground">
                                    {new Date(tag.createdAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Cập nhật lần cuối</Label>
                                <p className="text-sm text-foreground">
                                    {tag.updatedAt ? new Date(tag.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'}
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
                                    isDisabled={updateTag.isPending}
                                    className="flex items-center space-x-2"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{updateTag.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
