import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

// Types
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

// API Functions
export const createQrScan = async (payload: CreateQrScanPayload): Promise<QrScanResponse> => {
  const response = await apiClient.post('/payment/create-qr-scan', payload);
  return response.data;
};

export const checkPaymentStatus = async (
  appointmentId: number
): Promise<CheckPaymentStatusResponse> => {
  const response = await apiClient.post('/payment/check-payment-status', { appointmentId });
  return response.data;
};

export const cancelPayment = async (appointmentId: number): Promise<CancelPaymentResponse> => {
  const response = await apiClient.post('/payment/cancel-payment-code', { appointmentId });
  return response.data;
};

// React Query Hooks
export const useCreateQrScan = () => {
  return useMutation({
    mutationFn: createQrScan,
  });
};

export const useCheckPaymentStatus = (appointmentId: number, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['payment-status', appointmentId],
    queryFn: () => checkPaymentStatus(appointmentId),
    enabled,
    refetchInterval: false, // We'll handle polling manually
  });
};

export const useCancelPayment = () => {
  return useMutation({
    mutationFn: cancelPayment,
  });
};


