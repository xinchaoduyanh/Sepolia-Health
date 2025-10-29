'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { InputField, TextareaField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save } from 'lucide-react'
import { useCreateArticle } from '@/shared/hooks'
import type { CreateArticleRequest } from '@/shared/lib/api-services/articles.service'
import { AvatarUpload } from './AvatarUpload'

interface FieldErrors {
    title?: string
    content?: string
    image?: string
}

export function ArticleCreateForm() {
    const router = useRouter()
    const createArticle = useCreateArticle()

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề không được để trống'
        }

        if (!formData.content.trim()) {
            errors.content = 'Nội dung không được để trống'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: CreateArticleRequest = {
            title: formData.title.trim(),
            content: formData.content.trim(),
            image: formData.image || undefined,
        }

        try {
            await createArticle.mutateAsync(requestData)
            router.push('/dashboard/article-management/article-list')
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Quay lại</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tạo bài viết mới</h1>
                    <p className="text-sm text-muted-foreground mt-1">Thêm bài viết mới vào hệ thống</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="image">Ảnh bài viết (không bắt buộc)</Label>
                        <AvatarUpload value={formData.image} onChange={value => handleInputChange('image', value)} />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Tiêu đề <span className="text-red-500">*</span>
                        </Label>
                        <InputField
                            id="title"
                            type="text"
                            placeholder="Nhập tiêu đề bài viết"
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

                    {/* Content */}
                    <div className="space-y-2">
                        <Label htmlFor="content">
                            Nội dung <span className="text-red-500">*</span>
                        </Label>
                        <TextareaField
                            id="content"
                            placeholder="Nhập nội dung bài viết"
                            value={formData.content}
                            onChange={e => handleInputChange('content', e.target.value)}
                            rows={10}
                            className={fieldErrors.content ? 'border-red-500' : ''}
                        />
                        {fieldErrors.content && (
                            <div className="flex items-center space-x-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>{fieldErrors.content}</span>
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
                            isDisabled={createArticle.isPending}
                            className="flex items-center space-x-2"
                        >
                            <Save className="h-4 w-4" />
                            <span>{createArticle.isPending ? 'Đang tạo...' : 'Tạo bài viết'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
