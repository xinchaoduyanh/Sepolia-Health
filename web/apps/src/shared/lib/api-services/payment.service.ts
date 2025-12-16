import { apiClient } from '../api-client'

export interface PaymentUpdateRequest {
  receiptNumber?: string
}

export interface PaymentUpdateResponse {
  success: boolean
  message: string
  data: {
    id: number
    status: string
    paymentMethod: string
    amount: number
    notes?: string | null
  }
}

export interface CreateQrScanRequest {
  appointmentId: number
  amount: number
}

export interface QrScanResponse {
  qrCodeUrl: string
  transactionId: string
  amount: number
  appointmentId: number
  paymentCode: string
  expiresAt: string
}

export interface CheckPaymentStatusRequest {
  transactionId: string
}

export interface CheckPaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'EXPIRED'
  transactionId: string
}

export interface CancelPaymentRequest {
  transactionId: string
}

export class PaymentService {
  /**
   * Mark billing as paid (offline payment)
   * PATCH /payment/billing/:billingId/mark-as-paid
   */
  async markAsPaid(
    billingId: number,
    data: PaymentUpdateRequest
  ): Promise<PaymentUpdateResponse> {
    return apiClient.patch<PaymentUpdateResponse>(
      `/payment/billing/${billingId}/mark-as-paid`,
      data
    )
  }

  /**
   * Create QR code for payment
   * POST /payment/create-qr-scan
   */
  async createQrScan(
    data: CreateQrScanRequest
  ): Promise<{ data: QrScanResponse }> {
    return apiClient.post<{ data: QrScanResponse }>(
      '/payment/create-qr-scan',
      data
    )
  }

  /**
   * Check payment status
   * POST /payment/check-payment-status
   */
  async checkPaymentStatus(
    data: CheckPaymentStatusRequest
  ): Promise<{ data: CheckPaymentStatusResponse }> {
    return apiClient.post<{ data: CheckPaymentStatusResponse }>(
      '/payment/check-payment-status',
      data
    )
  }

  /**
   * Cancel payment
   * POST /payment/cancel-payment-code
   */
  async cancelPayment(
    data: CancelPaymentRequest
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      '/payment/cancel-payment-code',
      data
    )
  }
}

export const paymentService = new PaymentService()