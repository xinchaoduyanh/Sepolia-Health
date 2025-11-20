'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField, TextareaField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save } from 'lucide-react'
import { useCreateTag } from '@/shared/hooks'
import type { CreateTagRequest } from '@/shared/lib/api-services/tags.service'

interface FieldErrors {
    name?: string
    description?: string
}

export function TagCreateForm() {
    const router = useRouter()
    const createTag = useCreateTag()

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

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

        const requestData: CreateTagRequest = {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
        }

        try {
            await createTag.mutateAsync(requestData)
            router.push('/dashboard/admin/tag-management/tag-list')
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
                    <h1 className="text-3xl font-bold text-foreground">Tạo tag mới</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm tag mới vào hệ thống</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                            className={fieldErrors.name ? 'border-red-500' : ''}
                        />
                        {fieldErrors.name && (
                            <div className="flex items-center space-x-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>{fieldErrors.name}</span>
                            </div>
                        )}
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
                            rows={4}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Hủy
                        </Button>
                        <Button type="submit" isDisabled={createTag.isPending} className="flex items-center space-x-2">
                            <Save className="h-4 w-4" />
                            <span>{createTag.isPending ? 'Đang tạo...' : 'Tạo tag'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
