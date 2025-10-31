import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { useCreateQrScan, useCancelPayment, checkPaymentStatus } from '@/lib/api/payment';
import type { QrScanResponse } from '@/lib/api/payment';
import { usePayment } from '@/contexts/PaymentContext';

const COUNTDOWN_DURATION = 300; // 5 minutes
const POLLING_INTERVAL = 3000; // 3 seconds

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const appointmentId = parseInt(id as string);

  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const createQrScanMutation = useCreateQrScan();
  const cancelPaymentMutation = useCancelPayment();

  const {
    pendingPayment,
    setPendingPayment,
    clearPendingPayment,
    hasPendingPayment,
    isPendingPaymentForAppointment,
  } = usePayment();

  const [qrData, setQrData] = useState<QrScanResponse | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Define stopPolling first
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Define startPolling
  const startPolling = useCallback(() => {
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(appointmentId);
        if (status.isPaid) {
          setPaymentCompleted(true);
          stopPolling();
          await clearPendingPayment();

          // Show success notification
          setIsQrModalVisible(false);
          Alert.alert(
            '✅ Thanh toán thành công',
            `Đã thanh toán appointment #${appointmentId} thành công. Lịch hẹn của bạn đã được xác nhận.`,
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(homes)/(appointment)'),
              },
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, POLLING_INTERVAL);
  }, [appointmentId, clearPendingPayment, stopPolling]);

  // Load pending payment when screen mounts
  useEffect(() => {
    if (pendingPayment && isPendingPaymentForAppointment(appointmentId)) {
      setQrData(pendingPayment.qrData);
      setPaymentCompleted(false);
      setIsQrModalVisible(true);
    }
  }, [pendingPayment, appointmentId, isPendingPaymentForAppointment]);

  // Clear all intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Start countdown when QR is generated
  useEffect(() => {
    if (qrData && !paymentCompleted) {
      setCountdown(COUNTDOWN_DURATION);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopPolling();
            clearPendingPayment();
            setIsQrModalVisible(false);
            setQrData(null);
            Alert.alert('⏰ Hết thời gian', 'Mã QR đã hết hạn. Vui lòng tạo mã mới.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [qrData, paymentCompleted, clearPendingPayment, stopPolling]);

  // Start polling when QR is generated
  useEffect(() => {
    if (qrData && !paymentCompleted) {
      startPolling();
      return () => stopPolling();
    }
  }, [qrData, paymentCompleted, startPolling, stopPolling]);

  const handleCreateQR = async () => {
    if (!appointment?.billing) return;

    // Check if there's already a pending payment for a different appointment
    if (hasPendingPayment && !isPendingPaymentForAppointment(appointmentId)) {
      Alert.alert(
        '⚠️ Có giao dịch đang chờ',
        'Hãy thanh toán giao dịch đang chờ trước khi tạo thanh toán mới.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await createQrScanMutation.mutateAsync({
        appointmentId,
        amount: appointment.billing.amount,
      });

      // Save to context
      await setPendingPayment({
        appointmentId,
        qrData: result,
        createdAt: new Date().toISOString(),
      });

      console.log('QR Code URL:', result.qrCodeUrl);
      console.log('Payment Code (raw):', result.paymentCode);
      console.log('Payment Code (full): DADZ' + result.paymentCode);
      console.log('Amount (original):', result.amount);
      console.log('Amount (QR): 4000');
      console.log('Description: DADZ' + result.paymentCode);
      setQrData(result);
      setPaymentCompleted(false);
      setIsQrModalVisible(true);
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error?.response?.data?.message || 'Không thể tạo mã QR. Vui lòng thử lại.'
      );
    }
  };

  const handleCancelPayment = () => {
    Alert.alert('Hủy thanh toán', 'Bạn có chắc chắn muốn hủy thanh toán này?', [
      {
        text: 'Không',
        style: 'cancel',
      },
      {
        text: 'Có',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelPaymentMutation.mutateAsync(appointmentId);
            stopPolling();
            await clearPendingPayment();
            setQrData(null);
            setCountdown(COUNTDOWN_DURATION);
            setIsQrModalVisible(false);
            Alert.alert('✅ Thành công', 'Đã hủy thanh toán thành công.');
          } catch (error: any) {
            Alert.alert(
              '❌ Lỗi',
              error?.response?.data?.message || 'Không thể hủy thanh toán. Vui lòng thử lại.'
            );
          }
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />

      {/* Header */}
      <View className="bg-sky-600 px-5 py-4">
        <TouchableOpacity
          onPress={() => {
            setIsQrModalVisible(false);
            router.back();
          }}
          className="w-24 flex-row items-center rounded-lg bg-white/20 px-3 py-2">
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text className="ml-2 font-medium text-white">Quay về</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 px-5 py-6">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Đang tải...</Text>
          </View>
        ) : appointment ? (
          <View className="space-y-4">
            {/* Combined Appointment & Billing Info */}
            <View
              className="relative rounded-xl bg-white p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
              {/* Payment Status Badge */}
              {hasPendingPayment && isPendingPaymentForAppointment(appointmentId) && (
                <View className="absolute right-4 top-4 flex-row items-center rounded-full bg-orange-500 px-2 py-1">
                  <Ionicons name="time" size={12} color="white" />
                  <Text className="ml-1 text-xs font-medium text-white">Đang thanh toán</Text>
                </View>
              )}

              <Text className="mb-4 text-lg font-bold text-gray-900">Thông tin lịch hẹn</Text>

              {/* Appointment Details */}
              <View className="mb-4">
                <Text className="text-gray-600">Dịch vụ: {appointment.service.name}</Text>
                <Text className="text-gray-600">
                  Bác sĩ: BS. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                </Text>
                <Text className="text-gray-600">
                  Ngày: {new Date(appointment.date).toLocaleDateString('vi-VN')}
                </Text>
                <Text className="text-gray-600">
                  Thời gian: {appointment.startTime} - {appointment.endTime}
                </Text>
              </View>

              {/* Billing Details */}
              {appointment.billing && (
                <View className="border-t border-gray-200 pt-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-600">Số tiền:</Text>
                    <Text className="text-xl font-bold text-green-600">
                      {appointment.billing.amount.toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-gray-600">Trạng thái:</Text>
                    <Text
                      className={`font-medium ${appointment.billing.status === 'PENDING' ? 'text-orange-600' : appointment.billing.status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                      {appointment.billing.status === 'PENDING'
                        ? 'Chưa thanh toán'
                        : appointment.billing.status === 'PAID'
                          ? 'Đã thanh toán'
                          : 'Đã hoàn tiền'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Create/Resume QR Button */}
            {!qrData && appointment?.billing?.status === 'PENDING' && (
              <TouchableOpacity
                className="mt-6 w-full items-center rounded-lg bg-sky-600 py-4"
                onPress={handleCreateQR}
                disabled={createQrScanMutation.isPending}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                {createQrScanMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="qr-code" size={24} color="white" />
                    <Text className="ml-2 text-lg font-bold text-white">
                      {hasPendingPayment && isPendingPaymentForAppointment(appointmentId)
                        ? 'Tiếp tục thanh toán'
                        : 'Tạo mã QR thanh toán'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Payment Already Completed */}
            {appointment?.billing?.status === 'PAID' && (
              <View className="mt-6 items-center">
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                <Text className="mt-2 text-lg font-bold text-green-600">
                  Đã thanh toán thành công
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
            <Text className="mt-4 text-lg font-medium text-gray-500">Không tìm thấy lịch hẹn</Text>
          </View>
        )}
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={isQrModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsQrModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-gray-50">
          <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />


          {/* Modal Content */}
          <View className="flex-1 px-5 py-4">
            {qrData && countdown > 0 && !paymentCompleted && (
              <View className="space-y-4">
                {/* Countdown Timer */}
                <View className="items-center rounded-xl bg-white p-4">
                  <Text className="text-sm text-gray-500">Thời gian còn lại</Text>
                  <Text className="text-4xl font-bold text-orange-600">
                    {formatTime(countdown)}
                  </Text>
                </View>

                {/* QR Code */}
                <View className="items-center rounded-xl bg-white p-6">
                  <Text className="mb-4 text-center text-lg font-bold text-gray-900">
                    Quét mã QR để thanh toán
                  </Text>
                  <View className="rounded-lg bg-white p-4 shadow-lg">
                    <Image
                      source={{ uri: qrData.qrCodeUrl }}
                      style={{ width: 250, height: 250 }}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Payment Code */}
                <View className="items-center rounded-xl bg-white p-4">
                  <Text className="text-sm text-gray-500">Mã thanh toán</Text>
                  <Text className="text-2xl font-bold text-gray-900">DADZ{qrData.paymentCode}</Text>
                </View>

                {/* Polling Indicator */}
                {isPolling && (
                  <View className="flex-row items-center justify-center rounded-xl bg-white p-4">
                    <ActivityIndicator size="small" color="#0284C7" />
                    <Text className="ml-2 text-sm text-gray-500">Đang kiểm tra thanh toán...</Text>
                  </View>
                )}

                {/* Instructions */}
                <View className="rounded-xl bg-blue-50 p-4">
                  <Text className="text-sm leading-6 text-gray-700">
                    📱 Mở ứng dụng ngân hàng của bạn{'\n'}
                    📷 Quét mã QR hoặc nhập mã thanh toán: DADZ{qrData.paymentCode}
                    {'\n'}
                    💰 Chuyển khoản 4.000 VND{'\n'}✅ Hệ thống sẽ tự động xác nhận thanh toán
                  </Text>
                </View>

                {/* Cancel Button */}
                <TouchableOpacity
                  className="mt-4 w-full items-center rounded-lg bg-red-500 py-4"
                  onPress={handleCancelPayment}
                  disabled={cancelPaymentMutation.isPending}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                  {cancelPaymentMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-base font-bold text-white">Hủy thanh toán</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
