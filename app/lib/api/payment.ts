import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import {
  CreateQrScanPayload,
  QrScanResponse,
  CheckPaymentStatusResponse,
  CancelPaymentResponse,
} from '@/types/payment';

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


