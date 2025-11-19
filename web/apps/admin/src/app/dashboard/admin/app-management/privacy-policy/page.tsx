'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { TextareaField } from '@workspace/ui/components/InputField'
import { InputField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { useAppTermsByType, useCreateAppTerms, useUpdateAppTerms, useActivateAppTerms } from '@/shared/hooks'
import { AppTermsType } from '@/shared/lib/api-services/app-terms.service'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Save, CheckCircle2 } from 'lucide-react'

export default function PrivacyPolicyPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [isEditing, setIsEditing] = useState(false)

    const { data: activeTerms, isLoading, refetch } = useAppTermsByType(AppTermsType.PRIVACY_POLICY)
    const createMutation = useCreateAppTerms()
    const updateMutation = useUpdateAppTerms()
    const activateMutation = useActivateAppTerms()

    useEffect(() => {
        if (activeTerms && !isEditing) {
            setTitle(activeTerms.title)
            setContent(activeTerms.content)
        }
    }, [activeTerms, isEditing])

    const handleSave = async () => {
        if (!title || !content) {
            alert('Vui lòng điền đầy đủ thông tin')
            return
        }

        if (activeTerms) {
            await updateMutation.mutateAsync({
                id: activeTerms.id,
                data: { title, content },
            })
        } else {
            await createMutation.mutateAsync({
                type: AppTermsType.PRIVACY_POLICY,
                title,
                content,
            })
        }
        await refetch()
        setIsEditing(false)
    }

    const handleActivate = async () => {
        if (!activeTerms) return
        await activateMutation.mutateAsync(activeTerms.id)
        await refetch()
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Chính sách bảo vệ dữ liệu cá nhân</h1>
                    <p className="text-muted-foreground mt-2">Quản lý chính sách bảo vệ dữ liệu cá nhân của Sepolia</p>
                </div>
                <div className="flex gap-2">
                    {activeTerms && !activeTerms.isActive && (
                        <Button onClick={handleActivate} variant="outline">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Kích hoạt bản này
                        </Button>
                    )}
                    <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
                        {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Nội dung chính sách</CardTitle>
                    <CardDescription>
                        {activeTerms && (
                            <>
                                Phiên bản {activeTerms.version} -{' '}
                                {activeTerms.isActive ? (
                                    <span className="text-green-600">Đang áp dụng</span>
                                ) : (
                                    <span className="text-gray-500">Chưa áp dụng</span>
                                )}
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Tiêu đề</Label>
                        <InputField
                            id="title"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                            disabled={!isEditing}
                            placeholder="Nhập tiêu đề chính sách"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Nội dung</Label>
                        <TextareaField
                            id="content"
                            value={content}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                            disabled={!isEditing}
                            placeholder="Nhập nội dung chính sách (HTML hoặc markdown)"
                            className="min-h-[400px] font-mono text-sm"
                        />
                    </div>
                    {isEditing && (
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSave}
                                isDisabled={createMutation.isPending || updateMutation.isPending}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Lưu thay đổi
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
