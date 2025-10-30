import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMyAppointments } from '@/lib/api/appointments';

export default function AppointmentsListScreen() {
  // const [selectedTab, setSelectedTab] = useState<'confirmed' | 'requests'>('confirmed');

  const { data: appointmentsData, isLoading } = useMyAppointments();

  const appointments = appointmentsData?.data || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return { day, month, year };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="px-5 py-4" style={{ backgroundColor: '#0284C7' }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Lịch hẹn</Text>
          <TouchableOpacity
            onPress={() => router.push('/create')}
            style={{
              // position: 'absolute',
              right: 10,
              backgroundColor: '#ffffffff', // xanh dương
              padding: 6,
              borderRadius: 20,
              elevation: 3,
            }}>
            <Ionicons name="add" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector
      <View className="mx-5 mt-4 flex-row rounded-xl bg-white p-1">
        <TouchableOpacity
          onPress={() => setSelectedTab('confirmed')}
          className={`flex-1 items-center rounded-lg py-3 ${
            selectedTab === 'confirmed' ? 'bg-[#0284C7]' : 'bg-transparent'
          }`}>
          <Text
            className={`text-base font-semibold ${
              selectedTab === 'confirmed' ? 'text-white' : 'text-gray-600'
            }`}>
            Xác nhận
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab('requests')}
          className={`flex-1 items-center rounded-lg py-3 ${
            selectedTab === 'requests' ? 'bg-[#0284C7]' : 'bg-transparent'
          }`}>
          <Text
            className={`text-base font-semibold ${
              selectedTab === 'requests' ? 'text-white' : 'text-gray-600'
            }`}>
            Yêu cầu
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Appointments List */}
      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="items-center py-8">
            <Text className="text-gray-500">Đang tải...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-lg font-medium text-gray-500">Chưa có lịch hẹn nào</Text>
            <Text className="mt-2 text-center text-gray-400">Hãy đặt lịch khám để bắt đầu</Text>
          </View>
        ) : (
          appointments.map((appointment) => {
            console.log('Appointment:', appointment);
            const { day, month, year } = formatDate(appointment.date);
            const time = formatTime(appointment.date);
            const statusText = getStatusText(appointment.status, appointment.paymentStatus);
            const statusColor = getStatusColor(appointment.status, appointment.paymentStatus);

            return (
              <TouchableOpacity
                key={appointment.id}
                onPress={() =>
                  router.push(
                    `/(homes)/(appointment)/appointment-detail?id=${appointment.id}` as any
                  )
                }
                className="mb-4 rounded-xl bg-white p-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <View className="flex-row">
                  {/* Date Block */}
                  <View
                    className="mr-4 items-center justify-center rounded-lg px-3 py-2"
                    style={{ backgroundColor: '#F0FDFA' }}>
                    <Text className="text-sm font-medium text-gray-600">
                      {month}/{year}
                    </Text>
                    <Text className="text-2xl font-bold" style={{ color: '#0284C7' }}>
                      {day}
                    </Text>
                  </View>

                  {/* Appointment Details */}
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">
                      {appointment.service.name}
                    </Text>
                    <Text className="mt-1 text-sm text-gray-600">
                      BS. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                    </Text>
                    {/* <Text className="mt-1 text-sm text-gray-600">
                      {appointment.doctor.clinic?.name || 'Bệnh viện'}
                    </Text> */}
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-sm font-medium" style={{ color: statusColor }}>
                        {time} {statusText}
                      </Text>
                      <View
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: '#F0FDFA' }}>
                        <Text className="text-xs font-medium" style={{ color: '#0284C7' }}>
                          Bản thân
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="mt-3 space-y-2">
                      {/* Payment Button - Show only if billing exists and status is PENDING */}
                      {appointment.billing && appointment.billing.status === 'PENDING' && (
                        <TouchableOpacity
                          onPress={() => router.push(`/payment?id=${appointment.id}` as any)}
                          className="w-full items-center rounded-lg bg-green-600 py-2"
                          style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 2,
                            elevation: 2,
                          }}>
                          <Text className="text-sm font-medium text-white">Thanh toán</Text>
                        </TouchableOpacity>
                      )}

                      {/* Other Action Buttons */}
                      <View className="flex-row space-x-2">
                        <TouchableOpacity
                          className="flex-1 items-center rounded-lg border py-2"
                          style={{ borderColor: '#0284C7' }}>
                          <Text className="text-sm font-medium" style={{ color: '#0284C7' }}>
                            Đổi lịch
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 items-center rounded-lg border py-2"
                          style={{ borderColor: '#EF4444' }}>
                          <Text className="text-sm font-medium text-red-500">Hủy lịch</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text className="mt-2 text-xs text-gray-400">
                      (Quý khách chỉ được đổi/hủy lịch 1 lần)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
