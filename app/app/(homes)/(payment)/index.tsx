import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const appointmentId = parseInt(id as string);

  const { data: appointment, isLoading } = useAppointment(appointmentId);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="px-5 py-4" style={{ backgroundColor: '#0284C7' }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Thanh toán</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-5 py-6">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Đang tải...</Text>
          </View>
        ) : appointment ? (
          <View className="space-y-4">
            {/* Appointment Info */}
            <View
              className="rounded-xl bg-white p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
              <Text className="mb-2 text-lg font-bold text-gray-900">Thông tin lịch hẹn</Text>
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

            {/* Billing Info */}
            {appointment.billing && (
              <View
                className="rounded-xl bg-white p-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <Text className="mb-2 text-lg font-bold text-gray-900">Thông tin thanh toán</Text>
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

            {/* Payment Methods - Placeholder */}
            <View
              className="rounded-xl bg-white p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
              <Text className="mb-4 text-lg font-bold text-gray-900">Phương thức thanh toán</Text>

              {/* Placeholder for payment methods */}
              <View className="space-y-3">
                <TouchableOpacity className="flex-row items-center rounded-lg border border-gray-200 p-3">
                  <Ionicons name="card" size={24} color="#0284C7" />
                  <Text className="ml-3 text-gray-700">Thẻ tín dụng/ghi nợ</Text>
                  <View className="flex-1" />
                  <Ionicons name="radio-button-off" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center rounded-lg border border-gray-200 p-3">
                  <Ionicons name="phone-portrait" size={24} color="#0284C7" />
                  <Text className="ml-3 text-gray-700">Ví điện tử (MoMo, ZaloPay)</Text>
                  <View className="flex-1" />
                  <Ionicons name="radio-button-off" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center rounded-lg border border-gray-200 p-3">
                  <Ionicons name="cash" size={24} color="#0284C7" />
                  <Text className="ml-3 text-gray-700">Thanh toán tại quầy</Text>
                  <View className="flex-1" />
                  <Ionicons name="radio-button-off" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Button - Placeholder */}
            <TouchableOpacity
              className="mt-6 w-full items-center rounded-lg bg-green-600 py-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}>
              <Text className="text-lg font-bold text-white">Thanh toán ngay</Text>
            </TouchableOpacity>

            {/* Note */}
            <Text className="mt-4 text-center text-sm text-gray-500">
              * Trang thanh toán đang trong quá trình phát triển
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
            <Text className="mt-4 text-lg font-medium text-gray-500">Không tìm thấy lịch hẹn</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
