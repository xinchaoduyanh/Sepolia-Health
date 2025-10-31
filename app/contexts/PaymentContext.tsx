import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PAYMENT_STORAGE_KEY = '@pending_payment';

export interface PendingPayment {
  appointmentId: number;
  qrData: {
    qrCodeUrl: string;
    transactionId: string;
    amount: number;
    appointmentId: number;
    paymentCode: string;
    expiresAt: string;
  };
  createdAt: string;
}

interface PaymentContextType {
  pendingPayment: PendingPayment | null;
  setPendingPayment: (payment: PendingPayment | null) => Promise<void>;
  clearPendingPayment: () => Promise<void>;
  hasPendingPayment: boolean;
  isPendingPaymentForAppointment: (appointmentId: number) => boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingPayment, setPendingPaymentState] = useState<PendingPayment | null>(null);

  // Load pending payment from AsyncStorage on mount
  useEffect(() => {
    loadPendingPayment();
  }, []);

  const loadPendingPayment = async () => {
    try {
      const stored = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      if (stored) {
        const payment = JSON.parse(stored) as PendingPayment;

        // Check if payment has expired (more than 5 minutes old)
        const createdAt = new Date(payment.createdAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

        if (diffMinutes < 5) {
          setPendingPaymentState(payment);
        } else {
          // Payment expired, clear it
          await AsyncStorage.removeItem(PAYMENT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading pending payment:', error);
    }
  };

  const setPendingPayment = useCallback(async (payment: PendingPayment | null) => {
    try {
      if (payment) {
        await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payment));
        setPendingPaymentState(payment);
      } else {
        await AsyncStorage.removeItem(PAYMENT_STORAGE_KEY);
        setPendingPaymentState(null);
      }
    } catch (error) {
      console.error('Error saving pending payment:', error);
    }
  }, []);

  const clearPendingPayment = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PAYMENT_STORAGE_KEY);
      setPendingPaymentState(null);
    } catch (error) {
      console.error('Error clearing pending payment:', error);
    }
  }, []);

  const hasPendingPayment = pendingPayment !== null;

  const isPendingPaymentForAppointment = useCallback(
    (appointmentId: number) => {
      return pendingPayment?.appointmentId === appointmentId;
    },
    [pendingPayment]
  );

  return (
    <PaymentContext.Provider
      value={{
        pendingPayment,
        setPendingPayment,
        clearPendingPayment,
        hasPendingPayment,
        isPendingPaymentForAppointment,
      }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
