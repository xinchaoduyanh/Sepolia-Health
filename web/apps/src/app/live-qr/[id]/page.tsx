'use client'

import { useState, useEffect, use } from 'react'
import { promotionsService } from '@/shared/lib/api-services/promotions.service'
import { Card, CardContent } from '@workspace/ui/components/Card'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface QrData {
    id: number
    t: number
    signature: string
    expiresIn: number
}

export default function LiveQRPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const searchParams = useSearchParams()
    const intervalParam = searchParams.get('interval') || '30'
    const interval = parseInt(intervalParam)

    const [qrData, setQrData] = useState<QrData | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeLeft, setTimeLeft] = useState(0)
    const [promotionInfo, setPromotionInfo] = useState<any>(null)

    const fetchQrData = async () => {
        try {
            const data = await promotionsService.getQrData(parseInt(id), interval === 0 ? 3600 * 24 : interval)
            setQrData(data)
            setTimeLeft(data.expiresIn)
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch QR data', error)
        }
    }

    const fetchPromotionInfo = async () => {
        try {
            const data = await promotionsService.getPromotion(parseInt(id))
            setPromotionInfo(data)
        } catch (error) {
            console.error('Failed to fetch promotion info', error)
        }
    }

    useEffect(() => {
        fetchPromotionInfo()
        fetchQrData()
    }, [id])

    useEffect(() => {
        if (interval === 0) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchQrData()
                    return interval
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [qrData, interval])

    if (loading || !promotionInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    const qrValue = `sepolia-health://claim?id=${id}&sig=${qrData?.signature}&t=${qrData?.t}&i=${interval}`
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrValue)}`

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] p-6">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-white mb-2">{promotionInfo.title}</h1>
                <p className="text-blue-400 text-xl font-medium">Mở ứng dụng Sepolia Health để quét mã</p>
            </div>

            <Card className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center p-0">
                    <div className="relative w-full aspect-square bg-white rounded-xl mb-6">
                        <img 
                            src={qrImageUrl} 
                            alt="Scan me" 
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / interval) * 100}%` }}
                        />
                    </div>

                    <div className="text-center">
                        <p className="text-gray-500 font-medium mb-1 uppercase tracking-wider text-xs">Mã QR sẽ làm mới sau</p>
                        <p className="text-blue-600 text-3xl font-bold">{timeLeft}s</p>
                    </div>
                </CardContent>
                
                {/* Decorative elements */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl" />
            </Card>

            <div className="mt-12 flex items-center gap-4 text-white/60">
                <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center text-sm font-bold mb-2 italic">NHANH</div>
                    <span className="text-xs">Quét nhanh</span>
                </div>
                <div className="w-8 h-[1px] bg-white/20" />
                <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center text-sm font-bold mb-2 italic">NHẬN</div>
                    <span className="text-xs">Nhận ưu đãi</span>
                </div>
                <div className="w-8 h-[1px] bg-white/20" />
                <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center text-sm font-bold mb-2 italic">KHÁM</div>
                    <span className="text-xs">Theo dõi sức khỏe</span>
                </div>
            </div>
            
            <p className="fixed bottom-8 text-white/30 text-sm">Sepolia Health Management System © 2024</p>
        </div>
    )
}
