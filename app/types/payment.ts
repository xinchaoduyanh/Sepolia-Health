// Payment-related types

export interface ApplyVoucherPayload {
  appointmentId: number;
  userPromotionId: number;
}

export interface ApplyVoucherResponse {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  voucherInfo: {
    id: number;
    title: string;
    code: string;
    discountPercent: number;
    maxDiscountAmount: number;
  };
}

export interface CreateQrScanPayload {
  appointmentId: number;
  amount: number;
  userPromotionId?: number;
}

export interface QrScanResponse {
  qrCodeUrl: string;
  transactionId: string;
  amount: number;
  appointmentId: number;
  paymentCode: string;
  expiresAt: string;
}

export interface CheckPaymentStatusResponse {
  isPaid: boolean;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
}

export interface CancelPaymentResponse {
  success: boolean;
  message: string;
}
