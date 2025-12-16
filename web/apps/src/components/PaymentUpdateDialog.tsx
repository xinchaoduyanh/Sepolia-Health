"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/Dialog"
import { Button } from "@workspace/ui/components/Button"
import { Badge } from "@workspace/ui/components/Badge"
import { Loader2, CreditCard } from "lucide-react"
import { toast } from "@workspace/ui/components/Sonner"
import { paymentService } from "@/shared/lib/api-services/payment.service"

interface PaymentUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billing?: {
    id: number
    amount: number
    status: string
  }
  onUpdateSuccess?: () => void
}

export function PaymentUpdateDialog({
  open,
  onOpenChange,
  billing,
  onUpdateSuccess,
}: PaymentUpdateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirmPayment = async () => {
    if (!billing) return

    setIsSubmitting(true)

    try {
      await paymentService.markAsPaid(billing.id, {
        receiptNumber: ''
      })

      toast.success({
        title: 'Thành công',
        description: 'Đã xác nhận thanh toán tại quầy'
      })

      onOpenChange(false)
      onUpdateSuccess?.()

    } catch (error: any) {
      console.error('Payment update error:', error)
      toast.error({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật thanh toán'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!billing) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Xác nhận thanh toán tại quầy
          </DialogTitle>
          <DialogDescription>
            Xác nhận bệnh nhân đã thanh toán trực tiếp tại quầy
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Số tiền:</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(billing.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Trạng thái hiện tại:</span>
              <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
                Chưa thanh toán
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              💡 Sau khi xác nhận, trạng thái sẽ chuyển thành "Đã thanh toán"
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận đã thanh toán'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}