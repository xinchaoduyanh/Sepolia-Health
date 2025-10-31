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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment, useUpdateAppointment } from '@/lib/api/appointments';
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
  const updateAppointmentMutation = useUpdateAppointment();

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
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values for success modal
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

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

  // Success animation function
  const startSuccessAnimation = useCallback(() => {
    setIsSuccessModalVisible(true);

    // Reset animations
    successScaleAnim.setValue(0);
    successOpacityAnim.setValue(0);
    checkmarkAnim.setValue(0);

    // Start animations
    Animated.parallel([
      Animated.spring(successScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [successScaleAnim, successOpacityAnim, checkmarkAnim]);

  // Define startPolling
  const startPolling = useCallback(async () => {
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(appointmentId);
        if (status.isPaid) {
          setPaymentCompleted(true);
          stopPolling();
          await clearPendingPayment();

          // Update appointment status to paid
          try {
            await updateAppointmentMutation.mutateAsync({
              id: appointmentId,
              data: { paymentStatus: 'paid' },
            });
          } catch (updateError) {
            console.error('Failed to update appointment status:', updateError);
          }

          // Show success animation
          setIsQrModalVisible(false);
          startSuccessAnimation();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, POLLING_INTERVAL);
  }, [
    appointmentId,
    clearPendingPayment,
    stopPolling,
    updateAppointmentMutation,
    startSuccessAnimation,
  ]);

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
    <View style={{ flex: 1, backgroundColor: '#0ea5e9' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <SafeAreaView style={{ backgroundColor: '#0ea5e9' }}>
        <View style={{ backgroundColor: '#0ea5e9' }} className="flex-row items-center px-5 py-4">
          <TouchableOpacity
            onPress={() => {
              setIsQrModalVisible(false);
              router.replace('/(homes)/(appointment)');
            }}
            className="flex-row items-center rounded-lg bg-white/20 px-4 py-3">
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text className="ml-2 text-lg font-semibold text-white">Quay về</Text>
          </TouchableOpacity>

          <View className="flex-1 items-center">
            {/* <Text className="text-white font-bold text-xl">Thanh toán</Text> */}
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
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
                    Bác sĩ: BS. {appointment.doctor.user.firstName}{' '}
                    {appointment.doctor.user.lastName}
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
              <Text className="mt-4 text-lg font-medium text-gray-500">
                Không tìm thấy lịch hẹn
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

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

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSuccessModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <Animated.View
            style={{
              transform: [{ scale: successScaleAnim }],
              opacity: successOpacityAnim,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 15,
            }}
            className="mx-6 rounded-3xl bg-white p-8 shadow-2xl">
            {/* Success Icon with Animation */}
            <View className="mb-6 items-center">
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: checkmarkAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.2, 1],
                      }),
                    },
                  ],
                }}
                className="rounded-full bg-green-500 p-4">
                <Ionicons name="checkmark" size={48} color="white" />
              </Animated.View>

              {/* Confetti-like elements */}
              <View className="absolute bottom-0 left-0 right-0 top-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${20 + i * 10}%`,
                      top: '20%',
                      transform: [
                        {
                          translateY: checkmarkAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, -60],
                          }),
                        },
                        {
                          rotate: `${i * 60}deg`,
                        },
                      ],
                      opacity: checkmarkAnim,
                    }}>
                    <View
                      className={`h-2 w-2 rounded-full ${['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'][i]}`}
                    />
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Success Message */}
            <View className="mb-6 items-center">
              <Text className="mb-2 text-2xl font-bold text-gray-900">
                🎉 Thanh toán thành công!
              </Text>
              <Text className="text-center leading-6 text-gray-600">
                Đã thanh toán appointment #{appointmentId} thành công.{'\n'}
                Lịch hẹn của bạn đã được xác nhận và sẵn sàng.
              </Text>
            </View>

            {/* Payment Details */}
            {appointment && (
              <View className="mb-6 rounded-xl bg-green-50 p-4">
                <Text className="mb-3 text-sm font-semibold text-green-800">
                  Chi tiết thanh toán
                </Text>
                <View className="space-y-2">
                  <Text className="text-sm text-green-700">
                    💼 Dịch vụ: {appointment.service.name}
                  </Text>
                  <Text className="text-sm text-green-700">
                    👨‍⚕️ Bác sĩ: BS. {appointment.doctor.user.firstName}{' '}
                    {appointment.doctor.user.lastName}
                  </Text>
                  <Text className="text-sm text-green-700">
                    📅 Ngày: {new Date(appointment.date).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text className="text-sm text-green-700">
                    ⏰ Thời gian: {appointment.startTime} - {appointment.endTime}
                  </Text>
                  <Text className="text-sm text-green-700">
                    🏥 Phòng khám: {appointment.clinic?.name || 'Chưa xác định'}
                  </Text>
                  <Text className="text-sm text-green-700">
                    📱 Phương thức: Chuyển khoản ngân hàng
                  </Text>
                  <Text className="text-sm text-green-700">
                    🕒 Thời gian thanh toán: {new Date().toLocaleString('vi-VN')}
                  </Text>
                  <Text className="text-sm font-semibold text-green-700">
                    💰 Số tiền: {appointment.billing?.amount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>
              </View>
            )}

            {/* Action Button */}
            <View className="items-center">
              <TouchableOpacity
                onPress={() => {
                  setIsSuccessModalVisible(false);
                  router.replace('/(homes)/(appointment)');
                }}
                className="items-center rounded-xl bg-green-500 px-20 py-3"
                style={{
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                <Text className="text-lg font-bold text-white">Tiếp tục</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
