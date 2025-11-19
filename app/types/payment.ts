// Payment-related types

export interface CreateQrScanPayload {
  appointmentId: number;
  amount: number;
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
