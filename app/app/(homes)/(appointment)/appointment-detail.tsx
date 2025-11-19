import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { formatDate, formatTime } from '@/utils/datetime';

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



  return (
    <View style={{ flex: 1, backgroundColor: '#0ea5e9' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <SafeAreaView style={{ backgroundColor: '#0ea5e9' }}>
        <View className="flex-row items-center justify-center px-5 py-3">
          <TouchableOpacity onPress={() => router.back()} className="absolute left-5 top-3.5 p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Thông tin đặt hẹn</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView className="flex-1 px-6 py-5" showsVerticalScrollIndicator={false}>
          {/* Section Component */}
          {[
            // {
            //   title: 'Dịch vụ',
            //   icon: 'medical',
            //   rows: [{ label: 'Hình thức', value: 'Khám chuyên khoa tại bệnh viện' }],
            // },
            {
              title: 'Khách hàng',
              icon: 'person',
              rows: [
                {
                  label: 'Khách hàng',
                  value: `${appointment.patientProfile?.firstName} ${appointment.patientProfile?.lastName}`,
                },
                { label: 'Lý do khám', value: appointment.notes || 'Không có ghi chú' },
              ],
            },
            {
              title: 'Bác sĩ ',
              icon: 'briefcase',
              rows: [
                {
                  label: 'Bác sĩ',
                  value: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
                },
                {
                  label: 'Thời gian khám',
                  value: `${formatTime(appointment.startTime)}, ${formatDate(appointment.startTime)}`,
                },
                {
                  label: 'Địa điểm',
                  value: appointment.clinic?.name || 'Bệnh viện',
                },
                { label: 'Chuyên khoa', value: appointment.service.name },
                {
                  label: 'Phí khám tạm ứng',
                  value: `${appointment.service.price.toLocaleString('vi-VN')} VNĐ`,
                  bold: true,
                },
              ],
            },
          ].map((section, idx) => (
            <View key={idx} className="mb-6 rounded-xl bg-white p-4 shadow-sm">
              {/* Section Header */}
              <View className="mb-4 flex-row items-center">
                <View
                  className="mr-3 h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#F0FDFA' }}>
                  <Ionicons name={section.icon as any} size={20} color="#0284C7" />
                </View>
                <Text className="text-lg font-bold text-gray-900">{section.title}</Text>
              </View>

              {/* Rows */}
              <View className="ml-11 space-y-2">
                {section.rows.map((row, rIdx) => (
                  <View key={rIdx} className="mb-3 flex-row">
                    <Text className="w-32 text-sm text-gray-600">{row.label}:</Text>
                    <Text className={`flex-1 text-sm text-gray-900 ${row.bold ? 'font-bold' : ''}`}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Action Buttons */}
          <View className="mb-6 flex-row gap-4">
            <TouchableOpacity
              className="flex-1 items-center rounded-xl border-2 bg-white py-3 shadow-sm"
              style={{ borderColor: '#0284C7' }}>
              <Text className="text-base font-semibold text-blue-600">Đổi lịch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center rounded-xl border-2 bg-white py-3 shadow-sm"
              style={{ borderColor: '#EF4444' }}>
              <Text className="text-base font-semibold text-red-500">Hủy lịch</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
