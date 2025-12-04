import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateQrScan, useCancelPayment, checkPaymentStatus } from '@/lib/api/payment';
import { usePayment } from '@/contexts/PaymentContext';
import { QrScanResponse } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const COUNTDOWN_DURATION = 300; // 5 minutes
const POLLING_INTERVAL = 3000; // 3 seconds

export default function QrPaymentScreen() {
  const { id, voucherId, finalAmount } = useLocalSearchParams();
  const appointmentId = parseInt(id as string);
  const userPromotionId = voucherId ? parseInt(voucherId as string) : undefined;
  const paymentAmount = finalAmount ? parseFloat(finalAmount as string) : undefined;
  const queryClient = useQueryClient();

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
  const [shouldNavigateToAppointments, setShouldNavigateToAppointments] = useState(false);
  const [shouldNavigateToVoucherSelect, setShouldNavigateToVoucherSelect] = useState(false);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownStartedRef = useRef(false);

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
  const startPolling = useCallback(async () => {
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(appointmentId);
        if (status.isPaid) {
          // Stop polling first
          stopPolling();

          // Clear pending payment synchronously
          clearPendingPayment();

          // Set completed state
          setPaymentCompleted(true);

          // Đơn giản hóa - chỉ hiển thị Alert và navigate
          setTimeout(() => {
            // Cải tiến: invalidate toàn bộ các query lịch hẹn (my/list/detail...)
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            // Dùng Promise.all để lấy lại dữ liệu mới nhất của cả detail và list
            Promise.all([
              queryClient.fetchQuery({
                queryKey: ['appointments', 'detail', appointmentId],
                queryFn: () =>
                  import('@/lib/api/appointments').then((m) =>
                    m.appointmentApi.getAppointment(appointmentId)
                  ),
              }),
              queryClient.fetchQuery({
                queryKey: ['appointments', 'my'],
                queryFn: () =>
                  import('@/lib/api/appointments').then((m) =>
                    m.appointmentApi.getMyAppointments()
                  ),
              }),
            ]);

            // Hiển thị Alert đơn giản thay vì modal phức tạp
            Alert.alert(
              '🎉 Thanh toán thành công!',
              `Đã thanh toán appointment #${appointmentId} thành công.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Set state để navigate sau
                    setShouldNavigateToAppointments(true);
                  },
                },
              ]
            );
          }, 300);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, POLLING_INTERVAL);
  }, [appointmentId, clearPendingPayment, stopPolling, queryClient]);

  // Load pending payment when screen mounts
  useEffect(() => {
    if (pendingPayment && isPendingPaymentForAppointment(appointmentId)) {
      setQrData(pendingPayment.qrData);
      setPaymentCompleted(false);

      // Calculate remaining time from createdAt
      const createdAt = new Date(pendingPayment.createdAt);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
      const remaining = Math.max(0, COUNTDOWN_DURATION - elapsedSeconds);

      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        // Payment expired, clear it
        clearPendingPayment();
        Alert.alert('⏰ Thanh toán đã hết hạn', 'Mã QR đã hết hạn. Vui lòng tạo mã mới.');
      }
    }
  }, [pendingPayment, appointmentId, isPendingPaymentForAppointment, clearPendingPayment]);

  // Handle navigation after Alert
  useEffect(() => {
    if (shouldNavigateToAppointments) {
      router.replace('/(homes)/(appointment)');
      setShouldNavigateToAppointments(false);
    }
  }, [shouldNavigateToAppointments]);

  useEffect(() => {
    if (shouldNavigateToVoucherSelect) {
      router.replace({
        pathname: '/(homes)/(payment)/voucher-select',
        params: { id: appointmentId.toString() },
      });
      setShouldNavigateToVoucherSelect(false);
    }
  }, [shouldNavigateToVoucherSelect, appointmentId]);

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
    if (qrData && !paymentCompleted && !countdownStartedRef.current) {
      countdownStartedRef.current = true;

      // Clear any existing interval first
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            countdownStartedRef.current = false;
            stopPolling();
            clearPendingPayment();
            setQrData(null);
            Alert.alert('⏰ Hết thời gian', 'Mã QR đã hết hạn. Vui lòng tạo mã mới.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        countdownStartedRef.current = false;
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
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

  // Auto-create QR when screen loads
  useEffect(() => {
    // Only auto-create if:
    // 1. Not loading
    // 2. Has appointment billing
    // 3. No existing QR data
    // 4. No pending payment
    // 5. Not already creating QR
    if (
      !isLoading &&
      appointment?.billing &&
      !qrData &&
      !hasPendingPayment &&
      !createQrScanMutation.isPending
    ) {
      handleCreateQR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, appointment, qrData, hasPendingPayment]);

  // Refetch appointment after creating QR to get updated billing amount
  useEffect(() => {
    if (qrData && appointmentId) {
      queryClient.invalidateQueries({
        queryKey: ['appointments', 'detail', appointmentId],
      });
    }
  }, [qrData, appointmentId, queryClient]);

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
      // Sử dụng paymentAmount từ params (đã tính discount ở FE) hoặc billing.amount
      const amountToPay = paymentAmount || appointment.billing.amount;

      const result = await createQrScanMutation.mutateAsync({
        appointmentId,
        amount: amountToPay,
        userPromotionId,
      });

      // Save to context
      await setPendingPayment({
        appointmentId,
        qrData: result,
        createdAt: new Date().toISOString(),
      });

      setQrData(result);
      setPaymentCompleted(false);
      countdownStartedRef.current = false; // Reset for new QR

      // Refetch appointment after creating QR
      await queryClient.invalidateQueries({
        queryKey: ['appointments', 'detail', appointmentId],
      });
    } catch (error: any) {
      // If error is about voucher (already used, expired, etc.), redirect to voucher-select
      if (
        error?.response?.data?.message?.includes('Voucher') ||
        error?.response?.data?.message?.includes('voucher')
      ) {
        Alert.alert(
          'Lỗi voucher',
          error?.response?.data?.message || 'Vui lòng chọn lại voucher để tiếp tục thanh toán.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Set state để navigate sau
                setShouldNavigateToVoucherSelect(true);
              },
            },
          ]
        );
      } else {
        // Silent fail for other errors
        console.error('Error creating QR:', error);
      }
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
            countdownStartedRef.current = false;
            router.back();
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

  const formatCountdownTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="mt-4 text-gray-500">Đang tải...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}>
        {/* Background Gradient */}
        <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
          {/* Curved bottom edge using SVG */}
          <Svg
            height="70"
            width="200%"
            viewBox="0 0 1440 120"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
            <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
          </Svg>

          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              height: 120,
              width: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 80,
              left: -30,
              height: 100,
              width: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Header positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: 100,
              left: 24,
              right: 24,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
                marginRight: 12,
              }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Thanh toán
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {qrData && countdown > 0 && !paymentCompleted ? (
            <View className="space-y-4">
              {/* Main Payment Box - Gộp tất cả vào 1 box */}
              <View className="rounded-xl bg-white p-6 shadow-sm">
                {/* Countdown Timer */}
                <View className="mb-6 items-center border-b border-gray-200 pb-6">
                  <Text className="mb-2 text-sm text-gray-500">Thời gian còn lại</Text>
                  <Text className="text-4xl font-bold text-orange-600">
                    {formatCountdownTime(countdown)}
                  </Text>
                </View>

                {/* QR Code */}
                <View className="mb-6 items-center border-b border-gray-200 pb-6">
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
                <View className="mb-6 items-center border-b border-gray-200 pb-6">
                  <Text className="mb-2 text-sm text-gray-500">Mã thanh toán</Text>
                  <Text className="text-2xl font-bold text-gray-900">DADZ{qrData.paymentCode}</Text>
                </View>

                {/* Amount */}
                {(paymentAmount || appointment?.billing) && (
                  <View className="mb-6 border-b border-gray-200 pb-6">
                    <Text className="mb-2 text-center text-sm text-gray-500">
                      Số tiền cần thanh toán
                    </Text>
                    <Text className="text-center text-2xl font-bold text-green-600">
                      {(paymentAmount || appointment?.billing?.amount || 0).toLocaleString('vi-VN')}{' '}
                      VNĐ
                    </Text>
                  </View>
                )}

                {/* Polling Indicator */}
                {isPolling && (
                  <View className="mb-6 flex-row items-center justify-center border-b border-gray-200 pb-6">
                    <ActivityIndicator size="small" color="#0284C7" />
                    <Text className="ml-2 text-sm text-gray-500">Đang kiểm tra thanh toán...</Text>
                  </View>
                )}

                {/* Status/Instructions */}
                <View className="rounded-lg bg-blue-50 p-4">
                  <Text className="text-sm leading-6 text-gray-700">
                    📱 Mở ứng dụng ngân hàng của bạn{'\n'}
                    📷 Quét mã QR hoặc nhập mã thanh toán: DADZ{qrData.paymentCode}
                    {'\n'}
                    💰 Chuyển khoản{' '}
                    {(paymentAmount || appointment?.billing?.amount || 0).toLocaleString(
                      'vi-VN'
                    )}{' '}
                    VNĐ
                    {'\n'}✅ Hệ thống sẽ tự động xác nhận thanh toán
                  </Text>
                </View>
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
          ) : paymentCompleted ? (
            <View className="items-center rounded-xl bg-white p-8 shadow-sm">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              <Text className="mt-4 text-lg font-bold text-green-600">
                Đã thanh toán thành công
              </Text>
            </View>
          ) : (
            <View className="items-center rounded-xl bg-white p-8 shadow-sm">
              <ActivityIndicator size="large" color="#0284C7" />
              <Text className="mt-4 text-gray-500">Đang tạo mã QR...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
