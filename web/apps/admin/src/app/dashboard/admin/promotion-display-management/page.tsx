'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Plus, Edit, Eye } from 'lucide-react'
import { useActivePromotionDisplay, usePromotionDisplays } from '@/shared/hooks'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Badge } from '@workspace/ui/components/Badge'

export default function PromotionDisplayManagementPage() {
    const { data: activeDisplay, isLoading: isLoadingActive } = useActivePromotionDisplay(true)
    const { data: allDisplays, isLoading: isLoadingAll } = usePromotionDisplays(true)

    const displays = allDisplays || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý hiển thị promotion</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Cấu hình UI và chọn promotion hiển thị trên app
                    </p>
                </div>
                <Button
                    className="flex items-center space-x-2"
                    onClick={() => (window.location.href = '/dashboard/admin/promotion-display-management/edit')}
                >
                    <Plus className="h-4 w-4" />
                    <span>{activeDisplay ? 'Chỉnh sửa UI' : 'Tạo cấu hình mới'}</span>
                </Button>
            </div>

            {/* Active Display */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Cấu hình đang active</h2>
                {isLoadingActive ? (
                    <Skeleton className="h-32 w-full" />
                ) : activeDisplay ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Info */}
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Badge className="bg-green-500">Active</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Promotion: {activeDisplay.promotion?.title || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Màu nền: </span>
                                            <span className="font-mono">{activeDisplay.backgroundColor}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Màu chữ: </span>
                                            <span className="font-mono">{activeDisplay.textColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        (window.location.href = `/dashboard/admin/promotion-display-management/edit?id=${activeDisplay.id}`)
                                    }
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Chỉnh sửa
                                </Button>
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-card rounded-lg border border-border">
                                <h3 className="text-sm font-semibold mb-3">Preview</h3>
                                <div
                                    className="rounded-2xl p-6 shadow-lg"
                                    style={{
                                        background: (() => {
                                            try {
                                                const parsed = JSON.parse(activeDisplay.backgroundColor)
                                                if (Array.isArray(parsed)) {
                                                    return `linear-gradient(135deg, ${parsed[0]}, ${parsed[1]})`
                                                }
                                            } catch {
                                                const colors = activeDisplay.backgroundColor
                                                    .split(',')
                                                    .map((c: string) => c.trim().replace(/[\[\]"]/g, ''))
                                                if (colors.length >= 2) {
                                                    return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
                                                }
                                            }
                                            return 'linear-gradient(135deg, #1E3A5F, #2C5282)'
                                        })(),
                                        minHeight: '150px',
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 pr-4">
                                            <h4
                                                className="text-xl font-bold mb-2"
                                                style={{ color: activeDisplay.textColor }}
                                            >
                                                {activeDisplay.promotion?.title || 'Tiêu đề promotion'}
                                            </h4>
                                            <p
                                                className="text-sm mb-4"
                                                style={{ color: activeDisplay.textColor, opacity: 0.9 }}
                                            >
                                                {activeDisplay.promotion?.description || 'Mô tả promotion'}
                                            </p>
                                            <button
                                                className="px-5 py-3 rounded-full border-2 flex items-center space-x-2"
                                                style={{
                                                    backgroundColor: activeDisplay.buttonColor,
                                                    borderColor: activeDisplay.buttonTextColor,
                                                    opacity: 0.4,
                                                }}
                                            >
                                                <span
                                                    className="text-sm font-semibold"
                                                    style={{ color: activeDisplay.buttonTextColor }}
                                                >
                                                    Nhận ngay
                                                </span>
                                            </button>
                                        </div>
                                        {activeDisplay.imageUrl ? (
                                            <img
                                                src={activeDisplay.imageUrl}
                                                alt="Promotion"
                                                className="w-16 h-16 rounded-full object-cover"
                                                style={{ border: `2px solid ${activeDisplay.textColor}`, opacity: 0.9 }}
                                                onError={e => {
                                                    e.currentTarget.style.display = 'none'
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                                    if (fallback) fallback.style.display = 'flex'
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="w-16 h-16 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                display: activeDisplay.imageUrl ? 'none' : 'flex',
                                            }}
                                        >
                                            <span style={{ color: activeDisplay.textColor, fontSize: '24px' }}>🎁</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có cấu hình active</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() =>
                                (window.location.href = '/dashboard/admin/promotion-display-management/edit')
                            }
                        >
                            Tạo cấu hình mới
                        </Button>
                    </div>
                )}
            </div>

            {/* All Displays (including archived) */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Lịch sử cấu hình</h2>
                {isLoadingAll ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                ) : displays.length > 0 ? (
                    <div className="space-y-2">
                        {displays.map(display => (
                            <div
                                key={display.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        {display.isActive ? (
                                            <Badge className="bg-green-500">Active</Badge>
                                        ) : (
                                            <Badge variant="outline">Archived</Badge>
                                        )}
                                        <span className="font-medium">{display.promotion?.title || 'N/A'}</span>
                                        {display.archivedAt && (
                                            <span className="text-xs text-muted-foreground">
                                                (Archived: {new Date(display.archivedAt).toLocaleDateString('vi-VN')})
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Display Order: {display.displayOrder}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            (window.location.href = `/dashboard/admin/promotion-display-management/edit?id=${display.id}`)
                                        }
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có cấu hình nào</p>
                    </div>
                )}
            </div>
        </div>
    )
}
