'use client'

import { Button } from '@workspace/ui/components/Button'
import { Plus, Edit, Eye } from 'lucide-react'
import { useActivePromotionDisplay, usePromotionDisplays } from '@/shared/hooks'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Badge } from '@workspace/ui/components/Badge'

export default function PromotionDisplayManagementPage() {
    const { data: activeDisplay, isLoading: isLoadingActive } = useActivePromotionDisplay(true)
    const { data: allDisplays, isLoading: isLoadingAll } = usePromotionDisplays(true)

    const displays = allDisplays || []

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý hiển thị ưu đãi</h1>
                    <p className="text-sm text-muted-foreground mt-1">Cấu hình UI và chọn ưu đãi hiển thị trên app</p>
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
                <h2 className="text-xl font-semibold mb-4">Cấu hình đang hoạt động</h2>
                {isLoadingActive ? (
                    <Skeleton className="h-32 w-full" />
                ) : activeDisplay ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Info */}
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Badge className="bg-green-500">Đang hoạt động</Badge>
                                        <span className="text-sm font-medium">
                                            Ưu đãi: {activeDisplay.promotion?.title || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {activeDisplay.imageUrl ? (
                                            <div>
                                                <span className="text-muted-foreground">Hình nền: </span>
                                                <span className="text-green-600 font-medium">✓ Có ảnh</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-muted-foreground">Màu nền: </span>
                                                <span className="font-mono text-xs">
                                                    {activeDisplay.backgroundColor}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-muted-foreground">Màu chữ: </span>
                                            <span className="font-mono">{activeDisplay.textColor}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Màu nút: </span>
                                            <span className="font-mono">{activeDisplay.buttonColor}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Màu chữ nút: </span>
                                            <span className="font-mono">{activeDisplay.buttonTextColor}</span>
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
                                    className="rounded-2xl shadow-lg overflow-hidden relative"
                                    style={{
                                        minHeight: '150px',
                                    }}
                                >
                                    {/* Background - Image or Gradient */}
                                    {activeDisplay.imageUrl ? (
                                        <div
                                            className="absolute inset-0 bg-cover bg-center"
                                            style={{
                                                backgroundImage: `url(${activeDisplay.imageUrl})`,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: (() => {
                                                    try {
                                                        const parsed = JSON.parse(activeDisplay.backgroundColor)
                                                        if (Array.isArray(parsed) && parsed.length >= 2) {
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
                                            }}
                                        />
                                    )}

                                    {/* Overlay for image background */}
                                    {activeDisplay.imageUrl && <div className="absolute inset-0 bg-black/30" />}

                                    {/* Content */}
                                    <div className="relative p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 pr-4">
                                                <h4
                                                    className="text-xl font-bold mb-2"
                                                    style={{ color: activeDisplay.textColor }}
                                                >
                                                    {activeDisplay.promotion?.title || 'Tiêu đề ưu đãi'}
                                                </h4>
                                                <p
                                                    className="text-sm mb-4"
                                                    style={{ color: activeDisplay.textColor, opacity: 0.9 }}
                                                >
                                                    {activeDisplay.promotion?.description || 'Mô tả ưu đãi'}
                                                </p>
                                                <button
                                                    className="px-5 py-3 rounded-full border-2 flex items-center space-x-2"
                                                    style={{
                                                        backgroundColor: activeDisplay.buttonColor,
                                                        borderColor: activeDisplay.buttonTextColor,
                                                    }}
                                                >
                                                    <span
                                                        className="text-sm font-semibold"
                                                        style={{ color: activeDisplay.buttonTextColor }}
                                                    >
                                                        {activeDisplay.buttonText || 'Nhẫn ngay'}
                                                    </span>
                                                </button>
                                            </div>
                                            <div
                                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                                style={{
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                }}
                                            >
                                                <span style={{ fontSize: '32px' }}>
                                                    {getIconEmoji(activeDisplay.iconName || 'gift-outline')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có cấu hình đang hoạt động</p>
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
                    <div className="space-y-4">
                        {displays.map(display => (
                            <div key={display.id} className="border rounded-lg hover:bg-muted/50 overflow-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                                    {/* Info */}
                                    <div className="lg:col-span-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            {display.isActive ? (
                                                <Badge className="bg-green-500">Đang hoạt động</Badge>
                                            ) : (
                                                <Badge variant="outline">Đã lưu trữ</Badge>
                                            )}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Ưu đãi: </span>
                                                <span className="font-medium">{display.promotion?.title || 'N/A'}</span>
                                            </div>
                                            {display.imageUrl ? (
                                                <div>
                                                    <span className="text-muted-foreground">Hình nền: </span>
                                                    <span className="text-green-600 font-medium">✓ Có ảnh</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-muted-foreground">Màu nền: </span>
                                                    <span className="font-mono text-xs">{display.backgroundColor}</span>
                                                </div>
                                            )}
                                            {display.archivedAt && (
                                                <div className="text-xs text-muted-foreground">
                                                    Lưu trữ: {new Date(display.archivedAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() =>
                                                (window.location.href = `/dashboard/admin/promotion-display-management/edit?id=${display.id}`)
                                            }
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Xem chi tiết
                                        </Button>
                                    </div>

                                    {/* Preview */}
                                    <div className="lg:col-span-2">
                                        <div
                                            className="rounded-xl shadow-md overflow-hidden relative"
                                            style={{
                                                minHeight: '130px',
                                            }}
                                        >
                                            {/* Background - Image or Gradient */}
                                            {display.imageUrl ? (
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center"
                                                    style={{
                                                        backgroundImage: `url(${display.imageUrl})`,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="absolute inset-0"
                                                    style={{
                                                        background: (() => {
                                                            try {
                                                                const parsed = JSON.parse(display.backgroundColor)
                                                                if (Array.isArray(parsed) && parsed.length >= 2) {
                                                                    return `linear-gradient(135deg, ${parsed[0]}, ${parsed[1]})`
                                                                }
                                                            } catch {
                                                                const colors = display.backgroundColor
                                                                    .split(',')
                                                                    .map((c: string) =>
                                                                        c.trim().replace(/[\[\]"]/g, ''),
                                                                    )
                                                                if (colors.length >= 2) {
                                                                    return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
                                                                }
                                                            }
                                                            return 'linear-gradient(135deg, #1E3A5F, #2C5282)'
                                                        })(),
                                                    }}
                                                />
                                            )}

                                            {/* Overlay for image background */}
                                            {display.imageUrl && <div className="absolute inset-0 bg-black/30" />}

                                            {/* Content */}
                                            <div className="relative p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 pr-4">
                                                        <h4
                                                            className="text-lg font-bold mb-1"
                                                            style={{ color: display.textColor }}
                                                        >
                                                            {display.promotion?.title || 'Tiêu đề ưu đãi'}
                                                        </h4>
                                                        <p
                                                            className="text-xs mb-3"
                                                            style={{ color: display.textColor, opacity: 0.9 }}
                                                        >
                                                            {display.promotion?.description || 'Mô tả ưu đãi'}
                                                        </p>
                                                        <button
                                                            className="px-4 py-2 rounded-full border-2 flex items-center space-x-2 text-xs"
                                                            style={{
                                                                backgroundColor: display.buttonColor,
                                                                borderColor: display.buttonTextColor,
                                                            }}
                                                        >
                                                            <span
                                                                className="font-semibold"
                                                                style={{ color: display.buttonTextColor }}
                                                            >
                                                                {display.buttonText || 'Nhẫn ngay'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    <div
                                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                                        style={{
                                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '24px' }}>
                                                            {getIconEmoji(display.iconName || 'gift-outline')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
