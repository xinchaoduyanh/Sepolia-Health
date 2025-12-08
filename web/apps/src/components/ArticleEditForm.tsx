'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { Label } from '@workspace/ui/components/Label'
import { ArrowLeft, AlertCircle, Save } from 'lucide-react'
import { useArticle, useUpdateArticle } from '@/shared/hooks'
import type { UpdateArticleRequest } from '@/shared/lib/api-services/articles.service'
import { AvatarUpload } from './AvatarUpload'
import { ArticleMarkdownEditor } from './ArticleMarkdownEditor'

interface FieldErrors {
    title?: string
    contentMarkdown?: string
    image?: string
}

export function ArticleEditForm() {
    const router = useRouter()
    const params = useParams()
    const articleId = params?.id ? parseInt(params.id as string) : 0
    const updateArticle = useUpdateArticle()
    const { data: article, isLoading } = useArticle(articleId)

    const [formData, setFormData] = useState({
        title: '',
        contentMarkdown: '',
        image: '',
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    useEffect(() => {
        if (article) {
            setFormData({
                title: article.title || '',
                contentMarkdown: article.contentMarkdown || '',
                image: article.image || '',
            })
        }
    }, [article])

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề không được để trống'
        }

        if (!formData.contentMarkdown.trim()) {
            errors.contentMarkdown = 'Nội dung không được để trống'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: UpdateArticleRequest = {
            title: formData.title.trim(),
            contentMarkdown: formData.contentMarkdown.trim(),
            image: formData.image || undefined,
        }

        try {
            await updateArticle.mutateAsync({ id: articleId, data: requestData })
            router.push('/admin/articles/article-list')
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

    if (isLoading) {
        return (
            <div className="space-y-6">
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
                        <h1 className="text-3xl font-bold text-foreground">Đang tải...</h1>
                    </div>
                </div>
            </div>
        )
    }

    if (!article) {
        return (
            <div className="space-y-6">
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
                        <h1 className="text-3xl font-bold text-foreground">Bài viết không tồn tại</h1>
                    </div>
                </div>
            </div>
        )
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
                    <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa bài viết</h1>
                    <p className="text-sm text-muted-foreground mt-1">Chỉnh sửa thông tin bài viết</p>
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
                        <input
                            id="title"
                            type="text"
                            placeholder="Nhập tiêu đề bài viết"
                            value={formData.title}
                            onChange={e => handleInputChange('title', e.target.value)}
                            className={`w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                fieldErrors.title ? 'border-red-500' : ''
                            }`}
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
                        <Label htmlFor="contentMarkdown">
                            Nội dung <span className="text-red-500">*</span>
                        </Label>
                        <ArticleMarkdownEditor
                            id="contentMarkdown"
                            value={formData.contentMarkdown}
                            onChange={value => handleInputChange('contentMarkdown', value)}
                            placeholder="Nhập nội dung bài viết dạng Markdown..."
                            error={fieldErrors.contentMarkdown}
                            disabled={updateArticle.isPending}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateArticle.isPending}
                            className="flex items-center space-x-2"
                        >
                            <Save className="h-4 w-4" />
                            <span>{updateArticle.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
