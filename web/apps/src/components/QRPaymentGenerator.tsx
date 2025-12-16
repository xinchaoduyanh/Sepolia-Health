"use client"

import { useState, useEffect } from "react"
import { Button } from "@workspace/ui/components/Button"
import { Badge } from "@workspace/ui/components/Badge"
import { Card } from "@workspace/ui/components/Card"
import { Loader2, QrCode, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { toast } from "@workspace/ui/components/Sonner"
import { paymentService } from "@/shared/lib/api-services/payment.service"

interface QRPaymentGeneratorProps {
  appointmentId: number
  amount: number
  onPaymentSuccess?: () => void
  onCancel?: () => void
}

interface QRPaymentData {
  qrCodeUrl: string
  transactionId: string
  amount: number
  appointmentId: number
  paymentCode: string
  expiresAt: string
}

export function QRPaymentGenerator({
  appointmentId,
  amount,
  onPaymentSuccess,
  onCancel
}: QRPaymentGeneratorProps) {
  const [qrData, setQrData] = useState<QRPaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED' | 'ERROR'>('PENDING')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [isExpired, setIsExpired] = useState(false)

  // Format payment code with DADZ prefix
  const formatPaymentCode = (code: string) => `DADZ${code}`

  // Format time remaining
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Create QR payment
  const createQRPayment = async () => {
    setIsLoading(true)
    try {
      const response = await paymentService.createQrScan({
        appointmentId,
        amount
      })

      setQrData(response.data)
      setPaymentStatus('PENDING')
      setTimeLeft(300) // Reset timer to 5 minutes
      setIsExpired(false)

      toast.success({
        title: 'Thành công',
        description: 'Đã tạo mã QR thanh toán'
      })
    } catch (error: any) {
      console.error('QR creation error:', error)
      toast.error({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo mã QR'
      })
      setPaymentStatus('ERROR')
    } finally {
      setIsLoading(false)
    }
  }

  // Check payment status
  const checkPaymentStatus = async () => {
    if (!qrData || isCheckingPayment) return

    setIsCheckingPayment(true)
    try {
      const response = await paymentService.checkPaymentStatus({
        transactionId: qrData.transactionId
      })

      const status = response.data.status
      setPaymentStatus(status)

      if (status === 'PAID') {
        toast.success({
          title: 'Thanh toán thành công',
          description: 'Đã nhận được thanh toán từ bệnh nhân'
        })
        onPaymentSuccess?.()
      } else if (status === 'EXPIRED') {
        toast.error({
          title: 'Hết hạn',
          description: 'Mã QR đã hết hạn, vui lòng tạo lại'
        })
        setIsExpired(true)
      }
    } catch (error: any) {
      console.error('Payment status check error:', error)
    } finally {
      setIsCheckingPayment(false)
    }
  }

  // Cancel payment
  const cancelPayment = async () => {
    if (!qrData) return

    try {
      await paymentService.cancelPayment({
        transactionId: qrData.transactionId
      })
      setQrData(null)
      onCancel?.()
    } catch (error: any) {
      console.error('Payment cancellation error:', error)
    }
  }

  // Auto-check payment status every 3 seconds
  useEffect(() => {
    if (!qrData || paymentStatus !== 'PENDING') return

    const interval = setInterval(() => {
      checkPaymentStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [qrData, paymentStatus])

  // Countdown timer
  useEffect(() => {
    if (!qrData || timeLeft <= 0 || paymentStatus !== 'PENDING') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true)
          setPaymentStatus('EXPIRED')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [qrData, timeLeft, paymentStatus])

  // Auto-create QR on mount
  useEffect(() => {
    createQRPayment()
  }, [])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (paymentStatus === 'PAID') {
    return (
      <Card className="max-w-md mx-auto">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">Thanh toán thành công</h3>
          <p className="text-gray-600 mb-4">
            Đã nhận được thanh toán từ bệnh nhân
          </p>
          <Button onClick={onPaymentSuccess} className="w-full">
            Hoàn thành
          </Button>
        </div>
      </Card>
    )
  }

  if (paymentStatus === 'EXPIRED' || isExpired) {
    return (
      <Card className="max-w-md mx-auto">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Mã QR đã hết hạn</h3>
          <p className="text-gray-600 mb-4">
            Mã QR thanh toán đã hết hạn sau 5 phút
          </p>
          <Button onClick={createQRPayment} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo lại...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tạo lại mã QR
              </>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Quét mã để thanh toán</h3>
          <p className="text-gray-600 text-sm">
            Sử dụng ứng dụng ngân hàng để quét mã QR
          </p>
        </div>

        {qrData ? (
          <div className="space-y-4">
            {/* QR Code Image */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={qrData.qrCodeUrl}
                  alt="Payment QR Code"
                  className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                />
                {isCheckingPayment && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Số tiền:</span>
                <span className="font-bold text-lg">{formatPrice(qrData.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mã thanh toán:</span>
                <Badge variant="secondary" className="font-mono">
                  {formatPaymentCode(qrData.paymentCode)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Thời gian còn lại:</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className={`font-mono font-medium ${
                    timeLeft < 60 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {formatTimeLeft(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Hướng dẫn:</strong><br/>
                1. Mở ứng dụng ngân hàng<br/>
                2. Chọn quét mã QR<br/>
                3. Quét mã này để thanh toán<br/>
                4. Đợi xác nhận thanh toán
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={cancelPayment}
                disabled={paymentStatus !== 'PENDING'}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={() => window.open(qrData.qrCodeUrl, '_blank')}
                className="flex-1"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Mở QR
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {isLoading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
                <p className="text-gray-600">Đang tạo mã QR thanh toán...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <XCircle className="w-12 h-12 mx-auto text-red-600" />
                <p className="text-red-600">Không thể tạo mã QR</p>
                <Button onClick={createQRPayment} disabled={isLoading}>
                  Thử lại
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}