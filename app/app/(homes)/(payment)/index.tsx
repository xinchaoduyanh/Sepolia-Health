import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { formatDate, formatTime, getAppointmentEndTime } from '@/utils/datetime';

// Skeleton Component
const PaymentScreenSkeleton = () => {
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
            <View
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
                marginRight: 12,
              }}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 }} />
          </View>
        </View>

        {/* Content Skeleton */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="mt-4 text-gray-500">Đang tải...</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const { data: appointment, isLoading } = useAppointment(Number(id));

  // Early return for loading state - theo pattern AppointmentDetail
  if (isLoading) {
    return <PaymentScreenSkeleton />;
  }

  const handlePayment = () => {
    const appointmentId = Number(id);

    if (!appointmentId || isNaN(appointmentId)) {
      console.error('Invalid appointment ID');
      return;
    }

    try {
      router.push(`/(homes)/(payment)/voucher-select?id=${appointmentId}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

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
              Thông tin chi tiết
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#0284C7" />
              <Text className="mt-4 text-gray-500">Đang tải...</Text>
            </View>
          ) : appointment ? (
            <>
              {/* Combined Appointment & Billing Info */}
              <View
                className="rounded-xl bg-white p-4 shadow-sm"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <Text className="mb-4 text-lg font-bold text-gray-900">Thông tin lịch hẹn</Text>

                {/* Appointment Details */}
                <View className="mb-4">
                  <Text className="text-gray-600">Dịch vụ: {appointment.service.name}</Text>
                  <Text className="text-gray-600">
                    Bác sĩ: BS. {appointment.doctor.firstName} {appointment.doctor.lastName}
                  </Text>
                  <Text className="text-gray-600">Ngày: {formatDate(appointment.startTime)}</Text>
                  <Text className="text-gray-600">
                    Thời gian: {formatTime(appointment.startTime)} -{' '}
                    {formatTime(
                      getAppointmentEndTime(appointment.startTime, appointment.service.duration)
                    )}
                  </Text>
                </View>

                {/* Billing Details */}
                {appointment.billing && (
                  <View className="border-t border-gray-200 pt-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600">Số tiền:</Text>
                      <Text className="text-xl font-bold text-green-600">
                        {(() => {
                          // Nếu đã thanh toán thành công và có transaction, lấy số tiền từ transaction
                          // Nếu không, hiển thị số tiền gốc
                          const billing = appointment.billing as any;
                          const paidTransaction = billing.transactions?.find(
                            (t: any) => t.status === 'SUCCESS'
                          );
                          const displayAmount = paidTransaction
                            ? paidTransaction.amount
                            : appointment.billing.amount;
                          return displayAmount.toLocaleString('vi-VN');
                        })()}{' '}
                        VND
                      </Text>
                    </View>
                    {(() => {
                      const billing = appointment.billing as any;
                      return billing.userPromotion ? (
                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-gray-600">Đã áp dụng voucher:</Text>
                          <Text className="font-medium text-blue-600">
                            {billing.userPromotion.promotion?.title || 'Voucher đã áp dụng'}
                          </Text>
                        </View>
                      ) : null;
                    })()}
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

              {/* Payment Button */}
              {appointment?.billing?.status === 'PENDING' && (
                <TouchableOpacity
                  className="mt-6 w-full items-center rounded-lg bg-sky-600 py-4"
                  onPress={handlePayment}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                  <View className="flex-row items-center">
                    <Ionicons name="wallet" size={24} color="white" />
                    <Text className="ml-2 text-lg font-bold text-white">Thanh toán</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Payment Already Completed */}
              {appointment?.billing?.status === 'PAID' && (
                <View className="mt-6 items-center rounded-xl bg-white p-8 shadow-sm">
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                  <Text className="mt-4 text-lg font-bold text-green-600">
                    Đã thanh toán thành công
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View className="items-center justify-center rounded-xl bg-white p-8 shadow-sm">
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
              <Text className="mt-4 text-lg font-medium text-gray-500">
                Không tìm thấy lịch hẹn
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
