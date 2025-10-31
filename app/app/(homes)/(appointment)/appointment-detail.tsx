import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: appointment, isLoading } = useAppointment(Number(id));

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0ea5e9' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Đang tải...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0ea5e9' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Không tìm thấy lịch hẹn</Text>
        </SafeAreaView>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = formatTime(startTime);
    const end = formatTime(endTime);
    return `${start} - ${end}`;
  };

  const getStatusText = (status: string, paymentStatus: string) => {
    if (status === 'scheduled') {
      if (paymentStatus === 'paid') return 'Đã thanh toán';
      if (paymentStatus === 'pending') return 'Thanh toán tại viện';
    }
    return 'Chờ xác nhận';
  };

  const getStatusColor = (status: string, paymentStatus: string) => {
    if (status === 'scheduled' && paymentStatus === 'paid') return '#10B981';
    if (status === 'scheduled' && paymentStatus === 'pending') return '#F59E0B';
    return '#6B7280';
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0ea5e9' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <SafeAreaView style={{ backgroundColor: '#0ea5e9' }}>
        <View style={{ backgroundColor: '#0ea5e9' }} className="flex-row items-center px-5 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">Thông tin đặt hẹn</Text>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
          {/* Service Section */}
          <View className="mb-6 rounded-xl bg-white p-4">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-3 h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#F0FDFA' }}>
                <Ionicons name="medical" size={20} color="#0284C7" />
              </View>
              <Text className="text-lg font-bold text-gray-900">Dịch vụ</Text>
            </View>
            <View className="ml-11">
              <View className="mb-2 flex-row">
                <Text className="w-24 text-sm text-gray-600">Hình thức:</Text>
                <Text className="flex-1 text-sm text-gray-900">Khám chuyên khoa tại bệnh viện</Text>
              </View>
            </View>
          </View>

          {/* Customer Section */}
          <View className="mb-6 rounded-xl bg-white p-4">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: '#F0FDFA' }}>
                <Ionicons name="person" size={20} color="#0284C7" />
              </View>
              <Text className="text-lg font-bold text-gray-900">Khách hàng</Text>
            </View>
            <View className="ml-11">
              <View className="mb-2 flex-row">
                <Text className="w-24 text-sm text-gray-600">Khách hàng:</Text>
                <Text className="flex-1 text-sm text-gray-900">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </Text>
              </View>
              <View className="mb-2 flex-row">
                <Text className="w-24 text-sm text-gray-600">Lý do khám:</Text>
                <Text className="flex-1 text-sm text-gray-900">
                  {appointment.notes || 'Không có ghi chú'}
                </Text>
              </View>
            </View>
          </View>

          {/* Doctor Section */}
          <View className="mb-6 rounded-xl bg-white p-4">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-3 h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#F0FDFA' }}>
                <Ionicons name="briefcase" size={20} color="#0284C7" />
              </View>
              <Text className="text-lg font-bold text-gray-900">Bác sĩ</Text>
            </View>
            <View className="ml-11">
              <View className="mb-2 flex-row">
                <Text className="w-32 text-sm text-gray-600">Bác sĩ:</Text>
                <Text className="flex-1 text-sm text-gray-900">
                  {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                </Text>
              </View>
              <View className="mb-2 flex-row">
                <Text className="w-32 text-sm text-gray-600">Thời gian khám:</Text>
                <Text className="flex-1 text-sm text-gray-900">
                  {formatTimeRange(appointment.startTime, appointment.endTime)}, {formatDate(appointment.date)}
                </Text>
              </View>
              <View className="mb-2 flex-row">
                <Text className="w-32 text-sm text-gray-600">Địa điểm:</Text>
                <Text className="flex-1 text-sm text-gray-900">
                  {appointment.doctor.clinic?.name || 'Bệnh viện'}
                </Text>
              </View>
              <View className="mb-2 flex-row">
                <Text className="w-32 text-sm text-gray-600">Chuyên khoa:</Text>
                <Text className="flex-1 text-sm text-gray-900">{appointment.doctor.specialty}</Text>
              </View>
              <View className="mb-2 flex-row">
                <Text className="w-32 text-sm text-gray-600">Ưu đãi áp dụng:</Text>
                <Text className="flex-1 text-sm text-gray-900">Giảm giá 30%</Text>
              </View>
              <View className="mb-2 flex-row">
                <Text className="w-32 text-sm text-gray-600">Phí khám tạm ứng:</Text>
                <Text className="flex-1 text-sm text-gray-900">
                  {appointment.service.price.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mb-6 flex-row space-x-4">
            <TouchableOpacity
              className="flex-1 items-center rounded-xl border-2 py-3"
              style={{ borderColor: '#0284C7' }}>
              <Text className="text-base font-semibold" style={{ color: '#0284C7' }}>
                Đổi lịch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center rounded-xl border-2 py-3"
              style={{ borderColor: '#EF4444' }}>
              <Text className="text-base font-semibold text-red-500">Hủy lịch</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
