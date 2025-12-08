'use client'

import { useParams, useRouter } from 'next/navigation'
import { useArticle, useDeleteArticle } from '@/shared/hooks'
import { Spinner } from '@workspace/ui/components/Spinner'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Label } from '@workspace/ui/components/Label'

export default function ArticleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const articleId = params?.id ? parseInt(params.id as string) : 0
    const { data: article, isLoading, error } = useArticle(articleId)
    const deleteArticle = useDeleteArticle()

    const handleDelete = () => {
        if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            deleteArticle.mutate(articleId, {
                onSuccess: () => {
                    router.push('/admin/article-management/article-list')
                },
            })
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner />
            </div>
        )
    }

    if (error || !article) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-muted-foreground">Không thể tải thông tin bài viết. Vui lòng thử lại sau.</p>
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
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết bài viết</h1>
                        <p className="text-sm text-muted-foreground mt-1">Xem thông tin chi tiết bài viết</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex items-center space-x-2"
                    isDisabled={deleteArticle.isPending}
                >
                    <Trash2 className="h-4 w-4" />
                    <span>{deleteArticle.isPending ? 'Đang xóa...' : 'Xóa bài viết'}</span>
                </Button>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>{article.title}</CardTitle>
                    <CardDescription>Thông tin chi tiết về bài viết</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Image */}
                    {article.image && (
                        <div className="space-y-2">
                            <Label>Hình ảnh</Label>
                            <div className="rounded-lg overflow-hidden border border-border">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-auto max-h-96 object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-2">
                        <Label>Nội dung</Label>
                        <div className="prose max-w-none p-4 bg-muted rounded-lg border border-border">
                            <div className="whitespace-pre-wrap text-foreground">{article.content}</div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Ngày tạo</Label>
                            <p className="text-sm text-foreground">
                                {new Date(article.createdAt).toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Cập nhật lần cuối</Label>
                            <p className="text-sm text-foreground">
                                {new Date(article.updatedAt).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
