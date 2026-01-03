'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { usePromotions, useRenewPromotionQr } from '@/shared/hooks'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { QrCode, RefreshCcw, ExternalLink, Timer, Play } from 'lucide-react'
import { BsSelect } from '@workspace/ui/components/Select'
import { confirm } from '@workspace/ui/components/ConfirmDialog'

export default function QRSettingsPage() {
    const [selectedId, setSelectedId] = useState<string>('')
    const [refreshInterval, setRefreshInterval] = useState<string>('30')
    const { data: promotionsResponse, isLoading } = usePromotions({ limit: 100 }, true)
    const renewQr = useRenewPromotionQr()

    const promotions = promotionsResponse?.promotions || []

    const handleRenew = () => {
        if (selectedId) {
            renewQr.mutate(parseInt(selectedId))
        }
    }

    const openLiveView = () => {
        if (!selectedId) return

        confirm({
            title: 'Triển khai mã QR Live',
            description: 'Hệ thống sẽ mở trang hiển thị mã QR động trong cửa sổ mới để bạn có thể trình chiếu trên màn hình lớn. Tiếp tục?',
            action: {
                label: 'Đồng ý và Mở',
                onClick: () => {
                    window.open(`/live-qr/${selectedId}?interval=${refreshInterval}`, '_blank')
                }
            },
            cancel: {
                label: 'Hủy bỏ',
                onClick: () => {}
            }
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Cấu hình mã QR Live</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Cấu hình mã QR hiển thị trên màn hình lớn để khách hàng quét nhận voucher
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-primary" />
                            Chọn Voucher hiển thị
                        </CardTitle>
                        <CardDescription>Chọn chương trình khuyến mãi bạn muốn tạo mã QR Live</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chương trình khuyến mãi</label>
                            {isLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <BsSelect
                                    placeholder="Chọn một voucher..."
                                    selectedKey={selectedId || null}
                                    onSelectionChange={key => setSelectedId((key as string) || '')}
                                    options={promotions.map((p) => ({
                                        id: p.id.toString(),
                                        name: `${p.title} (${p.code})`
                                    }))}
                                    className="w-full"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Timer className="h-4 w-4" />
                                Thời gian tự động làm mới (Giây)
                            </label>
                            <BsSelect
                                selectedKey={refreshInterval}
                                onSelectionChange={key => setRefreshInterval((key as string) || '30')}
                                options={[
                                    { id: '15', name: '15 giây' },
                                    { id: '30', name: '30 giây' },
                                    { id: '60', name: '60 giây' },
                                    { id: '0', name: 'Không bao giờ' },
                                ]}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground italic">
                                * Mã QR sẽ tự động thay đổi chữ ký sau mỗi khoảng thời gian này để đảm bảo bảo mật.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-4">
                            <Button 
                                className="w-full flex items-center gap-2" 
                                isDisabled={!selectedId || renewQr.isPending}
                                onClick={openLiveView}
                            >
                                <Play className="h-4 w-4" />
                                Bắt đầu triển khai (Mở Live QR)
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full flex items-center gap-2"
                                isDisabled={!selectedId || renewQr.isPending}
                                onClick={handleRenew}
                            >
                                <RefreshCcw className={`h-4 w-4 ${renewQr.isPending ? 'animate-spin' : ''}`} />
                                Ép buộc làm mới mã ngay lập tức (Renew)
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Hướng dẫn sử dụng</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4 text-muted-foreground">
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
                            <p>Chọn chương trình khuyến mãi đang áp dụng tại quầy/cửa hàng.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
                            <p>Thiết lập thời gian làm mới mã (khuyên dùng 30s) để tránh khách hàng chụp ảnh mã QR dùng nhiều lần.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">3</div>
                            <p>Mở link "Trang hiển thị Live QR" trên TV hoặc Ipad đặt tại quầy để khách hàng quét qua App.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">4</div>
                            <p>Mã QR này chỉ có hiệu lực khi khách hàng quét bằng ứng dụng <strong>Sepolia Health</strong>.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
